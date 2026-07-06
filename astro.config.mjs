// @ts-check
import { defineConfig } from 'astro/config';
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
});
