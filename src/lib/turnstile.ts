/**
 * Cloudflare Turnstile server-side verification.
 *
 * The browser widget produces a single-use, short-lived token (submitted as the
 * `cf-turnstile-response` field). We validate it here against Cloudflare's
 * siteverify endpoint using the *secret* key (never exposed to the client).
 * Because tokens are single-use and time-limited, this also blocks replay.
 */

const SITEVERIFY_URL =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify';

type SiteVerifyResponse = {
  success: boolean;
  'error-codes'?: string[];
  hostname?: string;
  action?: string;
};

export async function verifyTurnstile(
  token: string | null | undefined,
  secret: string,
  remoteIp?: string | null,
): Promise<boolean> {
  if (!token || !secret) return false;

  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);
  if (remoteIp) body.append('remoteip', remoteIp);

  try {
    const res = await fetch(SITEVERIFY_URL, { method: 'POST', body });
    if (!res.ok) return false;
    const data = (await res.json()) as SiteVerifyResponse;
    return data.success === true;
  } catch {
    // Network error talking to Cloudflare — fail closed.
    return false;
  }
}
