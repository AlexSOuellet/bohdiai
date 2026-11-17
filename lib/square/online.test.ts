import { describe, it, expect, vi, beforeEach } from 'vitest';
import { seal } from './vault';

/** A stand-in for a Supabase query: any chain of calls, awaited, gives the next
 *  queued result (or the default). Every call is recorded. */
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

const state = vi.hoisted(() => ({ queue: [] as unknown[], calls: [] as string[], rpc: [] as { data: unknown; error: unknown }[], sent: [] as Record<string, unknown>[], sendFails: false }));
const logger = vi.hoisted(() => ({ error: vi.fn(), warn: vi.fn() }));
vi.mock('@/lib/logger', () => ({ logger }));
vi.mock('@/lib/env', () => ({ serverEnv: () => ({ SITE_URL: 'https://bohdiai.com' }) }));
vi.mock('@/lib/resend', () => ({
  fromEmail: () => 'BohdiAI <hello@bohdiai.com>',
  resend: () => ({
    emails: {
      send: async (m: Record<string, unknown>) => {
        if (state.sendFails) throw new Error('mail down');
        state.sent.push(m);
        return { error: null };
      },
    },
  }),
}));

const fakeDb = () => ({
  from: (t: string) => {
    state.calls.push(`from(${t})`);
    return chain(() => state.queue.shift() ?? { data: null, error: null }, state.calls);
  },
  rpc: async (name: string, args: unknown) => {
    state.calls.push(`rpc(${name},${JSON.stringify(args)})`);
    return state.rpc.shift() ?? { data: null, error: null };
  },
});
const db = () => fakeDb() as never;

const { startSquareCheckout, confirmSquareOrder, squareOrderFor, shopForSquareOrder, orderMatches } = await import('./online');

const KEY = btoa(String.fromCharCode(...new Uint8Array(32).map((_, i) => i + 7)));
const config = { applicationId: 'app', applicationSecret: 'secret', tokenKey: KEY, sandbox: true };
const YEAR = 365 * 24 * 60 * 60 * 1000;
const OUR = '11111111-2222-3333-4444-555555555555';

async function connection(locationId: string | null = 'L1') {
  return {
    data: {
      merchant_id: 'M1',
      location_id: locationId,
      access_token_enc: await seal('ACCESS', KEY),
      refresh_token_enc: await seal('REFRESH', KEY),
      expires_at: new Date(Date.now() + YEAR).toISOString(),
    },
    error: null,
  };
}

/** Square, answering by address; every call is kept. */
function square(routes: Record<string, { status?: number; body: unknown }>) {
  const seen: { url: string; init: RequestInit }[] = [];
  const fetcher = vi.fn(async (url: string, init: RequestInit) => {
    seen.push({ url, init });
    const hit = Object.entries(routes).find(([part]) => url.includes(part));
    if (hit === undefined) return new Response('{}', { status: 500 });
    return new Response(JSON.stringify(hit[1].body), { status: hit[1].status ?? 200 });
  }) as unknown as typeof fetch;
  return { fetcher, seen };
}

const placed = {
  orderId: OUR,
  orderNumber: '1042',
  shopName: 'Juniper Ridge',
  contactEmail: 'maker@example.com',
  currency: 'USD',
  lines: [
    { listingId: 'a', variantId: null, name: 'Bowl', option: null, priceCents: 6800 },
    { listingId: 'b', variantId: null, name: 'Mugs', option: null, priceCents: 4200 },
  ],
  subtotalCents: 11000,
  discount: { label: 'SPRING10', cents: 1100 },
  totalCents: 9900,
};

