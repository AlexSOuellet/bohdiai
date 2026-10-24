/**
 * A product's costs (Alex, 2026-10-24): what Cost to make and Price it worked out,
 * kept on the product so she can come back and change one number. Kept as she typed
 * it (the tools' own form), checked into rows for product_costs and
 * product_cost_items, and read back the same way. Her price stays her own; the
 * suggested price is worked out from these each time.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { formatCents, parseDollars } from '@/lib/backend/catalog/product-form';
import { MARKUPS, amount, costToMake, priceIt, type BatchSupply, type Markup, type PieceItem } from './maths';

export type CostSettings = {
  yield: string;
  hours: string;
  rate: string;
  extras: string;
  markup: Markup;
  batch: BatchSupply[];
  piece: PieceItem[];
};

export const COST_LINES_MAX = 30;
const NAME_MAX = 80;

type CostsRow = Database['public']['Tables']['product_costs']['Insert'];
type ItemRow = Database['public']['Tables']['product_cost_items']['Insert'];

type Db = SupabaseClient<Database>;

/** A typed number that may be left blank: blank is null, anything else must be a
 *  number of 0 or more (`positive`: more than 0). */
function optionalNumber(text: string, positive = false): { ok: true; n: number | null } | { ok: false } {
  const t = text.trim();
  if (t === '') return { ok: true, n: null };
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(t)) return { ok: false };
  const n = Number(t);
  return positive && n === 0 ? { ok: false } : { ok: true, n };
}

function optionalCents(text: string): { ok: true; cents: number | null } | { ok: false } {
  const d = parseDollars(text);
  return d.ok ? { ok: true, cents: d.cents } : { ok: false };
}

const blank = (s: string): boolean => s.trim() === '';

/** Her costs as rows, or what's wrong with them. Lines left wholly blank are dropped. */
export function costRows(tenantId: string, listingId: string, s: CostSettings): { ok: true; costs: CostsRow; items: ItemRow[] } | { ok: false; error: string } {
  const pieces = optionalNumber(s.yield, true);
  if (!pieces.ok) return { ok: false, error: 'Check how many one batch makes: a number more than 0.' };
  const hours = optionalNumber(s.hours);
  if (!hours.ok) return { ok: false, error: 'Check the hours to make the batch.' };
  const rate = optionalCents(s.rate);
  if (!rate.ok) return { ok: false, error: 'Check your hourly pay, like 20 or 22.50.' };
  const other = optionalCents(s.extras);
  if (!other.ok) return { ok: false, error: 'Check the other costs for one, like 1.50.' };
  if (!(MARKUPS as readonly number[]).includes(s.markup)) return { ok: false, error: 'Pick how much to mark it up.' };

  const items: ItemRow[] = [];
  for (const b of s.batch) {
    if (blank(b.name) && blank(b.paid)) continue;
    const paid = optionalCents(b.paid);
    if (!paid.ok || paid.cents === null) return { ok: false, error: `Check what you paid for ${blank(b.name) ? 'a supply' : b.name.trim()}.` };
    const lasts = optionalNumber(b.lasts, true);
    if (!lasts.ok) return { ok: false, error: `Check how many batches ${blank(b.name) ? 'a supply' : b.name.trim()} lasts.` };
    items.push({ tenant_id: tenantId, listing_id: listingId, kind: 'batch', name: b.name.trim().slice(0, NAME_MAX), paid_cents: paid.cents, batches_lasts: lasts.n, position: items.length });
  }
  for (const p of s.piece) {
    if (blank(p.name) && blank(p.each)) continue;
    const each = optionalCents(p.each);
    if (!each.ok || each.cents === null) return { ok: false, error: `Check what ${blank(p.name) ? 'an item' : p.name.trim()} costs you each.` };
    items.push({ tenant_id: tenantId, listing_id: listingId, kind: 'piece', name: p.name.trim().slice(0, NAME_MAX), paid_cents: each.cents, batches_lasts: null, position: items.length });
  }
  if (items.length > COST_LINES_MAX) return { ok: false, error: `Keep it to ${COST_LINES_MAX} supplies and items.` };
  return {
    ok: true,
    costs: { tenant_id: tenantId, listing_id: listingId, pieces_per_batch: pieces.n, batch_hours: hours.n, hourly_pay_cents: rate.cents, other_cents: other.cents, markup: s.markup },
    items,
  };
}

const text = (n: number | null): string => (n === null ? '' : String(n));

