/**
 * Your plan (Saltmarsh & Lace demo spec): which maker plan a site is on and what
 * moving up adds. Reads the one plan list bohdiai.com's pricing pages use
 * (lib/site/plans.ts), so the backend can't drift from the prices people saw.
 */
import { PLANS, type Plan } from '@/lib/site/plans';

export const SITE_PLANS = ['showcase', 'lite', 'full'] as const;
export type SitePlan = (typeof SITE_PLANS)[number];

export function isSitePlan(value: unknown): value is SitePlan {
  return typeof value === 'string' && (SITE_PLANS as readonly string[]).includes(value);
}

function makerPlan(tier: SitePlan): Plan {
  const plan = PLANS.find((p) => p.audience === 'maker' && p.tier === tier);
  if (plan === undefined) throw new Error(`No maker plan for ${tier}`);
  return plan;
}

export type PlanView = { current: Plan; above: Plan[] };

/** The site's plan and the plans above it, in selling order. */
export function planView(tier: SitePlan): PlanView {
  const at = SITE_PLANS.indexOf(tier);
  return { current: makerPlan(tier), above: SITE_PLANS.slice(at + 1).map(makerPlan) };
}

/** How a plan's list opens: Full builds on Lite, the others stand alone. */
export function includesLead(plan: Plan): string | null {
  return plan.tier === 'full' ? 'Everything in Lite, plus' : null;
}

/** An email to Alex asking to move the site up to `plan`, subject already filled in. */
export function moveUpMailto(contactEmail: string, siteName: string, plan: Plan): string {
  const subject = `Upgrade ${siteName} to ${plan.name}`;
  const body = `Hi Alex, I’d like to upgrade ${siteName} to ${plan.name}.`;
  return `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
