import { describe, it, expect, vi, beforeEach } from 'vitest';
import type * as Connection from '@/lib/paypal/connection';

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
  features: new Set<string>(['cart']),
  configured: true,
  queue: [] as unknown[],
  calls: [] as string[],
  status: null as unknown,
  statusFails: false,
  dropFails: false,
  rpcError: null as unknown,
  refund: vi.fn(),
}));
const conn = vi.hoisted(() => ({ saveConnection: vi.fn(), dropConnection: vi.fn() }));
const revalidatePath = vi.hoisted(() => vi.fn());
const fakeDb = () => ({
  from: (t: string) => {
    s.calls.push(`from(${t})`);
    return chain(() => s.queue.shift() ?? { data: null, error: null }, s.calls);
  },
  rpc: async (name: string) => {
    s.calls.push(`rpc(${name})`);
    return { error: s.rpcError };
  },
});
vi.mock('@/lib/backend/current-site', () => ({ requireActingSite: async () => ({ user: { id: 'u1' }, site: { tenantId: 't1' } }) }));
vi.mock('@/lib/backend/site-features', () => ({ getSiteFeatures: async () => s.features }));
vi.mock('@/lib/supabase', () => ({ supabaseAdmin: () => fakeDb() }));
vi.mock('@/lib/supabase-server', () => ({ createSupabaseServerClient: async () => fakeDb() }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn() } }));
vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('@/lib/paypal/config', () => ({ paypalConfig: () => (s.configured ? { clientId: 'client', clientSecret: 'x', partnerMerchantId: 'P', sandbox: true, attributionId: null } : null) }));
vi.mock('@/lib/paypal/api', () => ({
  partnerToken: async () => 'T',
  merchantStatus: async () => {
    if (s.statusFails) throw new Error('PayPal 500');
    return s.status;
  },
  refundCapture: async (...a: unknown[]) => s.refund(...a),
}));
vi.mock('@/lib/paypal/connection', async (orig) => ({
  ...(await orig<typeof Connection>()),
  saveConnection: async (...a: unknown[]) => conn.saveConnection(...a),
  dropConnection: async (...a: unknown[]) => {
    if (s.dropFails) throw new Error('down');
    return conn.dropConnection(...a);
  },
}));

const { checkPayPal, disconnectPayPal } = await import('./paypal-actions');
const { setOrderStatus } = await import('../orders/actions');

const ready = { merchantId: 'M1', email: 'renee@example.com', paymentsReceivable: true, emailConfirmed: true, permissionsGranted: true, cardsApproved: false };

beforeEach(() => {
  s.features = new Set(['cart']);
  s.configured = true;
  s.queue = [];
  s.calls = [];
  s.status = ready;
  s.statusFails = false;
  s.dropFails = false;
  s.rpcError = null;
  s.refund.mockReset().mockResolvedValue('R1');
  conn.saveConnection.mockReset();
  conn.dropConnection.mockReset();
});

describe('checkPayPal', () => {
  it('asks PayPal again and saves what it says', async () => {
    s.queue.push({ data: { merchant_id: 'M1' }, error: null });
    expect(await checkPayPal()).toEqual({ ok: true });
    expect(conn.saveConnection).toHaveBeenCalledWith(expect.anything(), 't1', ready);
  });
  it('says what’s still missing on PayPal’s side', async () => {
    s.status = { ...ready, emailConfirmed: false };
    s.queue.push({ data: { merchant_id: 'M1' }, error: null });
    expect(await checkPayPal()).toMatchObject({ ok: false, error: expect.stringContaining('can’t take payments yet') });
  });
  it('disconnects here when she took BohdiAI’s access away in PayPal', async () => {
    s.status = { ...ready, permissionsGranted: false };
    s.queue.push({ data: { merchant_id: 'M1' }, error: null });
    expect(await checkPayPal()).toMatchObject({ ok: false });
    expect(conn.dropConnection).toHaveBeenCalled();
  });
  it('refuses without the cart, PayPal set up, or a connection; says so when PayPal or the database fail', async () => {
    s.features = new Set();
    expect((await checkPayPal()).ok).toBe(false);
    s.features = new Set(['cart']);
    s.configured = false;
    expect(await checkPayPal()).toEqual({ ok: false, error: 'PayPal isn’t set up on BohdiAI yet.' });
    s.configured = true;
    s.queue.push({ data: null, error: null });
    expect(await checkPayPal()).toEqual({ ok: false, error: 'Connect your PayPal first.' });
    s.queue.push({ data: null, error: { message: 'down' } });
    expect((await checkPayPal()).ok).toBe(false);
    s.statusFails = true;
    s.queue.push({ data: { merchant_id: 'M1' }, error: null });
    expect(await checkPayPal()).toEqual({ ok: false, error: 'PayPal didn’t answer. Try again in a moment.' });
  });
});

