'use server';

/**
 * Change the site's plan from the backend (Saltmarsh & Lace demo spec, stage two).
 * Only demo sites can do it here: there is no billing yet, so a real site's
 * Upgrade still emails Alex. Each action re-checks the acting site and its
 * switches on the server, then writes with the service role (owners never write
 * switches directly).
 *
 * An upgrade happens now, prorated (lib/backend/plan/billing.ts). A downgrade waits
 * for the next renewal, with no refund, billed monthly or yearly from then as she
 * picks. On the demo, "skip to renewal" plays that renewal out so it can be shown.
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
import { galleryFromProducts, galleryToProducts, pickedForShowcase, showcaseCandidates } from './convert';
import { GALLERY_LIMIT } from '../gallery/gallery-form';
import {
  addDays,
  addMonths,
  isBilling,
  nextRenewal,
  priceCents,
  quoteUpgrade,
  renewalCharge,
} from './billing';

export type ChangePlanResult = { ok: true } | { ok: false; error: string };

const FAILED = 'The plan couldn’t be changed. Try again in a moment.';

type Ready = { ok: true; tenantId: string; state: PlanState } | { ok: false; error: string };

async function demoSite(): Promise<Ready> {
  const { site } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  if (!on.has('plan') || !on.has('demo_checkout'))
    return {
      ok: false,
      error: 'Plan changes go through Alex for now. Use the email button on Your plan.',
    };
  const state = await loadPlanState(supabaseAdmin(), site.tenantId);
  if (state === null) return { ok: false, error: 'This site isn’t on a plan yet.' };
  return { ok: true, tenantId: site.tenantId, state };
}

async function writeTerms(
  tenantId: string,
  terms: {
    plan_billing?: string;
    plan_renews_on?: string;
    plan_next?: string | null;
    plan_next_billing?: string | null;
    plan_next_gallery?: string[] | null;
    plan_credit_cents?: number;
  },
): Promise<boolean> {
  const { error } = await supabaseAdmin().from('tenants').update(terms).eq('id', tenantId);
  if (error !== null) logger.error('plan terms write failed', { tenantId, error: error.message });
  return error === null;
}

function done(): ChangePlanResult {
  revalidatePath('/manage', 'layout');
  return { ok: true };
}

/** Upgrade now, on `billing`: prorated against what's already paid. Clears any downgrade waiting. */
export async function upgradePlan(to: unknown, billing: unknown): Promise<ChangePlanResult> {
  if (!isSitePlan(to) || !isBilling(billing))
    return { ok: false, error: 'That isn’t one of the plans.' };
  const ready = await demoSite();
  if (!ready.ok) return ready;
  const { tenantId, state } = ready;
  if (moveOf(state.plan, to) !== 'up')
    return { ok: false, error: 'That isn’t an upgrade from your plan.' };
  const quote = quoteUpgrade(state, to, billing, state.today);
  // Leaving Showcase: her gallery photos become her first products ("Ask for price")
  // before the catalog switches on, so the shop is never empty.
  if (state.plan === 'showcase') {
    const made = await galleryToProducts(supabaseAdmin(), tenantId);
    if (!made.ok) {
      logger.error('gallery to products failed', { tenantId, error: made.error });
      return { ok: false, error: FAILED };
    }
  }
  const r = await applyPlan(supabaseAdmin(), tenantId, to);
  if (!r.ok) {
    logger.error('plan upgrade failed', { tenantId, to, error: r.error });
    return { ok: false, error: FAILED };
  }
  if (
    !(await writeTerms(tenantId, {
      plan_billing: billing,
      plan_renews_on: quote.renewsOn,
      plan_next: null,
      plan_next_billing: null,
      plan_next_gallery: null,
      plan_credit_cents: quote.creditLeftCents,
    }))
  )
    return { ok: false, error: FAILED };
  return done();
}

