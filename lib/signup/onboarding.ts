/**
 * Onboarding (Alex, Session 119): once a maker on Showcase, Market or Full has
 * paid and confirmed their email, the site form is the first thing they see, and
 * they don't reach their dashboard until they've sent it. Free has no site, so
 * Free never onboards.
 *
 * A site is waiting for its form when it's still a draft, on a plan with a site,
 * paid for, and no form has been sent for it.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { isSitePlan, type SitePlan } from '@/lib/backend/plan/plan';
import type { Billing } from '@/lib/intake/request';
import { sitesOf } from './server';

type Db = SupabaseClient<Database>;

/** Where onboarding lives, on the app host. */
export const ONBOARDING_PATH = '/welcome';

export type WaitingSite = { tenantId: string; plan: SitePlan; billing: Billing; businessName: string };

/** Which of these sites are waiting for their form. */
async function waiting(db: Db, tenantIds: readonly string[]): Promise<WaitingSite[]> {
  if (tenantIds.length === 0) return [];
  const { data, error } = await db.from('tenants').select('id, status, plan, plan_billing, business_name').in('id', [...tenantIds]);
  if (error !== null) throw new Error(`Could not read the sites: ${error.message}`);
  const { data: sent, error: sentErr } = await db.from('intakes').select('tenant_id').in('tenant_id', [...tenantIds]);
  if (sentErr !== null) throw new Error(`Could not read the sent forms: ${sentErr.message}`);
  const done = new Set((sent ?? []).map((r) => r.tenant_id));
  return (data ?? []).flatMap((t) =>
    t.status === 'draft' && isSitePlan(t.plan) && !done.has(t.id)
      ? [{ tenantId: t.id, plan: t.plan, billing: t.plan_billing === 'yearly' ? ('yearly' as const) : ('monthly' as const), businessName: t.business_name }]
      : [],
  );
}

/** The account's site that's waiting for its form, or null. */
export async function onboardingSite(db: Db, userId: string): Promise<WaitingSite | null> {
  const paid = (await sitesOf(db, userId)).filter((s) => s.paid).map((s) => s.tenantId);
  return (await waiting(db, paid))[0] ?? null;
}

/** True when the backend's site is still waiting for its form (and is paid for). */
export async function needsOnboarding(db: Db, tenantId: string): Promise<boolean> {
  const { count, error } = await db.from('subscriptions').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId);
  if (error !== null) throw new Error(`Could not read billing: ${error.message}`);
  if ((count ?? 0) === 0) return false;
  return (await waiting(db, [tenantId])).length > 0;
}
