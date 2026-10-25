// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type * as Config from './config';

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

const state = vi.hoisted(() => ({ queue: [] as unknown[], calls: [] as string[], features: new Set<string>(['cart']), env: {} as Record<string, string | undefined> }));
vi.mock('@/lib/backend/features', () => ({ loadSiteFeatures: async () => state.features }));
vi.mock('./config', async (orig) => {
  const real = await orig<typeof Config>();
  return { ...real, paypalConfig: () => real.paypalConfig(state.env) };
});

const db = () =>
  ({
    from: (t: string) => {
      state.calls.push(`from(${t})`);
      return chain(() => state.queue.shift() ?? { data: null, error: null }, state.calls);
    },
  }) as never;

const { paypalLink, paidInto, saveConnection, dropConnection } = await import('./connection');
const { onlinePay } = await import('./online-pay');

const fail = { data: null, error: { message: 'down' } };
const row = { merchant_id: 'M1', email: 'renee@example.com', payments_receivable: true, email_confirmed: true, connected_at: '2026-10-25T10:00:00Z' };
const ENV = { PAYPAL_CLIENT_ID: 'client', PAYPAL_CLIENT_SECRET: 'secret', PAYPAL_PARTNER_MERCHANT_ID: 'P', PAYPAL_ENV: 'sandbox' };

beforeEach(() => {
  state.queue = [];
  state.calls = [];
  state.features = new Set(['cart']);
  state.env = { ...ENV };
});

describe('the connection', () => {
  it('tells a screen only the email and whether it can take orders', async () => {
    state.queue.push({ data: row, error: null });
    expect(await paypalLink(db(), 't1')).toEqual({ email: 'renee@example.com', ready: true, paymentsReceivable: true, emailConfirmed: true, connectedAt: '2026-10-25T10:00:00Z' });
    state.queue.push({ data: null, error: null });
    expect(await paypalLink(db(), 't1')).toBeNull();
    state.queue.push(fail);
    await expect(paypalLink(db(), 't1')).rejects.toThrow('down');
  });

  it('pays into her account only once it can take orders', async () => {
    state.queue.push({ data: row, error: null });
    expect(await paidInto(db(), 't1')).toBe('M1');
    state.queue.push({ data: { ...row, email_confirmed: false }, error: null });
    expect(await paidInto(db(), 't1')).toBeNull();
    state.queue.push({ data: null, error: null });
    expect(await paidInto(db(), 't1')).toBeNull();
    state.queue.push(fail);
    await expect(paidInto(db(), 't1')).rejects.toThrow('down');
  });

  it('saves what PayPal said, and removes it', async () => {
    await saveConnection(db(), 't1', { merchantId: 'M1', email: 'renee@example.com', paymentsReceivable: true, emailConfirmed: false, permissionsGranted: true, cardsApproved: false });
    expect(state.calls.join(' ')).toContain('"merchant_id":"M1"');
    expect(state.calls.join(' ')).toContain('"email_confirmed":false');
    state.queue.push(fail);
    await expect(saveConnection(db(), 't1', { merchantId: 'M1', email: '', paymentsReceivable: false, emailConfirmed: false, permissionsGranted: true, cardsApproved: false })).rejects.toThrow('down');
    await dropConnection(db(), 't1');
    expect(state.calls.at(-2)).toBe('delete()');
    state.queue.push(fail);
    await expect(dropConnection(db(), 't1')).rejects.toThrow('down');
  });
});

describe('onlinePay', () => {
  it('gives the PayPal button the public app ID, her account and the shop’s currency', async () => {
    state.queue.push({ data: row, error: null }, { data: { currency: 'cad' }, error: null });
    expect(await onlinePay(db(), 't1')).toEqual({ clientId: 'client', merchantId: 'M1', currency: 'CAD' });
  });
  it('falls back to US dollars when the shop has none set', async () => {
    state.queue.push({ data: row, error: null }, { data: { currency: '' }, error: null });
    expect((await onlinePay(db(), 't1'))?.currency).toBe('USD');
    state.queue.push({ data: row, error: null }, { data: null, error: null });
    expect((await onlinePay(db(), 't1'))?.currency).toBe('USD');
  });
  it('is off when PayPal isn’t set up, the cart is off, or her PayPal can’t take orders', async () => {
    state.env = {};
    expect(await onlinePay(db(), 't1')).toBeNull();
    state.env = { ...ENV };
    state.features = new Set();
    expect(await onlinePay(db(), 't1')).toBeNull();
    state.features = new Set(['cart']);
    state.queue.push({ data: null, error: null });
    expect(await onlinePay(db(), 't1')).toBeNull();
  });
  it('fails loudly when the shop can’t be read', async () => {
    state.queue.push({ data: row, error: null }, fail);
    await expect(onlinePay(db(), 't1')).rejects.toThrow('currency');
  });
});
