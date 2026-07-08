/**
 * Shared helpers for the form-handling API routes: input reading/validation,
 * layered spam checks, and JSON responses.
 *
 * Anti-spam layers (cheapest first):
 *   1. Honeypot  — a hidden field real users never see. If it's filled, a bot
 *      did it: we silently accept (return ok) and drop the submission.
 *   2. Timing    — a JS-stamped "form loaded at" time. Sub-3s submissions are
 *      bots. (Set client-side, so it survives static prerendering.)
 *   3. Turnstile — Cloudflare's challenge, verified server-side.
 */
import { verifyTurnstile } from './turnstile';

/** Hidden honeypot field name. Innocuous so bots are tempted to fill it. */
export const HONEYPOT_FIELD = 'company_website';
/** Hidden field holding the client-side page-load timestamp (ms). */
export const TIMESTAMP_FIELD = 'form_loaded_at';
/** Turnstile injects/we append the token under this name. */
export const TURNSTILE_FIELD = 'cf-turnstile-response';

const MIN_SUBMIT_MS = 3000;

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

/** Read a trimmed string field, capped to `max` chars to reject junk payloads. */
export function field(form: FormData, name: string, max = 2000): string {
  const v = form.get(name);
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

export function isValidEmail(value: string): boolean {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export type SpamResult =
  | { pass: true }
  /** silent=true → pretend success so bots get no signal (honeypot hit). */
  | { pass: false; silent: boolean };

export async function checkSpam(
  form: FormData,
  env: Env,
  remoteIp?: string | null,
): Promise<SpamResult> {
  // 1. Honeypot
  if (field(form, HONEYPOT_FIELD, 200)) {
    return { pass: false, silent: true };
  }

  // 2. Timing — reject implausibly fast submits.
  const loadedAt = Number(form.get(TIMESTAMP_FIELD));
  if (
    Number.isFinite(loadedAt) &&
    loadedAt > 0 &&
    Date.now() - loadedAt < MIN_SUBMIT_MS
  ) {
    return { pass: false, silent: false };
  }

  // 3. Turnstile
  const token = field(form, TURNSTILE_FIELD, 4096);
  const ok = await verifyTurnstile(token, env.TURNSTILE_SECRET_KEY, remoteIp);
  return ok ? { pass: true } : { pass: false, silent: false };
}
