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
  return (
    <>
      <div className="bk-head">
        <h1 className="bk-title">
          {count} sites, {live} live, {dollars(monthlyCents)} a month
        </h1>
      </div>
      <main id="main" className="bk-content">
        <SiteTable sites={sites} />
      </main>
    </>
  );
}
