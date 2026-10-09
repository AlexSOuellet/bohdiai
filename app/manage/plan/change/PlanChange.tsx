'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, unstable_rethrow } from 'next/navigation';
import type { Plan } from '@/lib/site/plans';
import { includesLead } from '@/lib/backend/plan/plan';
import { longDay, money, type Billing, type UpgradeQuote } from '@/lib/backend/plan/billing';
import { scheduleDowngrade, upgradePlan, type ChangePlanResult } from '@/lib/backend/plan/actions';
import { useNotice } from '../../_components/Notice';

const FAILED = 'Something went wrong. Check your connection and try again.';
const YEARLY_TERMS =
  'Yearly plans aren’t refunded. If you move down later, the change starts at your next renewal.';
const TO_MONTHLY =
  'Your year is turned into credit: the unused part pays your monthly bills until it runs out. Nothing is lost.';

export type PlanChangeProps =
  | {
      kind: 'up';
      from: Plan;
      to: Plan;
      fromBilling: Billing;
      quotes: Record<Billing, UpgradeQuote | null>;
    }
  | { kind: 'down'; from: Plan; to: Plan; hidden: readonly string[]; renewsOn: string };

function useConfirm(): {
  busy: boolean;
  area: React.ReactElement;
  run: (
    work: () => Promise<ChangePlanResult>,
    then: (go: ReturnType<typeof useRouter>) => void,
  ) => Promise<void>;
} {
  const router = useRouter();
  const notice = useNotice();
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  async function run(
    work: () => Promise<ChangePlanResult>,
    then: (go: ReturnType<typeof useRouter>) => void,
  ): Promise<void> {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    notice.clear();
    try {
      const r = await work();
      if (r.ok) then(router);
      else notice.showError(r.error);
    } catch (err) {
      unstable_rethrow(err);
      notice.showError(FAILED);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  return { busy, area: notice.area, run };
}

function Upgrade({
  from,
  to,
  fromBilling,
  quotes,
}: Extract<PlanChangeProps, { kind: 'up' }>): React.ReactElement {
  const { busy, area, run } = useConfirm();
  const [billing, setBilling] = useState<Billing>(fromBilling);
  const q = quotes[billing];
  const options = (['monthly', 'yearly'] as const).filter((b) => quotes[b] !== null);
  return (
    <div className="bk-checkout">
      {area}
      <section className="bk-up" data-tier={to.tier} aria-labelledby="bk-co-plan">
        <p className="bk-kicker">Upgrading to</p>
        <h2 id="bk-co-plan" className="bk-up-name">
          {to.name}
        </h2>
        <p className="bk-up-for">{to.forWho}</p>
        <fieldset className="bk-billing">
          <legend className="bk-label">How would you like to pay?</legend>
          {options.map((b) => (
            <label key={b} className="bk-billing-opt">
              <input
                type="radio"
                name="billing"
                value={b}
                checked={billing === b}
                onChange={() => setBilling(b)}
              />
              <span>
                {b === 'monthly' ? (
                  <>
                    <strong>${to.monthly}</strong> a month
                  </>
                ) : (
                  <>
                    <strong>${to.yearly}</strong> a year <em>two months free</em>
                  </>
                )}
              </span>
            </label>
          ))}
        </fieldset>
        {billing === 'yearly' && <p className="bk-co-terms">{YEARLY_TERMS}</p>}
        {billing === 'monthly' && fromBilling === 'yearly' && (
          <p className="bk-co-terms">{TO_MONTHLY}</p>
        )}
        <p className="bk-up-lead">{includesLead(to) ?? 'What you’re adding'}</p>
        <ul className="bk-up-list">
          {to.includes.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        {q !== null && (
          <dl className="bk-co-sum">
            <div>
              <dt>
                {q.prorated
                  ? `${to.name}, rest of this ${fromBilling === 'monthly' ? 'month' : 'year'}`
                  : `${to.name}, first ${billing === 'monthly' ? 'month' : 'year'}`}
              </dt>
              <dd>{money(q.partCents)}</dd>
            </div>
            {q.creditCents > 0 && (
              <div>
                <dt>Credit for the unused part of {from.name}</dt>
                <dd>−{money(Math.min(q.creditCents, q.partCents))}</dd>
              </div>
            )}
            {q.accountCreditUsedCents > 0 && (
              <div>
                <dt>Credit on your account</dt>
                <dd>−{money(q.accountCreditUsedCents)}</dd>
              </div>
            )}
            <div className="bk-co-due">
              <dt>Today</dt>
              <dd>{money(q.todayCents)}</dd>
            </div>
            {q.creditLeftCents > 0 && (
              <div>
                <dt>Credit left, used on your next bills first</dt>
                <dd>{money(q.creditLeftCents)}</dd>
              </div>
            )}
            <div>
              <dt>
                Then {money(q.renewalCents)} {billing === 'monthly' ? 'a month' : 'a year'}, from
              </dt>
              <dd>{longDay(q.renewsOn)}</dd>
            </div>
          </dl>
        )}
        <div className="bk-co-actions">
          <button
            type="button"
            className="bk-up-btn"
            disabled={busy || q === null}
            onClick={() =>
              void run(
                () => upgradePlan(to.tier, billing),
                (go) => go.push(`/manage/plan?changed=${to.tier}`),
              )
            }
          >
            {busy ? 'Changing…' : `Confirm upgrade to ${to.name}`}
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

function Downgrade({
  from,
  to,
  hidden,
  renewsOn,
}: Extract<PlanChangeProps, { kind: 'down' }>): React.ReactElement {
  const { busy, area, run } = useConfirm();
  const when = renewsOn === '' ? 'your next renewal' : longDay(renewsOn);
  return (
    <div className="bk-checkout">
      {area}
      <section className="bk-up" data-tier={to.tier} aria-labelledby="bk-co-plan">
        <p className="bk-kicker">Moving down to</p>
        <h2 id="bk-co-plan" className="bk-up-name">
          {to.name}
        </h2>
        <p className="bk-up-price">
          <span className="bk-up-amount">${to.monthly}</span>
          <span className="bk-up-per">a month</span>
        </p>
        <p className="bk-co-terms">
          The change starts on {when}, when your plan renews. You keep everything in {from.name}{' '}
          until then. Nothing already paid is refunded.
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
        <p className="bk-co-safe">
          Nothing is deleted. Everything comes back the moment you move up again.
        </p>
        <div className="bk-co-actions">
          <button
            type="button"
            className="bk-up-btn"
            disabled={busy}
            onClick={() =>
              void run(
                () => scheduleDowngrade(to.tier),
                (go) => go.push(`/manage/plan?scheduled=${to.tier}`),
              )
            }
          >
            {busy ? 'Changing…' : `Move down to ${to.name}`}
          </button>
          <Link className="bk-btn bk-btn-quiet" href="/manage/plan">
            Stay on {from.name}
          </Link>
        </div>
      </section>
    </div>
  );
}

/** Checkout for moving up, or the confirm page for moving down. On a demo site no card is taken. */
export function PlanChange(props: PlanChangeProps): React.ReactElement {
  return props.kind === 'up' ? <Upgrade {...props} /> : <Downgrade {...props} />;
}
