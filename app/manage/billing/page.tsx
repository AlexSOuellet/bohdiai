import { notFound } from 'next/navigation';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';
import { loadPlanState } from '@/lib/backend/plan/queries';
import { billingView, stripeBillingView, type StripeBilling } from '@/lib/backend/plan/billing-view';
import { currentSubscription } from '@/lib/billing/maker-subscription';
import { stripe } from '@/lib/billing/stripe';
import { cardOnFile, nextCharge, pastCharges } from '@/lib/billing/card';
import { logger } from '@/lib/logger';
import { CardButton } from './CardButton';
import { freeSite } from '@/lib/backend/plan/free-up';

export const dynamic = 'force-dynamic';

/** Settings → Billing: how the maker pays BohdiAI. A site Stripe bills shows Stripe's own
 *  next charge, the card on file with Stripe's page to change it, and past charges with
 *  their receipts. A free or sample site shows its terms. */
export default async function BillingPage({ searchParams }: PageProps<'/manage/billing'>): Promise<React.ReactElement> {
  const { site } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  if (!on.has('plan')) notFound();
  const state = await loadPlanState(await createSupabaseServerClient(), site.tenantId);
  // Free has no site plan to load: nothing to pay, and any card it has stays changeable.
  const onFree = state === null && (await freeSite(supabaseAdmin(), site.tenantId)).free;
  if (state === null && !onFree) notFound();
  const sub = await currentSubscription(supabaseAdmin(), site.tenantId);
  let billed: StripeBilling | null = null;
  let unreadable = false;
  if (sub !== null) {
    try {
      const s = stripe();
      const [card, next, charges] = await Promise.all([cardOnFile(s, sub.stripeId), nextCharge(s, sub.stripeId), pastCharges(s, sub.customerId)]);
      billed = stripeBillingView({ card, next, charges, planName: state === null ? 'Free' : billingView(state).planName });
    } catch (err) {
      logger.error('billing: Stripe not read', { tenantId: site.tenantId, error: err instanceof Error ? err.message : String(err) });
      unreadable = true;
    }
  }
  const v = state === null ? null : billingView(state);
  const raw = (await searchParams)['card'];
  const cardNote = raw === 'updated' ? 'Your new card is saved. It’s the one we charge from now on.' : raw === 'not-updated' ? 'Your card wasn’t changed.' : null;
  return (
    <>
      <div className="bk-head">
        <h1 className="bk-title">Billing</h1>
      </div>
      <main id="main" className="bk-content">
        {cardNote !== null && (
          <div className="bk-notices">
            <div role="status">
              <p className="bk-notice" data-tone={raw === 'updated' ? 'ok' : 'warn'}>
                {cardNote}
              </p>
            </div>
          </div>
        )}
        {unreadable && (
          <div className="bk-notices">
            <div role="alert">
              <p className="bk-notice" data-tone="error">
                Your billing couldn’t be read from Stripe just now. Refresh in a moment.
              </p>
            </div>
          </div>
        )}
        <section className="bk-section" aria-labelledby="s-next">
          <h2 id="s-next" className="bk-section-title">Your next charge</h2>
          {v === null ? (
            <p className="bk-note">You’re on Free. Nothing to pay.</p>
          ) : billed !== null ? (
            <p className="bk-note">{billed.next}</p>
          ) : v.amount === null ? (
            <p className="bk-note">{`Your site is free on ${v.planName}. Nothing will be charged.`}</p>
          ) : (
            <p className="bk-note">{`${v.amount} for ${v.planName}, billed ${v.how}, on ${v.on}.`}</p>
          )}
        </section>
        <section className="bk-section" aria-labelledby="s-card">
          <h2 id="s-card" className="bk-section-title">How you pay</h2>
          {sub === null ? (
            <p className="bk-note">No card is needed for this site.</p>
          ) : (
            <>
              {billed !== null && <p className="bk-note">{billed.card}</p>}
              <CardButton />
            </>
          )}
        </section>
        <section className="bk-section" aria-labelledby="s-past">
          <h2 id="s-past" className="bk-section-title">Past charges</h2>
          {billed === null || billed.charges.length === 0 ? (
            <p className="bk-note">No charges yet.</p>
          ) : (
            <ul className="bk-charges">
              {billed.charges.map((c) => (
                <li key={c.id}>
                  <span>{c.on}</span>
                  <span>{c.amount}</span>
                  {c.receiptUrl !== null && (
                    <a className="bk-link" href={c.receiptUrl} target="_blank" rel="noopener noreferrer">
                      Receipt
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
