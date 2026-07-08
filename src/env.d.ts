/// <reference types="astro/client" />

/**
 * Worker runtime env: bindings + vars + secrets. Read in on-demand (SSR) routes
 * via `import { env } from 'cloudflare:workers'`. On Astro 7 / @astrojs/cloudflare
 * v14 this is the supported way to reach bindings — the old
 * `Astro.locals.runtime.env` was removed (it errors at runtime). In local dev the
 * values come from `.dev.vars` (git-ignored); in prod from `wrangler secret put`.
 *
 * The Turnstile *site* key is NOT here — it's public and build-time, read via
 * `import.meta.env.PUBLIC_TURNSTILE_SITE_KEY` (see below).
 */
type Env = {
  // Cloudflare Turnstile (server-side verification)
  TURNSTILE_SECRET_KEY: string;

  // Gmail SMTP (App Password). Your personal account in dev, org account in prod.
  SMTP_HOST: string;
  SMTP_PORT: string;
  SMTP_USER: string;
  SMTP_PASS: string;
  MAIL_FROM: string;
  MAIL_TO: string;

  // Mailchimp Marketing API
  MAILCHIMP_API_KEY: string;
  MAILCHIMP_AUDIENCE_ID: string;
  MAILCHIMP_SERVER_PREFIX: string;
};

declare module 'cloudflare:workers' {
  export const env: Env;
}

interface ImportMetaEnv {
  /** Public Turnstile site key — safe to embed in the page HTML. */
  readonly PUBLIC_TURNSTILE_SITE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
