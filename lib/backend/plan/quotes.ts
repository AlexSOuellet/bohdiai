/**
 * The checkout's amounts for a site Stripe bills, from Stripe itself (Alex, Session
 * 121): what an upgrade charges today, on monthly and on yearly, with the credit for
 * the unused part and any discount the maker has already worked in. Stripe charges
 * exactly what this shows.
 */
import { stripe } from '@/lib/billing/stripe';
import { findPrice, previewNow, quoteFromPreview } from '@/lib/billing/plan-change';
import type { Billing, UpgradeQuote } from './billing';
import type { SitePlan } from './plan';
import type { PlanState } from './queries';

export async function upgradeQuotes(stripeId: string, state: Pick<PlanState, 'plan' | 'billing' | 'renewsOn' | 'today'>, to: SitePlan): Promise<Record<Billing, UpgradeQuote>> {
  const s = stripe();
  const quote = async (billing: Billing): Promise<UpgradeQuote> => {
    const price = await findPrice(s, to, billing);
    const preview = await previewNow(s, stripeId, price);
    return quoteFromPreview(preview, { from: state.plan, fromBilling: state.billing, billing, priceCents: price.unit_amount ?? 0, renewsOn: state.renewsOn, today: state.today });
  };
  const [monthly, yearly] = await Promise.all([quote('monthly'), quote('yearly')]);
  return { monthly, yearly };
}
