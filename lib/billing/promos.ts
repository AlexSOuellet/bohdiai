/**
 * Promotions (Alex, 2026-11-04). A discount is a percent off for some months or
 * for good, so "3 months free" is 100% for 3 months and a free maker is 100% for
 * good. A code is a Stripe coupon whose id is the code; `plan_promo_uses` keeps
 * who used it, because a maker uses a code once, ever.
 *
 * A yearly plan is charged once a year, so a discount measured in months can't
 * skip bills: Stripe would either miss the renewal or take the months off the
 * whole year. There it becomes money off instead: credit toward the next renewal
 * for a maker already on the plan, or money off the first year at sign-up.
 */
import type Stripe from 'stripe';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { addMonths } from '@/lib/backend/plan/billing';
import { isSitePlan, type SitePlan } from '@/lib/backend/plan/plan';
import type { MakerSubscription } from './maker-subscription';
import { PROMO_CODE_SHAPE } from './promo-shape';

type Db = SupabaseClient<Database>;

export type Audience = 'new' | 'everyone';
export type Discount = { percent: number; months: number | null };
export type Promo = Discount & { code: string; audience: Audience; expires: string | null; maxUses: number | null };
export type PromoRow = Promo & { uses: number };
export type PromoRefusal = 'unknown' | 'used' | 'newOnly';
export type PromoCheck = { ok: true; promo: Promo } | { ok: false; why: PromoRefusal };

/** A one-use code made for one invited maker. */
export type InviteCode = Discount & { code: string; name: string; email: string; business: string; plan: SitePlan; note: string };

export { PROMO_CODE_SHAPE };

const PROMO_MARK = 'bohdiai_promo';
const CURRENCY = 'usd';
const INVITE_DAYS = 60;
const DAY_SECONDS = 86400;
const MONTHS_IN_YEAR = 12;
const UNIQUE_VIOLATION = '23505';

export function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase();
}

/** "3 months free", "10% off for 3 months", "10% off", "Free". */
export function discountLabel({ percent, months }: Discount): string {
  const span = months === 1 ? '1 month' : `${months} months`;
  if (percent === 100) return months === null ? 'Free' : `${span} free`;
  return months === null ? `${percent}% off` : `${percent}% off for ${span}`;
}

/** What a discount measured in months is worth on a yearly plan, never more than the year. */
export function yearlyValueCents(yearCents: number, { percent, months }: Discount): number {
  const share = Math.min(months ?? MONTHS_IN_YEAR, MONTHS_IN_YEAR) / MONTHS_IN_YEAR;
  return Math.round(yearCents * share * (percent / 100));
}

/** Whether this discount becomes money off rather than a coupon that runs. */
const asMoney = (interval: 'month' | 'year', d: Discount): boolean => interval === 'year' && d.months !== null;

function promoOf(coupon: Stripe.Coupon): Promo | null {
  if (coupon.metadata?.[PROMO_MARK] === undefined || coupon.percent_off === null) return null;
  return {
    code: coupon.id,
    percent: coupon.percent_off,
    months: coupon.duration_in_months,
    audience: coupon.metadata[PROMO_MARK] === 'new' ? 'new' : 'everyone',
    expires: coupon.redeem_by === null ? null : new Date(coupon.redeem_by * 1000).toISOString(),
    maxUses: coupon.max_redemptions,
  };
}

function couponDuration(d: Discount): Pick<Stripe.CouponCreateParams, 'duration' | 'duration_in_months'> {
  return d.months === null ? { duration: 'forever' } : { duration: 'repeating', duration_in_months: d.months };
}

export async function createPromo(s: Stripe, promo: Promo): Promise<void> {
  await s.coupons.create({
    id: promo.code,
    name: promo.code,
    percent_off: promo.percent,
    ...couponDuration(promo),
    ...(promo.expires === null ? {} : { redeem_by: Math.floor(new Date(promo.expires).getTime() / 1000) }),
    ...(promo.maxUses === null ? {} : { max_redemptions: promo.maxUses }),
    metadata: { [PROMO_MARK]: promo.audience },
  });
}

/** No new uses from now on; anyone already on the discount keeps it. */
export async function endPromo(s: Stripe, code: string): Promise<void> {
  await s.coupons.del(code);
}

