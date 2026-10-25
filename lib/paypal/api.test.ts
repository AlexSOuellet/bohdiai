import { describe, it, expect, vi } from 'vitest';
import {
  actingFor,
  capturePayPalOrder,
  centsOf,
  createPayPalOrder,
  merchantFor,
  merchantStatus,
  partnerToken,
  PayPalError,
  paypalAmount,
  refundCapture,
  signUpLink,
} from './api';
import { paypalBase, paypalConfig } from './config';

const config = { clientId: 'client', clientSecret: 'secret', partnerMerchantId: 'PARTNER', sandbox: true, attributionId: null };

type Call = [string, RequestInit];
function answer(status: number, body: unknown): typeof fetch & { mock: { calls: Call[] } } {
  return vi.fn(async () => new Response(body === '' ? '' : JSON.stringify(body), { status })) as unknown as typeof fetch & { mock: { calls: Call[] } };
}
const sent = (f: { mock: { calls: Call[] } }, i = 0): Call => f.mock.calls[i] ?? ['', {}];
const header = (init: RequestInit, name: string): string | undefined => (init.headers as Record<string, string>)[name];

describe('paypalConfig', () => {
  const env = { PAYPAL_CLIENT_ID: 'c', PAYPAL_CLIENT_SECRET: 's', PAYPAL_PARTNER_MERCHANT_ID: 'P', PAYPAL_ENV: 'sandbox' };
  it('needs every setting and a known mode', () => {
    expect(paypalConfig(env)).toEqual({ clientId: 'c', clientSecret: 's', partnerMerchantId: 'P', sandbox: true, attributionId: null });
    expect(paypalConfig({ ...env, PAYPAL_ENV: 'live', PAYPAL_ATTRIBUTION_ID: 'BN' })).toEqual({ clientId: 'c', clientSecret: 's', partnerMerchantId: 'P', sandbox: false, attributionId: 'BN' });
    expect(paypalConfig({ ...env, PAYPAL_ENV: 'production' })).toBeNull();
    expect(paypalConfig({ ...env, PAYPAL_PARTNER_MERCHANT_ID: undefined })).toBeNull();
  });
  it('uses PayPal’s test copy while testing', () => {
    expect(paypalBase({ sandbox: true })).toBe('https://api-m.sandbox.paypal.com');
    expect(paypalBase({ sandbox: false })).toBe('https://api-m.paypal.com');
  });
});

describe('partnerToken', () => {
  it('asks for a key with BohdiAI’s own app details, sent only to PayPal', async () => {
    const f = answer(200, { access_token: 'T' });
    expect(await partnerToken(config, f)).toBe('T');
    const [url, init] = sent(f);
    expect(url).toBe('https://api-m.sandbox.paypal.com/v1/oauth2/token');
    expect(header(init, 'Authorization')).toBe(`Basic ${btoa('client:secret')}`);
    expect(init.body).toBe('grant_type=client_credentials');
  });
  it('fails without a key', async () => {
    await expect(partnerToken(config, answer(200, {}))).rejects.toBeInstanceOf(PayPalError);
  });
  it('keeps PayPal’s error name, never its body', async () => {
    await expect(partnerToken(config, answer(401, { error: 'invalid_client', error_description: 'secret echoed' }))).rejects.toThrow('PayPal 401 invalid_client');
    await expect(partnerToken(config, answer(400, { name: 'INVALID_REQUEST', details: [{ issue: 'MISSING' }, {}] }))).rejects.toThrow('PayPal 400 INVALID_REQUEST,MISSING');
    const plain = vi.fn(async () => new Response('not json', { status: 500 })) as unknown as typeof fetch;
    await expect(partnerToken(config, plain)).rejects.toThrow('PayPal 500');
  });
});

