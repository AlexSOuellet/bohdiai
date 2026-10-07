/**
 * A market's shop page data (Market POS piece 2), for the storefront (service
 * role): the market's public facts, whether it's taking orders today, the pieces
 * she brought (sale prices on), and the ways to pay she has on. Null when the shop
 * has no market shop or no such market.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import type { MarketShopView } from '@/lib/archetypes/content';
import { loadSiteFeatures } from '@/lib/backend/features';
import { MARKET_PUBLIC_COLUMNS, marketDateFromRow } from '@/lib/backend/dates/dates-form';
import { loadProductsByIds } from '@/lib/storefront/catalog';
import { runningSale, withSale } from '@/lib/storefront/promotions';
import { loadShopPromotions } from '@/lib/storefront/promotions-load';
import { marketState } from './buyer';
import { methodsOn } from './pay';
import { loadPaySettings, marketListingIds } from './queries';

export async function loadMarketShop(db: SupabaseClient<Database>, tenantId: string, eventId: string): Promise<MarketShopView | null> {
  const features = await loadSiteFeatures(db, tenantId);
  if (!features.has('market_shop')) return null;
  const { data, error } = await db.from('events').select(MARKET_PUBLIC_COLUMNS).eq('tenant_id', tenantId).eq('id', eventId).maybeSingle();
  if (error !== null) throw new Error(`Could not load the market: ${error.message}`);
  if (data === null) return null;
  const market = marketDateFromRow(data.id, data);

  const [ids, promo, pay] = await Promise.all([marketListingIds(db, eventId), loadShopPromotions(db, tenantId), loadPaySettings(db, tenantId)]);
  const pieces = withSale(
    (await loadProductsByIds(db, tenantId, ids)).filter((p) => !p.isPreview).map((p) => p.view),
    runningSale(promo.promos, promo.today),
  );
  return {
    marketId: market.id,
    name: market.name,
    date: market.date,
    endDate: market.endDate,
    town: market.town,
    booth: market.booth,
    state: marketState(market, promo.today),
    pieces,
    methods: methodsOn(pay),
    codes: promo.promos.some((p) => p.kind === 'code'),
  };
}
