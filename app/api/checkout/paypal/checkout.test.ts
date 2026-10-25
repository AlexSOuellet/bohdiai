// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

function chain(next: () => unknown, calls: string[]): unknown {
  const p: unknown = new Proxy(() => undefined, {
    get(_t, prop) {
      if (prop === 'then') return (ok: (v: unknown) => unknown, bad: (e: unknown) => unknown) => Promise.resolve(next()).then(ok, bad);
      return (...args: unknown[]) => {
        calls.push(`${String(prop)}(${args.map((a) => JSON.stringify(a)).join(',')})`);
        return p;
      };
    },
  });
  return p;
}

const TENANT = '4b8f0f5e-8f3a-4a57-9a8e-1f2d3c4b5a69';
const A = '00000000-0000-4000-8000-000000000001';
const s = vi.hoisted(() => ({
  queue: [] as unknown[],
  calls: [] as string[],
  rpc: [] as { data: unknown; error: unknown }[],
  config: { clientId: 'client', clientSecret: 'secret', partnerMerchantId: 'P', sandbox: true, attributionId: null } as unknown,
  merchant: 'M1' as string | null,
  placed: null as unknown,
  capture: null as unknown,
  send: vi.fn(),
  created: vi.fn(),
  limited: null as Response | null,
}));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));
vi.mock('@/lib/forms/rate-limit', () => ({ formLimitResponse: async () => s.limited }));
vi.mock('@/lib/resend', () => ({ resend: () => ({ emails: { send: s.send } }), fromEmail: () => 'BohdiAI <site@example.com>' }));
vi.mock('@/lib/paypal/config', () => ({ paypalConfig: () => s.config }));
vi.mock('@/lib/paypal/connection', () => ({ paidInto: async () => s.merchant }));
vi.mock('@/lib/storefront/place-order', () => ({ placeCartOrder: async () => s.placed }));
vi.mock('@/lib/paypal/api', () => ({
  partnerToken: async () => 'T',
  createPayPalOrder: async (...a: unknown[]) => {
    s.created(...a);
    return 'PP1';
  },
  capturePayPalOrder: async () => s.capture,
}));
vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: () => ({
    from: (t: string) => {
      s.calls.push(`from(${t})`);
      return chain(() => s.queue.shift() ?? { data: null, error: null }, s.calls);
    },
    rpc: async (name: string, args: unknown) => {
      s.calls.push(`rpc(${name},${JSON.stringify(args)})`);
      return s.rpc.shift() ?? { data: null, error: null };
    },
  }),
}));

const create = (await import('./create/route')).POST;
const capture = (await import('./capture/route')).POST;

function request(path: string, body: unknown, tenant: string | null = TENANT): Request {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (tenant !== null) headers.set('x-tenant-id', tenant);
  return new Request(`https://rustic-charm.bohdiai.com${path}`, { method: 'POST', headers, body: typeof body === 'string' ? body : JSON.stringify(body) });
}
const good = { name: 'Pat', email: 'pat@example.com', phone: '', note: '', listingIds: [A] };
const placedOrder = { orderId: 'o1', orderNumber: '1001', shopName: 'Rustic Charm & More', contactEmail: 'alex@bohdiai.com', currency: 'USD', lines: [], subtotalCents: 600, discount: null, totalCents: 600 };
const completed = { orderId: 'PP1', status: 'COMPLETED', captureId: 'CAP1', captureStatus: 'COMPLETED', cents: 600, currency: 'USD', customId: 'o1', payee: 'M1' };

beforeEach(() => {
  s.queue = [];
  s.calls = [];
  s.rpc = [];
  s.config = { clientId: 'client', clientSecret: 'secret', partnerMerchantId: 'P', sandbox: true, attributionId: null };
  s.merchant = 'M1';
  s.placed = { ok: true, order: placedOrder };
  s.capture = completed;
  s.send.mockReset().mockResolvedValue({ data: { id: 'e1' }, error: null });
  s.created.mockReset();
  s.limited = null;
});

