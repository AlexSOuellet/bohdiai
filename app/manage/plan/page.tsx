import { notFound } from 'next/navigation';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { loadPlanState } from '@/lib/backend/plan/queries';
import { isSitePlan, planOf, planView } from '@/lib/backend/plan/plan';
import { longDay } from '@/lib/backend/plan/billing';
import { SITE_CONTACT_EMAIL } from '@/lib/site/contact';
import { PlanSummary, type PlanMode } from './PlanSummary';

export const dynamic = 'force-dynamic';

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function PlanPage({
  searchParams,
}: PageProps<'/manage/plan'>): Promise<React.ReactElement> {
  const { site } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  if (!on.has('plan')) notFound();
  const state = await loadPlanState(await createSupabaseServerClient(), site.tenantId);
  if (state === null) notFound();
  const mode: PlanMode = on.has('demo_checkout')
    ? { kind: 'demo' }
    : { kind: 'email', siteName: site.businessName, contactEmail: SITE_CONTACT_EMAIL };
  // After a change the checkout sends her back here; say what happened.
  const params = await searchParams;
  const changedTo = first(params['changed']);
  const scheduledTo = first(params['scheduled']);
  const changed =
    isSitePlan(changedTo) && changedTo === state.plan
      ? `You’re now on ${planOf(state.plan).name}.`
      : isSitePlan(scheduledTo) && scheduledTo === state.next && state.renewsOn !== ''
        ? `You’ll downgrade to ${planOf(scheduledTo).name} on ${longDay(state.renewsOn)}.`
        : null;
  return (
    <>
      <div className="bk-head">
        <h1 className="bk-title">Your plan</h1>
      </div>
      <main id="main" className="bk-content">
        <PlanSummary view={planView(state.plan)} mode={mode} terms={state} changed={changed} />
      </main>
    </>
  );
}
