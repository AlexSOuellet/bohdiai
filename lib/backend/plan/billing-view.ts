/**
 * The Billing screen's facts (Settings → Billing; Alex, 2026-10-19). What the next
 * charge is and when, from the plan's own terms. Paying by card isn't connected
 * yet (taking a maker's payment at sign-up is the next priority), so there is no
 * card and no past charge to show; the screen says so plainly.
 */
import { planOf } from './plan';
import { isFreeOn, longDay, money, priceCents, renewalCharge } from './billing';
import type { PlanState } from './queries';

export type BillingView = {
  /** The plan the next charge is for (a waiting change applies at renewal). */
  planName: string;
  how: 'monthly' | 'yearly';
  /** "$5.00", or null when the site is free on that plan. */
  amount: string | null;
  /** "Tuesday, November 18, 2026". */
  on: string;
};

export function billingView(state: Pick<PlanState, 'plan' | 'billing' | 'renewsOn' | 'next' | 'nextBilling' | 'creditCents' | 'comp'>): BillingView {
  const plan = state.next ?? state.plan;
  const how = state.nextBilling ?? state.billing;
  const free = isFreeOn(plan, state.comp);
  const { paidCents } = renewalCharge(priceCents(plan, how, state.comp), state.creditCents);
  return { planName: planOf(plan).name, how, amount: free ? null : money(paidCents), on: longDay(state.renewsOn) };
}
