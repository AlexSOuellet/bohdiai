import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { HOME_CONTRIBUTORS, collectHome } from '@/lib/backend/home';
import { StatTile } from './_components/StatTile';
import { PublishPanel } from './_components/PublishPanel';
import { supabaseAdmin } from '@/lib/supabase';
import { getPublishView } from '@/lib/backend/publish/queries';
import { publishSite } from '@/lib/backend/publish/actions';
import { VisitsPanel } from './_components/VisitsPanel';
import { loadVisits } from '@/lib/visits/home';
import { appVisitsReader } from '@/lib/visits/queries';
import { logger } from '@/lib/logger';
import { EventsPanel } from './_components/EventsPanel';
import { loadEventsHome, type EventsHome } from '@/lib/backend/markets/home-events';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { shopToday } from '@/lib/storefront/promotions';
import { isFreeSite } from '@/lib/backend/plan/free';
import { loadFreeHome } from '@/lib/tools/free-home';
import { planOf } from '@/lib/backend/plan/plan';
import { FreeHomePanel } from './_components/FreeHomePanel';

export const dynamic = 'force-dynamic';

export default async function ManageHome(): Promise<React.ReactElement> {
  const { site } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  // Free has no site: its Home is the steps and the numbers (Alex, 2026-10-24).
  if (await isFreeSite(supabaseAdmin(), site.tenantId)) return <FreeManageHome tenantId={site.tenantId} name={site.businessName} />;
  const home = await collectHome(HOME_CONTRIBUTORS, on, site.tenantId);
  const db = supabaseAdmin();
  const publish = await getPublishView(db, site.tenantId, site.subdomain, process.env['BACKEND_SESSION_SECRET']);
  const visits = await loadVisits({
    db,
    run: appVisitsReader(),
    tenantId: site.tenantId,
    draft: publish.draft,
    now: new Date(),
    onError: (err) => logger.error('backend home visitor numbers failed', { error: err instanceof Error ? err.message : String(err) }),
  });
  let events: EventsHome | null = null;
  let eventsFailed = false;
  if (on.has('market_dates')) {
    try {
      const own = await createSupabaseServerClient();
      const tenant = await own.from('tenants').select('time_zone').eq('id', site.tenantId).maybeSingle();
      events = await loadEventsHome(own, site.tenantId, shopToday(tenant.data?.time_zone ?? null), { shop: on.has('market_shop'), records: on.has('market_records') });
    } catch (err) {
      eventsFailed = true;
      logger.error('backend home events failed', { error: err instanceof Error ? err.message : String(err) });
    }
  }
  return (
    <>
      <div className="bk-head">
        <h1 className="bk-title">{site.businessName}</h1>
      </div>
      <main id="main" className="bk-content">
        {publish.draft && <PublishPanel siteUrl={`https://${site.subdomain}.bohdiai.com`} previewUrl={publish.previewUrl} publish={publishSite} />}
        {home.attention.length > 0 && (
          <section className="bk-attention" aria-labelledby="bk-attn">
            <p id="bk-attn" className="bk-kicker">Needs attention</p>
            <ul className="bk-attention-list">
              {home.attention.map((line, i) => (
                <li key={`${i}-${line}`}>{line}</li>
              ))}
            </ul>
          </section>
        )}
        {events !== null && <EventsPanel view={events} />}
        {eventsFailed && <p className="bk-note">Your events couldn’t load. Refresh to try again.</p>}
        <VisitsPanel view={visits} />
        {home.tiles.length > 0 ? (
          <div className="bk-tiles">
            {home.tiles.map((t, i) => (
              <StatTile key={`${i}-${t.label}`} label={t.label} value={t.value} {...(t.note !== undefined ? { note: t.note } : {})} />
            ))}
          </div>
        ) : (
          <p className="bk-note">Your backend is ready. More tools appear here as they’re added to your site.</p>
        )}
      </main>
    </>
  );
}

async function FreeManageHome({ tenantId, name }: { tenantId: string; name: string }): Promise<React.ReactElement> {
  const own = await createSupabaseServerClient();
  let view = null;
  try {
    view = await loadFreeHome(own, tenantId);
  } catch (err) {
    logger.error('backend free home failed', { error: err instanceof Error ? err.message : String(err) });
  }
  let events: EventsHome | null = null;
  try {
    const tenant = await own.from('tenants').select('time_zone').eq('id', tenantId).maybeSingle();
    events = await loadEventsHome(own, tenantId, shopToday(tenant.data?.time_zone ?? null), { shop: false, records: true });
  } catch (err) {
    logger.error('backend home events failed', { error: err instanceof Error ? err.message : String(err) });
  }
  return (
    <>
      <div className="bk-head">
        <h1 className="bk-title">{name}</h1>
      </div>
      <main id="main" className="bk-content">
        {view === null ? <p className="bk-note">Your numbers couldn’t load. Refresh to try again.</p> : <FreeHomePanel view={view} showcasePrice={planOf('showcase').monthly} />}
        {events !== null && <EventsPanel view={events} />}
      </main>
    </>
  );
}
