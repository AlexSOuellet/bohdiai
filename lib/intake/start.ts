/** Where the intake form starts: the plan the pricing page sent the maker with. */
import { isPlanId, planById } from '@/lib/site/plans';
import { FREE_PLAN, type AccountPlan } from '@/lib/backend/plan/plan';
import type { Billing, PlanTier } from './request';

/** Free's plan in bohdiai.com/start's address (?plan=maker-free). */
export const FREE_PLAN_ID = 'maker-free';

/** Sign-up's starting plan (Alex, Session 119): a maker plan or Free, and
 *  whether Stripe's back button brought them here (?back=1). */
export function startingSignup(search: Record<string, string | string[] | undefined>): { plan: AccountPlan | null; billing: Billing; back: boolean } {
  const site = startingPlan(search);
  const plan = search['plan'] === FREE_PLAN_ID ? FREE_PLAN : site.plan;
  return { plan, billing: plan === FREE_PLAN ? 'monthly' : site.billing, back: search['back'] === '1' };
}

/** The plan the pricing page's button carried (?plan=maker-full&billing=yearly);
 *  anything else is no plan yet, and monthly. */
export function startingPlan(search: Record<string, string | string[] | undefined>): { plan: PlanTier | null; billing: Billing } {
  const id = search['plan'];
  const plan = typeof id === 'string' && isPlanId(id) && planById(id).audience === 'maker' ? planById(id).tier : null;
  return { plan, billing: search['billing'] === 'yearly' ? 'yearly' : 'monthly' };
}