describe('signUpLink', () => {
  it('asks PayPal for its sign-up page with only payments and refunds, and the way back', async () => {
    const f = answer(201, { links: [{ rel: 'self', href: 'x' }, { rel: 'action_url', href: 'https://paypal.com/signup' }] });
    expect(await signUpLink(config, 'T', 'site.code', 'https://app.example.com/api/paypal/return', f)).toBe('https://paypal.com/signup');
    const body = JSON.parse(String(sent(f)[1].body)) as Record<string, unknown>;
    expect(body).toMatchObject({ tracking_id: 'site.code', products: ['PPCP'], partner_config_override: { return_url: 'https://app.example.com/api/paypal/return' } });
    expect(JSON.stringify(body['operations'])).toContain('"features":["PAYMENT","REFUND"]');
  });
  it('fails without a sign-up link', async () => {
    await expect(signUpLink(config, 'T', 'x', 'y', answer(201, { links: [] }))).rejects.toThrow('no sign-up link');
  });
  it('names BohdiAI’s partner code once PayPal gives one', async () => {
    const f = answer(201, { links: [{ rel: 'action_url', href: 'h' }] });
    await signUpLink({ ...config, attributionId: 'BN' }, 'T', 'x', 'y', f);
    expect(header(sent(f)[1], 'PayPal-Partner-Attribution-Id')).toBe('BN');
  });
});

describe('merchantFor', () => {
  it('finds the account that finished the sign-up', async () => {
    const f = answer(200, { merchant_id: 'M1' });
    expect(await merchantFor(config, 'T', 'site.code', f)).toBe('M1');
    expect(sent(f)[0]).toBe('https://api-m.sandbox.paypal.com/v1/customer/partners/PARTNER/merchant-integrations?tracking_id=site.code');
  });
  it('is null when nobody finished it', async () => {
    expect(await merchantFor(config, 'T', 'x', answer(404, {}))).toBeNull();
    expect(await merchantFor(config, 'T', 'x', answer(200, {}))).toBeNull();
  });
  it('passes other failures on', async () => {
    await expect(merchantFor(config, 'T', 'x', answer(500, {}))).rejects.toBeInstanceOf(PayPalError);
  });
});

describe('merchantStatus', () => {
  it('reads what PayPal says about the account', async () => {
    const f = answer(200, {
      merchant_id: 'M1',
      primary_email: 'renee@example.com',
      payments_receivable: true,
      primary_email_confirmed: true,
      oauth_integrations: [{ oauth_third_party: [{ partner_client_id: 'client', scopes: [] }] }],
      capabilities: [{ name: 'CUSTOM_CARD_PROCESSING', status: 'ACTIVE' }],
    });
    expect(await merchantStatus(config, 'T', 'M1', f)).toEqual({ merchantId: 'M1', email: 'renee@example.com', paymentsReceivable: true, emailConfirmed: true, permissionsGranted: true, cardsApproved: true });
  });
  it('treats anything PayPal leaves out as not yet', async () => {
    expect(await merchantStatus(config, 'T', 'M1', answer(200, { oauth_integrations: [{ oauth_third_party: [{ partner_client_id: 'someone-else' }] }, {}] }))).toEqual({
      merchantId: 'M1',
      email: '',
      paymentsReceivable: false,
      emailConfirmed: false,
      permissionsGranted: false,
      cardsApproved: false,
    });
  });
});

describe('money', () => {
  it('writes and reads PayPal amounts', () => {
    expect(paypalAmount(600)).toBe('6.00');
    expect(paypalAmount(843)).toBe('8.43');
    expect(centsOf('8.43')).toBe(843);
    expect(centsOf('6')).toBe(600);
    expect(centsOf('6.5')).toBe(650);
    expect(centsOf(undefined)).toBeNull();
    expect(centsOf('-1.00')).toBeNull();
    expect(centsOf('1e3')).toBeNull();
  });
});

