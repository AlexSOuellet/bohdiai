/**
 * Stripe's own checkout page for a site's plan (Alex, Session 119). The card is
 * typed on Stripe's page, never ours. Free is a $0 subscription and Stripe asks
 * for no card. The site is named on the session (client_reference_id and on the
 * subscription), so Stripe's notice says which site was paid for.
 */
import type Stripe from 'stripe';
import type { AccountPlan } from '@/lib/backend/plan/plan';
import { billingFor, lookupKey, type Billing } from './stripe';

export type CheckoutInput = {
  tenantId: string;
  email: string;
  plan: AccountPlan;
  billing: Billing;
  /** Where Stripe sends them once paid: Stripe fills in {CHECKOUT_SESSION_ID}. */
  paidUrl: string;
  /** Where Stripe's back button goes. */
  backUrl: string;
};

/** The page to send the maker to. */
export async function startCheckout(s: Stripe, input: CheckoutInput): Promise<string> {
  const key = lookupKey(input.plan, input.billing);
  const prices = await s.prices.list({ lookup_keys: [key], active: true, limit: 1 });
  const price = prices.data[0];
  if (price === undefined) throw new Error(`Stripe has no price ${key}: run scripts/stripe-plans.ts`);
  const metadata = { tenant_id: input.tenantId, plan: input.plan, billing: billingFor(input.plan, input.billing) };
  const session = await s.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: price.id, quantity: 1 }],
    customer_email: input.email,
    client_reference_id: input.tenantId,
    metadata,
    subscription_data: { metadata },
    payment_method_collection: 'if_required',
    success_url: input.paidUrl,
    cancel_url: input.backUrl,
  });
  if (session.url === null) throw new Error('Stripe gave no checkout page');
  return session.url;
}
