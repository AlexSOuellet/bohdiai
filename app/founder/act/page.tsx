import { headers } from 'next/headers';
import { siteOpenUrl } from '@/lib/backend/publish/queries';
import { requireFounder } from '@/lib/founder/access';
import { findSites, loadFounderSites } from '@/lib/founder/sites';
import { supabaseAdmin } from '@/lib/supabase';
import { SiteTable } from '../SiteTable';

export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Act as a maker: find one, then step into their backend. Shows nothing until asked. */
export default async function FounderActPage({ searchParams }: Props): Promise<React.ReactElement> {
  await requireFounder();
  const asked = (await searchParams)['q'];
  const query = typeof asked === 'string' ? asked.trim() : '';
  const found = query === '' ? [] : findSites(await loadFounderSites(supabaseAdmin()), query);
  const host = (await headers()).get('host');
  const rows = await Promise.all(found.map(async (site) => ({ ...site, openUrl: await siteOpenUrl(site, site.subdomain, process.env['BACKEND_SESSION_SECRET'], host) })));
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
        {rows.length > 0 && <SiteTable sites={rows} />}
      </main>
    </>
  );
}
