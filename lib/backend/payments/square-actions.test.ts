import { describe, it, expect, vi, beforeEach } from 'vitest';

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

const KEY = vi.hoisted(() => btoa(String.fromCharCode(...new Uint8Array(32).map((_, i) => i + 11))));
const state = vi.hoisted(() => ({
  features: new Set<string>(['market_shop']),
  configured: true,
  queue: [] as unknown[],
  calls: [] as string[],
  key: { token: 'T', merchantId: 'M1', locationId: 'L1' } as unknown,
  keyFails: false,
  locations: [] as { id: string; name: string }[],
  setFails: false,
  cancelFails: false,
  prices: [] as unknown[],
}));
const square = vi.hoisted(() => ({ setLocation: vi.fn(), dropConnection: vi.fn(), cancelKeys: vi.fn() }));
const revalidatePath = vi.hoisted(() => vi.fn());
const logger = vi.hoisted(() => ({ error: vi.fn(), warn: vi.fn() }));

const fakeDb = () => ({
  from: (t: string) => {
    state.calls.push(`from(${t})`);
    return chain(() => state.queue.shift() ?? { data: null, error: null }, state.calls);
  },
});
vi.mock('@/lib/backend/current-site', () => ({ requireActingSite: async () => ({ user: { id: 'u1' }, site: { tenantId: 't1', subdomain: 'salt', businessName: 'Saltmarsh' } }) }));
vi.mock('@/lib/backend/site-features', () => ({ getSiteFeatures: async () => state.features }));
vi.mock('@/lib/supabase-server', () => ({ createSupabaseServerClient: async () => fakeDb() }));
vi.mock('@/lib/supabase', () => ({ supabaseAdmin: () => fakeDb() }));
vi.mock('@/lib/env', () => ({ serverEnv: () => ({ SITE_URL: 'https://bohdiai.com' }) }));
vi.mock('@/lib/logger', () => ({ logger }));
vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('@/lib/square/config', () => ({ squareConfig: () => (state.configured ? { applicationId: 'app', applicationSecret: 's', tokenKey: KEY, sandbox: true } : null) }));
vi.mock('@/lib/square/api', () => ({
  openLocations: async () => state.locations,
  cancelKeys: async (...args: unknown[]) => {
    square.cancelKeys(...args);
    if (state.cancelFails) throw new Error('Square 503');
  },
}));
vi.mock('@/lib/square/connection', () => ({
  liveKey: async () => {
    if (state.keyFails) throw new Error('Square 500');
    return state.key;
  },
  setLocation: async (...args: unknown[]) => {
    square.setLocation(...args);
    if (state.setFails) throw new Error('down');
  },
  dropConnection: async (...args: unknown[]) => square.dropConnection(...args),
}));
vi.mock('../markets/table-price', () => ({ tablePrice: async () => state.prices.shift() }));

const { squareLocations, chooseSquareLocation, disconnectSquare, startCardSale } = await import('./square-actions');
const { readNote } = await import('@/lib/square/vault');
const { CARD_SALE_PURPOSE } = await import('@/lib/square/pos');

const OFF = { ok: false, error: 'The market shop isn’t switched on for this site.' };
const NOT_SET_UP = { ok: false, error: 'Card payments aren’t set up on BohdiAI yet.' };
const NOT_CONNECTED = { ok: false, error: 'Connect your Square on Getting paid first.' };

beforeEach(() => {
  state.features = new Set(['market_shop']);
  state.configured = true;
  state.queue = [];
  state.calls = [];
  state.key = { token: 'T', merchantId: 'M1', locationId: 'L1' };
  state.keyFails = false;
  state.locations = [{ id: 'L1', name: 'Booth' }, { id: 'L2', name: 'Shop' }];
  state.setFails = false;
  state.cancelFails = false;
  state.prices = [];
  for (const f of [square.setLocation, square.dropConnection, square.cancelKeys, revalidatePath, logger.error]) f.mockReset();
});

