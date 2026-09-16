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

/**
 * The park's timezone. "Upcoming" is judged here rather than in the visitor's
 * zone so a Saturday clean-up doesn't vanish at 9pm Friday for someone reading
 * from California.
 */
export const SITE_TIME_ZONE = 'America/New_York';

/** Today as YYYY-MM-DD in the park's timezone. */
export function todayInSiteZone(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: SITE_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .formatToParts(now)
    .reduce<Record<string, string>>((acc, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {});
  return `${parts.year}-${parts.month}-${parts.day}`;
}

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

/** The day after `ymd`, as YYYY-MM-DD. */
function nextDayYmd(ymd: string): string {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
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
 * Events for a rendered list, soonest first.
 *
 * This ships a superset on purpose. A static page is correct only for the day
 * it was built, so rather than resolving "upcoming" once at build time, it
 * renders every event that is upcoming *as of the build* and lets the browser
 * pick today's slice (see the filter script in Events.astro). Nothing here is
 * recomputed at runtime — the browser only chooses among cards we rendered.
 *
 * Recurring events are the reason this isn't just a filter: their date is
 * computed, not stored, so a single card would go stale. Each one is expanded
 * into its next `occurrences` dates as separate cards sharing a `series` id;
 * the browser shows the first that hasn't passed and hides the rest. That keeps
 * the recurrence math here, in one place, instead of duplicating it in a script.
 *
 * `occurrences` is therefore how long a deploy's markup stays correct — six
 * months of monthly clean-ups, by default. Every content publish redeploys, so
 * the real gap between deploys is far shorter than that.
 */
export async function getEventsForDisplay(
  occurrences = 6,
): Promise<EventItem[]> {
  const from = todayInSiteZone();
  const entries = await getCollection('events');
  const items: EventItem[] = [];

  for (const entry of entries) {
    const rec = entry.data.recurrence;

    if (!rec) {
      const item = toEventItem(entry, from);
      // Past-at-build events are dropped for good: they can only get older.
      if ((item.endDate ?? item.date) >= from) items.push(item);
      continue;
    }

    const series = eventSlug(entry);
    let cursor = from;
    for (let i = 0; i < occurrences; i++) {
      const date = nextRecurrenceDate(rec, cursor);
      items.push({
        ...toEventItem(entry, from),
        date,
        endDate: undefined,
        series,
      });
      cursor = nextDayYmd(date);
    }
  }

  return items.sort((a, b) => a.date.localeCompare(b.date));
}
