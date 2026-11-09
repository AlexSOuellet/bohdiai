/**
 * Moving up from Free (Alex, Session 121: "free needs a path to upgrade"). Free has no
 * site, so moving up is the start of one: the maker picks a paid plan, puts a card on
 * Stripe's own page if Stripe has none, Stripe charges the first month or year from
 * today, and the site form opens next (onboarding takes a paid draft site with no form
 * sent, lib/signup/onboarding.ts).
 *
 * Server only: callers check who is acting first.
 */
import type Stripe from 'stripe';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { changeNow, findPrice } from '@/lib/billing/plan-change';
import { applyPlan } from './apply';
import type { Billing } from './billing';
import type { SitePlan } from './plan';

type Db = SupabaseClient<Database>;

/** A Free site's own facts: whether it's on Free, and whether it's free for this maker. */
export async function freeSite(db: Db, tenantId: string): Promise<{ free: boolean; comp: boolean }> {
  const { data, error } = await db.from('tenants').select('plan, plan_comp').eq('id', tenantId).maybeSingle();
  if (error !== null) throw new Error(`Could not read the plan: ${error.message}`);
  return { free: data?.plan === 'free', comp: data?.plan_comp === 'free' };
}

export type MovedUp = { ok: true } | { ok: false; declined: string } | { ok: false; error: string };

/** Put the site on `to`, after Stripe has charged for it (or with nothing to charge). */
export async function stepUp(db: Db, tenantId: string, to: SitePlan, billing: Billing, renewsOn: string | null): Promise<MovedUp> {
  const applied = await applyPlan(db, tenantId, to);
  if (!applied.ok) return { ok: false, error: `switches: ${applied.error}` };
  const { error } = await db
    .from('tenants')
    .update({ plan_billing: billing, ...(renewsOn === null ? {} : { plan_renews_on: renewsOn }), plan_next: null, plan_next_billing: null, plan_next_gallery: null })
    .eq('id', tenantId);
  if (error !== null) return { ok: false, error: `terms: ${error.message}` };
  return { ok: true };
}

/** Stripe changes the $0 Free subscription to `to`, charging the first period now; then the site steps up. */
export async function chargeAndStepUp(s: Stripe, db: Db, input: { tenantId: string; stripeId: string; to: SitePlan; billing: Billing }): Promise<MovedUp> {
  const r = await changeNow(s, input.stripeId, await findPrice(s, input.to, input.billing), { plan: input.to, billing: input.billing });
  if (!r.ok) return r;
  const end = r.sub.items.data[0]?.current_period_end;
  return stepUp(db, input.tenantId, input.to, input.billing, end === undefined ? null : new Date(end * 1000).toISOString().slice(0, 10));
}

/** What a move up says to the maker when it didn't happen. */
export function movedUpError(r: Exclude<MovedUp, { ok: true }>): string {
  return 'declined' in r ? `Your card was declined: ${r.declined} Try another card.` : 'Your payment went through. Your site is being set up: refresh in a minute.';
}
