/**
 * Adapters that map EmDash field values into the existing src/types/content.ts shapes.
 *
 * The page .astro files query EmDash, run values through these adapters, and
 * pass the result to BlockRenderer using the same block-shape contract the
 * static content used to satisfy. Visual knobs (variant, padding, background)
 * stay in the page file — these adapters only carry editable content.
 */

import type { CtaRef, ImageRef } from '../types/content';

type EmDashImage = {
  id?: string;
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
  provider?: string;
  previewUrl?: string;
  meta?: Record<string, unknown>;
} | null | undefined;

/**
 * Map an EmDash image field value to ImageRef. Returns undefined if no usable
 * source is available so callers can guard with `?:`.
 */
export function imageRef(img: EmDashImage): ImageRef | undefined {
  if (!img) return undefined;
  const src = img.src ?? img.previewUrl;
  if (!src) return undefined;
  return {
    src,
    alt: img.alt ?? '',
    width: img.width,
    height: img.height,
  };
}

/**
 * Build a CTA from a label/href pair. Returns undefined if either is missing.
 */
export function cta(
  label: string | undefined | null,
  href: string | undefined | null,
  opts: { variant?: CtaRef['variant']; external?: boolean } = {},
): CtaRef | undefined {
  if (!label || !href) return undefined;
  const external =
    opts.external ?? (/^https?:\/\//i.test(href) && !href.includes('wymanparkdell.org'));
  return { label, href, variant: opts.variant, external };
}

/**
 * Compact an array of possibly-undefined values into a real array. The optional
 * generic parameter lets callers tell the compiler "trust me, this is the shape"
 * — useful when assembling block lists from EmDash fields that are typed
 * optional even though we expect them to be populated.
 */
export function compact<T>(items: unknown[]): T[] {
  return items.filter((x): x is T => Boolean(x)) as T[];
}
