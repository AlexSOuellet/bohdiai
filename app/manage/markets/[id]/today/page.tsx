import { notFound } from 'next/navigation';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getMarket } from '@/lib/backend/markets/queries';
import { listMarketOrders } from '@/lib/backend/markets/today';
import { marketListingIds } from '@/lib/market/queries';
import { marketState } from '@/lib/market/buyer';
import { loadProductsByIds } from '@/lib/storefront/catalog';
import { shopToday } from '@/lib/storefront/promotions';
import { TodayBoard } from './TodayBoard';

export const dynamic = 'force-dynamic';

const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function TodayPage({ params }: PageProps<'/manage/markets/[id]/today'>): Promise<React.ReactElement> {
  const { id } = await params;
  if (!ID.test(id)) notFound();
  const { site } = await requireActingSite();
  if (!(await getSiteFeatures(site.tenantId)).has('market_shop')) notFound();
  const db = await createSupabaseServerClient();
  const [market, orders, ids, tenant] = await Promise.all([
    getMarket(db, site.tenantId, id),
    listMarketOrders(db, site.tenantId, id),
    marketListingIds(db, id),
    db.from('tenants').select('time_zone').eq('id', site.tenantId).maybeSingle(),
  ]);
  if (market === null) notFound();
  const timeZone = tenant.data?.time_zone ?? 'America/New_York';
  const onShelf = (await loadProductsByIds(db, site.tenantId, ids)).filter((p) => p.view.status === 'active' && p.view.id !== undefined);
  return (
    <TodayBoard
      eventId={id}
      marketName={market.name}
      orders={orders}
      pieces={onShelf.map((p) => ({ id: p.view.id ?? '', name: p.view.name }))}
      open={marketState(market, shopToday(timeZone)) === 'open'}
      timeZone={timeZone}
    />
  );
}
