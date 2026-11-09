import { describe, it, expect, vi } from 'vitest';
import type Stripe from 'stripe';
import { cardOnFile, finishCardPage, nextCharge, pastCharges, startCardPage } from './card';

const visa = { card: { brand: 'visa', last4: '4242', exp_month: 3, exp_year: 2029 } };

function fake(over: Record<string, unknown> = {}) {
  const s = {
    subscriptions: { retrieve: vi.fn(async () => ({ default_payment_method: null, customer: { invoice_settings: { default_payment_method: null } } })), update: vi.fn(async () => ({})) },
    customers: { update: vi.fn(async () => ({})) },
    invoices: { list: vi.fn(async () => ({ data: [] })), createPreview: vi.fn(async () => ({ amount_due: 1500, next_payment_attempt: 1800000000, period_end: 1700000000 })) },
    checkout: { sessions: { create: vi.fn(async () => ({ url: 'https://checkout.stripe.com/c/cs_card' })), retrieve: vi.fn() } },
    ...over,
  };
  return { s: s as unknown as Stripe, raw: s };
}

describe('cardOnFile', () => {
  it('reads the subscription’s own card first', async () => {
    const { s, raw } = fake();
    raw.subscriptions.retrieve.mockResolvedValueOnce({ default_payment_method: visa, customer: 'cus_1' } as never);
    expect(await cardOnFile(s, 'sub_1')).toEqual({ brand: 'visa', last4: '4242', expMonth: 3, expYear: 2029 });
    expect(raw.subscriptions.retrieve).toHaveBeenCalledWith('sub_1', { expand: ['default_payment_method', 'customer.invoice_settings.default_payment_method'] });
  });
  it('then the customer’s default card', async () => {
    const { s, raw } = fake();
    raw.subscriptions.retrieve.mockResolvedValueOnce({ default_payment_method: null, customer: { invoice_settings: { default_payment_method: visa } } } as never);
    expect(await cardOnFile(s, 'sub_1')).toMatchObject({ last4: '4242' });
  });
  it('none when there isn’t one, or it isn’t a card, or the customer is gone', async () => {
    const { s, raw } = fake();
    expect(await cardOnFile(s, 'sub_1')).toBeNull();
    raw.subscriptions.retrieve.mockResolvedValueOnce({ default_payment_method: 'pm_1', customer: 'cus_1' } as never);
    expect(await cardOnFile(s, 'sub_1')).toBeNull();
    raw.subscriptions.retrieve.mockResolvedValueOnce({ default_payment_method: { type: 'us_bank_account' }, customer: { deleted: true } } as never);
    expect(await cardOnFile(s, 'sub_1')).toBeNull();
  });
});

describe('pastCharges', () => {
  it('lists what was actually paid, newest first as Stripe gives it, with receipts', async () => {
    const { s, raw } = fake();
    raw.invoices.list.mockResolvedValueOnce({
      data: [
        { id: 'in_2', amount_paid: 2500, currency: 'usd', created: 20, status_transitions: { paid_at: 21 }, hosted_invoice_url: 'https://invoice.stripe.com/i/2' },
        { id: 'in_1', amount_paid: 1500, currency: 'usd', created: 10, status_transitions: { paid_at: null }, hosted_invoice_url: null },
        { id: 'in_0', amount_paid: 0, currency: 'usd', created: 5, status_transitions: { paid_at: 5 } },
      ],
    } as never);
    expect(await pastCharges(s, 'cus_1')).toEqual([
      { id: 'in_2', on: 21, cents: 2500, currency: 'usd', receiptUrl: 'https://invoice.stripe.com/i/2' },
      { id: 'in_1', on: 10, cents: 1500, currency: 'usd', receiptUrl: null },
    ]);
    expect(raw.invoices.list).toHaveBeenCalledWith({ customer: 'cus_1', status: 'paid', limit: 24 });
  });
});

describe('startCardPage', () => {
  it('opens Stripe’s page to put a card on, for this site, and remembers a move to make after', async () => {
    const { s, raw } = fake();
    expect(await startCardPage(s, { customerId: 'cus_1', tenantId: 't1', doneUrl: 'https://app/done?session={CHECKOUT_SESSION_ID}', backUrl: 'https://app/billing', then: { plan: 'showcase', billing: 'monthly' } })).toBe('https://checkout.stripe.com/c/cs_card');
    expect(raw.checkout.sessions.create).toHaveBeenCalledWith({
      mode: 'setup',
      currency: 'usd',
      customer: 'cus_1',
      client_reference_id: 't1',
      metadata: { tenant_id: 't1', purpose: 'card', then_plan: 'showcase', then_billing: 'monthly' },
      success_url: 'https://app/done?session={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://app/billing',
    });
  });
  it('says so when Stripe gives no page', async () => {
    const { s, raw } = fake();
    raw.checkout.sessions.create.mockResolvedValueOnce({ url: null } as never);
    await expect(startCardPage(s, { customerId: 'cus_1', tenantId: 't1', doneUrl: 'd', backUrl: 'b' })).rejects.toThrow('Stripe gave no card page');
    expect(raw.checkout.sessions.create).toHaveBeenCalledWith(expect.objectContaining({ metadata: { tenant_id: 't1', purpose: 'card' } }));
  });
});

