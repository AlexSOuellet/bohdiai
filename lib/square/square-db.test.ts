import { describe, it, expect, vi, beforeEach } from 'vitest';
import { seal, unseal } from './vault';

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

const state = vi.hoisted(() => ({
  queue: [] as unknown[],
  calls: [] as string[],
  rpc: [] as { data: unknown; error: unknown }[],
  prices: [] as unknown[],
}));
const logger = vi.hoisted(() => ({ error: vi.fn(), warn: vi.fn() }));
vi.mock('@/lib/logger', () => ({ logger }));
vi.mock('@/lib/backend/markets/table-price', () => ({ tablePrice: async () => state.prices.shift() }));

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

const { squareLink, saveConnection, setLocation, dropConnection, liveKey, cardState } = await import('./connection');
const { finishConnect, alreadyRecorded, confirmCardSale, savePayments, recordCardSale } = await import('./flow');

const KEY = btoa(String.fromCharCode(...new Uint8Array(32).map((_, i) => i + 3)));
const config = { applicationId: 'app', applicationSecret: 'secret', tokenKey: KEY, sandbox: true };
const NOW = new Date('2026-10-24T12:00:00Z');
const DAY = 24 * 60 * 60 * 1000;
const fail = { data: null, error: { message: 'down' } };

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

async function sealedRow(expiresInMs: number, locationId: string | null = 'L1') {
  return {
    merchant_id: 'M1',
    location_id: locationId,
    access_token_enc: await seal('ACCESS', KEY),
    refresh_token_enc: await seal('REFRESH', KEY),
    expires_at: new Date(NOW.getTime() + expiresInMs).toISOString(),
  };
}

beforeEach(() => {
  state.queue = [];
  state.calls = [];
  state.rpc = [];
  state.prices = [];
  logger.error.mockReset();
});

describe('squareLink — what a screen may know', () => {
  it('gives the names and location, never the keys', async () => {
    state.queue.push({ data: { business_name: 'Saltmarsh', location_id: 'L1', location_name: 'Booth', connected_at: '2026-10-21' }, error: null });
    expect(await squareLink(db(), 't1')).toEqual({ businessName: 'Saltmarsh', locationId: 'L1', locationName: 'Booth', connectedAt: '2026-10-21' });
    expect(state.calls.join(' ')).not.toMatch(/token/);
  });

  it('is null when the site isn’t connected, and says so when it can’t read', async () => {
    expect(await squareLink(db(), 't1')).toBeNull();
    state.queue.push(fail);
    await expect(squareLink(db(), 't1')).rejects.toThrow('Could not read the Square connection: down');
  });
});

describe('cardState', () => {
  it('is off until Square is set up and the site is connected, then waits for a location', async () => {
    expect(await cardState(db(), 't1', false)).toBe('off');
    expect(state.calls).toEqual([]);
    expect(await cardState(db(), 't1', true)).toBe('off');
    state.queue.push({ data: { business_name: 'S', location_id: null, location_name: '', connected_at: 'x' }, error: null });
    expect(await cardState(db(), 't1', true)).toBe('pick-location');
    state.queue.push({ data: { business_name: 'S', location_id: 'L1', location_name: 'Booth', connected_at: 'x' }, error: null });
    expect(await cardState(db(), 't1', true)).toBe('ready');
  });
});

describe('saveConnection — keys kept scrambled', () => {
  const keys = { accessToken: 'ACCESS', refreshToken: 'REFRESH', expiresAt: '2026-11-20T00:00:00Z', merchantId: 'M1' };

  it('scrambles both keys with the secret, and trims long names', async () => {
    await saveConnection(db(), config, 't1', keys, 'B'.repeat(300), { id: 'L1', name: 'N'.repeat(300) });
    const call = state.calls.find((c) => c.startsWith('upsert('));
    expect(call).toBeDefined();
    const row = JSON.parse(call!.slice('upsert('.length, -1)) as Record<string, string>;
    expect(row['access_token_enc']).not.toContain('ACCESS');
    expect(await unseal(row['access_token_enc']!, KEY)).toBe('ACCESS');
    expect(await unseal(row['refresh_token_enc']!, KEY)).toBe('REFRESH');
    expect(row['business_name']).toHaveLength(255);
    expect(row['location_name']).toHaveLength(255);
    expect(row['location_id']).toBe('L1');
  });

  it('saves with no location yet, and says so when the save fails', async () => {
    await saveConnection(db(), config, 't1', keys, 'Saltmarsh', null);
    const row = JSON.parse(state.calls.find((c) => c.startsWith('upsert('))!.slice('upsert('.length, -1)) as Record<string, unknown>;
    expect(row['location_id']).toBeNull();
    expect(row['location_name']).toBe('');
    state.queue.push(fail);
    await expect(saveConnection(db(), config, 't1', keys, 'S', null)).rejects.toThrow('Could not save the Square connection: down');
  });
});

