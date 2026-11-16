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
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Route } from 'next';
import { headersOrigin } from '@/lib/backend/request-origin';
import { finishPayPage, startPayPage, type PayFor } from '@/lib/billing/pay-change';
import { ONBOARDING_PATH } from '@/lib/signup/onboarding';
import { stepUp } from './free-up';
import { nameMatches, removeAccount } from './close';
import { isFounder } from '@/lib/founder/access';
import { requireActingSite } from '@/lib/backend/current-site';
import { siteSuspended, SUSPENDED_NOTE } from '@/lib/founder/suspend';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { stripe } from '@/lib/billing/stripe';
import { currentSubscription, endNow, setEndsWithTerm } from '@/lib/billing/maker-subscription';
import {
  changeAtRenewal,
  changeNow,
  changeNowBillLater,
  dropAtRenewal,
  findPrice,
  whenChange,
} from '@/lib/billing/plan-change';
import { SITE_PLANS } from './plan';
import { planHow, type PlanHow } from './how';
import { sendPlanChange, type PlanChange } from './emails';
import { longDay } from './billing';
import { planOf } from './plan';
import { isSitePlan, type SitePlan } from './plan';
import { loadPlanState, type PlanState } from './queries';
import { moveOf } from './plan-features';
import { applyPlan } from './apply';
import {
  galleryFromProducts,
  galleryToProducts,
  pickedForShowcase,
  showcaseCandidates,
} from './convert';
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
const PAID_SWITCHING =
  'Your payment went through. Your site is switching over: refresh in a minute.';

type Ready =
  | { ok: true; tenantId: string; state: PlanState; how: PlanHow }
  | { ok: false; error: string };

/** The acting site, its plan, and how its plan is paid for. */
async function planSite(): Promise<Ready> {
  const { site } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  if (!on.has('plan')) return { ok: false, error: 'This site isn’t on a plan yet.' };
  const state = await loadPlanState(supabaseAdmin(), site.tenantId);
  if (state === null) return { ok: false, error: 'This site isn’t on a plan yet.' };
  return {
    ok: true,
    tenantId: site.tenantId,
    state,
    how: await planHow(supabaseAdmin(), site.tenantId, on.has('demo_checkout'), state),
  };
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
  await sendPlanChange({
    siteName: site.businessName,
    subdomain: site.subdomain,
    makerEmail: user.email ?? '',
    change,
  });
}

/** Cancelling (Alex, 2026-11-16): Stripe moves to the $0 Free price at renewal, the same
 *  way a downgrade waits, replacing any downgrade already waiting. The subscription
 *  carries on at $0, so the maker can move back up on it. A site Stripe doesn't bill has
 *  nothing to tell. */