describe('finishCardPage', () => {
  const done = (over: Record<string, unknown> = {}) => ({ mode: 'setup', status: 'complete', client_reference_id: 't1', customer: 'cus_1', setup_intent: { payment_method: 'pm_new' }, metadata: { purpose: 'card' }, ...over });

  it('makes the new card the one Stripe charges, for the customer and the subscription', async () => {
    const { s, raw } = fake();
    raw.checkout.sessions.retrieve.mockResolvedValueOnce(done());
    expect(await finishCardPage(s, 'cs_1', 't1', 'sub_1')).toEqual({ ok: true, then: null });
    expect(raw.checkout.sessions.retrieve).toHaveBeenCalledWith('cs_1', { expand: ['setup_intent'] });
    expect(raw.customers.update).toHaveBeenCalledWith('cus_1', { invoice_settings: { default_payment_method: 'pm_new' } });
    expect(raw.subscriptions.update).toHaveBeenCalledWith('sub_1', { default_payment_method: 'pm_new' });
  });
  it('hands back the move to make after, and reads expanded ids', async () => {
    const { s, raw } = fake();
    raw.checkout.sessions.retrieve.mockResolvedValueOnce(done({ customer: { id: 'cus_2' }, setup_intent: { payment_method: { id: 'pm_2' } }, metadata: { then_plan: 'lite', then_billing: 'yearly' } }));
    expect(await finishCardPage(s, 'cs_1', 't1', 'sub_1')).toEqual({ ok: true, then: { plan: 'lite', billing: 'yearly' } });
    expect(raw.customers.update).toHaveBeenCalledWith('cus_2', expect.anything());
  });
  it('only a finished card page for this same site counts', async () => {
    for (const over of [{ mode: 'subscription' }, { status: 'open' }, { client_reference_id: 'other' }, { setup_intent: 'seti_1' }, { setup_intent: null }, { setup_intent: { payment_method: null } }, { customer: null }, { metadata: null }]) {
      const { s, raw } = fake();
      raw.checkout.sessions.retrieve.mockResolvedValueOnce(done(over));
      const r = await finishCardPage(s, 'cs_1', 't1', 'sub_1');
      if ('metadata' in over) {
        expect(r).toEqual({ ok: true, then: null });
      } else {
        expect(r).toEqual({ ok: false });
        expect(raw.customers.update).not.toHaveBeenCalled();
      }
    }
  });
});

describe('nextCharge', () => {
  it('Stripe’s own next bill, discount and credit worked in', async () => {
    const { s, raw } = fake();
    raw.subscriptions.retrieve.mockResolvedValueOnce({ customer: 'cus_1', status: 'active', cancel_at_period_end: false } as never);
    expect(await nextCharge(s, 'sub_1')).toEqual({ cents: 1500, on: 1800000000 });
    expect(raw.invoices.createPreview).toHaveBeenCalledWith({ customer: 'cus_1', subscription: 'sub_1' });
    raw.subscriptions.retrieve.mockResolvedValueOnce({ customer: { id: 'cus_1' }, status: 'active', cancel_at_period_end: false } as never);
    raw.invoices.createPreview.mockResolvedValueOnce({ amount_due: 0, next_payment_attempt: null, period_end: 1700000000 } as never);
    expect(await nextCharge(s, 'sub_1')).toEqual({ cents: 0, on: 1700000000 });
  });
  it('nothing coming once it’s cancelled, or with no customer', async () => {
    const { s, raw } = fake();
    raw.subscriptions.retrieve.mockResolvedValueOnce({ customer: 'cus_1', status: 'active', cancel_at_period_end: true } as never);
    expect(await nextCharge(s, 'sub_1')).toBeNull();
    raw.subscriptions.retrieve.mockResolvedValueOnce({ customer: 'cus_1', status: 'canceled', cancel_at_period_end: false } as never);
    expect(await nextCharge(s, 'sub_1')).toBeNull();
    raw.subscriptions.retrieve.mockResolvedValueOnce({ customer: null, status: 'active', cancel_at_period_end: false } as never);
    expect(await nextCharge(s, 'sub_1')).toBeNull();
  });
});
