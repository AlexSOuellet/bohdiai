/**
 * How each piece sold at a market (Alex, 2026-10-20): what she brought, what sold,
 * what's left, and when a counted piece sold out. Paid sales only (a hold that's
 * still waiting isn't a sale yet). Worked out from the rows each time, never stored.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { countKey, optionLabel } from '@/lib/market/stock';

type Db = SupabaseClient<Database>;

export type PieceResult = {
  eventId: string;
  key: string;
  /** "Scarf" or "Scarf, Blue". */
  name: string;
  /** Null: she didn't count it for this market. */
  brought: number | null;
  sold: number;
  /** Null when not counted. */
  left: number | null;
  /** When the last one she brought sold (ISO time), when it sold out. */
  soldOutAt: string | null;
};

export type BroughtRow = { eventId: string; listingId: string; variantId: string | null; name: string; brought: number };
export type SoldRow = { eventId: string; listingId: string; variantId: string | null; name: string; quantity: number; at: string };

/** Each piece's line at each market: counted pieces first in the order given, then
 *  anything that sold without a count. */
export function pieceResults(brought: readonly BroughtRow[], sold: readonly SoldRow[]): PieceResult[] {
  const rows = new Map<string, PieceResult>();
  const id = (eventId: string, listingId: string, variantId: string | null): string => `${eventId}|${countKey(listingId, variantId)}`;
  for (const b of brought) {
    rows.set(id(b.eventId, b.listingId, b.variantId), { eventId: b.eventId, key: countKey(b.listingId, b.variantId), name: b.name, brought: b.brought, sold: 0, left: b.brought, soldOutAt: null });
  }
  const inOrder = [...sold].sort((a, b) => a.at.localeCompare(b.at));
  for (const s of inOrder) {
    const k = id(s.eventId, s.listingId, s.variantId);
    const row = rows.get(k) ?? { eventId: s.eventId, key: countKey(s.listingId, s.variantId), name: s.name, brought: null, sold: 0, left: null, soldOutAt: null };
    row.sold += s.quantity;
    if (row.brought !== null) {
      row.left = Math.max(row.brought - row.sold, 0);
      if (row.left === 0 && row.soldOutAt === null && row.brought > 0) row.soldOutAt = s.at;
    }
    rows.set(k, row);
  }
  return [...rows.values()];
}

const named = (name: string, option: string | null): string => (option === null || option === '' ? name : `${name}, ${option}`);

/** How the pieces sold at her markets: one market, or every one when `eventId` is null. */
export async function loadPieceResults(db: Db, tenantId: string, eventId: string | null): Promise<PieceResult[]> {
  let stockQuery = db.from('market_stock').select('event_id, listing_id, listing_variant_id, brought, listings(name), listing_variants(option_combination)').eq('tenant_id', tenantId);
  let salesQuery = db
    .from('orders')
    .select('event_id, paid_at, created_at, order_items(listing_id, listing_variant_id, name_snapshot, variant_description_snapshot, quantity)')
    .eq('tenant_id', tenantId)
    .eq('source', 'market_mode')
    .in('status', ['paid', 'fulfilled'])
    .not('event_id', 'is', null);
  if (eventId !== null) {
    stockQuery = stockQuery.eq('event_id', eventId);
    salesQuery = salesQuery.eq('event_id', eventId);
  }
  const [stock, sales] = await Promise.all([stockQuery, salesQuery]);
  if (stock.error !== null) throw new Error(`Could not load what you brought: ${stock.error.message}`);
  if (sales.error !== null) throw new Error(`Could not load your market sales: ${sales.error.message}`);
  const brought: BroughtRow[] = (stock.data ?? []).map((r) => ({
    eventId: r.event_id,
    listingId: r.listing_id,
    variantId: r.listing_variant_id,
    name: named(r.listings?.name ?? '', r.listing_variants === null ? null : optionLabel(r.listing_variants.option_combination)),
    brought: r.brought,
  }));
  const sold: SoldRow[] = (sales.data ?? []).flatMap((o) =>
    o.event_id === null
      ? []
      : o.order_items.flatMap((i) =>
          i.listing_id === null
            ? []
            : [{ eventId: o.event_id as string, listingId: i.listing_id, variantId: i.listing_variant_id, name: named(i.name_snapshot, i.variant_description_snapshot), quantity: i.quantity, at: o.paid_at ?? o.created_at }],
        ),
  );
  return pieceResults(brought, sold);
}