async function moveToFreeAtRenewal(tenantId: string): Promise<boolean> {
  try {
    const sub = await currentSubscription(supabaseAdmin(), tenantId);
    if (sub === null) return true;
    const s = stripe();
    await changeAtRenewal(s, sub.stripeId, await findPrice(s, 'free', 'monthly'), {
      plan: 'free',
      billing: 'monthly',
    });
    return true;
  } catch (err) {
    logger.error('plan: Stripe not told of the cancel', {
      tenantId,
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}

/** Keep my site: Stripe lets go of the move to Free (and of an older cancel that ended
 *  the subscription), so renewal carries on as it was. */
async function stayOnPlan(tenantId: string): Promise<boolean> {
  try {
    const sub = await currentSubscription(supabaseAdmin(), tenantId);
    if (sub === null) return true;
    await dropAtRenewal(stripe(), sub.stripeId);
    await setEndsWithTerm(stripe(), sub, false);
    return true;
  } catch (err) {
    logger.error('plan: Stripe not told of the keep', {
      tenantId,
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}

/** Cancel: the site stays up to the end of its current term, then comes down and the
 *  maker moves to Free (Alex, 2026-11-16): no more charges, their backend, products and
 *  tools kept, and moving back up any time. Nothing is deleted. Any site on a plan. */
export async function cancelAtTermEnd(): Promise<ChangePlanResult> {
  const { site } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  if (!on.has('plan')) return { ok: false, error: 'This site isn’t on a plan yet.' };
  const state = await loadPlanState(supabaseAdmin(), site.tenantId);
  if (state === null) return { ok: false, error: 'This site isn’t on a plan yet.' };
  if (!(await moveToFreeAtRenewal(site.tenantId)))
    return { ok: false, error: 'Your cancellation couldn’t be saved. Try again in a moment.' };
  const { error } = await supabaseAdmin()
    .from('tenants')
    .update({
      plan_cancels: true,
      plan_next: 'free',
      plan_next_billing: null,
      plan_next_gallery: null,
    })
    .eq('id', site.tenantId);
  if (error !== null) {
    logger.error('plan cancel failed', { tenantId: site.tenantId, error: error.message });
    return { ok: false, error: 'Your cancellation couldn’t be saved. Try again in a moment.' };
  }
  await tell({ kind: 'cancel', on: longDay(state.renewsOn) });
  return done();
}

/**
 * Close my account (Alex, 2026-11-16). The maker types the site's name to confirm.
 * A paid site closes at the end of its term: Stripe ends the subscription then, marked
 * to remove the account, and Stripe's notice that day does the removal
 * (lib/billing/record.ts). Until then Keep my account undoes it. A site with nothing
 * paid to run out (Free, or a free site) closes at once.
 */
export async function closeAccount(typed: unknown): Promise<ChangePlanResult> {
  const { user, site } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  if (!on.has('plan')) return { ok: false, error: 'This site isn’t on a plan yet.' };
  if (!nameMatches(typed, site.businessName))
    return { ok: false, error: `Type ${site.businessName} exactly to close your account.` };
  const db = supabaseAdmin();
  const state = await loadPlanState(db, site.tenantId);
  const sub = await currentSubscription(db, site.tenantId);
  const failed = 'Your account couldn’t be closed. Try again in a moment.';

  if (sub === null || sub.unitCents === 0 || state === null) {
    try {
      // Nothing paid to run out: Stripe stops at once, then everything goes.
      if (sub !== null) await endNow(stripe(), sub);
      await tell({ kind: 'closed' });
      const removed = await removeAccount(db, site.tenantId);
      if (!removed.ok) {
        logger.error('close account failed', { tenantId: site.tenantId, error: removed.error });
        return { ok: false, error: failed };
      }
    } catch (err) {
      logger.error('close account failed', {
        tenantId: site.tenantId,
        error: err instanceof Error ? err.message : String(err),
      });
      return { ok: false, error: failed };
    }
    redirect((isFounder(user.id) ? '/founder/act' : '/signin') as Route);
  }

  try {
    const s = stripe();
    // A downgrade or a move to Free waiting for renewal gives way to closing.
    await dropAtRenewal(s, sub.stripeId);
    await setEndsWithTerm(s, sub, true, true);
  } catch (err) {
    logger.error('plan: Stripe not told of the close', {
      tenantId: site.tenantId,
      error: err instanceof Error ? err.message : String(err),
    });
    return { ok: false, error: failed };
  }
  const { error } = await db
    .from('tenants')
    .update({
      plan_cancels: true,
      plan_next: null,
      plan_next_billing: null,
      plan_next_gallery: null,
    })
    .eq('id', site.tenantId);
  if (error !== null) {
    logger.error('close account not saved', { tenantId: site.tenantId, error: error.message });
    return { ok: false, error: failed };
  }
  await tell({ kind: 'close', on: longDay(state.renewsOn) });
  return done();
}

/** Keep my site: withdraw a cancellation before the term ends. */
export async function keepSite(): Promise<ChangePlanResult> {
  const { site } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  if (!on.has('plan')) return { ok: false, error: 'This site isn’t on a plan yet.' };
  if (!(await stayOnPlan(site.tenantId)))
    return { ok: false, error: 'That couldn’t be saved. Try again in a moment.' };
  const { error } = await supabaseAdmin()
    .from('tenants')
    .update({
      plan_cancels: false,
      plan_next: null,
      plan_next_billing: null,
      plan_next_gallery: null,
    })
    .eq('id', site.tenantId);
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

/** Stripe changes the plan now and charges for it; a declined card changes nothing.
 *  `later`: an amount too small for a card payment goes on the next bill instead. */
async function chargeNow(
  stripeId: string,
  to: SitePlan,
  billing: Billing,
  tenantId: string,
  later = false,
): Promise<Charged> {
  try {
    const s = stripe();
    const price = await findPrice(s, to, billing);
    const r = later
      ? await changeNowBillLater(s, stripeId, price, { plan: to, billing })
      : await changeNow(s, stripeId, price, { plan: to, billing });
    if (!r.ok)
      return {
        ok: false,
        error: `Your card was declined: ${r.declined} Update your card under Billing, then try again.`,
      };
    const end = r.sub.items.data[0]?.current_period_end;
    return { ok: true, renewsOn: end === undefined ? null : renewalDay(end) };
  } catch (err) {
    logger.error('plan: Stripe change failed', {
      tenantId,
      to,
      billing,
      error: err instanceof Error ? err.message : String(err),
    });
    return { ok: false, error: FAILED };
  }
}

/** Stripe holds the change for the next renewal. */
async function holdForRenewal(
  stripeId: string,
  to: SitePlan,
  billing: Billing,
  tenantId: string,
): Promise<boolean> {
  try {
    const s = stripe();
    await changeAtRenewal(s, stripeId, await findPrice(s, to, billing), { plan: to, billing });
    return true;
  } catch (err) {
    logger.error('plan: Stripe schedule failed', {
      tenantId,
      to,
      billing,
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}

async function letGoOfRenewal(stripeId: string, tenantId: string): Promise<boolean> {
  try {
    await dropAtRenewal(stripe(), stripeId);
    return true;
  } catch (err) {
    logger.error('plan: Stripe schedule not let go', {
      tenantId,
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}

/** What the maker sees on Stripe's page for what they're paying. */
function payLabel(pay: PayFor): string {
  const name = planOf(pay.plan).name;
  const period = pay.billing === 'yearly' ? 'year' : 'month';
  if (pay.kind === 'free') return `BohdiAI ${name} plan, your first ${period}`;
  if (pay.kind === 'billing') return `BohdiAI ${name} plan, billed yearly from today`;
  return `BohdiAI ${name} plan, due today for the move up`;
}

type Opened = { ok: true; url: string | null } | { ok: false; error: string };

/** Stripe's payment page for a change that charges today. url null: the amount is too
 *  small for a card payment, so the change goes ahead with it on the next bill. */
async function openPayPage(
  tenantId: string,
  stripeId: string,
  pay: PayFor,
  backPath: string,
): Promise<Opened> {
  try {
    // Nothing is charged while Alex has the site suspended (its billing is paused).
    if (await siteSuspended(supabaseAdmin(), tenantId)) return { ok: false, error: SUSPENDED_NOTE };
    const sub = await currentSubscription(supabaseAdmin(), tenantId);
    if (sub === null) return { ok: false, error: FAILED };
    const origin = headersOrigin(await headers());
    const page = await startPayPage(stripe(), {
      stripeId,
      customerId: sub.customerId,
      tenantId,
      pay,
      label: payLabel(pay),
      doneUrl: `${origin}/manage/plan/paid?session={CHECKOUT_SESSION_ID}`,
      backUrl: `${origin}${backPath}`,
    });
    return { ok: true, url: page.kind === 'page' ? page.url : null };
  } catch (err) {
    logger.error('plan: payment page failed', {
      tenantId,
      pay,
      error: err instanceof Error ? err.message : String(err),
    });
    return { ok: false, error: FAILED };
  }
}

/**
 * Back from Stripe's payment page (Alex, 2026-11-16). The change is made only for a
 * paid page for this site; the site then steps onto its plan and the maker is told.
 * Coming back twice is safe: Stripe isn't asked twice, and the site's own steps can run
 * again. Returns where to go next.
 */
export async function finishPaidChange(session: string): Promise<string> {
  if (typeof session !== 'string') return '/manage/plan?paid=not-done';
  const { site } = await requireActingSite();
  if (!(await getSiteFeatures(site.tenantId)).has('plan')) return '/manage/plan?paid=not-done';
  const tenantId = site.tenantId;
  // A Free site has no plan terms yet; only a paid site's are needed below.
  const state = await loadPlanState(supabaseAdmin(), tenantId);
  const sub = await currentSubscription(supabaseAdmin(), tenantId);
  if (sub === null || session === '') return '/manage/plan?paid=not-done';
  let paid: Awaited<ReturnType<typeof finishPayPage>>;
  try {
    paid = await finishPayPage(stripe(), session, tenantId, sub.stripeId);
  } catch (err) {
    logger.error('plan: paid change not made', {
      tenantId,
      error: err instanceof Error ? err.message : String(err),
    });
    return '/manage/plan?paid=credit';
  }
  if (!paid.ok) {
    if (paid.why === 'declined')
      logger.error('plan: paid, but Stripe refused the change; the payment is credit', {
        tenantId,
      });
    return `/manage/plan?paid=${paid.why === 'unpaid' ? 'not-paid' : paid.why === 'declined' ? 'credit' : 'not-done'}`;
  }
  const { plan, billing, kind } = paid.pay;
  const end = paid.sub.items.data[0]?.current_period_end;
  const renewsOn = end === undefined ? (state?.renewsOn ?? '') : renewalDay(end);
  if (kind === 'free') {
    const up = await stepUp(
      supabaseAdmin(),
      tenantId,
      plan,
      billing,
      renewsOn === '' ? null : renewsOn,
    );
    if (!up.ok) return '/manage/plan?up=switching';
    if (!paid.already) await tell({ kind: 'upgrade', to: planOf(plan).name });
    return ONBOARDING_PATH;
  }
  if (state === null) return '/manage/plan?paid=switching';
  if (kind === 'upgrade' && state.plan !== plan && !(await switchSite(tenantId, state.plan, plan)))
    return '/manage/plan?paid=switching';
  if (
    !(await writeTerms(tenantId, {
      plan_billing: billing,
      plan_renews_on: renewsOn,
      plan_next: null,
      plan_next_billing: null,
      plan_next_gallery: null,
    }))
  )
    return '/manage/plan?paid=switching';
  if (!paid.already)
    await tell(
      kind === 'upgrade'
        ? { kind: 'upgrade', to: planOf(plan).name }
        : { kind: 'billing', billing, on: null },
    );
  // No revalidatePath here: this runs while the return page is drawn, where Next refuses
  // it, and the maker arrives from Stripe on a fresh page anyway.
  return kind === 'upgrade' ? `/manage/plan?changed=${plan}` : '/manage/plan?changed=billing';
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
    // Paid on Stripe's own page first (Alex, 2026-11-16); the change is made on the way back.
    const pay: PayFor = { plan: to, billing, kind: 'upgrade' };
    const page = await openPayPage(tenantId, how.stripeId, pay, `/manage/plan/change?to=${to}`);
    if (!page.ok) return page;
    if (page.url !== null) redirect(page.url as Route);
    const moved = await chargeNow(how.stripeId, to, billing, tenantId, true);
    if (!moved.ok) return moved;
    // Paid: from here a failure is fixed by Stripe's own notice, which puts the site on its plan.
    if (!(await switchSite(tenantId, state.plan, to))) return { ok: false, error: PAID_SWITCHING };
    if (
      !(await writeTerms(tenantId, {
        plan_billing: billing,
        plan_renews_on: moved.renewsOn ?? state.renewsOn,
        plan_next: null,
        plan_next_billing: null,
        plan_next_gallery: null,
      }))
    )
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
export async function scheduleDowngrade(
  to: unknown,
  billing: unknown,
  showcase: unknown = [],
): Promise<ChangePlanResult> {
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
    const ids = Array.isArray(showcase)
      ? showcase.filter((x): x is string => typeof x === 'string')
      : [];
    picked = pickedForShowcase(ids, found.products, GALLERY_LIMIT).map((p) => p.id);
    if (picked.length === 0 && found.products.length > 0)
      return { ok: false, error: 'Pick at least one product to show on your Showcase page.' };
  }
  if (how.how === 'stripe' && !(await holdForRenewal(how.stripeId, to, billing, tenantId)))
    return { ok: false, error: FAILED };
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
    if (
      !(await writeTerms(tenantId, {
        plan_billing: billing,
        plan_next: null,
        plan_next_billing: null,
        plan_next_gallery: null,
      }))
    )
      return { ok: false, error: FAILED };
    return done();
  }
  if (when === 'now') {
    const page = await openPayPage(
      tenantId,
      how.stripeId,
      { plan: state.plan, billing, kind: 'billing' },
      '/manage/plan',
    );
    if (!page.ok) return page;
    if (page.url !== null) redirect(page.url as Route);
    const moved = await chargeNow(how.stripeId, state.plan, billing, tenantId, true);
    if (!moved.ok) return moved;
    if (
      !(await writeTerms(tenantId, {
        plan_billing: billing,
        plan_renews_on: moved.renewsOn ?? state.renewsOn,
        plan_next: null,
        plan_next_billing: null,
        plan_next_gallery: null,
      }))
    )
      return { ok: false, error: PAID_SWITCHING };
    await tell({ kind: 'billing', billing, on: null });
    return done();
  }
  if (!(await holdForRenewal(how.stripeId, state.plan, billing, tenantId)))
    return { ok: false, error: FAILED };
  if (
    !(await writeTerms(tenantId, {
      plan_next: state.plan,
      plan_next_billing: billing,
      plan_next_gallery: null,
    }))
  ) {
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
  if (how.how === 'stripe' && !(await letGoOfRenewal(how.stripeId, tenantId)))
    return { ok: false, error: FAILED };
  if (
    !(await writeTerms(tenantId, {
      plan_next: null,
      plan_next_billing: null,
      plan_next_gallery: null,
    }))
  )
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
    const g = await galleryFromProducts(
      supabaseAdmin(),
      tenantId,
      state.nextGallery,
      GALLERY_LIMIT,
    );
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
  const charge = renewalCharge(
    priceCents(state.next ?? state.plan, billing, state.comp),
    state.creditCents,
  );
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
