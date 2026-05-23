/**
 * One-shot: walk seed/seed.json for every external WP image URL, download it,
 * upload it to the running EmDash instance's storage (miniflare R2 in dev,
 * real R2 in prod), and rewrite seed.json with the new MediaValues that
 * point at our own storage. After this, the site no longer hot-links
 * wymanparkdell.org/wp-content/uploads.
 *
 * Requires a running dev server. Auto-obtains an API token via the
 * dev-bypass route — only works against an EmDash instance in DEV mode.
 * For production, pass --base-url=https://your.workers.dev --token=...
 *
 *   pnpm tsx scripts/migrate-images.mjs               # dev (auto token)
 *   pnpm tsx scripts/migrate-images.mjs --dry-run     # plan only, no upload
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, basename, join } from 'node:path';
import { createHash } from 'node:crypto';

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const found = args.find((a) => a.startsWith(`--${name}=`));
  if (found) return found.split('=').slice(1).join('=');
  if (args.includes(`--${name}`)) return true;
  return fallback;
};

const BASE_URL = flag('base-url', 'http://localhost:4321');
const DRY_RUN = Boolean(flag('dry-run', false));
let TOKEN = flag('token', null);

const SEED_PATH = resolve('seed/seed.json');
const CACHE_DIR = resolve('.image-cache');
if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });

/** Walk an arbitrary value and call `visit` on every MediaValue-shaped object
 *  whose provider is "external" and src points at a wymanparkdell.org URL. */
function walkMediaValues(node, visit, path = []) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    node.forEach((item, i) => walkMediaValues(item, visit, [...path, i]));
    return;
  }
  if (
    node.provider === 'external' &&
    typeof node.src === 'string' &&
    /wymanparkdell\.org/.test(node.src)
  ) {
    visit(node, path);
    return;
  }
  for (const [k, v] of Object.entries(node)) {
    walkMediaValues(v, visit, [...path, k]);
  }
}

async function getDevToken() {
  const res = await fetch(`${BASE_URL}/_emdash/api/setup/dev-bypass?token=1`, { method: 'GET' });
  if (!res.ok) throw new Error(`dev-bypass returned ${res.status}`);
  const body = await res.json();
  if (!body?.data?.token) {
    throw new Error('dev-bypass did not return a token (is this a dev instance?)');
  }
  return body.data.token;
}

async function downloadOnce(url, alt) {
  const ext = (url.match(/\.([a-z0-9]{2,5})(?:\?|$)/i)?.[1] ?? 'bin').toLowerCase();
  const hash = createHash('sha1').update(url).digest('hex').slice(0, 16);
  const filename = `${hash}.${ext}`;
  const localPath = resolve(CACHE_DIR, filename);
  if (existsSync(localPath)) return { filename, buffer: readFileSync(localPath) };
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed: ${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(localPath, buf);
  return { filename, buffer: buf };
}

const MIME = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
};

async function uploadOne(buffer, filename, alt) {
  const ext = filename.split('.').pop()?.toLowerCase();
  const type = MIME[ext] ?? 'application/octet-stream';
  const form = new FormData();
  form.append('file', new Blob([buffer], { type }), filename);
  if (alt) form.append('alt', alt);
  const res = await fetch(`${BASE_URL}/_emdash/api/media`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}` },
    body: form,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`upload failed (${res.status}): ${text.slice(0, 300)}`);
  }
  return (await res.json()).data.item;
}

/** Normalize a media item (from /_emdash/api/media response) into the
 *  MediaValue field shape stored on content entries. */
function itemToMediaValue(item, alt) {
  return {
    id: item.id,
    src: item.storageKey
      ? `/_emdash/api/media/file/${item.storageKey}`
      : item.url ?? item.src ?? '',
    alt: alt ?? item.alt ?? '',
    width: item.width,
    height: item.height,
    provider: item.provider ?? 'local',
  };
}

/** Walk a directory recursively, returning all .astro / .ts files. */
function findSourceFiles(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'dist' || entry === '.astro' || entry === '.image-cache') continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) findSourceFiles(full, out);
    else if (/\.(astro|ts|tsx|mjs)$/.test(entry) && !full.includes('/seed/')) out.push(full);
  }
  return out;
}

const WP_URL_RE = /https?:\/\/wymanparkdell\.org\/site\/wp-content\/uploads\/[^"'`)\s]+/g;