async function usesOf(db: Db): Promise<Map<string, number>> {
  const { data, error } = await db.from('plan_promo_uses').select('code');
  if (error !== null) throw new Error(`Could not read the code uses: ${error.message}`);
  const uses = new Map<string, number>();
  for (const row of data) uses.set(row.code, (uses.get(row.code) ?? 0) + 1);
  return uses;
}

export async function listPromos(s: Stripe, db: Db): Promise<PromoRow[]> {
  const [coupons, uses] = await Promise.all([s.coupons.list({ limit: 100 }), usesOf(db)]);
  return coupons.data.flatMap((coupon) => {
    const promo = promoOf(coupon);
    return promo === null || coupon.metadata?.['invite_email'] !== undefined ? [] : [{ ...promo, uses: uses.get(promo.code) ?? 0 }];
  });
}

/** A code only this invite knows: new sign-ups only, one use, good for 60 days. */
export async function createInviteCode(s: Stripe, who: { name: string; email: string; business: string; plan: SitePlan; note: string }, discount: Discount): Promise<InviteCode> {
  const code = `INVITE-${crypto.randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase()}`;
  await s.coupons.create({
    id: code,
    name: code,
    percent_off: discount.percent,
    ...couponDuration(discount),
    max_redemptions: 1,
    redeem_by: Math.floor(Date.now() / 1000) + INVITE_DAYS * DAY_SECONDS,
    metadata: { [PROMO_MARK]: 'new', invite_name: who.name, invite_email: who.email, invite_business: who.business, invite_plan: who.plan, invite_note: who.note },
  });
  return { ...discount, ...who, code };
}

function inviteOf(coupon: Stripe.Coupon): InviteCode | null {
  const m = coupon.metadata;
  const promo = promoOf(coupon);
  const plan = m?.['invite_plan'];
  if (promo === null || m?.['invite_email'] === undefined || !isSitePlan(plan)) return null;
  return { code: promo.code, percent: promo.percent, months: promo.months, name: m['invite_name'] ?? '', email: m['invite_email'], business: m['invite_business'] ?? '', plan, note: m['invite_note'] ?? '' };
}

/** Invite codes still open: not used, not expired. */
export async function findInviteCodes(s: Stripe, db: Db): Promise<InviteCode[]> {
  const [coupons, uses] = await Promise.all([s.coupons.list({ limit: 100 }), usesOf(db)]);
  return coupons.data.flatMap((coupon) => {
    const invite = coupon.valid ? inviteOf(coupon) : null;
    return invite === null || uses.has(invite.code) ? [] : [invite];
  });
}

async function findCoupon(s: Stripe, code: string): Promise<Stripe.Coupon | null> {
  if (!PROMO_CODE_SHAPE.test(code)) return null;
  try {
    return await s.coupons.retrieve(code);
  } catch (err) {
    if (err !== null && typeof err === 'object' && 'code' in err && err.code === 'resource_missing') return null;
    throw err;
  }
}

async function alreadyUsed(db: Db, code: string, email: string, tenantId: string | null): Promise<boolean> {
  const byEmail = await db.from('plan_promo_uses').select('id').eq('code', code).eq('email', email).limit(1);
  if (byEmail.error !== null) throw new Error(`Could not read the code uses: ${byEmail.error.message}`);
  if (byEmail.data.length > 0 || tenantId === null) return byEmail.data.length > 0;
  const bySite = await db.from('plan_promo_uses').select('id').eq('code', code).eq('tenant_id', tenantId).limit(1);
  if (bySite.error !== null) throw new Error(`Could not read the code uses: ${bySite.error.message}`);
  return bySite.data.length > 0;
}

/** Whether this maker may use this code. An ended, expired or used-up code reads as unknown. */
export async function checkPromo(s: Stripe, db: Db, input: { code: string; email: string; tenantId: string | null; isNew: boolean }): Promise<PromoCheck> {
  const coupon = await findCoupon(s, input.code);
  const promo = coupon === null ? null : promoOf(coupon);
  if (coupon === null || promo === null || !coupon.valid) return { ok: false, why: 'unknown' };
  if (promo.audience === 'new' && !input.isNew) return { ok: false, why: 'newOnly' };
  if (await alreadyUsed(db, promo.code, input.email, input.tenantId)) return { ok: false, why: 'used' };
  if (promo.maxUses !== null && ((await usesOf(db)).get(promo.code) ?? 0) >= promo.maxUses) return { ok: false, why: 'unknown' };
  return { ok: true, promo };
}

