/**
 * Products and events come from the tools (Alex, 2026-10-24): "Save as a product"
 * opens a new product with the tool's name and price filled in, and "Save as an
 * event" opens a new event with the market's name and costs. The maker checks it and
 * saves it there, through the screen's own rules. The name, a price and the costs
 * travel in the address; each is trimmed and capped on the way in, and the costs are
 * checked again when the product saves.
 */
import { emptyProductForm, formatCents, type ProductForm } from '@/lib/backend/catalog/product-form';
import { COSTS_LIMIT, MARKET_LIMITS, emptyMarketForm, type MarketForm } from '@/lib/backend/markets/market-form';
import { MARKUPS, type Markup } from './maths';
import { COST_LINES_MAX, type CostSettings } from './product-costs';
import type { Takings } from './event-takings';
import { BLANK_PRICE, type CostCarry, type PriceForm } from './forms';
import { LONG_MAX, SHORT_MAX } from './describe-limits';

const PRODUCT_NAME_MAX = 120;
const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** What Describe it sends with a new product besides the name and price. */
export type ProductWords = { short?: string; description?: string; photoUploadId?: string };

type Params = Record<string, string | string[] | undefined>;

function one(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? (v[0] ?? '') : (v ?? '')).trim();
}

function many(v: string | string[] | undefined): string[] {
  return Array.isArray(v) ? v : v === undefined ? [] : [v];
}

/** A whole number of cents, or null. */
function centsFrom(text: string): number | null {
  return /^\d{1,8}$/.test(text) ? Number(text) : null;
}

const NUMBER_MAX = 12;
const short = (s: string): string => s.trim().slice(0, NUMBER_MAX);

/** Cost to make's batch and time, written into an address. */
function appendCarry(q: URLSearchParams, c: CostCarry): void {
  q.set('y', short(c.yield));
  q.set('h', short(c.hours));
  q.set('r', short(c.rate));
  for (const b of c.batch) if (b.name.trim() !== '' || b.paid.trim() !== '') q.append('b', `${short(b.paid)}:${short(b.lasts)}:${b.name.trim()}`);
  for (const p of c.piece) if (p.name.trim() !== '' || p.each.trim() !== '') q.append('p', `${short(p.each)}:${p.name.trim()}`);
}

/** The address that opens a new product from a tool, with its costs when there are any. */
export function productLink(name: string, priceCents: number, costs: CostSettings | null = null, words: ProductWords = {}): string {
  const q = new URLSearchParams({ from: 'tools' });
  if (name.trim() !== '') q.set('name', name.trim());
  if (Number.isFinite(priceCents) && priceCents > 0) q.set('price', String(Math.round(priceCents)));
  if (words.short !== undefined && words.short.trim() !== '') q.set('short', words.short.trim().slice(0, SHORT_MAX));
  if (words.description !== undefined && words.description.trim() !== '') q.set('desc', words.description.trim().slice(0, LONG_MAX));
  if (words.photoUploadId !== undefined && ID.test(words.photoUploadId)) q.set('photo', words.photoUploadId);
  if (costs !== null) {
    appendCarry(q, costs);
    q.set('o', short(costs.extras));
    q.set('m', String(costs.markup));
  }
  return `/manage/products/new?${q.toString()}`;
}

/** The address that opens Price it from Cost to make (Alex, 2026-10-28): the piece's
 *  name, materials and time for one, and the batch so a product saved there keeps it. */
export function priceLink(name: string, materials: number, time: number, carry: CostCarry): string {
  const q = new URLSearchParams({ from: 'cost' });
  if (name.trim() !== '') q.set('name', name.trim());
  if (materials > 0) q.set('mat', materials.toFixed(2));
  if (time > 0) q.set('time', time.toFixed(2));
  appendCarry(q, carry);
  return `/manage/tools/price?${q.toString()}`;
}

/** Price it as Cost to make opened it, with what it carried; blank when opened on its own. */
export function priceFromCost(params: Params): { form: PriceForm; carry: CostCarry | null } {
  if (one(params['from']) !== 'cost') return { form: BLANK_PRICE, carry: null };
  const form = { ...BLANK_PRICE, name: one(params['name']).slice(0, PRODUCT_NAME_MAX), materials: one(params['mat']).slice(0, NUMBER_MAX), time: one(params['time']).slice(0, NUMBER_MAX) };
  return { form, carry: params['y'] === undefined ? null : carryFrom(params) };
}

