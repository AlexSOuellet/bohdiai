/**
 * How a site's plan is paid for, which decides how a plan change is made (Alex,
 * Session 121): the demo works its billing out itself; a site free for this maker
 * (plan_comp free) has nothing to charge; a site Stripe bills changes through
 * Stripe; a site with none of these (a sample) still goes through Alex.
 *
 * Kept out of the plan actions file: everything exported there is callable from a
 * browser, and this takes a site id.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { currentSubscription } from '@/lib/billing/maker-subscription';
import type { PlanState } from './queries';

export type PlanHow = { how: 'demo' } | { how: 'comp' } | { how: 'stripe'; stripeId: string } | { how: 'alex' };

export async function planHow(db: SupabaseClient<Database>, tenantId: string, demo: boolean, state: Pick<PlanState, 'comp'>): Promise<PlanHow> {
  if (demo) return { how: 'demo' };
  if (state.comp === 'free') return { how: 'comp' };
  const sub = await currentSubscription(db, tenantId);
  return sub === null ? { how: 'alex' } : { how: 'stripe', stripeId: sub.stripeId };
}
