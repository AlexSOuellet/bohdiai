import { requireFounder } from '@/lib/founder/access';
import { loadSiteReports } from '@/lib/site-reports/load';
import { supabaseAdmin } from '@/lib/supabase';
import { markSeenQuietly } from '@/lib/founder/seen-page';
import { ReportList } from './ReportList';

export const dynamic = 'force-dynamic';

/** Reports: what visitors sent from "Report this site" in every site's footer (go-live step 3). */
export default async function FounderReportsPage(): Promise<React.ReactElement> {
  await requireFounder();
  await markSeenQuietly('reports');
  return (
    <>
      <div className="bk-head">
        <h1 className="bk-title">Reports</h1>
      </div>
      <main id="main" className="bk-content">
        <ReportList reports={await loadSiteReports(supabaseAdmin())} />
      </main>
    </>
  );
}
