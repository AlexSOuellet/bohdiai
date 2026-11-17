import { describe, it, expect, vi, beforeEach } from 'vitest';

function chain(next: () => unknown): unknown {
  const p: unknown = new Proxy(() => undefined, {
    get(_t, prop) {
      if (prop === 'then') return (ok: (v: unknown) => unknown, bad: (e: unknown) => unknown) => Promise.resolve(next()).then(ok, bad);
      return () => p;
    },
  });
  return p;
}

const s = vi.hoisted(() => ({
  configured: true,
  squareOrder: 'SQO' as string | null,
  lookupFails: false,
  outcome: { kind: 'paid', orderNumber: '1042' } as unknown,
  confirmFails: false,
  queue: [] as unknown[],
  cardState: 'ready',
  features: new Set<string>(['cart']),
  paypal: null as unknown,
}));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));
vi.mock('@/lib/square/config', () => ({ squareConfig: () => (s.configured ? { applicationId: 'a', applicationSecret: 'b', tokenKey: 'k', sandbox: true } : null) }));
vi.mock('@/lib/square/online', () => ({
  squareOrderFor: async () => {
    if (s.lookupFails) throw new Error('down');
    return s.squareOrder;
  },
  confirmSquareOrder: async () => {
    if (s.confirmFails) throw new Error('Square 500');
    return s.outcome;
  },
}));
vi.mock('@/lib/square/connection', () => ({ cardState: async () => s.cardState }));
vi.mock('@/lib/backend/features', () => ({ loadSiteFeatures: async () => s.features }));
vi.mock('@/lib/paypal/online-pay', () => ({ paypalPay: async () => s.paypal }));

const { squareReturn } = await import('./square-return');
const { onlinePay } = await import('./online-pay');
const db = () => ({ from: () => chain(() => s.queue.shift() ?? { data: null, error: null }) }) as never;
const OUR = '11111111-2222-3333-4444-555555555555';

beforeEach(() => {
  s.configured = true;
  s.squareOrder = 'SQO';
  s.lookupFails = false;
  s.outcome = { kind: 'paid', orderNumber: '1042' };
  s.confirmFails = false;
  s.queue = [];
  s.cardState = 'ready';
  s.features = new Set(['cart']);
  s.paypal = null;
});

describe('squareReturn', () => {
  it('says what Square confirmed about the shopper’s order', async () => {
    expect(await squareReturn(db(), 't1', OUR)).toEqual({ kind: 'paid', orderNumber: '1042' });
    s.outcome = { kind: 'sold', orderNumber: '1042' };
    expect(await squareReturn(db(), 't1', OUR)).toEqual({ kind: 'sold', orderNumber: '1042' });
  });

  it('shows nothing for an address that isn’t one of this shop’s Square orders', async () => {
    expect(await squareReturn(db(), 't1', 'not-an-id')).toBeNull();
    s.squareOrder = null;
    expect(await squareReturn(db(), 't1', OUR)).toBeNull();
    s.squareOrder = 'SQO';
    s.outcome = { kind: 'unknown' };
    expect(await squareReturn(db(), 't1', OUR)).toBeNull();
    s.configured = false;
    expect(await squareReturn(db(), 't1', OUR)).toBeNull();
    s.configured = true;
    s.lookupFails = true;
    expect(await squareReturn(db(), 't1', OUR)).toBeNull();
  });

  it('says it’s still being confirmed when asking Square fails, never nothing', async () => {
    s.confirmFails = true;
    s.queue.push({ data: { order_number: '1042' }, error: null });
    expect(await squareReturn(db(), 't1', OUR)).toEqual({ kind: 'waiting', orderNumber: '1042' });
    expect(await squareReturn(db(), 't1', OUR)).toBeNull();
  });
});

describe('onlinePay', () => {
  it('pays through Square when it’s ready, else PayPal, else nothing', async () => {
    expect(await onlinePay(db(), 't1')).toEqual({ kind: 'square' });
    s.cardState = 'pick-location';
    expect(await onlinePay(db(), 't1')).toBeNull();
    s.paypal = { kind: 'paypal', clientId: 'c', merchantId: 'm', currency: 'USD' };
    expect(await onlinePay(db(), 't1')).toEqual(s.paypal);
    s.features = new Set();
    expect(await onlinePay(db(), 't1')).toBeNull();
  });
});
