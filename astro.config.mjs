// @ts-check
import { defineConfig, sessionDrivers } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
// Static by default (all pages prerendered); routes can opt into SSR with
// `export const prerender = false` (e.g. future form handlers). The Cloudflare
// adapter is required for those on-demand routes and generates the deploy
// config into dist/server/wrangler.json (wrangler resolves it automatically).
export default defineConfig({
  site: 'https://wymanparkdell.org',
  output: 'static',
  adapter: cloudflare(),
  // We don't use Astro sessions. @astrojs/cloudflare v14 otherwise auto-provisions
  // a SESSION KV namespace on every deploy, which collides once it already exists
  // ("already exists [code: 10014]", e.g. on `wrangler versions upload`). Setting
  // a non-KV in-memory driver stops the adapter from injecting the SESSION KV
  // binding at all — no namespace to create, pin, or manage.
  session: { driver: sessionDrivers.lruCache() },
});
