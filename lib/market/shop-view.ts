/**
 * A market's shop page data (Market POS piece 2), for the storefront (service
 * role): the market's public facts, whether it's taking orders today, the pieces
 * she brought (sale prices on), and the ways to pay she has on. Null when the shop
 * has no market shop or no such market.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import type { MarketInfoView, MarketShopView } from '@/lib/archetypes/content';
import { loadSiteFeatures } from '@/lib/backend/features';
import { MARKET_PUBLIC_COLUMNS, marketDateFromRow } from '@/lib/backend/dates/dates-form';
import { formatPrice, loadProductsByIds } from '@/lib/storefront/catalog';
import { runningSale, withSale } from '@/lib/storefront/promotions';
import { loadShopPromotions } from '@/lib/storefront/promotions-load';
import { marketState } from './buyer';
import { methodsOn } from './pay';
import { loadPaySettings, marketListingIds } from './queries';
import { goneHere, marketPieceStock } from './stock';

/** The pieces she ticked for a market, sale prices on, a piece with nothing left
 *  there marked sold out; and what's left of each. Shared by the till's page and the
 *  market's information page. */
async function piecesAt(db: SupabaseClient<Database>, tenantId: string, eventId: string) {
  const [ids, promo] = await Promise.all([marketListingIds(db, eventId), loadShopPromotions(db, tenantId)]);
  const [loaded, counts] = await Promise.all([loadProductsByIds(db, tenantId, ids), marketPieceStock(db, tenantId, eventId, ids)]);
  // A piece with nothing left at this market shows as sold out here, whatever is at home.
  const pieces = withSale(
    loaded
      .filter((p) => !p.isPreview)
      .map((p) => (p.view.id !== undefined && goneHere(counts.get(p.view.id)) ? { ...p.view, status: 'sold_out' as const } : p.view)),
    runningSale(promo.promos, promo.today),
  );
  return { pieces, loaded, counts, today: promo.today };
}

export async function loadMarketShop(db: SupabaseClient<Database>, tenantId: string, eventId: string): Promise<MarketShopView | null> {
  const features = await loadSiteFeatures(db, tenantId);
  if (!features.has('market_shop')) return null;
  const { data, error } = await db.from('events').select(MARKET_PUBLIC_COLUMNS).eq('tenant_id', tenantId).eq('id', eventId).maybeSingle();
  if (error !== null) throw new Error(`Could not load the market: ${error.message}`);
  if (data === null) return null;
  const market = marketDateFromRow(data.id, data);

  const [{ pieces, loaded, counts, today }, pay] = await Promise.all([piecesAt(db, tenantId, eventId), loadPaySettings(db, tenantId)]);
  const base = new Map(loaded.map((p) => [p.view.id, p.priceCents]));
  const stock = Object.fromEntries(
    [...counts].map(([id, c]) => [
      id,
      { left: c.left, options: c.options.map((o) => ({ id: o.id, label: o.label, price: formatPrice(o.priceCents ?? base.get(id) ?? 0), left: o.left })) },
    ]),
  );
  return {
    marketId: market.id,
    name: market.name,
    date: market.date,
    endDate: market.endDate,
    town: market.town,
    booth: market.booth,
    state: marketState(market, today),
    pieces,
    stock,
    methods: methodsOn(pay),
  };
}

/** A market's information page (Alex, 2026-10-22): its details and the pieces she's
 *  bringing. Null on Showcase (no market shop) or for no such market. */
export async function loadMarketInfo(db: SupabaseClient<Database>, tenantId: string, eventId: string): Promise<MarketInfoView | null> {
  const features = await loadSiteFeatures(db, tenantId);
  if (!features.has('market_shop')) return null;
  const { data, error } = await db.from('events').select(MARKET_PUBLIC_COLUMNS).eq('tenant_id', tenantId).eq('id', eventId).maybeSingle();
  if (error !== null) throw new Error(`Could not load the market: ${error.message}`);
  if (data === null) return null;
  const market = marketDateFromRow(data.id, data);
  const { pieces, today } = await piecesAt(db, tenantId, eventId);
  return {
    marketId: market.id,
    name: market.name,
    date: market.date,
    endDate: market.endDate,
    town: market.town,
    hours: market.hours,
    address: market.address,
    booth: market.booth,
    url: market.url,
    state: marketState(market, today),
    pieces,
  };
}