const payment = { data: { order_id: OUR, status: 'pending', amount_cents: 9900, currency: 'USD' }, error: null };
const order = (status = 'pending', source = 'storefront') => ({
  data: {
    id: OUR,
    order_number: '1042',
    status,
    source,
    total_cents: 9900,
    customer_name: 'Robin',
    customer_email: 'robin@example.com',
    customer_phone: null,
    customer_note: null,
    discount_cents: 1100,
    discount_label: 'SPRING10',
  },
  error: null,
});
const sale = (over: Record<string, unknown> = {}) => ({
  order: {
    id: 'SQO',
    location_id: 'L1',
    state: 'OPEN',
    reference_id: OUR,
    total_money: { amount: 9900, currency: 'USD' },
    net_amount_due_money: { amount: 0, currency: 'USD' },
    tenders: [{ payment_id: 'P1', type: 'CARD', amount_money: { amount: 9900 } }],
    ...over,
  },
});
const paid = (over: Record<string, unknown> = {}) => ({ payment: { id: 'P1', status: 'COMPLETED', amount_money: { amount: 9900, currency: 'USD' }, order_id: 'SQO', location_id: 'L1', ...over } });
const shop = { data: { business_name: 'Juniper Ridge', contact_email: 'maker@example.com' }, error: null };
const items = { data: [{ name_snapshot: 'Bowl', unit_price_cents: 6800, quantity: 1 }, { name_snapshot: 'Mug', unit_price_cents: 2100, quantity: 2 }], error: null };

beforeEach(() => {
  state.queue = [];
  state.calls = [];
  state.rpc = [];
  state.sent = [];
  state.sendFails = false;
  logger.error.mockReset();
});

describe('startSquareCheckout', () => {
  it('has Square make a page for exactly this order, and saves the payment as waiting', async () => {
    state.queue.push(await connection());
    const sq = square({ 'payment-links': { body: { payment_link: { url: 'https://sandbox.square.link/u/x', order_id: 'SQO' }, related_resources: { orders: [{ id: 'SQO', total_money: { amount: 9900, currency: 'USD' } }] } } } });
    expect(await startSquareCheckout(db(), config, 't1', placed, 'robin@example.com', 'https://shop.bohdiai.com/cart?order=x', sq.fetcher)).toEqual({ ok: true, url: 'https://sandbox.square.link/u/x' });
    const sent = JSON.parse(String(sq.seen[0]?.init.body));
    expect(sq.seen[0]?.url).toBe('https://connect.squareupsandbox.com/v2/online-checkout/payment-links');
    expect((sq.seen[0]?.init.headers as Record<string, string>)['Authorization']).toBe('Bearer ACCESS');
    expect(sent).toMatchObject({
      idempotency_key: `checkout-${OUR}`,
      order: {
        location_id: 'L1',
        reference_id: OUR,
        line_items: [
          { name: 'Bowl', quantity: '1', base_price_money: { amount: 6800, currency: 'USD' } },
          { name: 'Mugs', quantity: '1', base_price_money: { amount: 4200, currency: 'USD' } },
        ],
        discounts: [{ name: 'SPRING10', amount_money: { amount: 1100, currency: 'USD' }, scope: 'ORDER' }],
      },
      checkout_options: { redirect_url: 'https://shop.bohdiai.com/cart?order=x', allow_tipping: false, ask_for_shipping_address: false },
      pre_populated_data: { buyer_email: 'robin@example.com' },
    });
    expect(state.calls.some((c) => c.startsWith('insert(') && c.includes('"processor":"square"') && c.includes('"external_payment_id":"SQO"') && c.includes('"status":"pending"') && c.includes('"amount_cents":9900'))).toBe(true);
  });

  it('makes no page when the shop isn’t connected or has no location', async () => {
    expect(await startSquareCheckout(db(), config, 't1', placed, '', 'u', square({}).fetcher)).toEqual({ ok: false, reason: 'not-connected' });
    state.queue.push(await connection(null));
    expect(await startSquareCheckout(db(), config, 't1', placed, '', 'u', square({}).fetcher)).toEqual({ ok: false, reason: 'not-connected' });
  });

  it('refuses a page whose total isn’t ours to the cent, and saves nothing', async () => {
    state.queue.push(await connection());
    const sq = square({ 'payment-links': { body: { payment_link: { url: 'https://x', order_id: 'SQO' }, related_resources: { orders: [{ id: 'SQO', total_money: { amount: 10890, currency: 'USD' } }] } } } });
    expect(await startSquareCheckout(db(), config, 't1', { ...placed, discount: null }, '', 'u', sq.fetcher)).toEqual({ ok: false, reason: 'mismatch' });
    expect(JSON.parse(String(sq.seen[0]?.init.body)).pre_populated_data).toBeUndefined();
    expect(state.calls.some((c) => c.startsWith('insert('))).toBe(false);
    expect(logger.error).toHaveBeenCalled();
  });

  it('throws when the waiting payment can’t be saved', async () => {
    state.queue.push(await connection(), { data: null, error: { message: 'down' } });
    const sq = square({ 'payment-links': { body: { payment_link: { url: 'https://x', order_id: 'SQO' }, related_resources: { orders: [{ id: 'SQO', total_money: { amount: 9900, currency: 'USD' } }] } } } });
    await expect(startSquareCheckout(db(), config, 't1', placed, '', 'u', sq.fetcher)).rejects.toThrow('down');
  });
});

