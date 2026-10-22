import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { listMarkets } from '@/lib/backend/markets/queries';
import { loadMarketResults } from '@/lib/backend/markets/results';
import { formatPrice } from '@/lib/storefront/catalog';
import { shopToday } from '@/lib/storefront/promotions';
import { ListNotice, listNotice } from '../_components/ListNotice';
import { MarketList } from './MarketList';

export const dynamic = 'force-dynamic';

export default async function MarketsPage({ searchParams }: PageProps<'/manage/markets'>): Promise<React.ReactElement> {
  const { site } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  if (!on.has('market_dates')) notFound();
  const db = await createSupabaseServerClient();
  const shop = on.has('market_shop');
  const [markets, tenant, results] = await Promise.all([
    listMarkets(db, site.tenantId),
    db.from('tenants').select('time_zone').eq('id', site.tenantId).maybeSingle(),
    shop ? loadMarketResults(db, site.tenantId) : Promise.resolve([]),
  ]);
  const took = new Map(results.map((r) => [r.id, formatPrice(r.takingsCents)]));
  return (
    <>
      <div className="bk-head">
        <h1 className="bk-title">Schedule</h1>
        <div className="bk-head-actions">
          <Link href="/manage/markets/new" className="bk-btn">
            Add an event
          </Link>
        </div>
      </div>
      <main id="main" className="bk-content">
        <ListNotice message={listNotice(await searchParams)} />
        <MarketList markets={markets} today={shopToday(tenant.data?.time_zone ?? null)} records={on.has('market_records')} pos={shop} {...(shop ? { took } : {})} />
      </main>
    </>
  );
}
