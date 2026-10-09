'use server';

/**
 * Change the site's plan from the backend (Saltmarsh & Lace demo spec, stage two).
 * Only demo sites can do it here: there is no billing yet, so a real site's
 * Upgrade still emails Alex. Each action re-checks the acting site and its
 * switches on the server, then writes with the service role (owners never write
 * switches directly).
 *
 * Moving up happens now, prorated (lib/backend/plan/billing.ts). Moving down waits
 * for the next renewal, with no refund. On the demo, "skip to renewal" plays that
 * renewal out so the move down can be shown.
 */
import { revalidatePath } from 'next/cache';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { isSitePlan } from './plan';
import { loadPlanState, type PlanState } from './queries';
import { moveOf } from './plan-features';
import { applyPlan } from './apply';
import { addDays, addMonths, isBilling, nextRenewal, priceCents, quoteUpgrade, renewalCharge, todayDay } from './billing';

export type ChangePlanResult = { ok: true } | { ok: false; error: string };

const FAILED = 'The plan couldn’t be changed. Try again in a moment.';

type Ready = { ok: true; tenantId: string; state: PlanState } | { ok: false; error: string };

async function demoSite(): Promise<Ready> {
  const { site } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  if (!on.has('plan') || !on.has('demo_checkout')) return { ok: false, error: 'Plan changes go through Alex for now. Use the email button on Your plan.' };
  const state = await loadPlanState(supabaseAdmin(), site.tenantId, nextRenewal(todayDay(), 'monthly'));
  if (state === null) return { ok: false, error: 'This site isn’t on a plan yet.' };
  return { ok: true, tenantId: site.tenantId, state };
}

async function writeTerms(tenantId: string, terms: { plan_billing?: string; plan_renews_on?: string; plan_next?: string | null; plan_credit_cents?: number }): Promise<boolean> {
  const { error } = await supabaseAdmin().from('tenants').update(terms).eq('id', tenantId);
  if (error !== null) logger.error('plan terms write failed', { tenantId, error: error.message });
  return error === null;
}

function done(): ChangePlanResult {
  revalidatePath('/manage', 'layout');
  return { ok: true };
}

/** Move up now, on `billing`: prorated against what's already paid. Clears any move down waiting. */
export async function upgradePlan(to: unknown, billing: unknown): Promise<ChangePlanResult> {
  if (!isSitePlan(to) || !isBilling(billing)) return { ok: false, error: 'That isn’t one of the plans.' };
  const ready = await demoSite();
  if (!ready.ok) return ready;
  const { tenantId, state } = ready;
  if (moveOf(state.plan, to) !== 'up') return { ok: false, error: 'That isn’t a move up from your plan.' };
  const quote = quoteUpgrade(state, to, billing, todayDay());
  const r = await applyPlan(supabaseAdmin(), tenantId, to);
  if (!r.ok) {
    logger.error('plan upgrade failed', { tenantId, to, error: r.error });
    return { ok: false, error: FAILED };
  }
  if (!(await writeTerms(tenantId, { plan_billing: billing, plan_renews_on: quote.renewsOn, plan_next: null, plan_credit_cents: quote.creditLeftCents }))) return { ok: false, error: FAILED };
  return done();
}

/** Move down at the next renewal. Nothing changes until then, and nothing is refunded. */
export async function scheduleDowngrade(to: unknown): Promise<ChangePlanResult> {
  if (!isSitePlan(to)) return { ok: false, error: 'That isn’t one of the plans.' };
  const ready = await demoSite();
  if (!ready.ok) return ready;
  const { tenantId, state } = ready;
  if (moveOf(state.plan, to) !== 'down') return { ok: false, error: 'That isn’t a move down from your plan.' };
  if (!(await writeTerms(tenantId, { plan_billing: state.billing, plan_renews_on: state.renewsOn, plan_next: to }))) return { ok: false, error: FAILED };
  return done();
}

/** Keep the current plan after all: drop the move down waiting for renewal. */
export async function cancelScheduledChange(): Promise<ChangePlanResult> {
  const ready = await demoSite();
  if (!ready.ok) return ready;
  if (!(await writeTerms(ready.tenantId, { plan_next: null }))) return { ok: false, error: FAILED };
  return done();
}

/** Demo only: play out the next renewal now. A waiting move down takes effect, a new
 *  period starts, and credit on account pays for it first. */
export async function skipToRenewal(): Promise<ChangePlanResult> {
  const ready = await demoSite();
  if (!ready.ok) return ready;
  const { tenantId, state } = ready;
  if (state.next !== null) {
    const r = await applyPlan(supabaseAdmin(), tenantId, state.next);
    if (!r.ok) {
      logger.error('plan renewal failed', { tenantId, to: state.next, error: r.error });
      return { ok: false, error: FAILED };
    }
  }
  const renewsOn = nextRenewal(state.renewsOn === '' ? todayDay() : state.renewsOn, state.billing);
  const charge = renewalCharge(priceCents(state.next ?? state.plan, state.billing), state.creditCents);
  if (!(await writeTerms(tenantId, { plan_billing: state.billing, plan_renews_on: renewsOn, plan_next: null, plan_credit_cents: charge.creditLeftCents }))) {
    return { ok: false, error: FAILED };
  }
  return done();
}

/** Demo only: put the site on monthly or yearly billing, partway through a paid
 *  period (yearly: six months left; monthly: 20 days left), so proration and the
 *  yearly credit can be shown on camera. Clears any credit and waiting move. */
export async function setDemoBilling(billing: unknown): Promise<ChangePlanResult> {
  if (!isBilling(billing)) return { ok: false, error: 'That isn’t a billing choice.' };
  const ready = await demoSite();
  if (!ready.ok) return ready;
  const today = todayDay();
  const renewsOn = billing === 'yearly' ? addMonths(today, 6) : addDays(today, 20);
  if (!(await writeTerms(ready.tenantId, { plan_billing: billing, plan_renews_on: renewsOn, plan_next: null, plan_credit_cents: 0 }))) return { ok: false, error: FAILED };
  return done();
}
