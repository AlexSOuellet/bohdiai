/** Where the intake form starts: the plan the pricing page sent the maker with. */
import { isPlanId, planById } from '@/lib/site/plans';
import type { Billing, PlanTier } from './request';

/** The plan the pricing page's button carried (?plan=maker-full&billing=yearly);
 *  anything else is no plan yet, and monthly. */
export function startingPlan(search: Record<string, string | string[] | undefined>): { plan: PlanTier | null; billing: Billing } {
  const id = search['plan'];
  const plan = typeof id === 'string' && isPlanId(id) && planById(id).audience === 'maker' ? planById(id).tier : null;
  return { plan, billing: search['billing'] === 'yearly' ? 'yearly' : 'monthly' };
}
