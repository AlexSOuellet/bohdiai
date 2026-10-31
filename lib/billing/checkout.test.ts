import { describe, it, expect, vi } from 'vitest';
import type Stripe from 'stripe';
import { startCheckout, type CheckoutInput } from './checkout';

function fakeStripe(prices: { id: string }[], url: string | null = 'https://checkout.stripe.com/c/cs_1') {
  const list = vi.fn(async () => ({ data: prices }));
  const create = vi.fn(async () => ({ url }));
  return { s: { prices: { list }, checkout: { sessions: { create } } } as unknown as Stripe, list, create };
}

const input: CheckoutInput = {
  tenantId: 't1',
  email: 'lena@example.com',
  plan: 'full',
  billing: 'yearly',
  paidUrl: 'https://bohdiai.com/start/paid?session={CHECKOUT_SESSION_ID}',
  backUrl: 'https://bohdiai.com/start?plan=maker-full&billing=yearly&back=1',
};

describe('startCheckout', () => {
  it('opens Stripe’s page for the plan’s price, naming the site', async () => {
    const { s, list, create } = fakeStripe([{ id: 'price_full_year' }]);
    expect(await startCheckout(s, input)).toBe('https://checkout.stripe.com/c/cs_1');
    expect(list).toHaveBeenCalledWith({ lookup_keys: ['bohdiai_full_yearly'], active: true, limit: 1 });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'subscription',
        line_items: [{ price: 'price_full_year', quantity: 1 }],
        customer_email: 'lena@example.com',
        client_reference_id: 't1',
        metadata: { tenant_id: 't1', plan: 'full', billing: 'yearly' },
        subscription_data: { metadata: { tenant_id: 't1', plan: 'full', billing: 'yearly' } },
        payment_method_collection: 'if_required',
        success_url: input.paidUrl,
        cancel_url: input.backUrl,
      }),
    );
  });

  it('asks Stripe for no card on Free', async () => {
    const { s, list, create } = fakeStripe([{ id: 'price_free' }]);
    await startCheckout(s, { ...input, plan: 'free' });
    expect(list).toHaveBeenCalledWith(expect.objectContaining({ lookup_keys: ['bohdiai_free_monthly'] }));
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ payment_method_collection: 'if_required', metadata: expect.objectContaining({ billing: 'monthly' }) }));
  });

  it('fails loudly when Stripe has no such price', async () => {
    const { s } = fakeStripe([]);
    await expect(startCheckout(s, input)).rejects.toThrow(/no price bohdiai_full_yearly/);
  });

  it('fails loudly when Stripe gives no page', async () => {
    const { s } = fakeStripe([{ id: 'p' }], null);
    await expect(startCheckout(s, input)).rejects.toThrow(/no checkout page/);
  });
});