/** The costs a tool sent with a new product, or null. */
export function costsFromTools(params: Params): CostSettings | null {
  if (one(params['from']) !== 'tools' || params['y'] === undefined) return null;
  const m = Number(one(params['m']));
  return {
    ...carryFrom(params),
    extras: one(params['o']).slice(0, NUMBER_MAX),
    markup: (MARKUPS as readonly number[]).includes(m) ? (m as Markup) : 2.5,
  };
}

/** Cost to make's batch and time, read back out of an address. */
function carryFrom(params: Params): CostCarry {
  const split = (raw: string, parts: number): string[] => {
    const out: string[] = [];
    let rest = raw;
    for (let i = 1; i < parts; i++) {
      const at = rest.indexOf(':');
      out.push(at < 0 ? '' : rest.slice(0, at).slice(0, NUMBER_MAX));
      rest = at < 0 ? rest : rest.slice(at + 1);
    }
    out.push(rest.trim().slice(0, 80));
    return out;
  };
  return {
    yield: one(params['y']).slice(0, NUMBER_MAX),
    hours: one(params['h']).slice(0, NUMBER_MAX),
    rate: one(params['r']).slice(0, NUMBER_MAX),
    batch: many(params['b']).slice(0, COST_LINES_MAX).map((raw) => {
      const [paid = '', lasts = '', name = ''] = split(raw, 3);
      return { name, paid, lasts };
    }),
    piece: many(params['p']).slice(0, COST_LINES_MAX).map((raw) => {
      const [each = '', name = ''] = split(raw, 2);
      return { name, each };
    }),
  };
}

/** A new product's form, with what the tool sent. Anything else starts as usual. */
export function productFromTools(params: Params): ProductForm {
  const form = emptyProductForm();
  if (one(params['from']) !== 'tools') return form;
  const price = centsFrom(one(params['price']));
  return {
    ...form,
    name: one(params['name']).slice(0, PRODUCT_NAME_MAX),
    price: price === null ? '' : formatCents(price),
    shortDescription: one(params['short']).slice(0, SHORT_MAX),
    description: (Array.isArray(params['desc']) ? (params['desc'][0] ?? '') : (params['desc'] ?? '')).trim().slice(0, LONG_MAX),
  };
}

/** The photo Describe it sent with a new product: an upload id, checked against the site's own uploads by the page. */
export function photoFromTools(params: Params): string | null {
  const id = one(params['photo']);
  return one(params['from']) === 'tools' && ID.test(id) ? id : null;
}

export type EventCost = { description: string; cents: number };

const TAKINGS_KEYS: readonly (keyof Takings)[] = ['sales', 'card', 'cardRate', 'materials', 'hoursAtMarket', 'hoursOther', 'wage'];

/** The address that opens a new event from a tool, with Market day's own numbers.
 *  Costs of 0 are left out. */
export function eventLink(name: string, costs: readonly EventCost[], takings: Takings | null = null): string {
  const q = new URLSearchParams({ from: 'tools' });
  if (name.trim() !== '') q.set('name', name.trim());
  if (takings !== null) for (const k of TAKINGS_KEYS) if (takings[k].trim() !== '') q.set(`t_${k}`, short(takings[k]));
  for (const c of costs) {
    const n = Math.round(c.cents);
    if (Number.isFinite(n) && n > 0) q.append('cost', `${n}:${c.description}`);
  }
  return `/manage/markets/new?${q.toString()}`;
}

/** A new event's form, with what the tool sent. Anything else starts as usual. */
export function eventFromTools(params: Params): MarketForm {
  const form = emptyMarketForm();
  if (one(params['from']) !== 'tools') return form;
  const costs = many(params['cost'])
    .flatMap((raw) => {
      const at = raw.indexOf(':');
      const n = at > 0 ? centsFrom(raw.slice(0, at)) : null;
      const description = raw.slice(at + 1).trim().slice(0, MARKET_LIMITS.costWhat);
      return n === null || n === 0 || description === '' ? [] : [{ description, amount: formatCents(n) }];
    })
    .slice(0, COSTS_LIMIT);
  return { ...form, name: one(params['name']).slice(0, MARKET_LIMITS.name), costs };
}

/** Market day's own numbers sent with a new event, or null. */
export function takingsFromTools(params: Params): Takings | null {
  if (one(params['from']) !== 'tools') return null;
  const t = Object.fromEntries(TAKINGS_KEYS.map((k) => [k, one(params[`t_${k}`]).slice(0, NUMBER_MAX)])) as Takings;
  return Object.values(t).some((v) => v !== '') ? t : null;
}
