import type { ImageMetadata } from 'astro';

// Every image lives under src/assets/media so Astro's <Image> can optimize it
// at build time (hashed, immutable /_astro/* output). Content and the CMS keep
// storing plain /media/... strings; this module is the sole bridge.
//
// `eager: true` imports all metadata at module-eval, so a stored path with no
// matching file throws below during the static build — a fast, obvious failure
// rather than a broken image at runtime.
const assets = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/media/**/*.{jpg,jpeg,png,webp,avif}',
  { eager: true },
);

/** True for absolute http(s) URLs (e.g. the YouTube thumbnail fallback). */
export function isRemoteImage(src: string): boolean {
  return /^https?:\/\//.test(src);
}

/**
 * Map a stored content path (`/media/...`) to its build-time ImageMetadata.
 * Throws a clear build error naming the path if the asset is missing.
 */
export function resolveImage(src: string): ImageMetadata {
  const key = src.replace(/^\/media\//, '/src/assets/media/');
  const mod = assets[key];
  if (!mod) {
    throw new Error(
      `[images] No local asset for "${src}" (looked up "${key}"). ` +
        `Add the file under src/assets/media, or fix the content path. ` +
        `${Object.keys(assets).length} assets are registered.`,
    );
  }
  return mod.default;
}
