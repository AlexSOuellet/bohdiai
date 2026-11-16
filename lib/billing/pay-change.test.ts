import { describe, it, expect, vi } from 'vitest';
import { PAY_MIN_CENTS, finishPayPage, startPayPage } from './pay-change';

const price = (id: string, cents: number) => ({
  id,
  unit_amount: cents,
  lookup_key: 'bohdiai_lite_monthly',
  recurring: { interval: 'month' },
});

function fake(
  opts: { due?: number; session?: Record<string, unknown>; subMeta?: Record<string, string> } = {},
) {
  const sub = {
    id: 'sub_1',
    customer: 'cus_1',
    metadata: opts.subMeta ?? {},
    schedule: null,
    discounts: [],
    items: { data: [{ id: 'si_1', price: price('price_show', 500), current_period_end: 2000 }] },
  };
  const calls: Array<[string, unknown, unknown?]> = [];
  const s = {
    prices: { list: vi.fn(async () => ({ data: [price('price_market', 1500)] })) },
    invoices: {
      createPreview: vi.fn(async (p: unknown) => {
        calls.push(['preview', p]);
        return { amount_due: opts.due ?? 470 };
      }),
    },
    subscriptions: {
      retrieve: vi.fn(async () => sub),
      update: vi.fn(async (_id: string, p: unknown, o?: unknown) => {
        calls.push(['update', p, o]);
        return { ...sub, items: { data: [{ ...sub.items.data[0], current_period_end: 2600000 }] } };
      }),
    },
    subscriptionSchedules: { release: vi.fn() },
    customers: {
      update: vi.fn(async (_id: string, p: unknown) => {
        calls.push(['customer', p]);
        return {};
      }),
      createBalanceTransaction: vi.fn(async (_id: string, p: unknown, o?: unknown) => {
        calls.push(['credit', p, o]);
        return {};
      }),
    },
    checkout: {
      sessions: {
        create: vi.fn(async (p: unknown) => {
          calls.push(['session', p]);
          return { url: 'https://checkout.stripe.com/c/pay/cs_test_1' };
        }),
        retrieve: vi.fn(async () => opts.session ?? paidSession()),
      },
    },
  };
  return { s: s as never, calls };
}

const META = {
  tenant_id: 't1',
  purpose: 'plan-pay',
  plan: 'lite',
  billing: 'monthly',
  kind: 'upgrade',
  sub: 'sub_1',
  at: '1700000000',
  cents: '470',
};
function paidSession(over: Record<string, unknown> = {}) {
  return {
    id: 'cs_1',
    mode: 'payment',
    status: 'complete',
    payment_status: 'paid',
    client_reference_id: 't1',
    customer: 'cus_1',
    amount_total: 470,
    metadata: META,
    payment_intent: { payment_method: 'pm_new' },
    ...over,
  };
}
const input = {
  stripeId: 'sub_1',
  customerId: 'cus_1',
  tenantId: 't1',
  pay: { plan: 'lite' as const, billing: 'monthly' as const, kind: 'upgrade' as const },
  label: 'Market plan, for the rest of this month',
  doneUrl: 'https://app/done?s={CHECKOUT_SESSION_ID}',
  backUrl: 'https://app/back',
};

