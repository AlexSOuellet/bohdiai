import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { loadMarketResults } from '@/lib/backend/markets/results';
import { shopToday } from '@/lib/storefront/promotions';
import { MarketResultsView } from './MarketResultsView';
import { SoldOutList } from '../PieceSales';
import { loadPieceResults } from '@/lib/backend/markets/piece-sales';

export const dynamic = 'force-dynamic';

/** Which markets made money, this year against last (Full). */
export default async function MarketResultsPage(): Promise<React.ReactElement> {
  const { site } = await requireActingSite();
  if (!(await getSiteFeatures(site.tenantId)).has('market_records')) notFound();
  const db = await createSupabaseServerClient();
  const [results, tenant, pieces] = await Promise.all([
    loadMarketResults(db, site.tenantId),
    db.from('tenants').select('time_zone').eq('id', site.tenantId).maybeSingle(),
    loadPieceResults(db, site.tenantId, null),
  ]);
  const year = Number(shopToday(tenant.data?.time_zone ?? null).slice(0, 4));
  const markets = new Map(results.map((r) => [r.id, r.name]));
  // This year's sell-outs (by the market's own day).
  const thisYear = new Set(results.filter((r) => r.date.startsWith(String(year))).map((r) => r.id));
  return (
    <>
      <div className="bk-head">
        <h1 className="bk-title">Market results</h1>
        <div className="bk-head-actions">
          <Link className="bk-btn bk-btn-quiet" href="/manage/markets">
            Back to markets
          </Link>
        </div>
      </div>
      <main id="main" className="bk-content">
        <MarketResultsView results={results} year={year} />
        <SoldOutList rows={pieces.filter((p) => thisYear.has(p.eventId))} markets={markets} timeZone={tenant.data?.time_zone ?? 'America/New_York'} />
      </main>
    </>
  );
}
