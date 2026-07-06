/// <reference types="astro/client" />

/**
 * Runtime secrets exposed to on-demand (SSR) routes via
 * `Astro.locals.runtime.env`. In local dev these come from `.dev.vars`
 * (git-ignored); in production from `wrangler secret put`.
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

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {}
}

interface ImportMetaEnv {
  /** Public Turnstile site key — safe to embed in the page HTML. */
  readonly PUBLIC_TURNSTILE_SITE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
