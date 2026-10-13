/**
 * Markets in the backend (Market POS piece 1) — everything about one market as the
 * owner types it, checked into what save_market writes. Public on the site: name,
 * days, hours, town, address, booth, link, canceled. Private: costs, organizer,
 * notes, her review. Spec: docs/superpowers/specs/2026-10-07-market-pos-design.md
 */
import { parseDollars } from '@/lib/backend/catalog/product-form';
import { MARKET_MAX_DAYS, isCalendarDate } from '@/lib/backend/dates/dates-form';
import { formatPrice } from '@/lib/storefront/catalog';

export const MARKETS_LIMIT = 40;
export const COSTS_LIMIT = 20;

export const MARKET_LIMITS = {
  name: 60,
  town: 40,
  hours: 40,
  address: 160,
  booth: 30,
  url: 300,
  organizerName: 80,
  organizerPhone: 40,
  organizerEmail: 254,
  notes: 2000,
  review: 1000,
  costWhat: 60,
} as const;

export type GoBack = 'yes' | 'maybe' | 'no';
export const GO_BACK_LABEL: Readonly<Record<GoBack, string>> = { yes: 'Yes', maybe: 'Maybe', no: 'No' };

export type CostLine = { description: string; amount: string };

export type MarketForm = {
  id: string | null;
  name: string;
  date: string;
  endDate: string;
  hours: string;
  town: string;
  address: string;
  booth: string;
  url: string;
  canceled: boolean;
  costs: CostLine[];
  organizerName: string;
  organizerPhone: string;
  organizerEmail: string;
  notes: string;
  /** 0 = not rated yet. */
  rating: number;
  goBack: GoBack | '';
  review: string;
  /** The pieces she brings (market shop), in her order. */
  listingIds: string[];
};

export type MarketPayload = {
  name: string;
  event_date: string;
  end_date: string | null;
  hours: string | null;
  location: string | null;
  address: string | null;
  booth: string | null;
  url: string | null;
  status: 'upcoming' | 'canceled';
  organizer_name: string | null;
  organizer_phone: string | null;
  organizer_email: string | null;
  notes: string | null;
  rating: number | null;
  go_back: GoBack | null;
  review: string | null;
  costs: { description: string; amount_cents: number }[];
  listing_ids: string[];
};

export function emptyMarketForm(): MarketForm {
  return {
    id: null,
    name: '',
    date: '',
    endDate: '',
    hours: '',
    town: '',
    address: '',
    booth: '',
    url: '',
    canceled: false,
    costs: [],
    organizerName: '',
    organizerPhone: '',
    organizerEmail: '',
    notes: '',
    rating: 0,
    goBack: '',
    review: '',
    listingIds: [],
  };
}

const tidy = (s: string): string => s.trim().replace(/\s+/g, ' ');
/** Multi-line text: trimmed, blank lines kept to one. */
const tidyLong = (s: string): string => s.trim().replace(/\n{3,}/g, '\n\n');
const orNull = (s: string): string | null => (s === '' ? null : s);

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

/** A link as typed ("wickfordart.org") made into a full web address, or null when it isn't one. */
export function normalizeUrl(raw: string): string | null {
  const t = raw.trim();
  if (t === '') return '';
  const withScheme = /^https?:\/\//i.test(t) ? t : `https://${t}`;
  try {
    const u = new URL(withScheme);
    if (!u.hostname.includes('.')) return null;
    return u.toString();
  } catch {
    return null;
  }
}

