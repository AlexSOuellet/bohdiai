import { notFound } from 'next/navigation';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { loadSitePlan } from '@/lib/backend/plan/queries';
import { isSitePlan, planOf, planView } from '@/lib/backend/plan/plan';
import { SITE_CONTACT_EMAIL } from '@/lib/site/contact';
import { PlanSummary, type PlanMode } from './PlanSummary';

export const dynamic = 'force-dynamic';

export default async function PlanPage({ searchParams }: PageProps<'/manage/plan'>): Promise<React.ReactElement> {
  const { site } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  if (!on.has('plan')) notFound();
  const plan = await loadSitePlan(await createSupabaseServerClient(), site.tenantId);
  if (plan === null) notFound();
  const mode: PlanMode = on.has('demo_checkout') ? { kind: 'demo' } : { kind: 'email', siteName: site.businessName, contactEmail: SITE_CONTACT_EMAIL };
  // After a change the checkout sends her back here with ?changed=<plan>; say where she is now.
  const raw = (await searchParams)['changed'];
  const changedTo = Array.isArray(raw) ? raw[0] : raw;
  const changed = isSitePlan(changedTo) && changedTo === plan ? `You’re now on ${planOf(plan).name}.` : null;
  return (
    <>
      <div className="bk-head">
        <h1 className="bk-title">Your plan</h1>
      </div>
      <main id="main" className="bk-content">
        <PlanSummary view={planView(plan)} mode={mode} changed={changed} />
      </main>
    </>
  );
}
