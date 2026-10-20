/**
 * What a market can sell at the table, at the price each sells at today (the
 * shop's running sale taken off): the same sum recordMarketSale charges. A piece
 * with options is one line per option ("Scarf, Blue"), each at its own price. Each
 * line knows what's left of it at this market (null: not counted).
 * Shared by Sell at the table and the market-day screen.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { hasPrice } from '@/lib/catalog/price';
import { formatPrice, loadProductsByIds } from '@/lib/storefront/catalog';
import { runningSale, salePriceCents } from '@/lib/storefront/promotions';
import { loadShopPromotions } from '@/lib/storefront/promotions-load';
import { countKey, marketPieceStock } from '@/lib/market/stock';
import type { SellPiece } from './sell';

export async function loadSellPieces(db: SupabaseClient<Database>, tenantId: string, eventId: string, listingIds: readonly string[]): Promise<SellPiece[]> {
  const [promo, products, counts] = await Promise.all([
    loadShopPromotions(db, tenantId),
    loadProductsByIds(db, tenantId, [...listingIds]),
    marketPieceStock(db, tenantId, eventId, listingIds),
  ]);
  const sale = runningSale(promo.promos, promo.today);
  const priced = (cents: number): number => (sale?.percentOff == null ? cents : salePriceCents(cents, sale.percentOff));
  return products.flatMap((p): SellPiece[] => {
    const id = p.view.id;
    if (p.view.status !== 'active' || id === undefined) return [];
    const count = counts.get(id);
    const options = count?.options ?? [];
    if (options.length === 0) {
      if (!hasPrice(p.priceCents)) return [];
      const cents = priced(p.priceCents);
      return [{ id: countKey(id, null), listingId: id, variantId: null, name: p.view.name, priceCents: cents, price: formatPrice(cents), left: count?.left ?? null }];
    }
    return options.flatMap((o): SellPiece[] => {
      const base = o.priceCents ?? p.priceCents;
      if (!hasPrice(base)) return [];
      const cents = priced(base);
      return [{ id: countKey(id, o.id), listingId: id, variantId: o.id, name: `${p.view.name}, ${o.label}`, priceCents: cents, price: formatPrice(cents), left: o.left }];
    });
  });
}
