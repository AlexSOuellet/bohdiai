import { notFound } from 'next/navigation';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getMarket } from '@/lib/backend/markets/queries';
import { loadPaySettings, marketListingIds } from '@/lib/market/queries';
import { marketState } from '@/lib/market/buyer';
import { formatPrice, loadProductsByIds } from '@/lib/storefront/catalog';
import { runningSale, salePriceCents, shopToday } from '@/lib/storefront/promotions';
import { loadShopPromotions } from '@/lib/storefront/promotions-load';
import { hasPrice } from '@/lib/catalog/price';
import { sellMethods, type SellPiece } from '@/lib/backend/markets/sell';
import { SellBoard } from './SellBoard';

export const dynamic = 'force-dynamic';

const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Sell at the table: the Lite point of sale for one market. */
export default async function SellPage({ params }: PageProps<'/manage/markets/[id]/sell'>): Promise<React.ReactElement> {
  const { id } = await params;
  if (!ID.test(id)) notFound();
  const { site } = await requireActingSite();
  if (!(await getSiteFeatures(site.tenantId)).has('market_shop')) notFound();
  const db = await createSupabaseServerClient();
  const [market, ids, pay, promo, tenant] = await Promise.all([
    getMarket(db, site.tenantId, id),
    marketListingIds(db, id),
    loadPaySettings(db, site.tenantId),
    loadShopPromotions(db, site.tenantId),
    db.from('tenants').select('time_zone').eq('id', site.tenantId).maybeSingle(),
  ]);
  if (market === null) notFound();
  const sale = runningSale(promo.promos, promo.today);
  // The price each piece sells at today: the same sum recordMarketSale charges.
  const pieces: SellPiece[] = (await loadProductsByIds(db, site.tenantId, ids))
    .filter((p) => p.view.status === 'active' && p.view.id !== undefined && hasPrice(p.priceCents))
    .map((p) => {
      const cents = sale?.percentOff == null ? p.priceCents : salePriceCents(p.priceCents, sale.percentOff);
      return { id: p.view.id ?? '', name: p.view.name, priceCents: cents, price: formatPrice(cents) };
    });
  return (
    <SellBoard
      eventId={id}
      marketName={market.name}
      shopName={site.businessName}
      pieces={pieces}
      pay={pay}
      methods={sellMethods(pay)}
      open={marketState(market, shopToday(tenant.data?.time_zone ?? null)) === 'open'}
    />
  );
}