describe('orders', () => {
  const order = { id: 'o1', invoiceId: 'rustic-charm-1001', totalCents: 600, currency: 'USD', merchantId: 'M1', description: 'Rustic Charm & More order 1001' };
  it('creates a payment of exactly the total into her account, once per order', async () => {
    const f = answer(201, { id: 'PP1' });
    expect(await createPayPalOrder(config, 'T', order, f)).toBe('PP1');
    const [url, init] = sent(f);
    expect(url).toBe('https://api-m.sandbox.paypal.com/v2/checkout/orders');
    expect(header(init, 'PayPal-Request-Id')).toBe('create-o1');
    expect(JSON.parse(String(init.body))).toMatchObject({
      intent: 'CAPTURE',
      purchase_units: [{ custom_id: 'o1', invoice_id: 'rustic-charm-1001', amount: { currency_code: 'USD', value: '6.00' }, payee: { merchant_id: 'M1' } }],
    });
  });
  it('fails without PayPal’s order', async () => {
    await expect(createPayPalOrder(config, 'T', order, answer(201, {}))).rejects.toThrow('no order');
  });
  it('captures and reads back what PayPal took', async () => {
    const f = answer(201, {
      id: 'PP1',
      status: 'COMPLETED',
      purchase_units: [{ payee: { merchant_id: 'M1' }, payments: { captures: [{ id: 'CAP1', status: 'COMPLETED', custom_id: 'o1', amount: { value: '6.00', currency_code: 'USD' } }] } }],
    });
    expect(await capturePayPalOrder(config, 'T', 'PP1', f)).toEqual({ orderId: 'PP1', status: 'COMPLETED', captureId: 'CAP1', captureStatus: 'COMPLETED', cents: 600, currency: 'USD', customId: 'o1', payee: 'M1' });
    expect(header(sent(f)[1], 'PayPal-Request-Id')).toBe('capture-PP1');
  });
  it('reads an empty capture as nothing taken', async () => {
    expect(await capturePayPalOrder(config, 'T', 'PP1', answer(201, {}))).toEqual({ orderId: '', status: '', captureId: '', captureStatus: '', cents: null, currency: '', customId: '', payee: '' });
    expect((await capturePayPalOrder(config, 'T', 'PP1', answer(201, { purchase_units: [{ custom_id: 'o2' }] }))).customId).toBe('o2');
  });
});

describe('refunds', () => {
  it('acts for her account with PayPal’s unsigned note', () => {
    const [head, body, sig] = actingFor(config, 'M1').split('.');
    const read = (s: string | undefined): unknown => JSON.parse(atob((s ?? '').replace(/-/g, '+').replace(/_/g, '/')));
    expect(read(head)).toEqual({ alg: 'none' });
    expect(read(body)).toEqual({ iss: 'client', payer_id: 'M1' });
    expect(sig).toBe('');
  });
  it('gives the whole payment back from her account, once', async () => {
    const f = answer(201, { id: 'R1', status: 'COMPLETED' });
    expect(await refundCapture(config, 'T', 'CAP1', 'M1', f)).toBe('R1');
    const [url, init] = sent(f);
    expect(url).toBe('https://api-m.sandbox.paypal.com/v2/payments/captures/CAP1/refund');
    expect(header(init, 'PayPal-Auth-Assertion')).toBe(actingFor(config, 'M1'));
    expect(header(init, 'PayPal-Request-Id')).toBe('refund-CAP1');
    expect(await refundCapture(config, 'T', 'CAP1', 'M1', answer(201, { id: 'R2', status: 'PENDING' }))).toBe('R2');
  });
  it('fails when PayPal didn’t give it back', async () => {
    await expect(refundCapture(config, 'T', 'CAP1', 'M1', answer(201, { id: 'R1', status: 'FAILED' }))).rejects.toThrow('refund FAILED');
    await expect(refundCapture(config, 'T', 'CAP1', 'M1', answer(201, {}))).rejects.toThrow('refund unknown');
  });
  it('reads an empty answer as nothing back', async () => {
    await expect(refundCapture(config, 'T', 'CAP1', 'M1', answer(200, ''))).rejects.toBeInstanceOf(PayPalError);
  });
});
