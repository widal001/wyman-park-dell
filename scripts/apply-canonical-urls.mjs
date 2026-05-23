/**
 * Apply the canonical URL mapping (seed/canonical-url-map.json) to source
 * files and the seed:
 *
 * - In src/ files: replace every WP URL string with the matching R2 URL.
 * - In src/content/site.ts: also resolve `${WP}/path` template literals.
 * - In seed/seed.json: replace every external MediaValue with a `$media`
 *   reference using the R2 URL as the canonical source. EmDash's seed apply
 *   will download from that URL into env-local storage.
 *
 *   pnpm tsx scripts/apply-canonical-urls.mjs
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';

const mapping = JSON.parse(readFileSync('seed/canonical-url-map.json', 'utf8'));

const SOURCE_FILES = [
  'src/content/homepage.ts',
  'src/content/about.ts',
  'src/content/contact.ts',
  'src/content/events.ts',
  'src/content/friends.ts',
  'src/content/get-involved.ts',
  'src/content/site.ts',
  'src/pages/index.astro',
  'src/pages/events.astro',
  'src/pages/friends-of-wyman-park-dell.astro',
];

let filesChanged = 0;
for (const file of SOURCE_FILES) {
  let text = readFileSync(file, 'utf8');
  const before = text;

  // Direct URL replacements
  for (const [wp, r2] of Object.entries(mapping)) {
    text = text.split(wp).join(r2);
  }

  // Resolve `${WP}/path` template literals (site.ts uses this)
  if (text.includes('${WP}')) {
    text = text.replace(/\$\{WP\}([^"'`)\s]+)/g, (_m, path) => {
      const fullUrl = `https://wymanparkdell.org/site/wp-content/uploads${path}`;
      return mapping[fullUrl] ?? `\${WP}${path}`;
    });
    // If all WP refs resolved, the `const WP = '...'` line becomes dead code.
    // Leave the const alone — Phase G cleanup will retire src/content/.
  }

  if (text !== before) {
    writeFileSync(file, text);
    filesChanged += 1;
    console.log(`  rewrote ${file}`);
  }
}

// Transform seed.json: every external MediaValue that has its src in the
// mapping becomes a $media reference pointing at the R2 URL.
const seed = JSON.parse(readFileSync('seed/seed.json', 'utf8'));

let mediaTransformed = 0;
function transform(node) {
  if (!node || typeof node !== 'object') return node;
  if (Array.isArray(node)) return node.map(transform);

  // Detect a resolved external MediaValue we want to convert.
  if (
    node.provider === 'external' &&
    typeof node.src === 'string' &&
    mapping[node.src]
  ) {
    mediaTransformed += 1;
    return {
      $media: {
        url: mapping[node.src],
        alt: node.alt ?? undefined,
      },
    };
  }

  const out = {};
  for (const [k, v] of Object.entries(node)) out[k] = transform(v);
  return out;
}

const transformed = transform(seed);
writeFileSync('seed/seed.json', JSON.stringify(transformed, null, 2) + '\n');

console.log(`\nRewrote ${filesChanged} source files.`);
console.log(`Transformed ${mediaTransformed} MediaValues -> $media references in seed.json.`);
