/**
 * Your plan (Saltmarsh & Lace demo spec): which maker plan a site is on and what
 * moving up adds. Reads the one plan list bohdiai.com's pricing pages use
 * (lib/site/plans.ts), so the backend can't drift from the prices people saw.
 */
import { PLANS, type Plan } from '@/lib/site/plans';

export const SITE_PLANS = ['showcase', 'lite', 'full'] as const;
export type SitePlan = (typeof SITE_PLANS)[number];

/** Free (Alex, 2026-10-24): a backend with no site. Products worked out with the
 *  tools, events with their numbers. Below Showcase; not on the pricing pages yet. */
export const FREE_PLAN = 'free';
export type AccountPlan = typeof FREE_PLAN | SitePlan;

export function isFreePlan(value: unknown): value is typeof FREE_PLAN {
  return value === FREE_PLAN;
}

export function isSitePlan(value: unknown): value is SitePlan {
  return typeof value === 'string' && (SITE_PLANS as readonly string[]).includes(value);
}

/** The pricing list's maker plan for a tier. */
export function planOf(tier: SitePlan): Plan {
  const plan = PLANS.find((p) => p.audience === 'maker' && p.tier === tier);
  if (plan === undefined) throw new Error(`No maker plan for ${tier}`);
  return plan;
}

export type PlanView = { current: Plan; above: Plan[]; below: Plan[] };

/** The site's plan, the plans above it (selling order) and below it (nearest first). */
export function planView(tier: SitePlan): PlanView {
  const at = SITE_PLANS.indexOf(tier);
  return {
    current: planOf(tier),
    above: SITE_PLANS.slice(at + 1).map(planOf),
    below: SITE_PLANS.slice(0, at).reverse().map(planOf),
  };
}

/** How a plan's list opens: Full builds on the plan below it, the others stand alone. */
export { includesLead } from '@/lib/site/plans';

/** An email to Alex asking to move the site up to `plan`, subject already filled in. */
export function moveUpMailto(contactEmail: string, siteName: string, plan: Plan): string {
  const subject = `Upgrade ${siteName} to ${plan.name}`;
  const body = `Hi Alex, I’d like to upgrade ${siteName} to ${plan.name}.`;
  return `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