/** The rows back as she typed them. A markup the tools don't offer reads as the usual one. */
export function costSettingsFrom(
  row: Pick<CostsRow, 'pieces_per_batch' | 'batch_hours' | 'hourly_pay_cents' | 'other_cents' | 'markup'>,
  items: readonly Pick<ItemRow, 'kind' | 'name' | 'paid_cents' | 'batches_lasts' | 'position'>[],
): CostSettings {
  const sorted = [...items].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  return {
    yield: text(row.pieces_per_batch ?? null),
    hours: text(row.batch_hours ?? null),
    rate: formatCents(row.hourly_pay_cents ?? null),
    extras: formatCents(row.other_cents ?? null),
    markup: (MARKUPS as readonly number[]).includes(row.markup ?? 2.5) ? (row.markup as Markup) : 2.5,
    batch: sorted.filter((i) => i.kind === 'batch').map((i) => ({ name: i.name ?? '', paid: formatCents(i.paid_cents), lasts: text(i.batches_lasts ?? null) })),
    piece: sorted.filter((i) => i.kind === 'piece').map((i) => ({ name: i.name ?? '', each: formatCents(i.paid_cents) })),
  };
}

export type CostSummary = { materials: number; breakEven: number; suggestedCents: number };

/** Materials, break-even and the suggested price (break-even × markup, rounded up). */
export function costSummary(s: CostSettings): CostSummary | null {
  const c = costToMake(s);
  if (!c.has) return null;
  const p = priceIt({
    materials: String(c.materials),
    time: String(c.time),
    extras: s.extras,
    markup: s.markup,
    channels: new Set(),
    etsyPct: '',
    etsyFix: '',
    haggle: '',
    sitePct: '',
    siteFix: '',
    consignPct: '',
    consignRent: '',
    consignSold: '',
  });
  return { materials: c.materials, breakEven: p.breakEven, suggestedCents: p.fair * 100 };
}

/** Her price is under what the piece costs her (break-even). */
export function pricedBelowCost(priceCents: number | null, summary: CostSummary | null): boolean {
  return summary !== null && priceCents !== null && priceCents > 0 && priceCents < Math.round(summary.breakEven * 100);
}

/** Replace a product's costs with these. */
export async function saveProductCosts(db: Db, tenantId: string, listingId: string, s: CostSettings): Promise<{ ok: true } | { ok: false; error: string }> {
  const rows = costRows(tenantId, listingId, s);
  if (!rows.ok) return rows;
  const up = await db.from('product_costs').upsert(rows.costs);
  if (up.error !== null) throw new Error(`Could not save the costs: ${up.error.message}`);
  const del = await db.from('product_cost_items').delete().eq('listing_id', listingId).eq('tenant_id', tenantId);
  if (del.error !== null) throw new Error(`Could not save the supplies: ${del.error.message}`);
  if (rows.items.length > 0) {
    const ins = await db.from('product_cost_items').insert(rows.items);
    if (ins.error !== null) throw new Error(`Could not save the supplies: ${ins.error.message}`);
  }
  return { ok: true };
}

/** A product's costs, or null when none are saved. */
export async function loadProductCosts(db: Db, tenantId: string, listingId: string): Promise<CostSettings | null> {
  const [c, i] = await Promise.all([
    db.from('product_costs').select('pieces_per_batch, batch_hours, hourly_pay_cents, other_cents, markup').eq('tenant_id', tenantId).eq('listing_id', listingId).maybeSingle(),
    db.from('product_cost_items').select('kind, name, paid_cents, batches_lasts, position').eq('tenant_id', tenantId).eq('listing_id', listingId),
  ]);
  if (c.error !== null) throw new Error(`Could not read the costs: ${c.error.message}`);
  if (i.error !== null) throw new Error(`Could not read the supplies: ${i.error.message}`);
  return c.data === null ? null : costSettingsFrom(c.data, i.data ?? []);
}

/** Every product's cost summary for a site, by product. */
export async function loadCostSummaries(db: Db, tenantId: string): Promise<Map<string, CostSummary>> {
  const [c, i] = await Promise.all([
    db.from('product_costs').select('listing_id, pieces_per_batch, batch_hours, hourly_pay_cents, other_cents, markup').eq('tenant_id', tenantId),
    db.from('product_cost_items').select('listing_id, kind, name, paid_cents, batches_lasts, position').eq('tenant_id', tenantId),
  ]);
  if (c.error !== null) throw new Error(`Could not read the costs: ${c.error.message}`);
  if (i.error !== null) throw new Error(`Could not read the supplies: ${i.error.message}`);
  const out = new Map<string, CostSummary>();
  for (const row of c.data ?? []) {
    const s = costSummary(costSettingsFrom(row, (i.data ?? []).filter((x) => x.listing_id === row.listing_id)));
    if (s !== null) out.set(row.listing_id, s);
  }
  return out;
}

/** True when anything is filled in worth keeping. */
export function hasCosts(s: CostSettings): boolean {
  return amount(s.yield) > 0 || s.batch.some((b) => amount(b.paid) > 0) || s.piece.some((p) => amount(p.each) > 0);
}
