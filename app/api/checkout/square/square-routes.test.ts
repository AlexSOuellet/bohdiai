// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type * as Notices from '@/lib/square/notices';

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
  config: { applicationId: 'app', applicationSecret: 'secret', tokenKey: 'k', sandbox: true } as unknown,
  notices: { signatureKey: 'sig', url: 'https://bohdiai.com/api/square/webhook' } as unknown,
  placed: null as unknown,
  started: null as unknown,
  startThrows: false,
  start: vi.fn(),
  limited: null as Response | null,
  signed: true,
  shop: 't1' as string | null,
  outcome: { kind: 'paid', orderNumber: '1001' } as unknown,
  confirmThrows: false,
  confirm: vi.fn(),
}));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));
vi.mock('@/lib/forms/rate-limit', () => ({ formLimitResponse: async () => s.limited }));
vi.mock('@/lib/buyers/session', () => ({ signedInBuyerProfile: async () => null }));
vi.mock('@/lib/square/config', () => ({ squareConfig: () => s.config, squareNotices: () => s.notices }));
vi.mock('@/lib/storefront/place-order', () => ({ placeCartOrder: async () => s.placed }));
vi.mock('@/lib/square/notices', async (real) => ({ ...(await real<typeof Notices>()), fromSquare: async () => s.signed }));
vi.mock('@/lib/square/online', () => ({
  startSquareCheckout: async (...a: unknown[]) => {
    s.start(...a);
    if (s.startThrows) throw new Error('square down');
    return s.started;
  },
  shopForSquareOrder: async () => s.shop,
  confirmSquareOrder: async (...a: unknown[]) => {
    s.confirm(...a);
    if (s.confirmThrows) throw new Error('db down');
    return s.outcome;
  },
}));
vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: () => ({
    from: (t: string) => {
      s.calls.push(`from(${t})`);
      return chain(() => s.queue.shift() ?? { data: null, error: null }, s.calls);
    },
  }),
}));

const create = (await import('./create/route')).POST;
const webhook = (await import('../../square/webhook/route')).POST;

function request(body: unknown, tenant: string | null = TENANT): Request {
  const headers = new Headers({ 'Content-Type': 'application/json', host: 'rustic-charm.bohdiai.com', 'x-forwarded-proto': 'https' });
  if (tenant !== null) headers.set('x-tenant-id', tenant);
  return new Request('https://rustic-charm.bohdiai.com/api/checkout/square/create', { method: 'POST', headers, body: typeof body === 'string' ? body : JSON.stringify(body) });
}
const good = { name: 'Pat', email: 'pat@example.com', phone: '', note: '', listingIds: [A] };
const placedOrder = { orderId: 'o1', orderNumber: '1001', shopName: 'Rustic Charm & More', contactEmail: 'm@example.com', currency: 'USD', lines: [], subtotalCents: 600, discount: null, totalCents: 600 };
const connected = { data: { location_id: 'L1' }, error: null };

beforeEach(() => {
  s.queue = [];
  s.calls = [];
  s.config = { applicationId: 'app', applicationSecret: 'secret', tokenKey: 'k', sandbox: true };
  s.notices = { signatureKey: 'sig', url: 'https://bohdiai.com/api/square/webhook' };
  s.placed = { ok: true, order: placedOrder };
  s.started = { ok: true, url: 'https://sandbox.square.link/u/x' };
  s.startThrows = false;
  s.start.mockReset();
  s.limited = null;
  s.signed = true;
  s.shop = 't1';
  s.outcome = { kind: 'paid', orderNumber: '1001' };
  s.confirmThrows = false;
  s.confirm.mockReset();
});

