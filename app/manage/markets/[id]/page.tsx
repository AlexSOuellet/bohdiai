import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getMarket } from '@/lib/backend/markets/queries';
import { marketPageUrl, shopPicks } from '@/lib/backend/markets/shop-props';
import { marketListingIds, marketStock } from '@/lib/market/queries';
import { storefrontOrigin } from '@/lib/dashboard/storefront-url';
import { MarketEditor } from '../MarketEditor';
import { isEventTab } from '@/lib/backend/markets/event-tabs';
import { EventSummary } from '../EventSummary';
import { PieceSales } from '../PieceSales';
import { loadPieceResults } from '@/lib/backend/markets/piece-sales';
import { listMarketOrders } from '@/lib/backend/markets/today';
import { costsCents, isPastMarket } from '@/lib/backend/markets/market-form';
import { shopToday } from '@/lib/storefront/promotions';
import { MarketSales } from '../MarketSales';

export const dynamic = 'force-dynamic';

/** A mistyped address is "not found", not a database error. */
const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditMarketPage({
  params,
  searchParams,
}: PageProps<'/manage/markets/[id]'>): Promise<React.ReactElement> {
  const { id } = await params;
  const asked = (await searchParams)['tab'];
  const tab = isEventTab(asked) ? asked : 'details';
  if (!ID.test(id)) notFound();
  const { site } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  if (!on.has('market_dates')) notFound();
  const db = await createSupabaseServerClient();
  const market = await getMarket(db, site.tenantId, id);
  if (market === null) notFound();
  const summary = (took: { count: number; cents: number } | null, today: string): React.ReactElement => (
    <EventSummary
      eventId={id}
      date={market.date}
      endDate={market.endDate}
      town={market.town}
      canceled={market.canceled}
      took={took}
      costsCents={on.has('market_records') ? costsCents(market.costs) : null}
      onToday={on.has('market_shop') && market.date <= today && !isPastMarket(market, today)}
      past={isPastMarket(market, today)}
    />
  );
  if (!on.has('market_shop')) {
    const tenant = await db.from('tenants').select('time_zone').eq('id', site.tenantId).maybeSingle();
    return (
      <MarketEditor
        key={id}
        initial={market}
        details={on.has('market_details')}
        records={on.has('market_records')}
        summary={summary(null, shopToday(tenant.data?.time_zone ?? null))}
      />
    );
  }
  const [picks, listingIds, stock, sold, sales, tenant] = await Promise.all([
    shopPicks(db, site.tenantId),
    marketListingIds(db, id),
    marketStock(db, id),
    loadPieceResults(db, site.tenantId, id),
    listMarketOrders(db, site.tenantId, id),
    db.from('tenants').select('time_zone').eq('id', site.tenantId).maybeSingle(),
  ]);
  const timeZone = tenant.data?.time_zone ?? 'America/New_York';
  const paid = sales.filter((o) => o.status === 'paid');
  const origin = storefrontOrigin(site.subdomain, (await headers()).get('host'));
  return (
    <MarketEditor
      details={on.has('market_details')}
      records={on.has('market_records')}
      key={id}
      tab={tab}
      summary={summary({ count: paid.length, cents: paid.reduce((n, o) => n + o.amountCents, 0) }, shopToday(tenant.data?.time_zone ?? null))}
      sold={
        <>
          <PieceSales rows={sold} timeZone={timeZone} />
          <MarketSales eventId={id} orders={sales} timeZone={timeZone} />
        </>
      }
      initial={{ ...market, listingIds, stock: Object.fromEntries([...stock].map(([k, n]) => [k, String(n)])) }}
      shop={{
        products: picks,
        marketUrl: marketPageUrl(origin, id),
        fileBase: `${site.subdomain}-market-qr`,
      }}
    />
  );
}
