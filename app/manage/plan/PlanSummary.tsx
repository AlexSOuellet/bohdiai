import type { Plan } from '@/lib/site/plans';
import { includesLead, moveUpMailto, type PlanView } from '@/lib/backend/plan/plan';

function Checks({ lines, className }: { lines: readonly string[]; className: string }): React.ReactElement {
  return (
    <ul className={className}>
      {lines.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  );
}

function UpgradeCard({ plan, siteName, contactEmail }: { plan: Plan; siteName: string; contactEmail: string }): React.ReactElement {
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
      <a className="bk-up-btn" href={moveUpMailto(contactEmail, siteName, plan)}>
        Upgrade to {plan.name}
      </a>
    </section>
  );
}

/** Your plan: where the site is now, then each plan above it as an invitation to move up. */
export function PlanSummary({ view, siteName, contactEmail }: { view: PlanView; siteName: string; contactEmail: string }): React.ReactElement {
  const { current, above } = view;
  return (
    <div className="bk-plan">
      <section className="bk-now" aria-labelledby="bk-now-name">
        <div>
          <p className="bk-kicker">You’re on</p>
          <h2 id="bk-now-name" className="bk-now-name">
            {current.name}
          </h2>
          <p className="bk-now-price">
            ${current.monthly} a month, or ${current.yearly} a year
          </p>
        </div>
        <Checks lines={current.includes} className="bk-now-list" />
      </section>

      {above.length > 0 && (
        <>
          <p className="bk-plan-intro">Ready for more? Move up any time, and everything you’ve added comes with you.</p>
          <div className="bk-ups">
            {above.map((plan) => (
              <UpgradeCard key={plan.id} plan={plan} siteName={siteName} contactEmail={contactEmail} />
            ))}
          </div>
        </>
      )}

      <p className="bk-plan-safe">Moving down a plan never deletes anything. Your products, photos and dates are kept and come back when you move up again.</p>
    </div>
  );
}
