'use server';

/**
 * Change the site's plan from the backend. Makers change their own plan (Alex,
 * Session 121, 2026-11-09). Each action re-checks the acting site and its switches
 * on the server, then writes with the service role (owners never write switches
 * directly).
 *
 * An upgrade (or monthly to yearly) happens now, charged for the rest of the period.
 * A downgrade (or yearly to monthly) waits for the next renewal, with no refund.
 * Three kinds of site:
 * - billed by Stripe: Stripe is told first and charges first (lib/billing/plan-change.ts);
 *   only then does the site change. A waiting downgrade lives in a Stripe schedule,
 *   and Stripe's renewal notice steps the site down (lib/billing/record.ts).
 * - free for this maker (plan_comp free): nothing to charge, the change just happens.
 * - the demo: worked out here, and "skip to renewal" plays the renewal out on camera.
 * A site with none of these (a sample) still goes through Alex.
 */
import { revalidatePath } from 'next/cache';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { stripe } from '@/lib/billing/stripe';
import { currentSubscription, setEndsWithTerm } from '@/lib/billing/maker-subscription';
import { changeAtRenewal, changeNow, dropAtRenewal, findPrice, whenChange } from '@/lib/billing/plan-change';
import { SITE_PLANS } from './plan';
import { planHow, type PlanHow } from './how';
import { sendPlanChange, type PlanChange } from './emails';
import { longDay } from './billing';
import { planOf } from './plan';
import { isSitePlan, type SitePlan } from './plan';
import { loadPlanState, type PlanState } from './queries';
import { moveOf } from './plan-features';
import { applyPlan } from './apply';
import { galleryFromProducts, galleryToProducts, pickedForShowcase, showcaseCandidates } from './convert';
import { GALLERY_LIMIT } from '../gallery/gallery-form';
import type { Billing } from './billing';
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

const THROUGH_ALEX = 'This site’s plan is changed by Alex. Use the email button on Your plan.';
const PAID_SWITCHING = 'Your payment went through. Your site is switching over: refresh in a minute.';

type Ready = { ok: true; tenantId: string; state: PlanState; how: PlanHow } | { ok: false; error: string };

/** The acting site, its plan, and how its plan is paid for. */
async function planSite(): Promise<Ready> {
  const { site } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  if (!on.has('plan')) return { ok: false, error: 'This site isn’t on a plan yet.' };
  const state = await loadPlanState(supabaseAdmin(), site.tenantId);
  if (state === null) return { ok: false, error: 'This site isn’t on a plan yet.' };
  return { ok: true, tenantId: site.tenantId, state, how: await planHow(supabaseAdmin(), site.tenantId, on.has('demo_checkout'), state) };
}

/** The demo's own sums: only the demo works its billing out here. */
async function demoSite(): Promise<Ready> {
  const ready = await planSite();
  if (ready.ok && ready.how.how !== 'demo') return { ok: false, error: THROUGH_ALEX };
  return ready;
}

const rank = (p: string): number => (SITE_PLANS as readonly string[]).indexOf(p);

