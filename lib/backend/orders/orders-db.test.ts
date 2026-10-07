import { describe, it, expect, vi, beforeEach } from 'vitest';

/** A stand-in for a Supabase query: any chain of calls, awaited, gives `result`. */
function chain(result: () => unknown, calls: string[]): unknown {
  const p: unknown = new Proxy(() => undefined, {
    get(_t, prop) {
      if (prop === 'then') return (ok: (v: unknown) => unknown, bad: (e: unknown) => unknown) => Promise.resolve(result()).then(ok, bad);
      return (...args: unknown[]) => {
        calls.push(`${String(prop)}(${args.map((a) => JSON.stringify(a)).join(',')})`);
        return p;
      };
    },
  });
  return p;
}

const state = vi.hoisted(() => ({
  features: new Set<string>(['cart']),
  result: { data: null as unknown, error: null as unknown, count: null as number | null },
  rpc: { error: null as unknown },
  calls: [] as string[],
}));
const revalidatePath = vi.hoisted(() => vi.fn());
const logger = vi.hoisted(() => ({ error: vi.fn(), warn: vi.fn() }));

const fakeDb = () => ({
  from: () => chain(() => state.result, state.calls),
  rpc: async (name: string, args: unknown) => {
    state.calls.push(`rpc(${name},${JSON.stringify(args)})`);
    return state.rpc;
  },
});
vi.mock('@/lib/backend/current-site', () => ({ requireActingSite: async () => ({ user: { id: 'u1' }, site: { tenantId: 't1' } }) }));
vi.mock('@/lib/backend/site-features', () => ({ getSiteFeatures: async () => state.features }));
vi.mock('@/lib/supabase-server', () => ({ createSupabaseServerClient: async () => fakeDb() }));
vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('@/lib/logger', () => ({ logger }));

const { setOrderStatus } = await import('./actions');
const { listOrders, countNewOrders } = await import('./queries');
const { ordersHome } = await import('./home');

beforeEach(() => {
  state.features = new Set(['cart']);
  state.result = { data: null, error: null, count: null };
  state.rpc = { error: null };
  state.calls = [];
  revalidatePath.mockReset();
});

describe('setOrderStatus', () => {
  it('moves the order through set_order_status', async () => {
    expect(await setOrderStatus('o1', 'paid')).toEqual({ ok: true });
    expect(state.calls).toEqual(['rpc(set_order_status,{"p_tenant_id":"t1","p_order_id":"o1","p_status":"paid"})']);
    expect(revalidatePath).toHaveBeenCalledWith('/manage/orders');
  });
  it('refuses a step that does not exist, a site without the cart, and reports a failed change', async () => {
    expect((await setOrderStatus('o1', 'shipped')).ok).toBe(false);
    state.rpc = { error: { message: 'down' } };
    expect(await setOrderStatus('o1', 'paid')).toEqual({ ok: false, error: 'The order couldn’t be updated. Try again in a moment.' });
    state.features = new Set();
    expect(await setOrderStatus('o1', 'paid')).toEqual({ ok: false, error: 'Orders aren’t switched on for this site.' });
  });
});

describe('order reads', () => {
  it('lists orders with their pieces in order, the discount, and blanks for what was not given', async () => {
    state.result = {
      data: [
        {
          id: 'o1',
          order_number: '1001',
          created_at: '2026-10-07T16:00:00Z',
          status: 'weird',
          customer_name: 'Pat',
          customer_email: 'pat@example.com',
          customer_phone: null,
          customer_note: null,
          total_cents: 10800,
          discount_cents: 1200,
          discount_label: 'MARKET10',
          order_items: [
            { name_snapshot: 'Rosie', unit_price_cents: 6000, quantity: 2, created_at: '2026-10-07T16:00:02Z' },
            { name_snapshot: 'Theo', unit_price_cents: 12000, quantity: 1, created_at: '2026-10-07T16:00:01Z' },
          ],
        },
        {
          id: 'o2',
          order_number: '1002',
          created_at: '2026-10-07T17:00:00Z',
          status: 'paid',
          customer_name: 'Sam',
          customer_email: 's@example.com',
          customer_phone: '401',
          customer_note: 'hi',
          total_cents: 100,
          discount_cents: 50,
          discount_label: null,
          order_items: [],
        },
      ],
      error: null,
      count: null,
    };
    const [a, b] = await listOrders(fakeDb() as never, 't1');
    expect(a).toMatchObject({ status: 'pending', phone: '', note: '', total: '$108', discount: { label: 'MARKET10', amount: '$12' } });
    expect(a?.items).toEqual([
      { name: 'Theo', price: '$120' },
      { name: 'Rosie × 2', price: '$120' },
    ]);
    expect(b?.discount).toEqual({ label: 'Discount', amount: '$0.50' });
  });
  it('lists nothing for a shop with no orders, and throws a failed read', async () => {
    expect(await listOrders(fakeDb() as never, 't1')).toEqual([]);
    state.result = { data: null, error: { message: 'down' }, count: null };
    await expect(listOrders(fakeDb() as never, 't1')).rejects.toThrow('down');
    await expect(countNewOrders(fakeDb() as never, 't1')).rejects.toThrow('down');
  });
  it('counts new orders for the home screen', async () => {
    state.result = { data: null, error: null, count: 2 };
    expect(await ordersHome.load('t1')).toMatchObject({ tiles: [{ value: '2' }] });
    state.result = { data: null, error: null, count: null };
    expect(await countNewOrders(fakeDb() as never, 't1')).toBe(0);
  });
});