describe('paying through Square: the checkout page', () => {
  it('saves the order and answers with Square’s page, coming back to this shop’s cart', async () => {
    s.queue.push(connected);
    const res = await create(request(good));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, url: 'https://sandbox.square.link/u/x' });
    const [, , tenantId, order, email, back] = s.start.mock.calls[0] as unknown[];
    expect(tenantId).toBe(TENANT);
    expect(order).toEqual(placedOrder);
    expect(email).toBe('pat@example.com');
    expect(back).toBe('https://rustic-charm.bohdiai.com/cart?order=o1');
  });

  it('turns away a rate-limited, unknown, unreadable, spam or incomplete request', async () => {
    s.limited = new Response('{}', { status: 429 });
    expect((await create(request(good))).status).toBe(429);
    s.limited = null;
    expect((await create(request(good, null))).status).toBe(404);
    expect((await create(request('not json'))).status).toBe(400);
    expect((await create(request({ ...good, company: 'spam' }))).status).toBe(400);
    expect((await create(request({ ...good, email: 'nope' }))).status).toBe(400);
    expect(s.start).not.toHaveBeenCalled();
  });

  it('says the shop isn’t taking cards when Square isn’t set up or connected', async () => {
    s.config = null;
    expect((await create(request(good))).status).toBe(409);
    s.config = { applicationId: 'app', applicationSecret: 'secret', tokenKey: 'k', sandbox: true };
    expect((await create(request(good))).status).toBe(409);
    s.queue.push({ data: { location_id: null }, error: null });
    expect((await create(request(good))).status).toBe(409);
    s.queue.push({ data: null, error: { message: 'down' } });
    expect((await create(request(good))).status).toBe(500);
  });

  it('passes on why the order couldn’t be placed', async () => {
    s.queue.push(connected);
    s.placed = { ok: false, refusal: { status: 409, error: 'No longer available: Bowl.', unavailable: ['Bowl'] } };
    const res = await create(request(good));
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: 'No longer available: Bowl.', unavailable: ['Bowl'] });
    s.queue.push(connected);
    s.placed = { ok: false, refusal: { status: 404, error: 'Shop not found.' } };
    expect(await (await create(request(good))).json()).toEqual({ error: 'Shop not found.' });
  });

  it('won’t take a card for under a dollar', async () => {
    s.queue.push(connected);
    s.placed = { ok: true, order: { ...placedOrder, totalCents: 99 } };
    expect((await create(request(good))).status).toBe(409);
    expect(s.start).not.toHaveBeenCalled();
  });

  it('cancels the order when Square made no page, so it never waits on the maker', async () => {
    s.queue.push(connected);
    s.started = { ok: false, reason: 'mismatch' };
    expect((await create(request(good))).status).toBe(409);
    expect(s.calls.some((c) => c.includes('"status":"canceled"'))).toBe(true);
    s.calls = [];
    s.queue.push(connected);
    s.startThrows = true;
    expect((await create(request(good))).status).toBe(500);
    expect(s.calls.some((c) => c.includes('"status":"canceled"'))).toBe(true);
    s.calls = [];
    s.queue.push(connected, { data: null, error: null }, { data: null, error: { message: 'cancel failed' } });
    s.startThrows = false;
    expect((await create(request(good))).status).toBe(409);
  });
});

describe('Square’s notice', () => {
  const event = JSON.stringify({ type: 'payment.updated', merchant_id: 'M1', data: { object: { payment: { status: 'COMPLETED', order_id: 'SQO' } } } });
  const notice = (body: string) => new Request('https://bohdiai.com/api/square/webhook', { method: 'POST', headers: { 'x-square-hmacsha256-signature': 'sig' }, body });

  it('checks the order with Square once it’s signed by Square', async () => {
    const res = await webhook(notice(event));
    expect(res.status).toBe(200);
    expect(s.confirm.mock.calls[0]?.slice(2)).toEqual(['t1', 'SQO']);
  });

  it('turns away a notice not signed by Square, or when notices aren’t set up', async () => {
    s.signed = false;
    expect((await webhook(notice(event))).status).toBe(401);
    s.notices = null;
    expect((await webhook(notice(event))).status).toBe(503);
    expect(s.confirm).not.toHaveBeenCalled();
  });

  it('answers OK and leaves alone anything that isn’t one of the shop’s orders', async () => {
    expect((await webhook(notice('{"type":"refund.updated"}'))).status).toBe(200);
    s.shop = null;
    expect((await webhook(notice(event))).status).toBe(200);
    expect(s.confirm).not.toHaveBeenCalled();
  });

  it('asks Square to send it again while it isn’t confirmed, or when something failed', async () => {
    s.outcome = { kind: 'waiting', orderNumber: '1001' };
    expect((await webhook(notice(event))).status).toBe(503);
    s.confirmThrows = true;
    expect((await webhook(notice(event))).status).toBe(500);
  });
});