/** A Stripe time as a day. */
function renewalDay(seconds: number): string {
  return new Date(seconds * 1000).toISOString().slice(0, 10);
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

/** Email the maker (and Alex a copy) about a change that has happened. */
async function tell(change: PlanChange): Promise<void> {
  const { user, site } = await requireActingSite();
  await sendPlanChange({ siteName: site.businessName, subdomain: site.subdomain, makerEmail: user.email ?? '', change });
}

/** Tells Stripe first, so nothing says cancelled while Stripe would still charge. */
async function tellStripe(tenantId: string, ends: boolean): Promise<boolean> {
  try {
    const sub = await currentSubscription(supabaseAdmin(), tenantId);
    if (sub === null) return true;
    // A downgrade waiting for renewal gives way to the cancel.
    if (ends) await dropAtRenewal(stripe(), sub.stripeId);
    await setEndsWithTerm(stripe(), sub, ends);
    return true;
  } catch (err) {
    logger.error('plan: Stripe not told', { tenantId, ends, error: err instanceof Error ? err.message : String(err) });
    return false;
  }
}

/** Cancel: the site stays up to the end of its current term, then comes down
 *  (kept and hidden, never deleted). Any site on a plan; Alex, 2026-10-19. */
export async function cancelAtTermEnd(): Promise<ChangePlanResult> {
  const { site } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  if (!on.has('plan')) return { ok: false, error: 'This site isn’t on a plan yet.' };
  const state = await loadPlanState(supabaseAdmin(), site.tenantId);
  if (state === null) return { ok: false, error: 'This site isn’t on a plan yet.' };
  if (!(await tellStripe(site.tenantId, true))) return { ok: false, error: 'Your cancellation couldn’t be saved. Try again in a moment.' };
  const { error } = await supabaseAdmin()
    .from('tenants')
    .update({ plan_cancels: true, plan_next: null, plan_next_billing: null, plan_next_gallery: null })
    .eq('id', site.tenantId);
  if (error !== null) {
    logger.error('plan cancel failed', { tenantId: site.tenantId, error: error.message });
    return { ok: false, error: 'Your cancellation couldn’t be saved. Try again in a moment.' };
  }
  await tell({ kind: 'cancel', on: longDay(state.renewsOn) });
  return done();
}

/** Keep my site: withdraw a cancellation before the term ends. */
export async function keepSite(): Promise<ChangePlanResult> {
  const { site } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  if (!on.has('plan')) return { ok: false, error: 'This site isn’t on a plan yet.' };
  if (!(await tellStripe(site.tenantId, false))) return { ok: false, error: 'That couldn’t be saved. Try again in a moment.' };
  const { error } = await supabaseAdmin().from('tenants').update({ plan_cancels: false }).eq('id', site.tenantId);
  if (error !== null) {
    logger.error('plan keep failed', { tenantId: site.tenantId, error: error.message });
    return { ok: false, error: 'That couldn’t be saved. Try again in a moment.' };
  }
  await tell({ kind: 'keep' });
  return done();
}

function done(): ChangePlanResult {
  revalidatePath('/manage', 'layout');
  return { ok: true };
}

/** The site steps onto `to` here: Showcase's gallery photos become products first
 *  when leaving Showcase, so the shop is never empty. */
async function switchSite(tenantId: string, from: SitePlan, to: SitePlan): Promise<boolean> {
  if (from === 'showcase' && to !== 'showcase') {
    const made = await galleryToProducts(supabaseAdmin(), tenantId);
    if (!made.ok) {
      logger.error('gallery to products failed', { tenantId, error: made.error });
      return false;
    }
  }
  const r = await applyPlan(supabaseAdmin(), tenantId, to);
  if (!r.ok) logger.error('plan change failed', { tenantId, to, error: r.error });
  return r.ok;
}

type Charged = { ok: true; renewsOn: string | null } | { ok: false; error: string };

/** Stripe changes the plan now and charges for it; a declined card changes nothing. */
async function chargeNow(stripeId: string, to: SitePlan, billing: Billing, tenantId: string): Promise<Charged> {
  try {
    const s = stripe();
    const r = await changeNow(s, stripeId, await findPrice(s, to, billing), { plan: to, billing });
    if (!r.ok) return { ok: false, error: `Your card was declined: ${r.declined} Update your card under Billing, then try again.` };
    const end = r.sub.items.data[0]?.current_period_end;
    return { ok: true, renewsOn: end === undefined ? null : renewalDay(end) };
  } catch (err) {
    logger.error('plan: Stripe change failed', { tenantId, to, billing, error: err instanceof Error ? err.message : String(err) });
    return { ok: false, error: FAILED };
  }
}

/** Stripe holds the change for the next renewal. */
async function holdForRenewal(stripeId: string, to: SitePlan, billing: Billing, tenantId: string): Promise<boolean> {
  try {
    const s = stripe();
    await changeAtRenewal(s, stripeId, await findPrice(s, to, billing), { plan: to, billing });
    return true;
  } catch (err) {
    logger.error('plan: Stripe schedule failed', { tenantId, to, billing, error: err instanceof Error ? err.message : String(err) });
    return false;
  }
}

async function letGoOfRenewal(stripeId: string, tenantId: string): Promise<boolean> {
  try {
    await dropAtRenewal(stripe(), stripeId);
    return true;
  } catch (err) {
    logger.error('plan: Stripe schedule not let go', { tenantId, error: err instanceof Error ? err.message : String(err) });
    return false;
  }
}

/** Upgrade now, on `billing`: charged for the rest of the period. Clears any downgrade waiting. */
export async function upgradePlan(to: unknown, billing: unknown): Promise<ChangePlanResult> {
  if (!isSitePlan(to) || !isBilling(billing))
    return { ok: false, error: 'That isn’t one of the plans.' };
  const ready = await planSite();
  if (!ready.ok) return ready;
  const { tenantId, state, how } = ready;
  if (moveOf(state.plan, to) !== 'up')
    return { ok: false, error: 'That isn’t an upgrade from your plan.' };
  if (how.how === 'alex') return { ok: false, error: THROUGH_ALEX };

  if (how.how === 'stripe') {
    const moved = await chargeNow(how.stripeId, to, billing, tenantId);
    if (!moved.ok) return moved;
    // Paid: from here a failure is fixed by Stripe's own notice, which puts the site on its plan.
    if (!(await switchSite(tenantId, state.plan, to))) return { ok: false, error: PAID_SWITCHING };
    if (!(await writeTerms(tenantId, { plan_billing: billing, plan_renews_on: moved.renewsOn ?? state.renewsOn, plan_next: null, plan_next_billing: null, plan_next_gallery: null })))
      return { ok: false, error: PAID_SWITCHING };
    await tell({ kind: 'upgrade', to: planOf(to).name });
    return done();
  }

  // The demo works out its own credit; a free site has nothing to charge.
  const quote = quoteUpgrade(state, to, billing, state.today);
  if (!(await switchSite(tenantId, state.plan, to))) return { ok: false, error: FAILED };
  if (
    !(await writeTerms(tenantId, {
      plan_billing: billing,
      plan_renews_on: how.how === 'demo' ? quote.renewsOn : state.renewsOn,
      plan_next: null,
      plan_next_billing: null,
      plan_next_gallery: null,
      ...(how.how === 'demo' ? { plan_credit_cents: quote.creditLeftCents } : {}),
    }))
  )
    return { ok: false, error: FAILED };
  await tell({ kind: 'upgrade', to: planOf(to).name });
  return done();
}

/** Downgrade at the next renewal, billed `billing` from then. Nothing changes until then, and nothing is refunded. */
export async function scheduleDowngrade(to: unknown, billing: unknown, showcase: unknown = []): Promise<ChangePlanResult> {
  if (!isSitePlan(to) || !isBilling(billing))
    return { ok: false, error: 'That isn’t one of the plans.' };
  const ready = await planSite();
  if (!ready.ok) return ready;
  const { tenantId, state, how } = ready;
  if (moveOf(state.plan, to) !== 'down')
    return { ok: false, error: 'That isn’t a downgrade from your plan.' };
  if (how.how === 'alex') return { ok: false, error: THROUGH_ALEX };
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
  if (how.how === 'stripe' && !(await holdForRenewal(how.stripeId, to, billing, tenantId))) return { ok: false, error: FAILED };
  if (
    !(await writeTerms(tenantId, {
      plan_billing: state.billing,
      plan_renews_on: state.renewsOn,
      plan_next: to,
      plan_next_billing: billing,
      plan_next_gallery: picked,
    }))
  ) {
    // Nothing here says it's waiting, so Stripe mustn't hold it either.
    if (how.how === 'stripe') await letGoOfRenewal(how.stripeId, tenantId);
    return { ok: false, error: FAILED };
  }
  await tell({ kind: 'downgrade', to: planOf(to).name, on: longDay(state.renewsOn) });
  return done();
}

/** Monthly or yearly on the same plan: to yearly now (the unused month counts toward the
 *  year), to monthly at the next renewal (nobody loses part of a year they paid for). */
export async function changeBilling(billing: unknown): Promise<ChangePlanResult> {
  if (!isBilling(billing)) return { ok: false, error: 'That isn’t a billing choice.' };
  const ready = await planSite();
  if (!ready.ok) return ready;
  const { tenantId, state, how } = ready;
  const when = whenChange(state, { plan: state.plan, billing }, rank);
  if (when === 'same') return { ok: false, error: 'Your plan is already billed that way.' };
  if (how.how === 'alex' || how.how === 'demo') return { ok: false, error: THROUGH_ALEX };
  if (how.how === 'comp') {
    if (!(await writeTerms(tenantId, { plan_billing: billing, plan_next: null, plan_next_billing: null, plan_next_gallery: null }))) return { ok: false, error: FAILED };
    return done();
  }
  if (when === 'now') {
    const moved = await chargeNow(how.stripeId, state.plan, billing, tenantId);
    if (!moved.ok) return moved;
    if (!(await writeTerms(tenantId, { plan_billing: billing, plan_renews_on: moved.renewsOn ?? state.renewsOn, plan_next: null, plan_next_billing: null, plan_next_gallery: null })))
      return { ok: false, error: PAID_SWITCHING };
    await tell({ kind: 'billing', billing, on: null });
    return done();
  }
  if (!(await holdForRenewal(how.stripeId, state.plan, billing, tenantId))) return { ok: false, error: FAILED };
  if (!(await writeTerms(tenantId, { plan_next: state.plan, plan_next_billing: billing, plan_next_gallery: null }))) {
    await letGoOfRenewal(how.stripeId, tenantId);
    return { ok: false, error: FAILED };
  }
  await tell({ kind: 'billing', billing, on: longDay(state.renewsOn) });
  return done();
}

/** Keep the current plan after all: drop the change waiting for renewal. */
export async function cancelScheduledChange(): Promise<ChangePlanResult> {
  const ready = await planSite();
  if (!ready.ok) return ready;
  const { tenantId, state, how } = ready;
  if (how.how === 'alex') return { ok: false, error: THROUGH_ALEX };
  if (how.how === 'stripe' && !(await letGoOfRenewal(how.stripeId, tenantId))) return { ok: false, error: FAILED };
  if (!(await writeTerms(tenantId, { plan_next: null, plan_next_billing: null, plan_next_gallery: null })))
    return { ok: false, error: FAILED };
  await tell({ kind: 'downgrade-dropped', stays: planOf(state.plan).name });
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
  await tell({ kind: 'renewed', plan: planOf(state.next ?? state.plan).name });
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