describe('squareLocations', () => {
  it('lists the business’s open locations', async () => {
    expect(await squareLocations()).toEqual({ ok: true, locations: state.locations });
  });

  it('says why when there is no market shop, no Square on BohdiAI, no connection, or no answer', async () => {
    state.features = new Set();
    expect(await squareLocations()).toEqual(OFF);
    state.features = new Set(['market_shop']);
    state.configured = false;
    expect(await squareLocations()).toEqual(NOT_SET_UP);
    state.configured = true;
    state.key = null;
    expect(await squareLocations()).toEqual(NOT_CONNECTED);
    state.keyFails = true;
    expect(await squareLocations()).toEqual({ ok: false, error: 'Square didn’t answer. Try again in a moment.' });
    expect(logger.error).toHaveBeenCalledWith('square: locations failed', { tenantId: 't1', error: 'Square 500' });
  });
});

describe('chooseSquareLocation', () => {
  it('saves a location that’s open in her Square', async () => {
    expect(await chooseSquareLocation('L2')).toEqual({ ok: true });
    expect(square.setLocation).toHaveBeenCalledWith(expect.anything(), 't1', { id: 'L2', name: 'Shop' });
    expect(revalidatePath).toHaveBeenCalledWith('/manage/payments');
  });

  it('refuses a location her Square doesn’t have, and passes on any earlier refusal', async () => {
    expect(await chooseSquareLocation('L9')).toEqual({ ok: false, error: 'That location isn’t open in your Square.' });
    state.key = null;
    expect(await chooseSquareLocation('L1')).toEqual(NOT_CONNECTED);
    expect(square.setLocation).not.toHaveBeenCalled();
  });

  it('says so when the save fails', async () => {
    state.setFails = true;
    expect(await chooseSquareLocation('L1')).toEqual({ ok: false, error: 'The location couldn’t be saved. Try again in a moment.' });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe('disconnectSquare — Square cancels the keys before ours are erased', () => {
  it('cancels on Square’s side, then erases the connection', async () => {
    state.queue.push({ data: { merchant_id: 'M1' }, error: null });
    expect(await disconnectSquare()).toEqual({ ok: true });
    expect(square.cancelKeys).toHaveBeenCalledWith(expect.objectContaining({ applicationId: 'app' }), 'M1');
    expect(square.dropConnection).toHaveBeenCalledWith(expect.anything(), 't1');
    expect(revalidatePath).toHaveBeenCalledWith('/manage/payments');
  });

  it('erases nothing when Square can’t be reached', async () => {
    state.queue.push({ data: { merchant_id: 'M1' }, error: null });
    state.cancelFails = true;
    expect(await disconnectSquare()).toEqual({ ok: false, error: 'Square didn’t answer, so your Square is still connected. Try again in a moment.' });
    expect(square.dropConnection).not.toHaveBeenCalled();
  });

  it('is done already when nothing is connected', async () => {
    expect(await disconnectSquare()).toEqual({ ok: true });
    expect(square.cancelKeys).not.toHaveBeenCalled();
  });

  it('says why when there is no market shop, no Square on BohdiAI, or the connection can’t be read', async () => {
    state.features = new Set();
    expect(await disconnectSquare()).toEqual(OFF);
    state.features = new Set(['market_shop']);
    state.configured = false;
    expect(await disconnectSquare()).toEqual(NOT_SET_UP);
    state.configured = true;
    state.queue.push({ data: null, error: { message: 'down' } });
    expect(await disconnectSquare()).toEqual({ ok: false, error: 'Your Square couldn’t be disconnected. Try again in a moment.' });
  });
});

describe('startCardSale — the total is worked out on the server', () => {
  const linked = () => state.queue.push({ data: { location_id: 'L1' }, error: null }, { data: { name: 'Fall Fair' }, error: null });
  const line = (over: Record<string, unknown> = {}) => ({ listingId: 'l1', variantId: null, quantity: 2, ...over });

  it('hands off to Square with the table’s total and a signed note of the pieces', async () => {
    linked();
    state.prices.push({ cents: 2000, name: 'Dish' }, { cents: 1500, name: 'Star' });
    const r = await startCardSale('e1', [line(), line({ quantity: 1, agreedCents: 1200 })]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const data = JSON.parse(decodeURIComponent(r.handOff.iphone.split('data=')[1] ?? '')) as { amount_money: { amount: string }; state: string; notes: string; location_id: string; callback_url: string };
    expect(data).toMatchObject({ amount_money: { amount: '5200' }, notes: 'Saltmarsh · Fall Fair', location_id: 'L1', callback_url: 'https://app.bohdiai.com/api/square/pos' });
    expect(r.handOff.android).toContain('i.com.squareup.pos.TOTAL_AMOUNT=5200');
    expect(r.handOff.android).toContain(encodeURIComponent('https://app.bohdiai.com/manage/markets/e1/day?card=no-app'));
    const note = (await readNote(CARD_SALE_PURPOSE, data.state, KEY)) as { tenantId: string; totalCents: number; lines: { agreedCents: number | null }[] };
    expect(note).toMatchObject({ tenantId: 't1', totalCents: 5200 });
    expect(note.lines.map((l) => l.agreedCents)).toEqual([null, 1200]);
  });

  it('checks the pieces before asking Square anything', async () => {
    expect(await startCardSale('e1', [])).toEqual({ ok: false, error: 'Tap the pieces they’re taking first.' });
    expect(await startCardSale('e1', [line({ quantity: 0 })])).toEqual({ ok: false, error: 'Pick how many, from 1 to 99.' });
    expect(await startCardSale('e1', [line({ quantity: 100 })])).toEqual({ ok: false, error: 'Pick how many, from 1 to 99.' });
    expect(await startCardSale('e1', Array.from({ length: 51 }, () => line()))).toEqual({ ok: false, error: 'Pick how many, from 1 to 99.' });
    expect(await startCardSale('e1', [line({ agreedCents: -1 })])).toEqual({ ok: false, error: 'Type the price you agreed, like 15 or 14.50.' });
    expect(await startCardSale('e1', [line({ agreedCents: 1.5 })])).toEqual({ ok: false, error: 'Type the price you agreed, like 15 or 14.50.' });
    expect(state.calls).toEqual([]);
  });

  it('says why when there is no market shop, no Square, no connection or no location', async () => {
    state.features = new Set();
    expect(await startCardSale('e1', [line()])).toEqual(OFF);
    state.features = new Set(['market_shop']);
    state.configured = false;
    expect(await startCardSale('e1', [line()])).toEqual(NOT_SET_UP);
    state.configured = true;
    state.queue.push({ data: null, error: { message: 'down' } });
    expect(await startCardSale('e1', [line()])).toEqual({ ok: false, error: 'Something went wrong. Try again in a moment.' });
    expect(await startCardSale('e1', [line()])).toEqual(NOT_CONNECTED);
    state.queue.push({ data: { location_id: null }, error: null });
    expect(await startCardSale('e1', [line()])).toEqual({ ok: false, error: 'Pick which Square location card sales go to, on Getting paid.' });
  });

  it('refuses a market that’s gone, a piece that’s gone, a price above the marked one, or under a dollar', async () => {
    state.queue.push({ data: { location_id: 'L1' }, error: null });
    expect(await startCardSale('e1', [line()])).toEqual({ ok: false, error: 'That market isn’t on your site any more.' });
    linked();
    state.prices.push({ error: 'That piece isn’t on your site any more.' });
    expect(await startCardSale('e1', [line()])).toEqual({ ok: false, error: 'That piece isn’t on your site any more.' });
    linked();
    state.prices.push({ cents: 2000, name: 'Dish' });
    expect(await startCardSale('e1', [line({ agreedCents: 5000 })])).toEqual({ ok: false, error: 'That’s more than the marked price for Dish.' });
    linked();
    state.prices.push({ cents: 40, name: 'Sticker' });
    expect(await startCardSale('e1', [line()])).toEqual({ ok: false, error: 'Square takes cards for $1.00 or more.' });
  });
});
