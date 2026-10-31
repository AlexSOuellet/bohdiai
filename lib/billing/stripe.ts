/**
 * BohdiAI's own Stripe: makers paying for their plan (Alex, Session 119). Separate
 * from a maker's shop taking money from their customers. The key lives only in
 * the server's settings (STRIPE_SECRET_KEY: .env.local, Cloudflare secret), never
 * in the database or the browser; the card is typed on Stripe's own page.
 *
 * Every plan is a Stripe price found by its lookup key, made from the one plan
 * list (lib/site/plans.ts) by scripts/stripe-plans.ts, so a price can't drift
 * between bohdiai.com and what Stripe charges. Free is a $0 price: every maker,
 * Free included, has a subscription, and moving up is a plan change on it.
 */
import Stripe from 'stripe';
import { FREE_OFFER, plansFor } from '@/lib/site/plans';
import { FREE_PLAN, type AccountPlan } from '@/lib/backend/plan/plan';

export type Billing = 'monthly' | 'yearly';

/** One price in Stripe. */
export type StripePlan = { plan: AccountPlan; billing: Billing; name: string; cents: number; lookupKey: string };

/** Free is monthly at $0 whatever was picked: there is nothing to pay yearly. */
export function billingFor(plan: AccountPlan, billing: Billing): Billing {
  return plan === FREE_PLAN ? 'monthly' : billing;
}

export function lookupKey(plan: AccountPlan, billing: Billing): string {
  return `bohdiai_${plan}_${billingFor(plan, billing)}`;
}

/** Stripe's own id for a plan's product, so the script finds it again. */
export function productId(plan: AccountPlan): string {
  return `bohdiai_${plan}`;
}

/** Every price Stripe needs: Free, then each maker plan monthly and yearly. */
export function stripePlans(): StripePlan[] {
  const paid = plansFor('maker').flatMap((p) =>
    (['monthly', 'yearly'] as const).map((billing) => ({
      plan: p.tier,
      billing,
      name: p.name,
      cents: Math.round((billing === 'monthly' ? p.monthly : p.yearly) * 100),
      lookupKey: lookupKey(p.tier, billing),
    })),
  );
  return [{ plan: FREE_PLAN, billing: 'monthly', name: FREE_OFFER.name, cents: 0, lookupKey: lookupKey(FREE_PLAN, 'monthly') }, ...paid];
}

/** The Stripe client, talking to Stripe with fetch (it runs on Cloudflare). */
export function stripe(key: string | undefined = process.env['STRIPE_SECRET_KEY']): Stripe {
  if (key === undefined || key.trim() === '') throw new Error('STRIPE_SECRET_KEY is not set');
  return new Stripe(key, { httpClient: Stripe.createFetchHttpClient() });
}
