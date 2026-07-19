/**
 * Turns stored CMS blocks into the exact ContentBlock[] shape BlockRenderer
 * expects. Two jobs, both CMS-agnostic:
 *   1. Convert markdown rich-text fields (body / leftBody / rightBody) into the
 *      html / leftHtml / rightHtml props the block components already consume.
 *   2. Inject the events list into the `events` block (events live in their own
 *      collection and are surfaced here top-N by date).
 * Block components in src/components/blocks/ never change.
 */
import { marked } from 'marked';
import type { ContentBlock, EventItem } from '../types/content';

marked.setOptions({ async: false });
const md = (s?: string): string => (s ? (marked.parse(s) as string) : '');

export function renderBlocks(
  // Raw CMS block data has an open, discriminator-driven shape; it's narrowed
  // to ContentBlock below. `any` is deliberate here.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw: Array<Record<string, any>>,
  ctx: { events?: EventItem[] } = {},
): ContentBlock[] {
  return raw.map((b) => {
    switch (b.type) {
      case 'textWithMedia':
      case 'volunteerForm':
      case 'richText':
      case 'contactForm': {
        const { body, ...rest } = b;
        return { ...rest, html: md(body) };
      }
      case 'twoColumnText': {
        const { leftBody, rightBody, ...rest } = b;
        return { ...rest, leftHtml: md(leftBody), rightHtml: md(rightBody) };
      }
      case 'events': {
        // Events come from their own collection; `limit` caps how many show
        // (soonest first). Omit limit to show all (the /events page).
        const { limit, viewAllCta, ...rest } = b;
        const all = ctx.events ?? [];
        return {
          ...rest,
          // The "View all" CTA is optional; an untouched CMS object can
          // serialize as empty strings, so treat a CTA with no href as absent.
          viewAllCta: viewAllCta?.href ? viewAllCta : undefined,
          events: limit ? all.slice(0, limit) : all,
        };
      }
      default:
        return b;
    }
  }) as ContentBlock[];
}
