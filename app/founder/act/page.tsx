import { headers } from 'next/headers';
import Link from 'next/link';
import { siteOpenUrl } from '@/lib/backend/publish/queries';
import { requireFounder } from '@/lib/founder/access';
import { everySite, findSites, loadFounderSites } from '@/lib/founder/sites';
import { supabaseAdmin } from '@/lib/supabase';
import { SiteTable } from '../SiteTable';

export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Act as a maker: find one, or pick from every maker listed by name (Alex,
 *  2026-11-15: search OR see a list), then step into their backend. */
export default async function FounderActPage({ searchParams }: Props): Promise<React.ReactElement> {
  await requireFounder();
  const asked = (await searchParams)['q'];
  const query = typeof asked === 'string' ? asked.trim() : '';
  const sites = await loadFounderSites(supabaseAdmin());
  const found = query === '' ? everySite(sites) : findSites(sites, query);
  const host = (await headers()).get('host');
  const rows = await Promise.all(
    found.map(async (site) => ({
      ...site,
      openUrl: await siteOpenUrl(site, site.subdomain, process.env['BACKEND_SESSION_SECRET'], host),
    })),
  );
  return (
    <>
      <div className="bk-head">
        <h1 className="bk-title">Act as a maker</h1>
      </div>
      <main id="main" className="bk-content">
        <form action="/founder/act" method="get" role="search" className="fd-find">
          <label htmlFor="fd-q" className="bk-label">
            Maker’s name, site or email
          </label>
          <div className="bk-row">
            <input id="fd-q" name="q" type="search" className="bk-input" defaultValue={query} />
            <button type="submit" className="bk-btn">
              Find
            </button>
          </div>
        </form>
        {query !== '' && rows.length === 0 && <p className="bk-note">Nothing matches “{query}”.</p>}
        {query === '' && rows.length === 0 && <p className="bk-note">No makers yet.</p>}
        {query === '' && rows.length > 0 && (
          <p className="bk-note">{`Every maker, ${rows.length} in all. Search to narrow it down.`}</p>
        )}
        {query !== '' && rows.length > 0 && (
          <p className="bk-note">
            <Link className="bk-link" href="/founder/act">
              See every maker
            </Link>
          </p>
        )}
        {rows.length > 0 && <SiteTable sites={rows} />}
      </main>
    </>
  );
}
