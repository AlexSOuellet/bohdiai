import { notFound } from 'next/navigation';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getMarket } from '@/lib/backend/markets/queries';
import { listMarketOrders } from '@/lib/backend/markets/today';
import { sellMethods } from '@/lib/backend/markets/sell';
import { loadSellPieces } from '@/lib/backend/markets/sell-pieces';
import { loadPaySettings, marketListingIds } from '@/lib/market/queries';
import { marketState } from '@/lib/market/buyer';
import { shopToday } from '@/lib/storefront/promotions';
import { posMetadata, posViewport } from '@/lib/backend/pos-app';
import { supabaseAdmin } from '@/lib/supabase';
import { squareConfig } from '@/lib/square/config';
import { cardState } from '@/lib/square/connection';
import { cardOutcome } from '@/lib/backend/markets/card-outcome';
import { MarketDay } from './MarketDay';

export const dynamic = 'force-dynamic';
export const viewport = posViewport;

export async function generateMetadata(): Promise<ReturnType<typeof posMetadata>> {
  const { site } = await requireActingSite();
  return posMetadata(site.subdomain);
}

const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The market day: one phone screen for the table, with none of the getting-ready
 *  setup. Buyers waiting to pay, ringing up a sale, and what sold today. */
export default async function MarketDayPage({ params, searchParams }: PageProps<'/manage/markets/[id]/day'>): Promise<React.ReactElement> {
  const { id } = await params;
  const query = await searchParams;
  if (!ID.test(id)) notFound();
  const { site } = await requireActingSite();
  if (!(await getSiteFeatures(site.tenantId)).has('market_shop')) notFound();
  const db = await createSupabaseServerClient();
  const [market, orders, ids, pay, tenant] = await Promise.all([
    getMarket(db, site.tenantId, id),
    listMarketOrders(db, site.tenantId, id),
    marketListingIds(db, id),
    loadPaySettings(db, site.tenantId),
    db.from('tenants').select('time_zone').eq('id', site.tenantId).maybeSingle(),
  ]);
  if (market === null) notFound();
  const timeZone = tenant.data?.time_zone ?? 'America/New_York';
  const [pieces, card] = await Promise.all([loadSellPieces(db, site.tenantId, id, ids), cardState(supabaseAdmin(), site.tenantId, squareConfig() !== null)]);
  return (
    <MarketDay
      eventId={id}
      marketName={market.name}
      date={market.date}
      booth={market.booth}
      town={market.town}
      shopName={site.businessName}
      orders={orders}
      pieces={pieces}
      pay={pay}
      methods={sellMethods(pay)}
      open={marketState(market, shopToday(timeZone)) === 'open'}
      timeZone={timeZone}
      card={card}
      cardResult={cardOutcome(query['card'], query['reason'])}
    />
  );
}
