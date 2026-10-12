import Link from 'next/link';
import type { Route } from 'next';
import { notFound, redirect } from 'next/navigation';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { listMarkets } from '@/lib/backend/markets/queries';
import { isPastMarket } from '@/lib/backend/markets/market-form';
import { posLanding, posMetadata, posViewport } from '@/lib/backend/pos-app';
import { shopToday } from '@/lib/storefront/promotions';
import { marketDays } from '../markets/MarketList';
import { InstallTip } from './InstallTip';

export const dynamic = 'force-dynamic';
export const viewport = posViewport;

export async function generateMetadata(): Promise<ReturnType<typeof posMetadata>> {
  const { site } = await requireActingSite();
  return posMetadata(site.subdomain);
}

/** Where the Market POS icon opens: today's market straight away, otherwise the
 *  coming-up markets to pick from. */
export default async function PosStartPage(): Promise<React.ReactElement> {
  const { site } = await requireActingSite();
  if (!(await getSiteFeatures(site.tenantId)).has('market_shop')) notFound();
  const db = await createSupabaseServerClient();
  const [markets, tenant] = await Promise.all([listMarkets(db, site.tenantId), db.from('tenants').select('time_zone').eq('id', site.tenantId).maybeSingle()]);
  const today = shopToday(tenant.data?.time_zone ?? null);
  const landing = posLanding(markets, today);
  if (landing !== null) redirect(landing as Route);
  const coming = markets.filter((m) => !m.canceled && !isPastMarket(m, today));
  return (
    <div className="bk-day">
      <header className="bk-day-top">
        <div>
          <h1 className="bk-day-name">Market POS</h1>
          <p className="bk-day-where">{site.businessName}</p>
        </div>
        <Link className="bk-day-exit" href="/manage/markets">
          Markets
        </Link>
      </header>
      <main id="main" className="bk-day-main">
        <InstallTip />
        <section aria-labelledby="p-next">
          <h2 id="p-next" className="bk-day-h">
            No market today
          </h2>
          {coming.length === 0 ? (
            <p className="bk-day-empty">Nothing coming up. Add your next market in Markets, tick what you’re bringing, and its POS opens here on the day.</p>
          ) : (
            <ul className="bk-day-sold" aria-label="Coming up">
              {coming.map((m) => (
                <li key={m.id}>
                  <Link className="bk-day-sold-piece" href={`/manage/markets/${m.id}/day` as Route}>
                    {m.name}
                  </Link>
                  <span className="bk-day-sold-who">
                    {marketDays(m)}
                    {m.town !== '' && `, ${m.town}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
