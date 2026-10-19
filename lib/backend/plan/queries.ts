import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { isSitePlan, type SitePlan } from './plan';
import { isBilling, isPlanComp, nextRenewal, todayDay, type Billing, type PlanComp } from './billing';

export type PlanState = {
  plan: SitePlan;
  billing: Billing;
  renewsOn: string;
  next: SitePlan | null;
  nextBilling: Billing | null;
  creditCents: number;
  /** Free on some or all plans (Alex sets it); null pays normally. */
  comp: PlanComp | null;
  /** The products she picked to show when a downgrade to Showcase takes effect. */
  nextGallery: string[];
  /** The site closes at the end of its current term (Cancel on Your plan). */
  cancels: boolean;
  /** Today in the shop's time zone. */
  today: string;
};

/** The plan with how it's billed, when it renews, any downgrade waiting for that
 *  renewal, and today in the shop's own time zone. A plan with no billing yet reads
 *  as monthly, renewing a month from today. */
export async function loadPlanState(
  db: SupabaseClient<Database>,
  tenantId: string,
): Promise<PlanState | null> {
  const { data, error } = await db
    .from('tenants')
    .select(
      'plan, plan_billing, plan_renews_on, plan_next, plan_next_billing, plan_credit_cents, plan_next_gallery, plan_comp, plan_cancels, time_zone',
    )
    .eq('id', tenantId)
    .maybeSingle();
  if (error !== null) throw new Error(`Could not load your plan: ${error.message}`);
  if (data === null || !isSitePlan(data.plan)) return null;
  const today = todayDay(data.time_zone);
  return {
    plan: data.plan,
    billing: isBilling(data.plan_billing) ? data.plan_billing : 'monthly',
    renewsOn: data.plan_renews_on ?? nextRenewal(today, 'monthly'),
    next: isSitePlan(data.plan_next) ? data.plan_next : null,
    nextBilling: isBilling(data.plan_next_billing) ? data.plan_next_billing : null,
    creditCents: data.plan_credit_cents,
    comp: isPlanComp(data.plan_comp) ? data.plan_comp : null,
    nextGallery: data.plan_next_gallery ?? [],
    cancels: data.plan_cancels,
    today,
  };
}
