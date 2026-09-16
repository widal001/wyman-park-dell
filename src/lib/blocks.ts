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

/** Spare events rendered past an events block's `limit`. See the events case. */
const LIMIT_BUFFER = 6;

/**
 * Trims the superset for a block with a `limit`, keeping `limit + LIMIT_BUFFER`
 * *distinct* events plus every pre-rendered date of the recurring ones among
 * them. Counting cards instead of distinct events would spend the whole buffer
 * on repeat occurrences of one series — and since only a series' soonest date
 * is ever shown, those can never fill a vacated slot.
 */
function capEvents(all: EventItem[], limit: number): EventItem[] {
  const budget = limit + LIMIT_BUFFER;
  const keptSeries = new Set<string>();
  let distinct = 0;
  return all.filter((event) => {
    // A later date for a series already kept: it's that series' replacement.
    if (event.series && keptSeries.has(event.series)) return true;
    if (distinct >= budget) return false;
    if (event.series) keptSeries.add(event.series);
    distinct += 1;
    return true;
  });
}

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
      case 'donationPanel':
      case 'contactForm': {
        const { body, ...rest } = b;
        return { ...rest, html: md(body) };
      }
      case 'twoColumnText': {
        const { leftBody, rightBody, ...rest } = b;
        return { ...rest, leftHtml: md(leftBody), rightHtml: md(rightBody) };
      }
      case 'events': {
        // Events come from their own collection. `limit` caps how many show
        // (soonest first); omit it to show all (the /events page). The cap is
        // applied in the browser rather than here, so ship spares past it —
        // when an event elapses after the build, the next one moves up instead
        // of leaving a gap. LIMIT_BUFFER is how many may elapse between
        // deploys before a capped list runs short.
        const { limit, viewAllCta, ...rest } = b;
        const all = ctx.events ?? [];
        return {
          ...rest,
          limit,
          // The "View all" CTA is optional; an untouched CMS object can
          // serialize as empty strings, so treat a CTA with no href as absent.
          viewAllCta: viewAllCta?.href ? viewAllCta : undefined,
          events: limit ? capEvents(all, limit) : all,
        };
      }
      default:
        return b;
    }
  }) as ContentBlock[];
}
