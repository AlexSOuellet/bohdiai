import { notFound } from 'next/navigation';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { loadSitePlan } from '@/lib/backend/plan/queries';
import { planView } from '@/lib/backend/plan/plan';
import { SITE_CONTACT_EMAIL } from '@/lib/site/contact';
import { PlanSummary } from './PlanSummary';

export const dynamic = 'force-dynamic';

export default async function PlanPage(): Promise<React.ReactElement> {
  const { site } = await requireActingSite();
  if (!(await getSiteFeatures(site.tenantId)).has('plan')) notFound();
  const plan = await loadSitePlan(await createSupabaseServerClient(), site.tenantId);
  if (plan === null) notFound();
  return (
    <>
      <div className="bk-head">
        <h1 className="bk-title">Your plan</h1>
      </div>
      <main id="main" className="bk-content">
        <PlanSummary view={planView(plan)} siteName={site.businessName} contactEmail={SITE_CONTACT_EMAIL} />
      </main>
    </>
  );
}
