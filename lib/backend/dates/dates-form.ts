/**
 * Market dates (Showcase: dates only, shown in the marquee; Lite's calendar later
 * reads the same `events` rows). Each date is a day, the market's name and the
 * town. Shown in the owner's dates, earliest first; nothing is hidden by today's
 * date: the owner keeps the list current.
 */

/** The most dates a site holds. A constant until plans drive it. */
export const DATES_LIMIT = 20;
export const DATE_LIMITS = { name: 60, town: 40 } as const;

export type MarketDate = { id: string; date: string; name: string; town: string };
export type MarketDateForm = { date: string; name: string; town: string };
export type MarketDateRow = { event_date: string; name: string; location: string | null };

export const EMPTY_DATE: MarketDateForm = { date: '', name: '', town: '' };

/** A real calendar day written YYYY-MM-DD (what a date input gives). */
export function isCalendarDate(value: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (m === null) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const day = new Date(Date.UTC(y, mo - 1, d));
  return day.getUTCFullYear() === y && day.getUTCMonth() === mo - 1 && day.getUTCDate() === d;
}

const tidy = (s: string): string => s.trim().replace(/\s+/g, ' ');

/** The owner's date, checked, as the row to write. */
export function buildDateRow(form: MarketDateForm): { ok: true; row: MarketDateRow } | { ok: false; error: string } {
  if (!isCalendarDate(form.date)) return { ok: false, error: 'Pick the day of the market.' };
  const name = tidy(form.name);
  const town = tidy(form.town);
  if (name === '') return { ok: false, error: 'Add the market’s name.' };
  if (name.length > DATE_LIMITS.name) return { ok: false, error: `The market’s name is ${name.length} characters. Keep it to ${DATE_LIMITS.name}.` };
  if (town.length > DATE_LIMITS.town) return { ok: false, error: `The town is ${town.length} characters. Keep it to ${DATE_LIMITS.town}.` };
  return { ok: true, row: { event_date: form.date, name, location: town === '' ? null : town } };
}

/** Earliest first by the market's own day (never by today's date). */
export function byDay(a: MarketDate, b: MarketDate): number {
  return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
}
