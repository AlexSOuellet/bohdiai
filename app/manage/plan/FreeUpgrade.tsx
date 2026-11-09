'use client';

import { useRef, useState } from 'react';
import { unstable_rethrow } from 'next/navigation';
import type { Plan } from '@/lib/site/plans';
import { includesLead } from '@/lib/backend/plan/plan';
import type { Billing } from '@/lib/backend/plan/billing';
import { upgradeFromFree } from '@/lib/backend/plan/free-actions';
import { useNotice } from '../_components/Notice';

const FAILED = 'Something went wrong. Check your connection and try again.';

/** One paid plan a Free maker can move up to: monthly or yearly, then on to Stripe. */
function FreeUpCard({ plan, cardOnFile, busy, go }: { plan: Plan; cardOnFile: boolean; busy: boolean; go: (plan: Plan, billing: Billing) => void }): React.ReactElement {
  const [billing, setBilling] = useState<Billing>('monthly');
  return (
    <section className="bk-up" data-tier={plan.tier} aria-labelledby={`bk-up-${plan.id}`}>
      <h2 id={`bk-up-${plan.id}`} className="bk-up-name">
        {plan.name}
      </h2>
      <p className="bk-up-for">{plan.forWho}</p>
      <fieldset className="bk-billing">
        <legend className="bk-label">How would you like to pay?</legend>
        {(['monthly', 'yearly'] as const).map((b) => (
          <label key={b} className="bk-billing-opt">
            <input type="radio" name={`billing-${plan.id}`} value={b} checked={billing === b} onChange={() => setBilling(b)} />
            <span>
              {b === 'monthly' ? (
                <>
                  <strong>${plan.monthly}</strong> a month
                </>
              ) : (
                <>
                  <strong>${plan.yearly}</strong> a year <em>two months free</em>
                </>
              )}
            </span>
          </label>
        ))}
      </fieldset>
      <p className="bk-up-lead">{includesLead(plan) ?? 'What you’d add'}</p>
      <ul className="bk-up-list">
        {plan.includes.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <button type="button" className="bk-up-btn" disabled={busy} onClick={() => go(plan, billing)}>
        {busy ? 'One moment…' : `Upgrade to ${plan.name}`}
      </button>
      <p className="bk-co-terms">
        {cardOnFile
          ? `Your card is charged ${billing === 'monthly' ? `$${plan.monthly} today, then every month` : `$${plan.yearly} today, then every year`}. Then you fill in your site, and it builds itself.`
          : `You’ll add your card on Stripe’s own page; BohdiAI never sees it. It’s charged ${billing === 'monthly' ? `$${plan.monthly} today, then every month` : `$${plan.yearly} today, then every year`}. Then you fill in your site, and it builds itself.`}
      </p>
    </section>
  );
}

/** Your plan on Free: Free has no site, so every paid plan is a way to get one. */
export function FreeUpgrade({ plans, cardOnFile, note }: { plans: readonly Plan[]; cardOnFile: boolean; note: string | null }): React.ReactElement {
  const notice = useNotice();
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);

  async function go(plan: Plan, billing: Billing): Promise<void> {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    notice.clear();
    try {
      // On success the action sends the browser on (to Stripe, or to the site form) and never returns.
      const r = await upgradeFromFree(plan.tier, billing);
      notice.showError(r.error);
    } catch (err) {
      unstable_rethrow(err);
      notice.showError(FAILED);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  return (
    <div className="bk-plan">
      {notice.area}
      {note !== null && (
        <div className="bk-notices">
          <div role="alert">
            <p className="bk-notice">{note}</p>
          </div>
        </div>
      )}
      <section className="bk-now" aria-labelledby="bk-now-name">
        <div>
          <p className="bk-kicker">You’re on</p>
          <h2 id="bk-now-name" className="bk-now-name">
            Free
          </h2>
          <p className="bk-now-price">Nothing to pay</p>
          <p className="bk-now-terms">Your products, costs and tools. Pick a plan below to put your work on a site of your own.</p>
        </div>
      </section>
      <p className="bk-plan-intro">Everything you’ve added here comes with you.</p>
      <div className="bk-ups">
        {plans.map((plan) => (
          <FreeUpCard key={plan.id} plan={plan} cardOnFile={cardOnFile} busy={busy} go={(p, b) => void go(p, b)} />
        ))}
      </div>
    </div>
  );
}
