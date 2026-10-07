import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { listMarkets } from '@/lib/backend/markets/queries';
import { shopToday } from '@/lib/storefront/promotions';
import { ListNotice, listNotice } from '../_components/ListNotice';
import { MarketList } from './MarketList';

export const dynamic = 'force-dynamic';

export default async function MarketsPage({ searchParams }: PageProps<'/manage/markets'>): Promise<React.ReactElement> {
  const { site } = await requireActingSite();
  if (!(await getSiteFeatures(site.tenantId)).has('market_dates')) notFound();
  const db = await createSupabaseServerClient();
  const [markets, tenant] = await Promise.all([listMarkets(db, site.tenantId), db.from('tenants').select('time_zone').eq('id', site.tenantId).maybeSingle()]);
  return (
    <>
      <div className="bk-head">
        <h1 className="bk-title">Markets</h1>
        <div className="bk-head-actions">
          <Link href="/manage/markets/new" className="bk-btn">
            Add market
          </Link>
        </div>
      </div>
      <main id="main" className="bk-content">
        <ListNotice message={listNotice(await searchParams)} />
        <MarketList markets={markets} today={shopToday(tenant.data?.time_zone ?? null)} />
      </main>
    </>
  );
}
