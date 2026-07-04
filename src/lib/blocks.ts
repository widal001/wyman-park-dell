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
  raw: Array<Record<string, any>>,
  ctx: { events?: EventItem[] } = {},
): ContentBlock[] {
  return raw.map((b) => {
    switch (b.type) {
      case 'textWithMedia':
      case 'volunteerForm': {
        const { body, ...rest } = b;
        return { ...rest, html: md(body) };
      }
      case 'twoColumnText': {
        const { leftBody, rightBody, ...rest } = b;
        return { ...rest, leftHtml: md(leftBody), rightHtml: md(rightBody) };
      }
      case 'events':
        return { ...b, events: ctx.events ?? [] };
      default:
        return b;
    }
  }) as ContentBlock[];
}
