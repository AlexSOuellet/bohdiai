/**
 * The pieces a market can sell at the table, at the price each sells at today
 * (the shop's running sale taken off): the same sum recordMarketSale charges.
 * Shared by Sell at the table and the market-day screen.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { hasPrice } from '@/lib/catalog/price';
import { formatPrice, loadProductsByIds } from '@/lib/storefront/catalog';
import { runningSale, salePriceCents } from '@/lib/storefront/promotions';
import { loadShopPromotions } from '@/lib/storefront/promotions-load';
import type { SellPiece } from './sell';

export async function loadSellPieces(db: SupabaseClient<Database>, tenantId: string, listingIds: readonly string[]): Promise<SellPiece[]> {
  const [promo, products] = await Promise.all([loadShopPromotions(db, tenantId), loadProductsByIds(db, tenantId, [...listingIds])]);
  const sale = runningSale(promo.promos, promo.today);
  return products
    .filter((p) => p.view.status === 'active' && p.view.id !== undefined && hasPrice(p.priceCents))
    .map((p) => {
      const cents = sale?.percentOff == null ? p.priceCents : salePriceCents(p.priceCents, sale.percentOff);
      return { id: p.view.id ?? '', name: p.view.name, priceCents: cents, price: formatPrice(cents) };
    });
}
