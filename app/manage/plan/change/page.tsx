import { notFound, redirect } from 'next/navigation';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { loadPlanState } from '@/lib/backend/plan/queries';
import { isSitePlan, planOf } from '@/lib/backend/plan/plan';
import { hiddenByMove, moveOf } from '@/lib/backend/plan/plan-features';
import { daysLeft, quoteUpgrade } from '@/lib/backend/plan/billing';
import { PlanChange } from './PlanChange';

export const dynamic = 'force-dynamic';

/** Checkout (upgrade, prorated) or the downgrade confirm (at next renewal). Demo sites only, until billing exists. */
export default async function PlanChangePage({
  searchParams,
}: PageProps<'/manage/plan/change'>): Promise<React.ReactElement> {
  const { site } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  if (!on.has('plan')) notFound();
  if (!on.has('demo_checkout')) redirect('/manage/plan');
  const state = await loadPlanState(await createSupabaseServerClient(), site.tenantId);
  const raw = (await searchParams)['to'];
  const to = Array.isArray(raw) ? raw[0] : raw;
  if (state === null || !isSitePlan(to)) redirect('/manage/plan');
  const today = state.today;
  const move = moveOf(state.plan, to);
  if (move === 'same') redirect('/manage/plan');
  return (
    <>
      <div className="bk-head">
        <h1 className="bk-title">{move === 'up' ? 'Checkout' : 'Downgrade'}</h1>
      </div>
      <main id="main" className="bk-content">
        {move === 'up' ? (
          <PlanChange
            kind="up"
            from={planOf(state.plan)}
            to={planOf(to)}
            fromBilling={state.billing}
            quotes={{
              monthly: quoteUpgrade(state, to, 'monthly', today),
              yearly: quoteUpgrade(state, to, 'yearly', today),
            }}
          />
        ) : (
          <PlanChange
            kind="down"
            from={planOf(state.plan)}
            to={planOf(to)}
            hidden={hiddenByMove(state.plan, to)}
            renewsOn={state.renewsOn}
            fromBilling={state.billing}
            daysLeft={daysLeft(today, state.renewsOn, state.billing)}
          />
        )}
      </main>
    </>
  );
}
