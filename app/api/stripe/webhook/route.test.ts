// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Stripe from 'stripe';

const claim = vi.fn();
const letGo = vi.fn();
const recordCheckout = vi.fn();
const recordSubscription = vi.fn();
const touched = vi.fn();
const confirmSite = vi.fn();

vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));
vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: () => {
    touched();
    return {};
  },
}));
vi.mock('@/lib/billing/record', () => ({
  claim: (...a: unknown[]) => claim(...a),
  letGo: (...a: unknown[]) => letGo(...a),
  recordCheckout: (...a: unknown[]) => recordCheckout(...a),
  recordSubscription: (...a: unknown[]) => recordSubscription(...a),
}));

vi.mock('@/lib/signup/after-paid', () => ({ confirmSite: (...a: unknown[]) => confirmSite(...a) }));

import { POST } from './route';

const SECRET = 'whsec_test_secret';
const real = new Stripe('sk_test_x', { httpClient: Stripe.createFetchHttpClient() });

async function notice(event: Record<string, unknown>, secret = SECRET): Promise<Request> {
  const payload = JSON.stringify(event);
  const header = await real.webhooks.generateTestHeaderStringAsync({ payload, secret, cryptoProvider: Stripe.createSubtleCryptoProvider() });
  return new Request('https://bohdiai.com/api/stripe/webhook', { method: 'POST', body: payload, headers: { 'stripe-signature': header } });
}

const completed = { id: 'evt_1', object: 'event', type: 'checkout.session.completed', data: { object: { id: 'cs_1', object: 'checkout.session', mode: 'subscription' } } };

describe('POST /api/stripe/webhook', () => {
  beforeEach(() => {
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', SECRET);
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_x');
    for (const f of [claim, letGo, recordCheckout, recordSubscription, touched, confirmSite]) f.mockReset();
    claim.mockResolvedValue(true);
    recordCheckout.mockResolvedValue({ paid: true, tenantId: 't1', email: 'a@b.co', first: true });
    confirmSite.mockResolvedValue(undefined);
  });
  afterEach(() => vi.unstubAllEnvs());

  it('records a paid checkout from a notice Stripe signed', async () => {
    const res = await POST(await notice(completed));
    expect(res.status).toBe(200);
    expect(claim).toHaveBeenCalledWith({}, 'evt_1', 'checkout.session.completed');
    expect(recordCheckout).toHaveBeenCalledWith(expect.anything(), {}, 'cs_1');
    expect(confirmSite).toHaveBeenCalledWith({}, 't1');
  });

  it('sends the confirmation email only if it recorded the payment first', async () => {
    recordCheckout.mockResolvedValue({ paid: true, tenantId: 't1', email: 'a@b.co', first: false });
    await POST(await notice(completed));
    expect(confirmSite).not.toHaveBeenCalled();
  });

  it('keeps the payment recorded when only the email fails', async () => {
    confirmSite.mockRejectedValue(new Error('resend down'));
    const res = await POST(await notice(completed));
    expect(res.status).toBe(200);
    expect(letGo).not.toHaveBeenCalled();
  });

  it('turns away a notice not signed with our secret, before the database', async () => {
    const res = await POST(await notice(completed, 'whsec_someone_else'));
    expect(res.status).toBe(400);
    expect(touched).not.toHaveBeenCalled();
    expect(recordCheckout).not.toHaveBeenCalled();
  });

  it('turns away a notice with no signature', async () => {
    const res = await POST(new Request('https://bohdiai.com/api/stripe/webhook', { method: 'POST', body: JSON.stringify(completed) }));
    expect(res.status).toBe(400);
    expect(touched).not.toHaveBeenCalled();
  });

  it('acts on a notice once', async () => {
    claim.mockResolvedValue(false);
    const res = await POST(await notice(completed));
    expect(res.status).toBe(200);
    expect(recordCheckout).not.toHaveBeenCalled();
  });

  it('follows subscription changes', async () => {
    const sub = { id: 'sub_1', object: 'subscription' };
    await POST(await notice({ id: 'evt_2', object: 'event', type: 'customer.subscription.updated', data: { object: sub } }));
    expect(recordSubscription).toHaveBeenCalledWith({}, sub);
  });

  it('lets the notice go and answers 500 when recording fails, so Stripe sends it again', async () => {
    recordCheckout.mockRejectedValue(new Error('db down'));
    const res = await POST(await notice(completed));
    expect(res.status).toBe(500);
    expect(letGo).toHaveBeenCalledWith({}, 'evt_1');
  });

  it('is closed when the secret isn’t set', async () => {
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', '');
    const res = await POST(await notice(completed));
    expect(res.status).toBe(503);
    expect(touched).not.toHaveBeenCalled();
  });
});