/** Downgrade at the next renewal, billed `billing` from then. Nothing changes until then, and nothing is refunded. */
export async function scheduleDowngrade(to: unknown, billing: unknown, showcase: unknown = []): Promise<ChangePlanResult> {
  if (!isSitePlan(to) || !isBilling(billing))
    return { ok: false, error: 'That isn’t one of the plans.' };
  const ready = await demoSite();
  if (!ready.ok) return ready;
  const { tenantId, state } = ready;
  if (moveOf(state.plan, to) !== 'down')
    return { ok: false, error: 'That isn’t a downgrade from your plan.' };
  // Showcase is one page of up to 12 pieces: she picks which of her products they are.
  let picked: string[] | null = null;
  if (to === 'showcase') {
    const found = await showcaseCandidates(supabaseAdmin(), tenantId);
    if (!found.ok) {
      logger.error('showcase candidates failed', { tenantId, error: found.error });
      return { ok: false, error: FAILED };
    }
    const ids = Array.isArray(showcase) ? showcase.filter((x): x is string => typeof x === 'string') : [];
    picked = pickedForShowcase(ids, found.products, GALLERY_LIMIT).map((p) => p.id);
    if (picked.length === 0 && found.products.length > 0)
      return { ok: false, error: 'Pick at least one product to show on your Showcase page.' };
  }
  if (
    !(await writeTerms(tenantId, {
      plan_billing: state.billing,
      plan_renews_on: state.renewsOn,
      plan_next: to,
      plan_next_billing: billing,
      plan_next_gallery: picked,
    }))
  )
    return { ok: false, error: FAILED };
  return done();
}

/** Keep the current plan after all: drop the downgrade waiting for renewal. */
export async function cancelScheduledChange(): Promise<ChangePlanResult> {
  const ready = await demoSite();
  if (!ready.ok) return ready;
  if (!(await writeTerms(ready.tenantId, { plan_next: null, plan_next_billing: null, plan_next_gallery: null })))
    return { ok: false, error: FAILED };
  return done();
}

/** Demo only: play out the next renewal now. A waiting downgrade takes effect on its billing, a new
 *  period starts, and credit on account pays for it first. */
export async function skipToRenewal(): Promise<ChangePlanResult> {
  const ready = await demoSite();
  if (!ready.ok) return ready;
  const { tenantId, state } = ready;
  if (state.next === 'showcase' && state.nextGallery.length > 0) {
    const g = await galleryFromProducts(supabaseAdmin(), tenantId, state.nextGallery, GALLERY_LIMIT);
    if (!g.ok) {
      logger.error('showcase gallery failed', { tenantId, error: g.error });
      return { ok: false, error: FAILED };
    }
  }
  if (state.next !== null) {
    const r = await applyPlan(supabaseAdmin(), tenantId, state.next);
    if (!r.ok) {
      logger.error('plan renewal failed', { tenantId, to: state.next, error: r.error });
      return { ok: false, error: FAILED };
    }
  }
  const billing = state.next !== null ? (state.nextBilling ?? state.billing) : state.billing;
  // The demo's clock never moves, so the renewal happens today and the new period starts
  // from today; counting from the old renewal day would leave more than a period ahead.
  const renewsOn = nextRenewal(state.today, billing);
  const charge = renewalCharge(priceCents(state.next ?? state.plan, billing, state.comp), state.creditCents);
  if (
    !(await writeTerms(tenantId, {
      plan_billing: billing,
      plan_renews_on: renewsOn,
      plan_next: null,
      plan_next_billing: null,
      plan_next_gallery: null,
      plan_credit_cents: charge.creditLeftCents,
    }))
  ) {
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
  const today = ready.state.today;
  const renewsOn = billing === 'yearly' ? addMonths(today, 6) : addDays(today, 20);
  if (
    !(await writeTerms(ready.tenantId, {
      plan_billing: billing,
      plan_renews_on: renewsOn,
      plan_next: null,
      plan_next_billing: null,
      plan_next_gallery: null,
      plan_credit_cents: 0,
    }))
  )
    return { ok: false, error: FAILED };
  return done();
}