describe('setLocation and dropConnection', () => {
  it('save the location and remove the connection, for this site only', async () => {
    await setLocation(db(), 't1', { id: 'L2', name: 'Market' });
    await dropConnection(db(), 't1');
    expect(state.calls).toContain('update({"location_id":"L2","location_name":"Market"})');
    expect(state.calls).toContain('delete()');
    expect(state.calls.filter((c) => c === 'eq("tenant_id","t1")')).toHaveLength(2);
  });

  it('say so when they fail', async () => {
    state.queue.push(fail);
    await expect(setLocation(db(), 't1', { id: 'L2', name: 'Market' })).rejects.toThrow('Could not save the Square location: down');
    state.queue.push(fail);
    await expect(dropConnection(db(), 't1')).rejects.toThrow('Could not remove the Square connection: down');
  });
});

describe('liveKey — a working key, renewed near the end', () => {
  it('unscrambles a key with time left, without calling Square', async () => {
    state.queue.push({ data: await sealedRow(20 * DAY), error: null });
    const { fetcher } = square({});
    expect(await liveKey(db(), config, 't1', NOW, fetcher)).toEqual({ token: 'ACCESS', merchantId: 'M1', locationId: 'L1' });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('renews a key within a week of running out and keeps the new keys scrambled', async () => {
    state.queue.push({ data: await sealedRow(3 * DAY), error: null });
    const { fetcher, seen } = square({ '/oauth2/token': { body: { access_token: 'NEW', refresh_token: 'NEW-R', expires_at: '2026-11-24T00:00:00Z', merchant_id: 'M1' } } });
    expect(await liveKey(db(), config, 't1', NOW, fetcher)).toEqual({ token: 'NEW', merchantId: 'M1', locationId: 'L1' });
    expect(JSON.parse(String(seen[0]!.init.body))).toMatchObject({ grant_type: 'refresh_token', refresh_token: 'REFRESH' });
    const saved = JSON.parse(state.calls.find((c) => c.startsWith('update('))!.slice('update('.length, -1)) as Record<string, string>;
    expect(await unseal(saved['access_token_enc']!, KEY)).toBe('NEW');
    expect(saved['expires_at']).toBe('2026-11-24T00:00:00Z');
  });

  it('is null for a site that isn’t connected, and says so when it can’t read or save', async () => {
    expect(await liveKey(db(), config, 't1', NOW)).toBeNull();
    state.queue.push(fail);
    await expect(liveKey(db(), config, 't1', NOW)).rejects.toThrow('Could not read the Square connection: down');
    state.queue.push({ data: await sealedRow(DAY), error: null }, fail);
    const { fetcher } = square({ '/oauth2/token': { body: { access_token: 'NEW', expires_at: '2026-11-24T00:00:00Z', merchant_id: 'M1' } } });
    await expect(liveKey(db(), config, 't1', NOW, fetcher)).rejects.toThrow('Could not save the renewed Square key: down');
  });

  it('uses the time now when none is given', async () => {
    state.queue.push({ data: { ...(await sealedRow(0)), expires_at: new Date(Date.now() + 30 * DAY).toISOString() }, error: null });
    expect((await liveKey(db(), config, 't1'))?.token).toBe('ACCESS');
  });
});

describe('finishConnect', () => {
  const token = { '/oauth2/token': { body: { access_token: 'A', refresh_token: 'R', expires_at: '2026-11-20T00:00:00Z', merchant_id: 'M1' } } };
  const merchant = { '/v2/merchants/': { body: { merchant: { business_name: 'Saltmarsh & Lace' } } } };

  it('keeps the business and its only location', async () => {
    const { fetcher } = square({ ...token, ...merchant, '/v2/locations': { body: { locations: [{ id: 'L1', name: 'Booth', status: 'ACTIVE' }] } } });
    await finishConnect(db(), config, 't1', 'code', fetcher);
    const row = JSON.parse(state.calls.find((c) => c.startsWith('upsert('))!.slice('upsert('.length, -1)) as Record<string, unknown>;
    expect(row).toMatchObject({ tenant_id: 't1', merchant_id: 'M1', business_name: 'Saltmarsh & Lace', location_id: 'L1', location_name: 'Booth' });
  });

  it('leaves the location for the maker to pick when there are several', async () => {
    const { fetcher } = square({ ...token, ...merchant, '/v2/locations': { body: { locations: [{ id: 'L1', name: 'A', status: 'ACTIVE' }, { id: 'L2', name: 'B', status: 'ACTIVE' }] } } });
    await finishConnect(db(), config, 't1', 'code', fetcher);
    const row = JSON.parse(state.calls.find((c) => c.startsWith('upsert('))!.slice('upsert('.length, -1)) as Record<string, unknown>;
    expect(row['location_id']).toBeNull();
  });
});

describe('alreadyRecorded — each Square sale counts once', () => {
  it('finds a sale by its hand-off, then by Square’s order', async () => {
    state.queue.push({ data: [{ id: 'p1' }], error: null });
    expect(await alreadyRecorded(db(), 't1', 'n1', 'ORD')).toBe(true);
    state.queue.push({ data: [], error: null }, { data: [{ id: 'p1' }], error: null });
    expect(await alreadyRecorded(db(), 't1', 'n1', 'ORD')).toBe(true);
    state.queue.push({ data: [], error: null }, { data: null, error: null });
    expect(await alreadyRecorded(db(), 't1', 'n1', 'ORD')).toBe(false);
  });

  it('checks only the hand-off when there is no Square order yet', async () => {
    state.queue.push({ data: null, error: null });
    expect(await alreadyRecorded(db(), 't1', 'n1', null)).toBe(false);
    expect(state.calls.filter((c) => c === 'from(payments)')).toHaveLength(1);
  });

  it('says so when it can’t check', async () => {
    state.queue.push(fail);
    await expect(alreadyRecorded(db(), 't1', 'n1', 'ORD')).rejects.toThrow('Could not check the payment: down');
    state.queue.push({ data: [], error: null }, fail);
    await expect(alreadyRecorded(db(), 't1', 'n1', 'ORD')).rejects.toThrow('Could not check the payment: down');
  });
});

describe('confirmCardSale — Square’s own word first', () => {
  const order = (over: Record<string, unknown> = {}) => ({
    '/v2/orders/': { body: { order: { id: 'ORD', location_id: 'L1', state: 'COMPLETED', total_money: { amount: 4200, currency: 'USD' }, tenders: [{ payment_id: 'P1', type: 'CARD', amount_money: { amount: 4200 } }], ...over } } },
  });
  const connected = async () => state.queue.push({ data: await sealedRow(20 * DAY), error: null });
  const fresh = () => state.queue.push({ data: [], error: null }, { data: [], error: null });

  it('confirms a completed card sale for exactly the total at her location', async () => {
    await connected();
    fresh();
    expect(await confirmCardSale(db(), config, 't1', 'n1', 'ORD', 4200, square(order()).fetcher)).toEqual({ ok: true, paymentIds: ['P1'] });
  });

  it('refuses when the site isn’t connected, the sale was already recorded, Square has no such sale, or it doesn’t match', async () => {
    expect(await confirmCardSale(db(), config, 't1', 'n1', 'ORD', 4200, square(order()).fetcher)).toEqual({ ok: false, reason: 'not-connected' });
    await connected();
    state.queue.push({ data: [{ id: 'p1' }], error: null });
    expect(await confirmCardSale(db(), config, 't1', 'n1', 'ORD', 4200, square(order()).fetcher)).toEqual({ ok: false, reason: 'already-recorded' });
    await connected();
    fresh();
    expect(await confirmCardSale(db(), config, 't1', 'n1', 'ORD', 4200, square({ '/v2/orders/': { status: 404, body: { errors: [{ code: 'NOT_FOUND' }] } } }).fetcher)).toEqual({ ok: false, reason: 'not-found' });
    await connected();
    fresh();
    expect(await confirmCardSale(db(), config, 't1', 'n1', 'ORD', 5000, square(order()).fetcher)).toEqual({ ok: false, reason: 'mismatch' });
    await connected();
    fresh();
    expect(await confirmCardSale(db(), config, 't1', 'n1', 'ORD', 4200, square(order({ location_id: 'OTHER' })).fetcher)).toEqual({ ok: false, reason: 'mismatch' });
  });
});

describe('savePayments', () => {
  const orders = { data: [{ id: 'o1', order_number: 'A-1', total_cents: 3000 }, { id: 'o2', order_number: 'A-2', total_cents: 1200 }], error: null };
  const inserted = () => JSON.parse(state.calls.find((c) => c.startsWith('insert('))!.slice('insert('.length, -1)) as Record<string, unknown>[];

  it('saves one row per order, the first under Square’s own order ID', async () => {
    state.queue.push(orders);
    await savePayments(db(), 't1', 'n1', 'ORD', ['P1'], ['A-1', 'A-2', 'A-gone'], 'succeeded');
    const rows = inserted();
    expect(rows.map((r) => r['external_payment_id'])).toEqual(['ORD', 'ORD/1']);
    expect(rows.map((r) => r['amount_cents'])).toEqual([3000, 1200]);
    expect(rows[0]).toMatchObject({ processor: 'square', status: 'succeeded', metadata: { sale_nonce: 'n1', square_order_id: 'ORD', square_payment_ids: ['P1'] } });
    expect(rows[0]!['processed_at']).not.toBeNull();
  });

  it('saves a sale taken with no signal as waiting, with no Square ID yet', async () => {
    state.queue.push(orders);
    await savePayments(db(), 't1', 'n1', null, [], ['A-1'], 'pending');
    expect(inserted()[0]).toMatchObject({ external_payment_id: null, status: 'pending', processed_at: null });
  });

  it('writes nothing when no order is found, and says so when it can’t read or save', async () => {
    await savePayments(db(), 't1', 'n1', 'ORD', [], ['A-1'], 'succeeded');
    expect(state.calls.some((c) => c.startsWith('insert('))).toBe(false);
    state.queue.push(fail);
    await expect(savePayments(db(), 't1', 'n1', 'ORD', [], ['A-1'], 'succeeded')).rejects.toThrow('Could not read the orders: down');
    state.queue.push(orders, fail);
    await expect(savePayments(db(), 't1', 'n1', 'ORD', [], ['A-1'], 'succeeded')).rejects.toThrow('Could not save the card payment: down');
  });
});

describe('recordCardSale — line by line, at the table’s prices', () => {
  const line = (over: Record<string, unknown> = {}) => ({ listingId: 'l1', variantId: null, quantity: 2, ...over });

  it('records each line, with an option and an agreed price when there is one', async () => {
    state.prices.push({ cents: 2000, name: 'Dish' }, { cents: 1500, name: 'Star' });
    state.rpc.push({ data: 'A-1', error: null }, { data: 'A-2', error: null });
    expect(await recordCardSale(db(), 't1', 'e1', [line(), line({ variantId: 'v1', quantity: 1, agreedCents: 1200 })])).toEqual({ ok: true, orderNumbers: ['A-1', 'A-2'] });
    const args = state.calls.filter((c) => c.startsWith('rpc(')).map((c) => JSON.parse(c.slice('rpc(market_record_card_sale,'.length, -1)) as Record<string, unknown>);
    expect(args[0]).toEqual({ p_tenant_id: 't1', p_event_id: 'e1', p_listing_id: 'l1', p_price_cents: 2000, p_quantity: 2 });
    expect(args[1]).toMatchObject({ p_variant_id: 'v1', p_discount_cents: 300 });
  });

  it('stops at a piece that’s gone, an agreed price above the marked one, or a line the database refuses', async () => {
    state.prices.push({ cents: 2000, name: 'Dish' }, { error: 'gone' });
    state.rpc.push({ data: 'A-1', error: null });
    expect(await recordCardSale(db(), 't1', 'e1', [line(), line()])).toEqual({ ok: false, orderNumbers: ['A-1'] });
    state.prices.push({ cents: 2000, name: 'Dish' });
    expect(await recordCardSale(db(), 't1', 'e1', [line({ agreedCents: 9000 })])).toEqual({ ok: false, orderNumbers: [] });
    state.prices.push({ cents: 2000, name: 'Dish' });
    state.rpc.push({ data: null, error: { code: 'P0001', message: 'closed' } });
    expect(await recordCardSale(db(), 't1', 'e1', [line()])).toEqual({ ok: false, orderNumbers: [] });
    expect(logger.error).toHaveBeenCalledWith('square: card sale line not recorded', expect.objectContaining({ code: 'P0001' }));
  });
});