describe('looking orders up', () => {
  it('finds the Square order behind one of the shop’s orders', async () => {
    state.queue.push({ data: { external_payment_id: 'SQO' }, error: null });
    expect(await squareOrderFor(db(), 't1', OUR)).toBe('SQO');
    expect(await squareOrderFor(db(), 't1', OUR)).toBeNull();
    state.queue.push({ data: null, error: { message: 'down' } });
    await expect(squareOrderFor(db(), 't1', OUR)).rejects.toThrow('down');
  });

  it('names the shop only when the notice’s Square business is the one it’s connected to', async () => {
    state.queue.push({ data: { tenant_id: 't1' }, error: null }, { data: { merchant_id: 'M1' }, error: null });
    expect(await shopForSquareOrder(db(), 'SQO', 'M1')).toBe('t1');
    state.queue.push({ data: { tenant_id: 't1' }, error: null }, { data: { merchant_id: 'M1' }, error: null });
    expect(await shopForSquareOrder(db(), 'SQO', 'SOMEONE-ELSE')).toBeNull();
    expect(await shopForSquareOrder(db(), 'SQO', 'M1')).toBeNull();
    state.queue.push({ data: null, error: { message: 'down' } });
    await expect(shopForSquareOrder(db(), 'SQO', 'M1')).rejects.toThrow('down');
    state.queue.push({ data: { tenant_id: 't1' }, error: null }, { data: null, error: { message: 'gone' } });
    await expect(shopForSquareOrder(db(), 'SQO', 'M1')).rejects.toThrow('gone');
  });
});

describe('orderMatches', () => {
  const s = { orderId: 'SQO', locationId: 'L1', state: 'OPEN', totalCents: 9900, currency: 'USD', payments: [], referenceId: OUR, dueCents: 0 };
  const e = { orderId: OUR, locationId: 'L1', cents: 9900, currency: 'usd' };
  it('needs our reference, total, currency and the maker’s location', () => {
    expect(orderMatches(s, e)).toBe(true);
    expect(orderMatches(s, { ...e, locationId: null })).toBe(true);
    expect(orderMatches({ ...s, referenceId: 'other' }, e)).toBe(false);
    expect(orderMatches({ ...s, totalCents: 9899 }, e)).toBe(false);
    expect(orderMatches({ ...s, currency: 'CAD' }, e)).toBe(false);
    expect(orderMatches({ ...s, locationId: 'L2' }, e)).toBe(false);
  });
});

