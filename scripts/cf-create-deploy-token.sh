#!/usr/bin/env bash
# Create a Cloudflare account-owned API token scoped to exactly what
# the deploy workflows need. Bootstrap requirement: set
# CF_BOOTSTRAP_TOKEN to a token that has "Account > API Tokens > Edit"
# (and read). The bootstrap token can (and should) be deleted right
# after this runs.
#
# Usage:
#   CF_BOOTSTRAP_TOKEN=<bootstrap> CF_ACCOUNT_ID=<account_id> \
#     ./scripts/cf-create-deploy-token.sh
#
# Writes the token value to .env.local (gitignored) as
# CLOUDFLARE_API_TOKEN. Never prints the value to stdout. Refuses to
# overwrite an existing CLOUDFLARE_API_TOKEN line — delete it first if
# you want to rotate.

set -euo pipefail

: "${CF_BOOTSTRAP_TOKEN:?set CF_BOOTSTRAP_TOKEN to a token with 'Account > API Tokens > Edit'}"
: "${CF_ACCOUNT_ID:?set CF_ACCOUNT_ID to your Cloudflare account id (wrangler whoami)}"

TOKEN_NAME="${TOKEN_NAME:-fwpd-astro deploys}"
ENV_FILE="${ENV_FILE:-.env.local}"
SECRET_KEY="CLOUDFLARE_API_TOKEN"

# Refuse to clobber an existing token line so we don't silently rotate
# something the user is depending on.
if [ -f "$ENV_FILE" ] && grep -qE "^${SECRET_KEY}=" "$ENV_FILE"; then
  echo "ERROR: $ENV_FILE already contains $SECRET_KEY. Remove that line first if you want to rotate." >&2
  exit 1
fi

cf() {
  curl --fail-with-body -sS \
    -H "Authorization: Bearer $CF_BOOTSTRAP_TOKEN" \
    -H "Content-Type: application/json" "$@"
}

# Account-scoped permission groups. Account-owned tokens can only carry
# account-scoped policies — no user-scoped permission groups.
WANT=(
  "Workers Scripts Write"     # deploy / versions upload
  "Workers KV Storage Write"  # SESSION binding (auto-added by @astrojs/cloudflare)
  "Workers R2 Storage Write"  # MEDIA bucket
  "D1 Write"                  # DB
  "Account Settings Read"     # wrangler account context
)

echo "Fetching account-scoped permission groups..." >&2
groups=$(cf "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/tokens/permission_groups")

id_for() {
  local name="$1"
  local id
  id=$(echo "$groups" | jq -r --arg n "$name" '.result[] | select(.name == $n) | .id' | head -n1)
  if [ -z "$id" ]; then
    echo "ERROR: permission group not found: $name" >&2
    echo "Available account-scoped groups:" >&2
    echo "$groups" | jq -r '.result[].name' | sort | sed 's/^/  - /' >&2
    exit 1
  fi
  echo "$id"
}

pgs=()
for name in "${WANT[@]}"; do
  pgs+=("$(id_for "$name")")
done

pg_json=$(printf '%s\n' "${pgs[@]}" | jq -R 'select(length>0) | {id: .}' | jq -s .)

payload=$(jq -n \
  --arg name "$TOKEN_NAME" \
  --arg acct "$CF_ACCOUNT_ID" \
  --argjson pgs "$pg_json" \
  '{
    name: $name,
    policies: [
      {
        effect: "allow",
        resources: { ("com.cloudflare.api.account." + $acct): "*" },
        permission_groups: $pgs
      }
    ]
  }')

echo "Creating account-owned token \"$TOKEN_NAME\"..." >&2
result=$(cf -X POST -d "$payload" "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/tokens")

if [ "$(echo "$result" | jq -r '.success')" != "true" ]; then
  echo "Token creation failed:" >&2
  echo "$result" | jq -r '.errors' >&2
  exit 1
fi

token_id=$(echo "$result" | jq -r '.result.id')
token_value=$(echo "$result" | jq -r '.result.value')

# Append to env file with restrictive perms. Write to a temp file first
# so we never leave a partial line on disk.
umask 077
tmp=$(mktemp "${ENV_FILE}.XXXXXX")
trap 'rm -f "$tmp"' EXIT
if [ -f "$ENV_FILE" ]; then
  cat "$ENV_FILE" > "$tmp"
  # Ensure file ends with a newline before appending
  [ -s "$tmp" ] && [ "$(tail -c1 "$tmp" | od -An -c | tr -d ' ')" != '\n' ] && printf '\n' >> "$tmp"
fi
printf '%s=%s\n' "$SECRET_KEY" "$token_value" >> "$tmp"
mv "$tmp" "$ENV_FILE"
chmod 600 "$ENV_FILE"
trap - EXIT

# Mask for display: keep the first 4 and last 4 chars only.
masked="${token_value:0:4}...${token_value: -4}"

echo "Created account-owned token id $token_id (value $masked)." >&2
echo "Wrote $SECRET_KEY to $ENV_FILE (mode 600, gitignored)." >&2
echo "" >&2
echo "Next steps:" >&2
echo "  1. Copy the value from $ENV_FILE into the GitHub repo secret named $SECRET_KEY" >&2
echo "     (Settings → Secrets and variables → Actions)." >&2
echo "  2. Also add CLOUDFLARE_ACCOUNT_ID = $CF_ACCOUNT_ID as a repo secret." >&2
echo "  3. Delete the bootstrap token in the Cloudflare dashboard." >&2
