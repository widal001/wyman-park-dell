/**
 * Shared helpers for the events collection.
 *
 * Two consumers rely on these:
 *   1. Pages with an `events` block (src/pages/[...slug].astro) inject the
 *      upcoming list via getUpcomingEvents().
 *   2. The per-event detail route (src/pages/events/[slug].astro) needs the
 *      same recurrence + slug logic to build its pages.
 * Keeping the date math in one place means a recurring event resolves to the
 * same "next occurrence" everywhere.
 */
import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import type { EventItem } from '../types/content';

/** Today as YYYY-MM-DD (local time), the anchor for "upcoming" and recurrence. */
export function todayYmd(now = new Date()): string {
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
}

/** Date (UTC) of the `week`-th `weekday` in a given month. */
function nthWeekdayOfMonth(
  year: number,
  monthIdx: number,
  week: number,
  weekday: number,
): Date {
  const first = new Date(Date.UTC(year, monthIdx, 1));
  const shift = (weekday - first.getUTCDay() + 7) % 7;
  return new Date(Date.UTC(year, monthIdx, 1 + shift + (week - 1) * 7));
}

/** Next occurrence (YYYY-MM-DD) of a monthly Nth-weekday rule on/after `fromYmd`. */
export function nextRecurrenceDate(
  rec: { weekday: number; week: number },
  fromYmd: string,
): string {
  const from = new Date(`${fromYmd}T00:00:00Z`);
  let year = from.getUTCFullYear();
  let month = from.getUTCMonth();
  for (let i = 0; i < 24; i++) {
    const d = nthWeekdayOfMonth(year, month, rec.week, rec.weekday);
    if (d.getTime() >= from.getTime()) return d.toISOString().slice(0, 10);
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }
  return fromYmd;
}

/**
 * URL slug for an event. Prefers an explicit `slug` field (set by the CMS via
 * the `{fields.slug}.yaml` filename), falling back to the file id for the
 * hand-authored kebab-case files already in the repo.
 */
export function eventSlug(entry: CollectionEntry<'events'>): string {
  return entry.data.slug || entry.id;
}

/** Resolve an entry's display date, recomputing recurring events from `fromYmd`. */
export function resolveEventDate(
  entry: CollectionEntry<'events'>,
  fromYmd: string,
): string {
  const rec = entry.data.recurrence;
  return rec ? nextRecurrenceDate(rec, fromYmd) : entry.data.date;
}

/** Flatten a collection entry into the shape the events block/card consumes. */
export function toEventItem(
  entry: CollectionEntry<'events'>,
  fromYmd: string,
): EventItem {
  return {
    slug: eventSlug(entry),
    title: entry.data.title,
    date: resolveEventDate(entry, fromYmd),
    endDate: entry.data.endDate,
    time: entry.data.time,
    location: entry.data.location,
    body: entry.data.description,
    image: entry.data.image,
    recurrence: entry.data.recurrence?.label,
  };
}

/**
 * Upcoming events, soonest first: recurring events resolved to their next
 * occurrence, anything already past dropped.
 */
export async function getUpcomingEvents(): Promise<EventItem[]> {
  const from = todayYmd();
  const entries = await getCollection('events');
  return entries
    .map((e) => toEventItem(e, from))
    .filter((e) => (e.endDate ?? e.date) >= from)
    .sort((a, b) => a.date.localeCompare(b.date));
}