async function main() {
  if (!TOKEN && !DRY_RUN) {
    console.log('No --token provided. Getting dev token from', BASE_URL);
    TOKEN = await getDevToken();
  }

  const seed = JSON.parse(readFileSync(SEED_PATH, 'utf8'));

  const unique = new Map(); // src -> { src, alt }
  walkMediaValues(seed, (mv) => {
    if (!unique.has(mv.src)) unique.set(mv.src, { src: mv.src, alt: mv.alt ?? '' });
  });

  // Also scan src/ for hardcoded WP URLs (activity grid icons, hardcoded
  // featured projects, header logo, etc.)
  const sourceFiles = findSourceFiles(resolve('src'));
  const fileToUrls = new Map(); // filepath -> Set<url>
  for (const file of sourceFiles) {
    const text = readFileSync(file, 'utf8');
    const matches = text.match(WP_URL_RE);
    if (!matches) continue;
    const set = new Set();
    for (const url of matches) {
      set.add(url);
      if (!unique.has(url)) unique.set(url, { src: url, alt: '' });
    }
    fileToUrls.set(file, set);
  }

  console.log(`Found ${unique.size} unique external image URLs (seed + ${fileToUrls.size} source files).`);
  if (DRY_RUN) {
    for (const { src } of unique.values()) console.log('  - ' + src);
    return;
  }

  const mapping = new Map(); // src -> new MediaValue
  let i = 0;
  for (const { src, alt } of unique.values()) {
    i += 1;
    process.stdout.write(`[${i}/${unique.size}] ${src} ... `);
    try {
      const { filename, buffer } = await downloadOnce(src, alt);
      const item = await uploadOne(buffer, filename, alt);
      const mv = itemToMediaValue(item, alt);
      mapping.set(src, mv);
      console.log(`ok (${item.id})`);
    } catch (err) {
      console.log(`FAILED: ${err.message}`);
    }
  }

  // Rewrite seed: replace every external MediaValue with the migrated one.
  walkMediaValues(seed, (mv) => {
    const newMv = mapping.get(mv.src);
    if (!newMv) return;
    // mutate in place — preserve alt from the seed (already on mv)
    mv.id = newMv.id;
    mv.src = newMv.src;
    mv.provider = newMv.provider;
    if (newMv.width) mv.width = newMv.width;
    if (newMv.height) mv.height = newMv.height;
  });

  writeFileSync(SEED_PATH, JSON.stringify(seed, null, 2) + '\n');
  console.log(`\nRewrote ${SEED_PATH}.`);

  // Apply URL replacements to source files. For each hardcoded WP URL, replace
  // it with the new media file URL. These are template-fixed images (activity
  // grid icons, header logo, featured projects) that editors don't manage.
  let filesChanged = 0;
  for (const [file, urls] of fileToUrls) {
    let text = readFileSync(file, 'utf8');
    let changed = false;
    for (const url of urls) {
      const mv = mapping.get(url);
      if (!mv) continue;
      const before = text;
      text = text.split(url).join(mv.src);
      if (text !== before) changed = true;
    }
    if (changed) {
      writeFileSync(file, text);
      filesChanged += 1;
      console.log('  rewrote ' + file.replace(process.cwd() + '/', ''));
    }
  }
  console.log(`Rewrote ${filesChanged} source files.`);
  console.log('\nRe-seed: rm -rf .wrangler/state/v3/d1 data.db* emdash-env.d.ts && pnpm dev (keeps R2 intact)');
}

main().catch((err) => {
  console.error('\nFATAL:', err);
  process.exit(1);
});