describe('disconnectPayPal', () => {
  it('stops offering PayPal at once', async () => {
    expect(await disconnectPayPal()).toEqual({ ok: true });
    expect(conn.dropConnection).toHaveBeenCalledWith(expect.anything(), 't1');
  });
  it('refuses without the cart, and says so when it can’t', async () => {
    s.features = new Set();
    expect((await disconnectPayPal()).ok).toBe(false);
    s.features = new Set(['cart']);
    s.dropFails = true;
    expect((await disconnectPayPal()).ok).toBe(false);
  });
});

describe('refunding a PayPal sale', () => {
  it('gives the money back through PayPal first, then marks it refunded', async () => {
    s.queue.push({ data: { metadata: { capture_id: 'CAP1' } }, error: null }, { data: { merchant_id: 'M1' }, error: null });
    expect(await setOrderStatus('o1', 'refunded')).toEqual({ ok: true });
    expect(s.refund).toHaveBeenCalledWith(expect.anything(), 'T', 'CAP1', 'M1');
    expect(s.calls.join(' ')).toContain('"refund_id":"R1"');
    expect(s.calls.at(-1)).toBe('rpc(set_order_status)');
  });
  it('changes nothing when PayPal doesn’t give it back', async () => {
    s.refund.mockRejectedValue(new Error('PayPal 422'));
    s.queue.push({ data: { metadata: { capture_id: 'CAP1' } }, error: null }, { data: { merchant_id: 'M1' }, error: null });
    expect(await setOrderStatus('o1', 'refunded')).toMatchObject({ ok: false, error: expect.stringContaining('PayPal didn’t give the money back') });
    expect(s.calls.join(' ')).not.toContain('rpc(set_order_status)');
  });
  it('never refunds twice at PayPal', async () => {
    s.queue.push({ data: { metadata: { capture_id: 'CAP1', refund_id: 'R0' } }, error: null });
    expect(await setOrderStatus('o1', 'refunded')).toEqual({ ok: true });
    expect(s.refund).not.toHaveBeenCalled();
  });
  it('records a sale paid any other way, or with her PayPal disconnected, here only', async () => {
    s.queue.push({ data: null, error: null });
    expect(await setOrderStatus('o1', 'refunded')).toEqual({ ok: true });
    s.queue.push({ data: { metadata: { capture_id: 'CAP1' } }, error: null }, { data: null, error: null });
    expect(await setOrderStatus('o1', 'refunded')).toEqual({ ok: true });
    s.queue.push({ data: { metadata: null }, error: null }, { data: { merchant_id: 'M1' }, error: null });
    expect(await setOrderStatus('o1', 'refunded')).toEqual({ ok: true });
    expect(s.refund).not.toHaveBeenCalled();
  });
  it('says so when the sale can’t be read', async () => {
    s.queue.push({ data: null, error: { message: 'down' } });
    expect(await setOrderStatus('o1', 'refunded')).toMatchObject({ ok: false });
  });
});
