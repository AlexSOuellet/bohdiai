import { headers } from 'next/headers';
import { siteOpenUrl } from '@/lib/backend/publish/queries';
import { requireFounder } from '@/lib/founder/access';
import { dollars, loadFounderSites, summarize } from '@/lib/founder/sites';
import { supabaseAdmin } from '@/lib/supabase';
import { SiteTable } from './SiteTable';

export const dynamic = 'force-dynamic';

/** Sites: where the business stands in one line, then every site. */
export default async function FounderSitesPage(): Promise<React.ReactElement> {
  await requireFounder();
  const sites = await loadFounderSites(supabaseAdmin());
  const { sites: count, live, monthlyCents } = summarize(sites);
  const host = (await headers()).get('host');
  const rows = await Promise.all(sites.map(async (site) => ({ ...site, openUrl: await siteOpenUrl(site, site.subdomain, process.env['BACKEND_SESSION_SECRET'], host) })));
  return (
    <>
      <div className="bk-head">
        <h1 className="bk-title">
          {count} sites, {live} live, {dollars(monthlyCents)} a month
        </h1>
      </div>
      <main id="main" className="bk-content">
        <SiteTable sites={rows} />
      </main>
    </>
  );
}
