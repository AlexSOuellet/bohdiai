/**
 * Plan billing (Saltmarsh & Lace demo spec, stage two). Pure date and money math,
 * in whole cents and YYYY-MM-DD days (UTC), so every case is testable.
 *
 * - Moving up is prorated: she pays the difference for what's left of the period
 *   she already paid for, and her renewal day stays put. Changing billing starts a
 *   new period today, less the unused part of the old one; anything left over
 *   (yearly to monthly) stays as credit and pays her next bills first.
 * - A downgrade takes effect at the next renewal. Nothing is refunded (Alex,
 *   2026-10-09); a yearly plan says so where it's chosen.
 */
import { shopToday } from '@/lib/storefront/promotions';
import type { SitePlan } from './plan';
import { planOf } from './plan';

export const BILLINGS = ['monthly', 'yearly'] as const;
export type Billing = (typeof BILLINGS)[number];

export function isBilling(value: unknown): value is Billing {
  return typeof value === 'string' && (BILLINGS as readonly string[]).includes(value);
}

/**
 * A free site (Alex, 2026-10-16): `free` pays nothing on any plan; `showcase` pays
 * nothing on Showcase and the normal price on Market or Full. Null pays normally.
 */
export const PLAN_COMPS = ['free', 'showcase'] as const;
export type PlanComp = (typeof PLAN_COMPS)[number];

export function isPlanComp(value: unknown): value is PlanComp {
  return typeof value === 'string' && (PLAN_COMPS as readonly string[]).includes(value);
}

/** True when the site pays nothing for `plan`. */
export function isFreeOn(plan: SitePlan, comp: PlanComp | null | undefined): boolean {
  return comp === 'free' || (comp === 'showcase' && plan === 'showcase');
}

/** What one period of `plan` costs this site: its price, or nothing when it's free on it. */
export function priceCents(plan: SitePlan, billing: Billing, comp: PlanComp | null = null): number {
  if (isFreeOn(plan, comp)) return 0;
  const p = planOf(plan);
  return (billing === 'monthly' ? p.monthly : p.yearly) * 100;
}

function toDate(day: string): Date {
  return new Date(`${day}T00:00:00Z`);
}

function toDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** `day` moved by whole months, held to the month's last day (Jan 31 + 1 → Feb 28). */
export function addMonths(day: string, months: number): string {
  const d = toDate(day);
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, 1));
  const last = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  target.setUTCDate(Math.min(d.getUTCDate(), last));
  return toDay(target);
}

/** `day` moved by whole days. */
export function addDays(day: string, days: number): string {
  const d = toDate(day);
  d.setUTCDate(d.getUTCDate() + days);
  return toDay(d);
}

export function periodMonths(billing: Billing): number {
  return billing === 'monthly' ? 1 : 12;
}

/** The next renewal after paying on `day`. */
export function nextRenewal(day: string, billing: Billing): string {
  return addMonths(day, periodMonths(billing));
}

function daysBetween(a: string, b: string): number {
  return Math.round((toDate(b).getTime() - toDate(a).getTime()) / 86_400_000);
}

/** The share of the current period still ahead of `today`, between 0 and 1. */
export function periodLeft(today: string, renewsOn: string, billing: Billing): number {
  const start = addMonths(renewsOn, -periodMonths(billing));
  const total = daysBetween(start, renewsOn);
  const left = daysBetween(today, renewsOn);
  if (total <= 0) return 0;
  return Math.min(1, Math.max(0, left / total));
}

/** Days from `today` to `renewsOn`, never below zero, and never more than one `billing` period. */
export function daysLeft(today: string, renewsOn: string, billing?: Billing): number {
  const left = Math.max(0, daysBetween(today, renewsOn));
  if (billing === undefined) return left;
  // Never more than one period: a renewal day further out than that is not a real period.
  return Math.min(left, daysBetween(addMonths(renewsOn, -periodMonths(billing)), renewsOn));
}

