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

/** What Stripe says, as the Billing screen words it. */
export type StripeBilling = {
  next: string;
  card: string;
  charges: { id: string; on: string; amount: string; receiptUrl: string | null }[];
};

const BRANDS: Record<string, string> = { visa: 'Visa', mastercard: 'Mastercard', amex: 'American Express', discover: 'Discover', diners: 'Diners Club', jcb: 'JCB', unionpay: 'UnionPay' };

const dayOf = (seconds: number): string => longDay(new Date(seconds * 1000).toISOString().slice(0, 10));

export function stripeBillingView(input: {
  card: { brand: string; last4: string; expMonth: number; expYear: number } | null;
  next: { cents: number; on: number } | null;
  charges: { id: string; on: number; cents: number; currency: string; receiptUrl: string | null }[];
  planName: string;
}): StripeBilling {
  const { card, next } = input;
  return {
    next: next === null ? 'Nothing more will be charged.' : `${money(next.cents)} for ${input.planName}, on ${dayOf(next.on)}.`,
    card:
      card === null
        ? 'No card is on file. Put one on so your plan keeps renewing.'
        : `${BRANDS[card.brand] ?? 'Card'} ending ${card.last4}, expires ${String(card.expMonth).padStart(2, '0')}/${card.expYear}.`,
    charges: input.charges.map((c) => ({ id: c.id, on: dayOf(c.on), amount: money(c.cents), receiptUrl: c.receiptUrl })),
  };
}
