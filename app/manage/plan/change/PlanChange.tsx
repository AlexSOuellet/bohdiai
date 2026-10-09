'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, unstable_rethrow } from 'next/navigation';
import type { Plan } from '@/lib/site/plans';
import { includesLead } from '@/lib/backend/plan/plan';
import { changePlan } from '@/lib/backend/plan/actions';
import { useNotice } from '../../_components/Notice';

const FAILED = 'Something went wrong. Check your connection and try again.';

type Billing = 'monthly' | 'yearly';

/** Checkout for moving up, or the confirm page for moving down. On a demo site
 *  Confirm switches the plan at once; no card is taken. */
export function PlanChange({ from, to, move, hidden }: { from: Plan; to: Plan; move: 'up' | 'down'; hidden: readonly string[] }): React.ReactElement {
  const router = useRouter();
  const notice = useNotice();
  const [billing, setBilling] = useState<Billing>('monthly');
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const up = move === 'up';
  const total = billing === 'monthly' ? `$${to.monthly}` : `$${to.yearly}`;

  async function confirm(): Promise<void> {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    notice.clear();
    try {
      const r = await changePlan(to.tier);
      if (r.ok) router.push(`/manage/plan?changed=${to.tier}`);
      else notice.showError(r.error);
    } catch (err) {
      unstable_rethrow(err);
      notice.showError(FAILED);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  return (
    <div className="bk-checkout">
      {notice.area}
      <section className="bk-up" data-tier={to.tier} aria-labelledby="bk-co-plan">
        <p className="bk-kicker">{up ? 'Upgrading to' : 'Moving down to'}</p>
        <h2 id="bk-co-plan" className="bk-up-name">
          {to.name}
        </h2>
        <p className="bk-up-for">{to.forWho}</p>
        {up ? (
          <>
            <fieldset className="bk-billing">
              <legend className="bk-label">How would you like to pay?</legend>
              <label className="bk-billing-opt">
                <input type="radio" name="billing" value="monthly" checked={billing === 'monthly'} onChange={() => setBilling('monthly')} />
                <span>
                  <strong>${to.monthly}</strong> a month
                </span>
              </label>
              <label className="bk-billing-opt">
                <input type="radio" name="billing" value="yearly" checked={billing === 'yearly'} onChange={() => setBilling('yearly')} />
                <span>
                  <strong>${to.yearly}</strong> a year <em>two months free</em>
                </span>
              </label>
            </fieldset>
            <p className="bk-up-lead">{includesLead(to) ?? 'What you’re adding'}</p>
            <ul className="bk-up-list">
              {to.includes.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <p className="bk-co-total">
              Today: <strong>{total}</strong> <span>{billing === 'monthly' ? 'then monthly' : 'for the year'}</span>
            </p>
          </>
        ) : (
          <>
            <p className="bk-up-price">
              <span className="bk-up-amount">${to.monthly}</span>
              <span className="bk-up-per">a month</span>
            </p>
            {hidden.length > 0 && (
              <>
                <p className="bk-up-lead">Put away until you move back up</p>
                <ul className="bk-co-hidden">
                  {hidden.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </>
            )}
            <p className="bk-co-safe">Nothing is deleted. Everything comes back the moment you move up again.</p>
          </>
        )}
        <div className="bk-co-actions">
          <button type="button" className="bk-up-btn" disabled={busy} onClick={() => void confirm()}>
            {busy ? 'Changing…' : up ? `Confirm upgrade to ${to.name}` : `Move down to ${to.name}`}
          </button>
          <Link className="bk-btn bk-btn-quiet" href="/manage/plan">
            Stay on {from.name}
          </Link>
        </div>
        <p className="bk-co-demo">Demo site: no card is charged.</p>
      </section>
    </div>
  );
}
