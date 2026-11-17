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

const s = vi.hoisted(() => ({
  queue: [] as unknown[],
  calls: [] as string[],
  configured: true,
  key: { token: 'T', merchantId: 'M1', locationId: 'L1' } as unknown,
  refund: vi.fn(),
  refundFails: false,
}));
const fakeDb = () => ({
  from: (t: string) => {
    s.calls.push(`from(${t})`);
    return chain(() => s.queue.shift() ?? { data: null, error: null }, s.calls);
  },
  rpc: async (name: string) => {
    s.calls.push(`rpc(${name})`);
    return { error: null };
  },
});
vi.mock('@/lib/backend/current-site', () => ({ requireActingSite: async () => ({ user: { id: 'u1' }, site: { tenantId: 't1' } }) }));
vi.mock('@/lib/backend/site-features', () => ({ getSiteFeatures: async () => new Set(['cart']) }));
vi.mock('@/lib/supabase', () => ({ supabaseAdmin: () => fakeDb() }));
vi.mock('@/lib/supabase-server', () => ({ createSupabaseServerClient: async () => fakeDb() }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn() } }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/paypal/config', () => ({ paypalConfig: () => null }));
vi.mock('@/lib/square/config', () => ({ squareConfig: () => (s.configured ? { applicationId: 'a', applicationSecret: 'b', tokenKey: 'k', sandbox: true } : null) }));
vi.mock('@/lib/square/connection', () => ({ liveKey: async () => s.key }));
vi.mock('@/lib/square/api', () => ({
  refundPayment: async (...a: unknown[]) => {
    s.refund(...a);
    if (s.refundFails) throw new Error('Square 402');
    return 'R1';
  },
}));

const { setOrderStatus } = await import('./actions');

const none = { data: null, error: null };
const charge = (meta: unknown = { square_order_id: 'SQO', online: true, square_payment_ids: ['P1'] }) => ({ data: { amount_cents: 9900, currency: 'USD', metadata: meta, orders: { source: 'storefront' } }, error: null });

beforeEach(() => {
  s.queue = [];
  s.calls = [];
  s.configured = true;
  s.key = { token: 'T', merchantId: 'M1', locationId: 'L1' };
  s.refund.mockReset();
  s.refundFails = false;
});

describe('refunding an order paid online through Square', () => {
  it('gives the money back through Square first, once, then records the refund', async () => {
    s.queue.push(none, charge());
    expect(await setOrderStatus('o1', 'refunded')).toEqual({ ok: true });
    expect(s.refund.mock.calls[0]?.[2]).toEqual({ paymentId: 'P1', cents: 9900, currency: 'USD', key: 'refund-o1', reason: 'Refunded by the shop' });
    expect(s.calls.some((c) => c.includes('"square_refund_ids":["R1"]'))).toBe(true);
    expect(s.calls).toContain('rpc(set_order_status)');
  });

  it('doesn’t give it back twice, and leaves a market sale or an unpaid one alone', async () => {
    s.queue.push(none, charge({ square_payment_ids: ['P1'], square_refund_ids: ['R1'] }));
    expect(await setOrderStatus('o1', 'refunded')).toEqual({ ok: true });
    s.queue.push(none, none);
    expect(await setOrderStatus('o1', 'refunded')).toEqual({ ok: true });
    expect(s.refund).not.toHaveBeenCalled();
  });

  it('changes nothing when Square won’t give it back, and says what to do', async () => {
    s.refundFails = true;
    s.queue.push(none, charge());
    expect(await setOrderStatus('o1', 'refunded')).toMatchObject({ ok: false, error: expect.stringContaining('refund it in your Square') });
    s.queue.push(none, charge({ square_payment_ids: ['P1', 'P2'] }));
    expect(await setOrderStatus('o1', 'refunded')).toMatchObject({ ok: false, error: expect.stringContaining('paid in parts') });
    s.queue.push(none, charge({}));
    expect(await setOrderStatus('o1', 'refunded')).toMatchObject({ ok: false });
    s.key = null;
    s.queue.push(none, charge());
    expect(await setOrderStatus('o1', 'refunded')).toMatchObject({ ok: false, error: expect.stringContaining('isn’t connected') });
    s.configured = false;
    s.queue.push(none, charge());
    expect(await setOrderStatus('o1', 'refunded')).toMatchObject({ ok: false });
    s.queue.push(none, { data: null, error: { message: 'down' } });
    expect(await setOrderStatus('o1', 'refunded')).toMatchObject({ ok: false, error: expect.stringContaining('couldn’t be started') });
    expect(s.calls).not.toContain('rpc(set_order_status)');
  });
});
