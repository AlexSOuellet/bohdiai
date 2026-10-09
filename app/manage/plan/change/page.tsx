import { notFound, redirect } from 'next/navigation';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { loadSitePlan } from '@/lib/backend/plan/queries';
import { isSitePlan, planOf } from '@/lib/backend/plan/plan';
import { hiddenByMove, moveOf } from '@/lib/backend/plan/plan-features';
import { PlanChange } from './PlanChange';

export const dynamic = 'force-dynamic';

/** Checkout (moving up) or confirm (moving down). Demo sites only, until billing exists. */
export default async function PlanChangePage({ searchParams }: PageProps<'/manage/plan/change'>): Promise<React.ReactElement> {
  const { site } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  if (!on.has('plan')) notFound();
  if (!on.has('demo_checkout')) redirect('/manage/plan');
  const from = await loadSitePlan(await createSupabaseServerClient(), site.tenantId);
  const raw = (await searchParams)['to'];
  const to = Array.isArray(raw) ? raw[0] : raw;
  if (from === null || !isSitePlan(to)) redirect('/manage/plan');
  const move = moveOf(from, to);
  if (move === 'same') redirect('/manage/plan');
  return (
    <>
      <div className="bk-head">
        <h1 className="bk-title">{move === 'up' ? 'Checkout' : 'Change your plan'}</h1>
      </div>
      <main id="main" className="bk-content">
        <PlanChange from={planOf(from)} to={planOf(to)} move={move} hidden={hiddenByMove(from, to)} />
      </main>
    </>
  );
}
