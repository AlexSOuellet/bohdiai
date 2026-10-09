import Link from 'next/link';
import type { Plan } from '@/lib/site/plans';
import { includesLead, moveUpMailto, planOf, type PlanView } from '@/lib/backend/plan/plan';
import { longDay, money, priceCents, renewalCharge, type Billing } from '@/lib/backend/plan/billing';
import type { SitePlan } from '@/lib/backend/plan/plan';
import { PlanButtons } from './PlanButtons';

/** How Upgrade works on this site: the demo switches through checkout; a real site emails Alex until billing exists. */
export type PlanMode = { kind: 'demo' } | { kind: 'email'; siteName: string; contactEmail: string };

/** How the plan is billed, when it renews, and any move down waiting for that renewal. */
export type PlanTermsView = { billing: Billing; renewsOn: string; next: SitePlan | null; creditCents: number };

function Checks({ lines, className }: { lines: readonly string[]; className: string }): React.ReactElement {
  return (
    <ul className={className}>
      {lines.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  );
}

function UpgradeCard({ plan, mode }: { plan: Plan; mode: PlanMode }): React.ReactElement {
  const label = `Upgrade to ${plan.name}`;
  return (
    <section className="bk-up" data-tier={plan.tier} aria-labelledby={`bk-up-${plan.id}`}>
      <h2 id={`bk-up-${plan.id}`} className="bk-up-name">
        {plan.name}
      </h2>
      <p className="bk-up-for">{plan.forWho}</p>
      <p className="bk-up-price">
        <span className="bk-up-amount">${plan.monthly}</span>
        <span className="bk-up-per">a month</span>
      </p>
      <p className="bk-up-year">or ${plan.yearly} a year, two months free</p>
      <p className="bk-up-lead">{includesLead(plan) ?? 'What you’d add'}</p>
      <Checks lines={plan.includes} className="bk-up-list" />
      {mode.kind === 'demo' ? (
        <Link className="bk-up-btn" href={{ pathname: '/manage/plan/change', query: { to: plan.tier } }}>
          {label}
        </Link>
      ) : (
        <a className="bk-up-btn" href={moveUpMailto(mode.contactEmail, mode.siteName, plan)}>
          {label}
        </a>
      )}
    </section>
  );
}

/** Your plan: where the site is now, then each plan above it as an invitation to move up. */
export function PlanSummary({
  view,
  mode,
  terms = null,
  changed = null,
}: {
  view: PlanView;
  mode: PlanMode;
  terms?: PlanTermsView | null;
  changed?: string | null;
}): React.ReactElement {
  const { current, above, below } = view;
  const demo = mode.kind === 'demo';
  const next = terms?.next ?? null;
  return (
    <div className="bk-plan">
      {changed !== null && (
        <div className="bk-notices">
          <div role="status">
            <p className="bk-notice" data-tone="ok">
              {changed}
            </p>
          </div>
        </div>
      )}
      <section className="bk-now" aria-labelledby="bk-now-name">
        <div>
          <p className="bk-kicker">You’re on</p>
          <h2 id="bk-now-name" className="bk-now-name">
            {current.name}
          </h2>
          <p className="bk-now-price">
            ${current.monthly} a month, or ${current.yearly} a year
          </p>
          {terms !== null && terms.renewsOn !== '' && (
            <p className="bk-now-terms">
              Billed {terms.billing}. Renews {longDay(terms.renewsOn)} for {money(renewalCharge(priceCents(next ?? current.tier, terms.billing), terms.creditCents).paidCents)}
              {terms.creditCents > 0 && ', after credit'}.
            </p>
          )}
          {terms !== null && terms.creditCents > 0 && <p className="bk-now-credit">{money(terms.creditCents)} credit on your account, used on your next bills first.</p>}
        </div>
        <Checks lines={current.includes} className="bk-now-list" />
      </section>

      {next !== null && terms !== null && (
        <section className="bk-pending" aria-labelledby="bk-pending-h">
          <h2 id="bk-pending-h" className="bk-pending-h">
            Changing to {planOf(next).name} on {longDay(terms.renewsOn)}
          </h2>
          <p className="bk-note">You keep everything in {current.name} until then. Nothing is deleted; it’s put away until you move back up.</p>
        </section>
      )}

      {demo && <PlanButtons keepLabel={next !== null ? `Keep ${current.name}` : null} demo billing={terms?.billing ?? 'monthly'} />}

      {above.length > 0 && (
        <>
          <p className="bk-plan-intro">Ready for more? Move up any time, and everything you’ve added comes with you.</p>
          <div className="bk-ups">
            {above.map((plan) => (
              <UpgradeCard key={plan.id} plan={plan} mode={mode} />
            ))}
          </div>
        </>
      )}

      {demo && next === null && below.length > 0 && (
        <div className="bk-downs">
          <p className="bk-label">Need less for a while?</p>
          {below.map((plan) => (
            <Link key={plan.id} className="bk-btn bk-btn-quiet" href={{ pathname: '/manage/plan/change', query: { to: plan.tier } }}>
              Move down to {plan.name}
            </Link>
          ))}
        </div>
      )}

      <p className="bk-plan-safe">Moving down a plan never deletes anything. Your products, photos and dates are kept and come back when you move up again.</p>
    </div>
  );
}
