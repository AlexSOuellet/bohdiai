import Link from 'next/link';
import type { Route } from 'next';
import { notFound } from 'next/navigation';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { listSalesByEvent } from '@/lib/backend/markets/sales';
import { takings } from '@/lib/backend/markets/today';
import { marketDays } from '../markets/MarketList';
import { MarketSales } from '../markets/MarketSales';

export const dynamic = 'force-dynamic';

/** Sales (Events; Alex, 2026-10-22): what sold at each event, newest event first. */
export default async function SalesPage(): Promise<React.ReactElement> {
  const { site } = await requireActingSite();
  if (!(await getSiteFeatures(site.tenantId)).has('market_shop')) notFound();
  const db = await createSupabaseServerClient();
  const [events, tenant] = await Promise.all([listSalesByEvent(db, site.tenantId), db.from('tenants').select('time_zone').eq('id', site.tenantId).maybeSingle()]);
  const timeZone = tenant.data?.time_zone ?? 'America/New_York';
  return (
    <>
      <div className="bk-head">
        <h1 className="bk-title">Sales</h1>
      </div>
      <main id="main" className="bk-content">
        {events.length === 0 ? (
          <p className="bk-note">No sales yet. What you sell at your events shows up here, grouped by event.</p>
        ) : (
          events.map((e) => {
            const took = takings(e.sales);
            return (
              <section key={e.id} className="bk-section" aria-labelledby={`sales-${e.id}`}>
                <div className="bk-event-sales-head">
                  <div>
                    <h2 id={`sales-${e.id}`} className="bk-section-title">
                      <Link href={`/manage/markets/${e.id}?tab=sold` as Route}>{e.name}</Link>
                    </h2>
                    <p className="bk-event-sales-when">
                      {marketDays(e)}
                      {e.town !== '' && `, ${e.town}`}
                    </p>
                  </div>
                  <p className="bk-event-sales-took">
                    {took.count === 0 ? (
                      'Nothing paid yet'
                    ) : (
                      <>
                        Took in <strong>{took.total}</strong> from {took.count === 1 ? 'one sale' : `${took.count} sales`}
                      </>
                    )}
                  </p>
                </div>
                <MarketSales eventId={e.id} orders={e.sales} timeZone={timeZone} />
              </section>
            );
          })
        )}
      </main>
    </>
  );
}
