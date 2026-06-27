#!/usr/bin/env bash
# One-time provisioning script.
#
# Creates fresh prod D1 + R2 resources, then updates wrangler.jsonc so that:
#   top-level (prod)  → new clean resources
#   env.preview       → old existing resources (wyman-park-dell / wyman-park-dell-media)
#
# Run from the repo root:
#   bash scripts/provision-resources.sh

set -euo pipefail

NEW_PROD_DB="wyman-park-dell-prod"
NEW_PROD_BUCKET="wyman-park-dell-media-prod"
OLD_PREVIEW_DB="wyman-park-dell"
OLD_PREVIEW_BUCKET="wyman-park-dell-media"

# ── 1. Create new prod D1 ────────────────────────────────────────────────────
echo "==> Creating prod D1 database: $NEW_PROD_DB"
D1_OUTPUT=$(pnpm wrangler d1 create "$NEW_PROD_DB" 2>&1)
echo "$D1_OUTPUT"

# wrangler prints the database_id inside a JSON snippet in its output
PROD_DB_ID=$(echo "$D1_OUTPUT" | grep -o '"database_id": *"[^"]*"' | grep -o '"[^"]*"$' | tr -d '"')
if [ -z "$PROD_DB_ID" ]; then
  echo "ERROR: could not parse database_id from wrangler output. Aborting." >&2
  exit 1
fi
echo "  prod DB id: $PROD_DB_ID"

# ── 2. Create new prod R2 bucket ─────────────────────────────────────────────
echo ""
echo "==> Creating prod R2 bucket: $NEW_PROD_BUCKET"
pnpm wrangler r2 bucket create "$NEW_PROD_BUCKET"

# ── 3. Look up the existing (preview) DB id ──────────────────────────────────
echo ""
echo "==> Looking up existing preview DB id for: $OLD_PREVIEW_DB"
D1_INFO=$(pnpm wrangler d1 info "$OLD_PREVIEW_DB" 2>&1)
echo "$D1_INFO"
PREVIEW_DB_ID=$(echo "$D1_INFO" | grep -o '"database_id": *"[^"]*"' \
  || echo "$D1_INFO" | grep -o 'database_id *= *"[^"]*"')
PREVIEW_DB_ID=$(echo "$PREVIEW_DB_ID" | grep -o '"[^"]*"$' | tr -d '"' | head -n1)
if [ -z "$PREVIEW_DB_ID" ]; then
  echo "  WARNING: could not auto-parse preview DB id — you will need to fill it in manually."
fi
echo "  preview DB id: ${PREVIEW_DB_ID:-(not found)}"

# ── 4. Write updated wrangler.jsonc ──────────────────────────────────────────
echo ""
echo "==> Writing wrangler.jsonc"
cat > wrangler.jsonc <<JSONC
{
	"\$schema": "node_modules/wrangler/config-schema.json",
	"name": "wyman-park-dell",
	"main": "./src/worker.ts",
	"compatibility_date": "2026-04-15",
	"compatibility_flags": ["nodejs_compat"],
	"observability": {
		"enabled": true
	},
	// Prod bindings — fresh resources seeded via pnpm seed:prod
	"d1_databases": [
		{
			"binding": "DB",
			"database_name": "$NEW_PROD_DB",
			"database_id": "$PROD_DB_ID"
		}
	],
	"r2_buckets": [
		{
			"binding": "MEDIA",
			"bucket_name": "$NEW_PROD_BUCKET"
		}
	],
	// Preview environment — old resources; shared by all open PRs
	"env": {
		"preview": {
			"d1_databases": [
				{
					"binding": "DB",
					"database_name": "$OLD_PREVIEW_DB",
					"database_id": "${PREVIEW_DB_ID:-FILL_IN_PREVIEW_DB_ID}"
				}
			],
			"r2_buckets": [
				{
					"binding": "MEDIA",
					"bucket_name": "$OLD_PREVIEW_BUCKET"
				}
			]
		}
	}
	// No worker_loaders block: plugin sandbox is disabled, keeping us on the free Workers tier.
}
JSONC

echo ""
echo "Done. Review wrangler.jsonc, then:"
echo "  1. pnpm build && pnpm wrangler deploy          # deploys prod Worker pointing at new resources"
echo "  2. Run EmDash setup wizard on the new prod URL, enroll a passkey"
echo "  3. EMDASH_URL=<prod-url> EMDASH_TOKEN=<token> pnpm seed:prod"
echo "  4. Smoke-test all 6 public routes"