describe('confirmSquareOrder', () => {
  async function ready(orderRow = order()) {
    state.queue.push(payment, orderRow, await connection());
  }

  it('records the order paid once Square says it’s paid in full, and tells the maker once', async () => {
    await ready();
    state.queue.push(shop, items);
    state.rpc.push({ data: true, error: null });
    const sq = square({ '/v2/orders/SQO': { body: sale() }, '/v2/payments/P1': { body: paid() } });
    expect(await confirmSquareOrder(db(), config, 't1', 'SQO', sq.fetcher)).toEqual({ kind: 'paid', orderNumber: '1042' });
    expect(state.calls.find((c) => c.startsWith('rpc(record_online_payment'))).toContain('"p_amount_cents":9900');
    expect(state.sent).toHaveLength(1);
    expect(state.sent[0]).toMatchObject({ to: 'maker@example.com', replyTo: 'robin@example.com', subject: 'Paid order 1042 on Juniper Ridge' });
    expect(String(state.sent[0]?.['text'])).toContain('Mug × 2: $42');
    expect(String(state.sent[0]?.['text'])).toContain('https://app.bohdiai.com/manage/orders');
  });

  it('records nothing new and emails no one the second time', async () => {
    await ready();
    state.rpc.push({ data: false, error: null });
    const sq = square({ '/v2/orders/SQO': { body: sale() }, '/v2/payments/P1': { body: paid() } });
    expect(await confirmSquareOrder(db(), config, 't1', 'SQO', sq.fetcher)).toEqual({ kind: 'paid', orderNumber: '1042' });
    expect(state.sent).toHaveLength(0);
  });

  it('answers from the record once it’s settled, without asking Square', async () => {
    const sq = square({});
    state.queue.push({ data: { ...payment.data, status: 'succeeded' }, error: null }, order('paid'));
    expect(await confirmSquareOrder(db(), config, 't1', 'SQO', sq.fetcher)).toEqual({ kind: 'paid', orderNumber: '1042' });
    state.queue.push({ data: { ...payment.data, status: 'succeeded' }, error: null }, order('refunded'));
    expect(await confirmSquareOrder(db(), config, 't1', 'SQO', sq.fetcher)).toEqual({ kind: 'sold', orderNumber: '1042' });
    state.queue.push(payment, order('canceled'));
    expect(await confirmSquareOrder(db(), config, 't1', 'SQO', sq.fetcher)).toEqual({ kind: 'failed', orderNumber: '1042' });
    expect(sq.fetcher).not.toHaveBeenCalled();
  });

  it('leaves alone anything that isn’t one of the online shop’s orders', async () => {
    expect(await confirmSquareOrder(db(), config, 't1', 'SQO', square({}).fetcher)).toEqual({ kind: 'unknown' });
    state.queue.push(payment, order('paid', 'market_mode'));
    expect(await confirmSquareOrder(db(), config, 't1', 'SQO', square({}).fetcher)).toEqual({ kind: 'unknown' });
    state.queue.push(payment, { data: null, error: null });
    expect(await confirmSquareOrder(db(), config, 't1', 'SQO', square({}).fetcher)).toEqual({ kind: 'unknown' });
  });

  it('keeps waiting while Square hasn’t got it paid yet', async () => {
    const cases: Record<string, { status?: number; body: unknown }>[] = [
      { '/v2/orders/SQO': { status: 404, body: { errors: [{ code: 'NOT_FOUND' }] } } },
      { '/v2/orders/SQO': { body: sale({ net_amount_due_money: { amount: 9900 }, tenders: [] }) } },
      { '/v2/orders/SQO': { body: sale({ tenders: [] }) } },
      { '/v2/orders/SQO': { body: sale({ tenders: [{ payment_id: 'P1', type: 'CARD' }, { id: 'C', type: 'CASH' }] }) } },
      { '/v2/orders/SQO': { body: sale() }, '/v2/payments/P1': { body: paid({ status: 'APPROVED' }) } },
      { '/v2/orders/SQO': { body: sale() }, '/v2/payments/P1': { status: 404, body: {} } },
      { '/v2/orders/SQO': { body: sale() }, '/v2/payments/P1': { body: paid({ order_id: 'OTHER' }) } },
    ];
    for (const routes of cases) {
      await ready();
      expect(await confirmSquareOrder(db(), config, 't1', 'SQO', square(routes).fetcher)).toEqual({ kind: 'waiting', orderNumber: '1042' });
    }
    expect(state.calls.some((c) => c.startsWith('rpc('))).toBe(false);
  });

  it('waits when the shop isn’t connected any more', async () => {
    state.queue.push(payment, order());
    expect(await confirmSquareOrder(db(), config, 't1', 'SQO', square({}).fetcher)).toEqual({ kind: 'waiting', orderNumber: '1042' });
    expect(logger.error).toHaveBeenCalled();
  });

  it('records nothing when Square’s order isn’t ours, was canceled, or doesn’t add up', async () => {
    const cases: Record<string, { status?: number; body: unknown }>[] = [
      { '/v2/orders/SQO': { body: sale({ reference_id: 'someone-else' }) } },
      { '/v2/orders/SQO': { body: sale({ location_id: 'L9' }) } },
      { '/v2/orders/SQO': { body: sale({ state: 'CANCELED' }) } },
      { '/v2/orders/SQO': { body: sale() }, '/v2/payments/P1': { body: paid({ amount_money: { amount: 100, currency: 'USD' } }) } },
    ];
    for (const routes of cases) {
      await ready();
      expect(await confirmSquareOrder(db(), config, 't1', 'SQO', square(routes).fetcher)).toEqual({ kind: 'failed', orderNumber: '1042' });
    }
    expect(state.calls.some((c) => c.startsWith('rpc('))).toBe(false);
  });

  it('gives the money back through Square when the piece had sold, records it, and tells the maker', async () => {
    await ready();
    state.queue.push(shop, items);
    state.rpc.push({ data: null, error: { code: 'P0028', message: 'sold' } }, { data: true, error: null });
    const sq = square({ '/v2/orders/SQO': { body: sale() }, '/v2/payments/P1': { body: paid() }, '/v2/refunds': { body: { refund: { id: 'R1', status: 'PENDING' } } } });
    expect(await confirmSquareOrder(db(), config, 't1', 'SQO', sq.fetcher)).toEqual({ kind: 'sold', orderNumber: '1042' });
    const refund = sq.seen.find((s) => s.url.endsWith('/v2/refunds'));
    expect(JSON.parse(String(refund?.init.body))).toMatchObject({ idempotency_key: `sold-0-${OUR}`, payment_id: 'P1', amount_money: { amount: 9900, currency: 'USD' } });
    expect(state.calls.find((c) => c.startsWith('rpc(record_online_sold'))).toContain('"square_refund_ids":["R1"]');
    expect(state.sent).toHaveLength(1);
    expect(state.sent[0]).toMatchObject({ subject: 'Order 1042 was refunded: it had already sold' });
  });

  it('leaves it waiting to try again, and tells Alex, when Square won’t give the money back', async () => {
    await ready();
    state.rpc.push({ data: null, error: { code: 'P0028', message: 'sold' } });
    const sq = square({ '/v2/orders/SQO': { body: sale() }, '/v2/payments/P1': { body: paid() }, '/v2/refunds': { body: { refund: { id: 'R1', status: 'REJECTED' } } } });
    expect(await confirmSquareOrder(db(), config, 't1', 'SQO', sq.fetcher)).toEqual({ kind: 'sold', orderNumber: '1042' });
    expect(state.calls.some((c) => c.startsWith('rpc(record_online_sold'))).toBe(false);
    expect(state.sent[0]).toMatchObject({ to: 'alex@bohdiai.com', subject: 'A Square refund needs a look' });
  });

  it('throws on a database failure, so Square’s notice comes again', async () => {
    await ready();
    state.rpc.push({ data: null, error: { code: 'XX000', message: 'down' } });
    const routes = { '/v2/orders/SQO': { body: sale() }, '/v2/payments/P1': { body: paid() } };
    await expect(confirmSquareOrder(db(), config, 't1', 'SQO', square(routes).fetcher)).rejects.toThrow('down');
    await ready();
    state.rpc.push({ data: null, error: { code: 'P0028', message: 'sold' } }, { data: null, error: { code: 'XX000', message: 'gone' } });
    await expect(confirmSquareOrder(db(), config, 't1', 'SQO', square({ ...routes, '/v2/refunds': { body: { refund: { id: 'R1', status: 'COMPLETED' } } } }).fetcher)).rejects.toThrow('gone');
    state.queue.push({ data: null, error: { message: 'no payments' } });
    await expect(confirmSquareOrder(db(), config, 't1', 'SQO', square({}).fetcher)).rejects.toThrow('no payments');
    state.queue.push(payment, { data: null, error: { message: 'no orders' } });
    await expect(confirmSquareOrder(db(), config, 't1', 'SQO', square({}).fetcher)).rejects.toThrow('no orders');
  });

  it('keeps the order recorded when the maker’s email fails, and skips a shop with no email', async () => {
    await ready();
    state.queue.push(shop, items);
    state.rpc.push({ data: true, error: null });
    state.sendFails = true;
    const routes = { '/v2/orders/SQO': { body: sale() }, '/v2/payments/P1': { body: paid() } };
    expect(await confirmSquareOrder(db(), config, 't1', 'SQO', square(routes).fetcher)).toEqual({ kind: 'paid', orderNumber: '1042' });
    expect(logger.error).toHaveBeenCalled();
    state.sendFails = false;
    await ready();
    state.queue.push({ data: { business_name: 'J', contact_email: null }, error: null });
    state.rpc.push({ data: true, error: null });
    expect(await confirmSquareOrder(db(), config, 't1', 'SQO', square(routes).fetcher)).toEqual({ kind: 'paid', orderNumber: '1042' });
    expect(state.sent).toHaveLength(0);
  });
});
