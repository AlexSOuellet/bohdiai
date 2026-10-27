import Link from 'next/link';
import type { Route } from 'next';
import { headers } from 'next/headers';
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
import { getMoment } from '@/lib/backend/moment/queries';
import type { MomentMedia } from '@/lib/backend/moment/moment-form';
import { listProducts, type ProductRowView } from '@/lib/backend/catalog/queries';
import { storefrontOrigin } from '@/lib/dashboard/storefront-url';
import { MY_SITE_PATH } from '@/lib/backend/modules';

export const dynamic = 'force-dynamic';

/** How many of her pieces the home page shows. */
const WALL_MAX = 7;

const count = (n: number, one: string, many: string): string => `${n} ${n === 1 ? one : many}`;

function err(where: string, e: unknown): void {
  logger.error(where, { error: e instanceof Error ? e.message : String(e) });
}

/** The home screen (the redesign, 2026-10-27): her site and her work first, then
 *  what needs doing, then how things are going. */
export default async function ManageHome(): Promise<React.ReactElement> {
  const { site } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  const own = await createSupabaseServerClient();
  const home = await collectHome(HOME_CONTRIBUTORS, on, site.tenantId);
  const db = supabaseAdmin();
  const publish = await getPublishView(db, site.tenantId, site.subdomain, process.env['BACKEND_SESSION_SECRET']);
  const siteUrl = storefrontOrigin(site.subdomain, (await headers()).get('host'));
  const visits = await loadVisits({
    db,
    run: appVisitsReader(),
    tenantId: site.tenantId,
    draft: publish.draft,
    now: new Date(),
    onError: (e) => err('backend home visitor numbers failed', e),
  });

  let opening: MomentMedia | null = null;
  let openingFailed = false;
  try {
    opening = (await getMoment(own, site.tenantId)).media;
  } catch (e) {
    openingFailed = true;
    err('backend home opening photo failed', e);
  }

  const hasProducts = on.has('catalog') || on.has('gallery_pieces');
  let products: ProductRowView[] | null = null;
  if (hasProducts) {
    try {
      products = (await listProducts(own, site.tenantId)).filter((p) => p.status !== 'archived');
    } catch (e) {
      err('backend home products failed', e);
    }
  }

  let events: EventsHome | null = null;
  let eventsFailed = false;
  if (on.has('market_dates')) {
    try {
      const tenant = await own.from('tenants').select('time_zone').eq('id', site.tenantId).maybeSingle();
      events = await loadEventsHome(own, site.tenantId, shopToday(tenant.data?.time_zone ?? null), { shop: on.has('market_shop'), records: on.has('market_records') });
    } catch (e) {
      eventsFailed = true;
      err('backend home events failed', e);
    }
  }

  const address = siteUrl.replace(/^https?:\/\//, '');
  const live = products?.filter((p) => p.status === 'active').length ?? 0;
  const drafts = products?.filter((p) => p.status === 'draft').length ?? 0;

  return (
    <>
      <header className="bk-hello">
        <div className="bk-hello-text">
          <p className="bk-hello-status" data-live={!publish.draft}>
            {publish.draft ? 'Only you can see your site for now' : `Live at ${address}`}
          </p>
          <h1 className="bk-hello-name">{site.businessName}</h1>
          <div className="bk-hello-actions">
            <a className="bk-btn" href={publish.draft && publish.previewUrl !== null ? publish.previewUrl : siteUrl} target="_blank" rel="noopener noreferrer">
              Open my site
            </a>
            <Link className="bk-btn bk-btn-quiet" href={MY_SITE_PATH}>
              Change my site
            </Link>
          </div>
        </div>
        <figure className="bk-window">
          <figcaption className="bk-window-bar">{address}</figcaption>
          {opening === null ? (
            <p className="bk-window-empty">{openingFailed ? 'Your opening photo couldn’t load. Refresh to try again.' : 'Your site has no opening photo yet.'}</p>
          ) : opening.kind === 'video' ? (
            <video src={opening.url} poster={opening.posterUrl === '' ? undefined : opening.posterUrl} muted playsInline aria-label={opening.alt} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- her own upload, sized by CSS
            <img src={opening.url} alt={opening.alt} />
          )}
        </figure>
      </header>

      <main id="main" className="bk-content bk-home">
        {publish.draft && <PublishPanel siteUrl={`https://${site.subdomain}.bohdiai.com`} previewUrl={publish.previewUrl} publish={publishSite} />}

        {home.attention.length > 0 && (
          <section className="bk-next" aria-labelledby="bk-next">
            <h2 id="bk-next" className="bk-band-title">
              Worth doing next
            </h2>
            <ul className="bk-next-list">
              {home.attention.map((line, i) => (
                <li key={`${i}-${line}`}>{line}</li>
              ))}
            </ul>
          </section>
        )}

        {hasProducts && (
          <section aria-labelledby="bk-work">
            <div className="bk-band-head">
              <div>
                <h2 id="bk-work" className="bk-band-title">
                  Your work
                </h2>
                {products !== null && (
                  <p className="bk-band-sub">
                    {count(live, 'product on your site', 'products on your site')}
                    {drafts > 0 && `, ${count(drafts, 'draft', 'drafts')}`}
                  </p>
                )}
              </div>
              <Link className="bk-band-link" href="/manage/products">
                See all your products
              </Link>
            </div>
            {products === null ? (
              <p role="alert" className="bk-error">
                Your products couldn’t load. Refresh to try again.
              </p>
            ) : (
              <ul className="bk-wall">
                <li>
                  <Link className="bk-wall-add" href="/manage/products/new">
                    Add a product
                  </Link>
                </li>
                {products.slice(0, WALL_MAX).map((p) => (
                  <li key={p.id}>
                    <Link className="bk-wall-item" href={`/manage/products/${p.id}` as Route}>
                      {p.photoUrl === null ? (
                        <span className="bk-wall-blank">No photo yet</span>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element -- her own upload, sized by CSS
                        <img src={p.photoUrl} alt="" loading="lazy" />
                      )}
                      {p.status === 'draft' && <span className="bk-wall-tag">Draft</span>}
                      <span className="bk-wall-name">{p.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {(events !== null || eventsFailed || home.tiles.length > 0) && (
          <div className="bk-home-pair">
            {events !== null && <EventsPanel view={events} />}
            {eventsFailed && <p className="bk-note">Your events couldn’t load. Refresh to try again.</p>}
            {home.tiles.length > 0 && (
              <section aria-labelledby="bk-glance">
                <h2 id="bk-glance" className="bk-band-title bk-band-head">
                  At a glance
                </h2>
                <div className="bk-tiles">
                  {home.tiles.map((t, i) => (
                    <StatTile key={`${i}-${t.label}`} label={t.label} value={t.value} {...(t.note !== undefined ? { note: t.note } : {})} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        <VisitsPanel view={visits} />
      </main>
    </>
  );
}
