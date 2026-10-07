/**
 * Market dates (Showcase: dates only, shown in the marquee; Lite's calendar later
 * reads the same `events` rows). Each date is a day (or a first and last day, for
 * a market that runs over a weekend or longer), the market's name and the town. Shown in the owner's dates, earliest first; nothing is hidden by today's
 * date: the owner keeps the list current.
 */

/** The most dates a site holds. A constant until plans drive it. */
export const DATES_LIMIT = 20;
export const DATE_LIMITS = { name: 60, town: 40 } as const;
/** The longest run one market can have, in days. */
export const MARKET_MAX_DAYS = 14;

/** `endDate` is the market's last day, or '' when it runs one day. */
export type MarketDate = { id: string; date: string; endDate: string; name: string; town: string };
export type MarketDateForm = { date: string; endDate: string; name: string; town: string };
export type MarketDateRow = { event_date: string; end_date: string | null; name: string; location: string | null };

export const EMPTY_DATE: MarketDateForm = { date: '', endDate: '', name: '', town: '' };

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
  const end = form.endDate.trim();
  if (end !== '' && !isCalendarDate(end)) return { ok: false, error: 'Pick the market’s last day, or leave it empty for a one-day market.' };
  if (end !== '' && end < form.date) return { ok: false, error: 'The last day comes before the first day. Check the two days.' };
  if (end !== '' && daysBetween(form.date, end) >= MARKET_MAX_DAYS)
    return { ok: false, error: `A market can run up to ${MARKET_MAX_DAYS} days. Check the last day.` };
  const name = tidy(form.name);
  const town = tidy(form.town);
  if (name === '') return { ok: false, error: 'Add the market’s name.' };
  if (name.length > DATE_LIMITS.name) return { ok: false, error: `The market’s name is ${name.length} characters. Keep it to ${DATE_LIMITS.name}.` };
  if (town.length > DATE_LIMITS.town) return { ok: false, error: `The town is ${town.length} characters. Keep it to ${DATE_LIMITS.town}.` };
  return { ok: true, row: { event_date: form.date, end_date: end === '' || end === form.date ? null : end, name, location: town === '' ? null : town } };
}

/** Earliest first by the market's own day (never by today's date). */
export function byDay(a: MarketDate, b: MarketDate): number {
  return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

/** The date as saved, back in the shape the owner and the site use. */
export function marketDateFromRow(id: string, row: MarketDateRow): MarketDate {
  return { id, date: row.event_date, endDate: row.end_date ?? '', name: row.name, town: row.location ?? '' };
}