describe('paying with PayPal, step one: create', () => {
  it('saves the order, then asks PayPal for exactly its total into her account, and keeps a pending record', async () => {
    s.queue.push({ data: { subdomain: 'rustic-charm' }, error: null }, { data: null, error: null });
    const res = await create(request('/api/checkout/paypal/create', good));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, paypalOrderId: 'PP1' });
    expect(s.created).toHaveBeenCalledWith(s.config, 'T', expect.objectContaining({ id: 'o1', invoiceId: 'rustic-charm-1001', totalCents: 600, currency: 'USD', merchantId: 'M1' }));
    expect(s.calls.join(' ')).toContain('"status":"pending"');
    expect(s.calls.join(' ')).toContain('"external_payment_id":"PP1"');
  });

  it('turns away the spam trap, bad input and a missing shop before PayPal', async () => {
    expect((await create(request('/api/checkout/paypal/create', { ...good, company: 'x' }))).status).toBe(400);
    expect((await create(request('/api/checkout/paypal/create', { ...good, email: 'nope' }))).status).toBe(400);
    expect((await create(request('/api/checkout/paypal/create', 'not json'))).status).toBe(400);
    expect((await create(request('/api/checkout/paypal/create', good, null))).status).toBe(404);
    expect(s.created).not.toHaveBeenCalled();
  });

  it('passes the rate limit’s answer through', async () => {
    s.limited = new Response('{}', { status: 429 });
    expect((await create(request('/api/checkout/paypal/create', good))).status).toBe(429);
  });

  it('says so when the shop isn’t taking PayPal', async () => {
    s.merchant = null;
    expect((await create(request('/api/checkout/paypal/create', good))).status).toBe(409);
    s.config = null;
    expect((await create(request('/api/checkout/paypal/create', good))).status).toBe(409);
  });

  it('passes on why the order couldn’t be placed', async () => {
    s.placed = { ok: false, refusal: { status: 409, error: 'No longer available: x.', unavailable: [A] } };
    const res = await create(request('/api/checkout/paypal/create', good));
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: 'No longer available: x.', unavailable: [A] });
    s.placed = { ok: false, refusal: { status: 404, error: 'Shop not found.' } };
    expect(await (await create(request('/api/checkout/paypal/create', good))).json()).toEqual({ error: 'Shop not found.' });
  });

  it('never asks PayPal to take nothing', async () => {
    s.placed = { ok: true, order: { ...placedOrder, totalCents: 0 } };
    expect((await create(request('/api/checkout/paypal/create', good))).status).toBe(409);
    expect(s.created).not.toHaveBeenCalled();
  });

  it('fails safely when the pending record can’t be kept', async () => {
    s.queue.push({ data: null, error: null }, { data: null, error: { message: 'down' } });
    const res = await create(request('/api/checkout/paypal/create', good));
    expect(res.status).toBe(500);
    expect(s.created).toHaveBeenCalledWith(s.config, 'T', expect.objectContaining({ invoiceId: 'shop-1001' }));
  });
});

