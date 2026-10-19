import { notFound } from 'next/navigation';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { loadPlanState } from '@/lib/backend/plan/queries';
import { billingView } from '@/lib/backend/plan/billing-view';

export const dynamic = 'force-dynamic';

/** Settings → Billing: how the maker pays BohdiAI. The next charge is real (from the
 *  plan's terms); the card and past charges arrive with paying at sign-up. */
export default async function BillingPage(): Promise<React.ReactElement> {
  const { site } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  if (!on.has('plan')) notFound();
  const state = await loadPlanState(await createSupabaseServerClient(), site.tenantId);
  if (state === null) notFound();
  const v = billingView(state);
  return (
    <>
      <div className="bk-head">
        <h1 className="bk-title">Billing</h1>
      </div>
      <main id="main" className="bk-content">
        <section className="bk-section" aria-labelledby="s-next">
          <h2 id="s-next" className="bk-section-title">Your next charge</h2>
          {v.amount === null ? (
            <p className="bk-note">{`Your site is free on ${v.planName}. Nothing will be charged.`}</p>
          ) : (
            <p className="bk-note">{`${v.amount} for ${v.planName}, billed ${v.how}, on ${v.on}.`}</p>
          )}
        </section>
        <section className="bk-section" aria-labelledby="s-card">
          <h2 id="s-card" className="bk-section-title">How you pay</h2>
          <p className="bk-note">No card is connected yet. Paying by card is being set up.</p>
        </section>
        <section className="bk-section" aria-labelledby="s-past">
          <h2 id="s-past" className="bk-section-title">Past charges</h2>
          <p className="bk-note">No charges yet.</p>
        </section>
      </main>
    </>
  );
}
