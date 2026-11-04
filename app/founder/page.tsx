import { requireFounder } from '@/lib/founder/access';
import { loadDashboard } from '@/lib/founder/dashboard';
import { supabaseAdmin } from '@/lib/supabase';
import { DashboardView } from './DashboardView';

export const dynamic = 'force-dynamic';

/** The dashboard: how the business stands today. */
export default async function FounderDashboardPage(): Promise<React.ReactElement> {
  await requireFounder();
  return (
    <>
      <div className="bk-head">
        <h1 className="bk-title">Dashboard</h1>
      </div>
      <main id="main" className="bk-content">
        <DashboardView data={await loadDashboard(supabaseAdmin())} />
      </main>
    </>
  );
}