describe('startPayPage (Alex, 2026-11-16: a maker picks the card, on Stripe’s own page)', () => {
  it('opens Stripe’s payment page for exactly what Stripe says the change costs today', async () => {
    const { s, calls } = fake();
    expect(await startPayPage(s, input)).toEqual({
      kind: 'page',
      url: 'https://checkout.stripe.com/c/pay/cs_test_1',
    });
    const preview = calls.find((c) => c[0] === 'preview')?.[1] as {
      subscription_details: { proration_date: number };
    };
    const session = calls.find((c) => c[0] === 'session')?.[1] as Record<string, unknown>;
    expect(session).toMatchObject({
      mode: 'payment',
      customer: 'cus_1',
      client_reference_id: 't1',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: 470,
            product_data: { name: 'Market plan, for the rest of this month' },
          },
        },
      ],
      payment_intent_data: { setup_future_usage: 'off_session' },
      success_url: input.doneUrl,
      cancel_url: input.backUrl,
    });
    // The card on file is offered, and a new one can be used instead.
    expect(session['saved_payment_method_options']).toEqual({
      allow_redisplay_filters: ['always', 'limited', 'unspecified'],
    });
    expect(session['metadata']).toMatchObject({
      purpose: 'plan-pay',
      plan: 'lite',
      billing: 'monthly',
      kind: 'upgrade',
      sub: 'sub_1',
      cents: '470',
      at: String(preview.subscription_details.proration_date),
    });
    expect(calls.some((c) => c[0] === 'update')).toBe(false);
  });
  it('sends no page for an amount too small for a card payment', async () => {
    const { s, calls } = fake({ due: PAY_MIN_CENTS - 1 });
    expect(await startPayPage(s, input)).toEqual({ kind: 'small', cents: 49 });
    expect(calls.some((c) => c[0] === 'session')).toBe(false);
  });
});

describe('finishPayPage', () => {
  it('only once Stripe says it’s paid: the card becomes the one on file, the payment is credited, then the plan changes at the quoted moment', async () => {
    const { s, calls } = fake();
    const r = await finishPayPage(s, 'cs_1', 't1', 'sub_1');
    expect(r).toMatchObject({
      ok: true,
      already: false,
      pay: { plan: 'lite', billing: 'monthly', kind: 'upgrade' },
    });
    expect(calls.find((c) => c[0] === 'customer')?.[1]).toEqual({
      invoice_settings: { default_payment_method: 'pm_new' },
    });
    expect(calls.find((c) => c[0] === 'credit')).toEqual([
      'credit',
      expect.objectContaining({ amount: -470, currency: 'usd' }),
      { idempotencyKey: 'plan-pay-credit-cs_1' },
    ]);
    const update = calls.find((c) => c[0] === 'update');
    expect(update?.[1]).toMatchObject({
      proration_behavior: 'always_invoice',
      proration_date: 1700000000,
      default_payment_method: 'pm_new',
      metadata: { plan: 'lite', billing: 'monthly', paid_change: 'cs_1' },
    });
    expect(update?.[2]).toEqual({ idempotencyKey: 'plan-pay-change-cs_1' });
    // The credit comes before the change, so Stripe's own charge for it is covered.
    expect(calls.findIndex((c) => c[0] === 'credit')).toBeLessThan(
      calls.findIndex((c) => c[0] === 'update'),
    );
  });
  it('does nothing twice when the maker comes back to the page again', async () => {
    const { s, calls } = fake({ subMeta: { paid_change: 'cs_1' } });
    expect(await finishPayPage(s, 'cs_1', 't1', 'sub_1')).toMatchObject({
      ok: true,
      already: true,
    });
    expect(calls.some((c) => c[0] === 'credit' || c[0] === 'update')).toBe(false);
  });
  it.each([
    ['not paid', { payment_status: 'unpaid' }, 'unpaid'],
    ['not finished', { status: 'open' }, 'unpaid'],
    ['another site’s payment', { client_reference_id: 't2' }, 'mismatch'],
    ['another subscription', { metadata: { ...META, sub: 'sub_9' } }, 'mismatch'],
    ['a different amount', { amount_total: 100 }, 'mismatch'],
    ['not a plan payment', { metadata: { ...META, purpose: 'card' } }, 'mismatch'],
    ['a card page, not a payment', { mode: 'setup' }, 'mismatch'],
  ])('changes nothing for %s', async (_what, over, why) => {
    const { s, calls } = fake({ session: paidSession(over) });
    expect(await finishPayPage(s, 'cs_1', 't1', 'sub_1')).toEqual({ ok: false, why });
    expect(calls.some((c) => c[0] === 'credit' || c[0] === 'update' || c[0] === 'customer')).toBe(
      false,
    );
  });
});
