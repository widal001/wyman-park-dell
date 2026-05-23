/**
 * One-shot: upload every pre-migration WP image to the public R2 bucket under
 * a stable, human-readable filename. After this, seed.json can reference each
 * image via a canonical R2 URL that's identical across dev, every PR preview,
 * and prod — each environment downloads from the same URL into its own
 * env-local emdash media library at seed-apply time.
 *
 * Source of truth for the original WP URLs is the pre-image-migration commit
 * (ab6e6cb). We read that revision's seed.json + source files to extract every
 * external wymanparkdell.org/wp-content/uploads URL, then upload the cached
 * file (downloaded earlier into .image-cache/) to R2 with the URL's basename
 * as the key.
 *
 *   pnpm tsx scripts/upload-canonical-r2.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const PUBLIC_URL_BASE = 'https://pub-793f2ed4365042cb96f36d101a563f6e.r2.dev';
const BUCKET = 'wyman-park-dell-media';
const PRE_MIGRATION_REV = 'ab6e6cb';
const WP_URL_RE = /https?:\/\/wymanparkdell\.org\/site\/wp-content\/uploads\/[^"'`)\s]+/g;
const CACHE_DIR = resolve('.image-cache');
const MAPPING_PATH = resolve('seed/canonical-url-map.json');

/** Read a file at a specific git revision; returns null if missing. */
function readAtRev(rev, path) {
  const res = spawnSync('git', ['show', `${rev}:${path}`], { encoding: 'utf8' });
  return res.status === 0 ? res.stdout : null;
}

/** Files (relative to repo root) where pre-migration WP URLs lived. */
const SOURCES = [
  'seed/seed.json',
  'src/content/site.ts',
  'src/content/homepage.ts',
  'src/content/about.ts',
  'src/content/contact.ts',
  'src/content/events.ts',
  'src/content/friends.ts',
  'src/content/get-involved.ts',
  'src/pages/index.astro',
  'src/pages/events.astro',
  'src/pages/friends-of-wyman-park-dell.astro',
];

const urls = new Set();
for (const path of SOURCES) {
  const text = readAtRev(PRE_MIGRATION_REV, path);
  if (!text) continue;
  for (const match of text.match(WP_URL_RE) ?? []) {
    // resolve the template-literal-style ${WP}/path that appears in some files
    if (match.includes('${WP}')) continue; // template-literal expressions need resolution; handled below
    urls.add(match);
  }
  // Also catch `${WP}/2026/01/FWPD-RGB.jpg` style — extract path-after-WP, prepend the real prefix
  const tplMatches = text.match(/\$\{WP\}([^"'`)\s]+)/g) ?? [];
  for (const m of tplMatches) {
    urls.add(`https://wymanparkdell.org/site/wp-content/uploads${m.replace('${WP}', '')}`);
  }
}

console.log(`Found ${urls.size} unique WP URLs at ${PRE_MIGRATION_REV}.`);

/** Derive an R2 object key from a URL. Decode percent-encodings so the key
 *  is the visible filename (en-dashes etc.). */
function keyFromUrl(url) {
  const pathname = new URL(url).pathname;
  return decodeURIComponent(pathname.split('/').pop());
}

/** Find the cached file for a URL (we hashed by URL earlier). */
function cachedFileFor(url) {
  const ext = (url.match(/\.([a-z0-9]{2,5})(?:\?|$)/i)?.[1] ?? 'bin').toLowerCase();
  const hash = createHash('sha1').update(url).digest('hex').slice(0, 16);
  const path = resolve(CACHE_DIR, `${hash}.${ext}`);
  return existsSync(path) ? path : null;
}

const MIME = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
};

/** Upload one file via `wrangler r2 object put`. */
function uploadOne(localPath, key) {
  const ext = key.split('.').pop()?.toLowerCase();
  const ct = MIME[ext] ?? 'application/octet-stream';
  const res = spawnSync(
    'pnpm',
    [
      'dlx',
      'wrangler',
      'r2',
      'object',
      'put',
      `${BUCKET}/${key}`,
      '--file',
      localPath,
      '--content-type',
      ct,
      '--remote',
    ],
    { encoding: 'utf8' },
  );
  if (res.status !== 0) throw new Error(`upload failed for ${key}: ${res.stderr || res.stdout}`);
}

const mapping = {}; // wpUrl -> R2 public URL
let i = 0;
for (const url of urls) {
  i += 1;
  const key = keyFromUrl(url);
  const local = cachedFileFor(url);
  if (!local) {
    console.log(`[${i}/${urls.size}] ${url}  ✗ no cache, skipping`);
    continue;
  }
  process.stdout.write(`[${i}/${urls.size}] ${key} ... `);
  try {
    uploadOne(local, key);
    const publicUrl = `${PUBLIC_URL_BASE}/${encodeURIComponent(key).replace(/%2F/g, '/')}`;
    mapping[url] = publicUrl;
    console.log('ok');
  } catch (err) {
    console.log(`FAIL: ${err.message}`);
  }
}

writeFileSync(MAPPING_PATH, JSON.stringify(mapping, null, 2) + '\n');
console.log(`\nUploaded ${Object.keys(mapping).length}/${urls.size} files.`);
console.log(`Wrote URL mapping to ${MAPPING_PATH}.`);
