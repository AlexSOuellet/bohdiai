import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { isSitePlan, type SitePlan } from './plan';
import { isBilling, type Billing } from './billing';

export type PlanState = {
  plan: SitePlan;
  billing: Billing;
  renewsOn: string;
  next: SitePlan | null;
  nextBilling: Billing | null;
  creditCents: number;
};

/** The plan the site is on, or null for a site that has none set. */
export async function loadSitePlan(
  db: SupabaseClient<Database>,
  tenantId: string,
): Promise<SitePlan | null> {
  return (await loadPlanState(db, tenantId))?.plan ?? null;
}

/** The plan with how it's billed, when it renews and any downgrade waiting for that
 *  renewal. A plan with no billing yet reads as monthly, renewing a month from `today`. */
export async function loadPlanState(
  db: SupabaseClient<Database>,
  tenantId: string,
  fallbackRenewsOn = '',
): Promise<PlanState | null> {
  const { data, error } = await db
    .from('tenants')
    .select('plan, plan_billing, plan_renews_on, plan_next, plan_next_billing, plan_credit_cents')
    .eq('id', tenantId)
    .maybeSingle();
  if (error !== null) throw new Error(`Could not load your plan: ${error.message}`);
  if (data === null || !isSitePlan(data.plan)) return null;
  return {
    plan: data.plan,
    billing: isBilling(data.plan_billing) ? data.plan_billing : 'monthly',
    renewsOn: data.plan_renews_on ?? fallbackRenewsOn,
    next: isSitePlan(data.plan_next) ? data.plan_next : null,
    nextBilling: isBilling(data.plan_next_billing) ? data.plan_next_billing : null,
    creditCents: data.plan_credit_cents,
  };
}
