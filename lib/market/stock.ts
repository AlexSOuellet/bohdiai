/**
 * What's left at a market (Alex, 2026-10-20): for each piece she brought, and for
 * each of its options, the fewest of what she has on hand and what's left of what
 * she brought to this market (brought less sold there, open holds counted as sold).
 * Null on either side means "not counted". The database checks the same at the
 * moment of a sale (market_order_internal); this is what the pages show.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

type Db = SupabaseClient<Database>;

/** An option's words from its combination ({ Colour: 'Blue', Size: 'L' } → "Blue / L"). */
export function optionLabel(combination: unknown): string {
  if (combination === null || typeof combination !== 'object' || Array.isArray(combination)) return '';
  return Object.keys(combination)
    .sort()
    .map((k) => (combination as Record<string, unknown>)[k])
    .filter((v): v is string => typeof v === 'string' && v !== '')
    .join(' / ');
}

/** One option of a piece at a market. `left` null: not counted, no limit. */
export type MarketOption = { id: string; label: string; priceCents: number | null; left: number | null };

/** A piece at a market: what's left of it (pieces without options) and its options. */
export type MarketPieceStock = { left: number | null; options: MarketOption[] };

/** The key for a piece, or one of its options, at a market. */
export const countKey = (listingId: string, variantId: string | null): string => (variantId === null ? listingId : `${listingId}:${variantId}`);

/** The fewest of the two limits; null when neither is counted. */
export function leftOf(onHand: number | null, brought: number | null, sold: number): number | null {
  const here = brought === null ? null : brought - sold;
  if (onHand === null) return here === null ? null : Math.max(here, 0);
  if (here === null) return Math.max(onHand, 0);
  return Math.max(Math.min(onHand, here), 0);
}

/** How many of each piece and option sold at a market (open holds included). */
export async function soldAtMarket(db: Db, tenantId: string, eventId: string): Promise<Map<string, number>> {
  const { data, error } = await db
    .from('orders')
    .select('order_items(listing_id, listing_variant_id, quantity)')
    .eq('tenant_id', tenantId)
    .eq('event_id', eventId)
    .eq('source', 'market_mode')
    .in('status', ['pending', 'paid', 'fulfilled']);
  if (error !== null) throw new Error(`Could not load this market’s sales: ${error.message}`);
  const sold = new Map<string, number>();
  for (const o of data ?? []) {
    for (const i of o.order_items) {
      if (i.listing_id === null) continue;
      const k = countKey(i.listing_id, i.listing_variant_id);
      sold.set(k, (sold.get(k) ?? 0) + i.quantity);
    }
  }
  return sold;
}

/** What she brought to a market, by piece and option. */
export async function broughtToMarket(db: Db, eventId: string): Promise<Map<string, number>> {
  const { data, error } = await db.from('market_stock').select('listing_id, listing_variant_id, brought').eq('event_id', eventId);
  if (error !== null) throw new Error(`Could not load how many this market brings: ${error.message}`);
  return new Map((data ?? []).map((r) => [countKey(r.listing_id, r.listing_variant_id), r.brought]));
}

/** Every piece's (and option's) left at a market, for the pieces given. */
export async function marketPieceStock(db: Db, tenantId: string, eventId: string, listingIds: readonly string[]): Promise<Map<string, MarketPieceStock>> {
  if (listingIds.length === 0) return new Map();
  const [rows, brought, sold] = await Promise.all([
    db
      .from('listings')
      .select('id, inventory_count, listing_variants(id, option_combination, price_cents, inventory_count, status)')
      .eq('tenant_id', tenantId)
      .in('id', [...listingIds]),
    broughtToMarket(db, eventId),
    soldAtMarket(db, tenantId, eventId),
  ]);
  if (rows.error !== null) throw new Error(`Could not load what’s on hand: ${rows.error.message}`);
  const out = new Map<string, MarketPieceStock>();
  for (const r of rows.data ?? []) {
    const options = r.listing_variants
      .filter((v) => v.status === 'active')
      .map((v) => {
        const k = countKey(r.id, v.id);
        return { id: v.id, label: optionLabel(v.option_combination), priceCents: v.price_cents, left: leftOf(v.inventory_count, brought.get(k) ?? null, sold.get(k) ?? 0) };
      });
    const k = countKey(r.id, null);
    out.set(r.id, { left: options.length > 0 ? null : leftOf(r.inventory_count, brought.get(k) ?? null, sold.get(k) ?? 0), options });
  }
  return out;
}

/** Nothing of it left at this market: no units, or every option gone. */
export function goneHere(s: MarketPieceStock | undefined): boolean {
  if (s === undefined) return false;
  if (s.options.length > 0) return s.options.every((o) => o.left === 0);
  return s.left === 0;
}