/** How much of a period is left, as people say it: "about 6 months (182 days)" or "20 days". */
export function timeLeft(days: number, billing: Billing): string {
  if (billing === 'monthly' || days < 45) return days === 1 ? '1 day' : `${days} days`;
  const months = Math.round(days / 30.4);
  return `about ${months} months (${days} days)`;
}

/** Where a site stands: its plan, billing, renewal day and any credit on account. */
export type PlanTerms = {
  plan: SitePlan;
  billing: Billing;
  renewsOn: string;
  creditCents?: number;
  /** Free on some or all plans. */
  comp?: PlanComp | null;
};

export type UpgradeQuote = {
  billing: Billing;
  /** The new plan's full price for one period. */
  priceCents: number;
  /** The new plan for what this charge covers: the rest of the period, or a whole new one. */
  partCents: number;
  /** True when the charge covers only the rest of the period already paid for. */
  prorated: boolean;
  /** The unused part of the period she already paid for. */
  creditCents: number;
  /** The part of that credit put toward today. */
  creditUsedCents: number;
  /** Days left in the period she already paid for. */
  daysLeft: number;
  /** Credit already on her account, put toward today. */
  accountCreditUsedCents: number;
  /** What she pays today. */
  todayCents: number;
  /** Credit still on her account after today; it pays her next bills first. */
  creditLeftCents: number;
  /** When the next full charge comes, and its price before credit. */
  renewsOn: string;
  renewalCents: number;
};

/**
 * What moving up to `to` costs today on `billing`. Same billing: the difference for
 * what's left of the period, renewal day unchanged. Changing billing starts a new
 * period today; the unused part of the old one becomes credit (yearly to monthly
 * can leave credit over, which pays the next months until it runs out — Alex,
 * 2026-10-09). Credit already on account is used before she pays anything.
 */
export function quoteUpgrade(
  now: PlanTerms,
  to: SitePlan,
  billing: Billing,
  today: string,
): UpgradeQuote {
  const left = periodLeft(today, now.renewsOn, now.billing);
  const comp = now.comp ?? null;
  const paidCents = priceCents(now.plan, now.billing, comp);
  const newCents = priceCents(to, billing, comp);
  const balance = now.creditCents ?? 0;
  const sameBilling = billing === now.billing;
  const partCents = sameBilling ? Math.round(newCents * left) : newCents;
  const creditCents = Math.round(paidCents * left);
  const owed = Math.max(0, partCents - creditCents);
  const overCredit = Math.max(0, creditCents - partCents);
  const accountCreditUsedCents = Math.min(balance, owed);
  return {
    billing,
    priceCents: newCents,
    partCents,
    prorated: sameBilling,
    creditCents,
    creditUsedCents: Math.min(creditCents, partCents),
    daysLeft: daysLeft(today, now.renewsOn, now.billing),
    accountCreditUsedCents,
    todayCents: owed - accountCreditUsedCents,
    creditLeftCents: balance - accountCreditUsedCents + overCredit,
    renewsOn: sameBilling ? now.renewsOn : nextRenewal(today, billing),
    renewalCents: newCents,
  };
}

/** A renewal: the price, paid from credit first. */
export function renewalCharge(
  priceCents: number,
  creditCents: number,
): { paidCents: number; creditLeftCents: number } {
  const used = Math.min(priceCents, creditCents);
  return { paidCents: priceCents - used, creditLeftCents: creditCents - used };
}

/** The money as the site says it: $6.67, or $15 for whole dollars. */
export function money(cents: number): string {
  const dollars = cents / 100;
  return Number.isInteger(dollars) ? `$${dollars}` : `$${dollars.toFixed(2)}`;
}

/** A renewal day as the backend says it: "October 29, 2026". */
export function longDay(day: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(toDate(day));
}

/** Today in the shop's own time zone, as a day (the shop's day decides renewals and proration). */
export function todayDay(timeZone: string | null, now: Date = new Date()): string {
  return shopToday(timeZone, now);
}
