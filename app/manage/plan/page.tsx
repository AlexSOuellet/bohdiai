import { notFound } from 'next/navigation';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { loadPlanState } from '@/lib/backend/plan/queries';
import { isSitePlan, planOf, planView } from '@/lib/backend/plan/plan';
import { longDay } from '@/lib/backend/plan/billing';
import { SITE_CONTACT_EMAIL } from '@/lib/site/contact';
import { PlanSummary, type PlanMode } from './PlanSummary';
import { CancelPanel } from './CancelPanel';
import { PromoPanel } from './PromoPanel';
import { currentSubscription } from '@/lib/billing/maker-subscription';
import { discountRunning } from '@/lib/billing/promos';
import { supabaseAdmin } from '@/lib/supabase';
import { planHow } from '@/lib/backend/plan/how';
import { freeSite } from '@/lib/backend/plan/free-up';
import { SITE_PLANS } from '@/lib/backend/plan/plan';
import { stripe } from '@/lib/billing/stripe';
import { cardOnFile } from '@/lib/billing/card';
import { FreeUpgrade } from './FreeUpgrade';

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
  const params = await searchParams;
  // Free has no site: its Your plan is the way up to one.
  if ((await freeSite(supabaseAdmin(), site.tenantId)).free) {
    const freeSub = await currentSubscription(supabaseAdmin(), site.tenantId);
    const hasCard = freeSub !== null && (await cardOnFile(stripe(), freeSub.stripeId)) !== null;
    const up = first(params['up']);
    const note = up === 'declined' ? 'Your card was declined, so nothing changed. Try another card.' : up === 'switching' ? 'Your payment went through. Your site is being set up: refresh in a minute.' : up === 'not-done' ? 'Nothing changed. Pick a plan when you’re ready.' : null;
    return (
      <>
        <div className="bk-head">
          <h1 className="bk-title">Your plan</h1>
        </div>
        <main id="main" className="bk-content">
          <FreeUpgrade plans={SITE_PLANS.map(planOf)} cardOnFile={hasCard} note={note} />
        </main>
      </>
    );
  }
  const state = await loadPlanState(await createSupabaseServerClient(), site.tenantId);
  if (state === null) notFound();
  const sub = await currentSubscription(supabaseAdmin(), site.tenantId);
  const canUseCode = sub !== null && sub.unitCents > 0;
  const discount = sub !== null && discountRunning(sub, new Date()) ? sub.discountLabel : null;
  const how = await planHow(supabaseAdmin(), site.tenantId, on.has('demo_checkout'), state);
  const mode: PlanMode =
    how.how === 'demo' ? { kind: 'demo' } : how.how === 'alex' ? { kind: 'email', siteName: site.businessName, contactEmail: SITE_CONTACT_EMAIL } : { kind: 'self' };
  // After a change the checkout sends her back here; say what happened.
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
        {canUseCode && <PromoPanel discount={discount} />}
        <CancelPanel cancels={state.cancels} endsOn={longDay(state.renewsOn)} offerShowcase={state.plan !== 'showcase'} />
      </main>
    </>
  );
}
