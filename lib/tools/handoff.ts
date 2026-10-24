/**
 * Products and events come from the tools (Alex, 2026-10-24): "Save as a product"
 * opens a new product with the tool's name and price filled in, and "Save as an
 * event" opens a new event with the market's name and costs. The maker checks it and
 * saves it there, through the screen's own rules. Only the name, a price and cost
 * lines travel, in the address; each is trimmed and capped on the way in.
 */
import { emptyProductForm, formatCents, type ProductForm } from '@/lib/backend/catalog/product-form';
import { COSTS_LIMIT, MARKET_LIMITS, emptyMarketForm, type MarketForm } from '@/lib/backend/markets/market-form';

const PRODUCT_NAME_MAX = 120;

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

/** The address that opens a new product from a tool. */
export function productLink(name: string, priceCents: number): string {
  const q = new URLSearchParams({ from: 'tools' });
  if (name.trim() !== '') q.set('name', name.trim());
  if (Number.isFinite(priceCents) && priceCents > 0) q.set('price', String(Math.round(priceCents)));
  return `/manage/products/new?${q.toString()}`;
}

/** A new product's form, with what the tool sent. Anything else starts as usual. */
export function productFromTools(params: Params): ProductForm {
  const form = emptyProductForm();
  if (one(params['from']) !== 'tools') return form;
  const price = centsFrom(one(params['price']));
  return { ...form, name: one(params['name']).slice(0, PRODUCT_NAME_MAX), price: price === null ? '' : formatCents(price) };
}

export type EventCost = { description: string; cents: number };

/** The address that opens a new event from a tool. Costs of 0 are left out. */
export function eventLink(name: string, costs: readonly EventCost[]): string {
  const q = new URLSearchParams({ from: 'tools' });
  if (name.trim() !== '') q.set('name', name.trim());
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