export function buildMarketPayload(form: MarketForm): { ok: true; payload: MarketPayload } | { ok: false; error: string } {
  const fail = (error: string) => ({ ok: false as const, error });
  const L = MARKET_LIMITS;
  const name = tidy(form.name);
  if (name === '') return fail('Add the market’s name.');
  if (!isCalendarDate(form.date)) return fail('Pick the market’s first day.');
  const end = form.endDate.trim();
  if (end !== '' && !isCalendarDate(end)) return fail('Pick the market’s last day, or leave it empty for a one-day market.');
  if (end !== '' && end < form.date) return fail('The last day comes before the first day. Check the two days.');
  if (end !== '' && daysBetween(form.date, end) >= MARKET_MAX_DAYS) return fail(`A market can run up to ${MARKET_MAX_DAYS} days. Check the last day.`);

  const fields: [string, string, number, string][] = [
    ['name', name, L.name, 'The name'],
    ['hours', tidy(form.hours), L.hours, 'The hours'],
    ['town', tidy(form.town), L.town, 'The town'],
    ['address', tidy(form.address), L.address, 'The address'],
    ['booth', tidy(form.booth), L.booth, 'The booth'],
    ['organizerName', tidy(form.organizerName), L.organizerName, 'The organizer’s name'],
    ['organizerPhone', tidy(form.organizerPhone), L.organizerPhone, 'The organizer’s phone'],
    ['organizerEmail', tidy(form.organizerEmail), L.organizerEmail, 'The organizer’s email'],
    ['notes', tidyLong(form.notes), L.notes, 'Your notes'],
    ['review', tidyLong(form.review), L.review, 'Your review'],
  ];
  for (const [, value, max, label] of fields) {
    if (value.length > max) return fail(`${label} is ${value.length} characters. Keep it to ${max}.`);
  }
  const v = Object.fromEntries(fields.map(([k, value]) => [k, value])) as Record<string, string>;
  const email = v['organizerEmail'] ?? '';
  if (email !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('The organizer’s email doesn’t look right.');

  const url = normalizeUrl(form.url);
  if (url === null) return fail('The market’s website doesn’t look like a web address.');
  if (url.length > L.url) return fail('The market’s website address is too long.');

  if (form.costs.length > COSTS_LIMIT) return fail(`A market holds up to ${COSTS_LIMIT} costs.`);
  const costs: MarketPayload['costs'] = [];
  for (const [i, c] of form.costs.entries()) {
    const what = tidy(c.description);
    if (what === '' && c.amount.trim() === '') continue;
    if (what === '') return fail(`Cost ${i + 1} needs a name, like Booth fee.`);
    if (what.length > L.costWhat) return fail(`Cost ${i + 1}’s name is too long. Keep it to ${L.costWhat} characters.`);
    const d = parseDollars(c.amount);
    if (!d.ok || d.cents === null) return fail(`${what}: type the amount, like 40 or 12.50.`);
    costs.push({ description: what, amount_cents: d.cents });
  }

  if (!Number.isInteger(form.rating) || form.rating < 0 || form.rating > 5) return fail('Pick from one to five stars.');

  return {
    ok: true,
    payload: {
      name,
      event_date: form.date,
      end_date: end === '' || end === form.date ? null : end,
      hours: orNull(v['hours'] ?? ''),
      location: orNull(v['town'] ?? ''),
      address: orNull(v['address'] ?? ''),
      booth: orNull(v['booth'] ?? ''),
      url: orNull(url),
      status: form.canceled ? 'canceled' : 'upcoming',
      organizer_name: orNull(v['organizerName'] ?? ''),
      organizer_phone: orNull(v['organizerPhone'] ?? ''),
      organizer_email: orNull(email),
      notes: orNull(v['notes'] ?? ''),
      rating: form.rating === 0 ? null : form.rating,
      go_back: form.goBack === '' ? null : form.goBack,
      review: orNull(v['review'] ?? ''),
      costs,
      listing_ids: [...new Set(form.listingIds)],
    },
  };
}

/** The costs' total as the page shows it, counting only lines with a readable amount. */
export function costsTotal(costs: readonly CostLine[]): string {
  let cents = 0;
  for (const c of costs) {
    const d = parseDollars(c.amount);
    if (d.ok && d.cents !== null) cents += d.cents;
  }
  return formatPrice(cents);
}

/** Past once its last day is before today (in the shop's time zone). Only groups the
 *  owner's own list; the public site never hides a market by date. */
export function isPastMarket(m: { date: string; endDate: string }, today: string): boolean {
  return (m.endDate === '' ? m.date : m.endDate) < today;
}