describe('paying with PayPal, step two: capture', () => {
  const pending = { data: { order_id: 'o1', status: 'pending', amount_cents: 600, currency: 'USD' }, error: null };
  const order = { data: { order_number: '1001', customer_name: 'Pat', customer_email: 'pat@example.com', customer_phone: null, customer_note: null, subtotal_cents: 600, discount_cents: 0, discount_label: null }, error: null };
  const shop = { data: { business_name: 'Rustic Charm & More', contact_email: 'alex@bohdiai.com' }, error: null };
  const items = { data: [{ listing_id: A, listing_variant_id: null, name_snapshot: 'Skinny Snowman bundle', unit_price_cents: 600 }], error: null };

  it('records the order paid once PayPal confirms it, and emails the maker it’s paid', async () => {
    s.queue.push(pending, order, shop, items);
    const res = await capture(request('/api/checkout/paypal/capture', { paypalOrderId: 'PP1' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, orderNumber: '1001' });
    expect(s.calls.join(' ')).toContain('rpc(record_online_payment,{"p_tenant_id":"4b8f0f5e-8f3a-4a57-9a8e-1f2d3c4b5a69","p_order_id":"o1","p_processor":"paypal","p_external_id":"PP1","p_amount_cents":600,"p_currency":"USD","p_metadata":{"capture_id":"CAP1"}}');
    const mail = s.send.mock.calls[0]?.[0] as { subject: string; text: string };
    expect(mail.subject).toContain('New paid order #1001');
    expect(mail.text).toContain('Paid in full with PayPal');
  });

  it('records nothing when PayPal’s answer doesn’t match', async () => {
    s.capture = { ...completed, cents: 1 };
    s.queue.push(pending, order);
    const res = await capture(request('/api/checkout/paypal/capture', { paypalOrderId: 'PP1' }));
    expect(res.status).toBe(402);
    expect(s.calls.join(' ')).not.toContain('record_online_payment');
  });

  it('answers a second time with the same order, recording nothing again', async () => {
    s.queue.push({ data: { ...pending.data, status: 'succeeded' }, error: null }, order);
    expect(await (await capture(request('/api/checkout/paypal/capture', { paypalOrderId: 'PP1' }))).json()).toEqual({ ok: true, orderNumber: '1001' });
    expect(s.calls.join(' ')).not.toContain('record_online_payment');
  });

  it('refuses a payment that isn’t this shop’s, bad input, and a shop not taking PayPal', async () => {
    s.queue.push({ data: null, error: null });
    expect((await capture(request('/api/checkout/paypal/capture', { paypalOrderId: 'PP9' }))).status).toBe(404);
    expect((await capture(request('/api/checkout/paypal/capture', {}))).status).toBe(400);
    expect((await capture(request('/api/checkout/paypal/capture', { paypalOrderId: 'PP1' }, null))).status).toBe(404);
    s.queue.push(pending, order);
    s.merchant = null;
    expect((await capture(request('/api/checkout/paypal/capture', { paypalOrderId: 'PP1' }))).status).toBe(409);
    s.config = null;
    expect((await capture(request('/api/checkout/paypal/capture', { paypalOrderId: 'PP1' }))).status).toBe(409);
  });

  it('passes the rate limit’s answer through', async () => {
    s.limited = new Response('{}', { status: 429 });
    expect((await capture(request('/api/checkout/paypal/capture', { paypalOrderId: 'PP1' }))).status).toBe(429);
  });

  it('keeps the paid order when the email fails, and when the shop has no email', async () => {
    s.send.mockResolvedValue({ data: null, error: { message: 'nope' } });
    s.queue.push(pending, { data: { ...order.data, discount_cents: 100, discount_label: 'Five off' }, error: null }, shop, { data: null, error: null });
    expect((await capture(request('/api/checkout/paypal/capture', { paypalOrderId: 'PP1' }))).status).toBe(200);
    s.send.mockRejectedValue(new Error('down'));
    s.queue.push(pending, order, shop, items);
    expect((await capture(request('/api/checkout/paypal/capture', { paypalOrderId: 'PP1' }))).status).toBe(200);
    s.send.mockReset();
    s.queue.push(pending, order, { data: { business_name: 'x', contact_email: null }, error: null }, items);
    expect((await capture(request('/api/checkout/paypal/capture', { paypalOrderId: 'PP1' }))).status).toBe(200);
    expect(s.send).not.toHaveBeenCalled();
  });

  it('fails safely, telling the buyer the shop will see a real payment', async () => {
    s.queue.push({ data: null, error: { message: 'down' } });
    const res = await capture(request('/api/checkout/paypal/capture', { paypalOrderId: 'PP1' }));
    expect(res.status).toBe(500);
    expect(((await res.json()) as { error: string }).error).toContain('the shop will see it');
    s.queue.push(pending, { data: null, error: { message: 'down' } });
    expect((await capture(request('/api/checkout/paypal/capture', { paypalOrderId: 'PP1' }))).status).toBe(500);
    s.queue.push(pending, order);
    s.rpc.push({ data: null, error: { message: 'amount mismatch' } });
    expect((await capture(request('/api/checkout/paypal/capture', { paypalOrderId: 'PP1' }))).status).toBe(500);
  });
});