/** Holds the code for this maker; false when they've already used it. */
export async function claimPromo(db: Db, code: string, tenantId: string, email: string): Promise<boolean> {
  const { error } = await db.from('plan_promo_uses').insert({ code, tenant_id: tenantId, email });
  if (error === null) return true;
  if (error.code === UNIQUE_VIOLATION) return false;
  throw new Error(`Could not note the code’s use: ${error.message}`);
}

export async function releasePromo(db: Db, code: string, tenantId: string): Promise<void> {
  const { error } = await db.from('plan_promo_uses').delete().eq('code', code).eq('tenant_id', tenantId);
  if (error !== null) throw new Error(`Could not release the code: ${error.message}`);
}

export function discountRunning(sub: Pick<MakerSubscription, 'discountLabel' | 'discountEndsAt'>, now: Date): boolean {
  if (sub.discountLabel === null) return false;
  return sub.discountEndsAt === null || new Date(sub.discountEndsAt) > now;
}

async function saveDiscount(db: Db, stripeId: string, saved: { label: string | null; percent: number | null; endsAt: string | null }): Promise<void> {
  const { error } = await db.from('subscriptions').update({ discount_label: saved.label, discount_percent: saved.percent, discount_ends_at: saved.endsAt }).eq('stripe_subscription_id', stripeId);
  if (error !== null) throw new Error(`Could not save the discount: ${error.message}`);
}

/** The day a discount of this many months stops. */
export function endsAfter(months: number, now: Date): string {
  return `${addMonths(now.toISOString().slice(0, 10), months)}T00:00:00.000Z`;
}

/** Takes the running discount off. Credit already given stays on the maker's account. */
export async function clearDiscount(s: Stripe, db: Db, sub: MakerSubscription): Promise<void> {
  await s.subscriptions.update(sub.stripeId, { discounts: '' });
  await saveDiscount(db, sub.stripeId, { label: null, percent: null, endsAt: null });
}

/** Puts a discount on a maker already on a plan, replacing any running. `couponId`
 *  is the code's coupon; a discount given directly gets a coupon of its own. */
export async function applyDiscount(s: Stripe, db: Db, sub: MakerSubscription, discount: Discount, now: Date, couponId: string | null = null): Promise<void> {
  const label = discountLabel(discount);
  if (asMoney(sub.interval, discount)) {
    if (discountRunning(sub, now)) await s.subscriptions.update(sub.stripeId, { discounts: '' });
    await s.customers.createBalanceTransaction(sub.customerId, { amount: -yearlyValueCents(sub.unitCents, discount), currency: CURRENCY, description: label });
    await saveDiscount(db, sub.stripeId, { label, percent: 0, endsAt: sub.periodEnd });
    return;
  }
  const coupon = couponId ?? (await s.coupons.create({ name: label, percent_off: discount.percent, ...couponDuration(discount) })).id;
  await s.subscriptions.update(sub.stripeId, { discounts: [{ coupon }] });
  await saveDiscount(db, sub.stripeId, { label, percent: discount.percent, endsAt: discount.months === null ? null : endsAfter(discount.months, now) });
}

/** What a code does to a sign-up's first checkout: a coupon that runs, or money off the first year. */
export async function checkoutCoupon(s: Stripe, promo: Promo, interval: 'month' | 'year', periodCents: number): Promise<string> {
  if (!asMoney(interval, promo)) return promo.code;
  const once = await s.coupons.create({ name: `${promo.code}: ${discountLabel(promo)}`, amount_off: yearlyValueCents(periodCents, promo), currency: CURRENCY, duration: 'once', max_redemptions: 1 });
  return once.id;
}

/** After a paid sign-up: the code is used, and a discount that runs is on the record. */
export async function recordSignupPromo(db: Db, input: { stripeId: string; code: string; tenantId: string; email: string; discount: Discount; interval: 'month' | 'year'; now: Date }): Promise<void> {
  await claimPromo(db, input.code, input.tenantId, input.email);
  if (asMoney(input.interval, input.discount)) return;
  const { percent, months } = input.discount;
  await saveDiscount(db, input.stripeId, { label: discountLabel(input.discount), percent, endsAt: months === null ? null : endsAfter(months, input.now) });
}
