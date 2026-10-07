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

const state = vi.hoisted(() => ({
  features: new Set<string>(['promotions']),
  queue: [] as unknown[],
  calls: [] as string[],
}));
const revalidatePath = vi.hoisted(() => vi.fn());
const logger = vi.hoisted(() => ({ error: vi.fn(), warn: vi.fn() }));

const fakeDb = () => ({
  from: (t: string) => {
    state.calls.push(`from(${t})`);
    return chain(() => state.queue.shift() ?? { data: null, error: null }, state.calls);
  },
});
vi.mock('@/lib/backend/current-site', () => ({ requireActingSite: async () => ({ user: { id: 'u1' }, site: { tenantId: 't1' } }) }));
vi.mock('@/lib/backend/site-features', () => ({ getSiteFeatures: async () => state.features }));
vi.mock('@/lib/backend/features', () => ({ loadSiteFeatures: async () => state.features }));
vi.mock('@/lib/supabase-server', () => ({ createSupabaseServerClient: async () => fakeDb() }));
vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('@/lib/logger', () => ({ logger }));

const { addPromotion, updatePromotion, setPromotionActive, removePromotion } = await import('./actions');
const { listPromotions, loadShopPromotions, promotionFromRow } = await import('@/lib/storefront/promotions-load');
const { EMPTY_PROMO } = await import('./promo-form');

const row = {
  id: 'c1',
  kind: 'code',
  name: 'MARKET10',
  code: 'MARKET10',
  percent_off: 10,
  amount_off_cents: null,
  starts_on: null,
  ends_on: null,
  max_uses: null,
  uses: 0,
  active: true,
};
const code = { ...EMPTY_PROMO, code: 'market10', amount: '10' };

beforeEach(() => {
  state.features = new Set(['promotions']);
  state.queue = [];
  state.calls = [];
  revalidatePath.mockReset();
  logger.error.mockReset();
});

describe('addPromotion', () => {
  it('adds a code for this site and hands it back', async () => {
    state.queue = [{ count: 2, error: null }, { data: row, error: null }];
    expect(await addPromotion(code)).toEqual({ ok: true, item: promotionFromRow(row) });
    expect(state.calls.some((c) => c.startsWith('insert({"tenant_id":"t1","kind":"code","name":"MARKET10","code":"MARKET10"'))).toBe(true);
    expect(revalidatePath).toHaveBeenCalledWith('/manage/promotions');
  });
  it('stops at the limit, a failed count, a taken code, and a failed save', async () => {
    state.queue = [{ count: 30, error: null }];
    expect(await addPromotion(code)).toEqual({ ok: false, error: 'You can keep up to 30 promotions. Remove an old one to add another.' });
    state.queue = [{ count: null, error: { message: 'down' } }];
    expect((await addPromotion(code)).ok).toBe(false);
    state.queue = [{ count: 0, error: null }, { data: null, error: { code: '23505', message: 'dup' } }];
    expect(await addPromotion(code)).toEqual({ ok: false, error: 'You already have the code MARKET10. Pick another.' });
    state.queue = [{ count: 0, error: null }, { data: null, error: { code: 'XX000', message: 'x' } }];
    expect(await addPromotion(code)).toEqual({ ok: false, error: 'The promotion couldn’t be saved. Try again in a moment.' });
  });
  it('refuses when Promotions is off, or the form is wrong, without touching the database', async () => {
    state.features = new Set();
    expect((await addPromotion(code)).ok).toBe(false);
    state.features = new Set(['promotions']);
    expect((await addPromotion({ ...code, code: 'x' })).ok).toBe(false);
    expect(state.calls).toEqual([]);
  });
});

describe('updatePromotion', () => {
  it('saves the change and hands back the saved row', async () => {
    state.queue = [{ data: { ...row, percent_off: 15 }, error: null }];
    expect(await updatePromotion('c1', { ...code, amount: '15' })).toMatchObject({ ok: true, item: { percentOff: 15 } });
    expect(state.calls).toContain('eq("id","c1")');
  });
  it('says why it did not save', async () => {
    state.queue = [{ data: null, error: { code: '23505', message: 'dup' } }];
    expect((await updatePromotion('c1', code)).ok).toBe(false);
    state.features = new Set();
    expect((await updatePromotion('c1', code)).ok).toBe(false);
    state.features = new Set(['promotions']);
    expect((await updatePromotion('c1', { ...code, amount: '' })).ok).toBe(false);
  });
});

describe('pause and remove', () => {
  it('pauses and turns back on', async () => {
    expect(await setPromotionActive('c1', false)).toEqual({ ok: true });
    expect(state.calls).toContain('update({"active":false})');
  });
  it('removes', async () => {
    expect(await removePromotion('c1')).toEqual({ ok: true });
    expect(state.calls).toContain('delete()');
  });
  it('says so when either fails or Promotions is off', async () => {
    state.queue = [{ error: { message: 'down' } }, { error: { message: 'down' } }];
    expect((await setPromotionActive('c1', true)).ok).toBe(false);
    expect((await removePromotion('c1')).ok).toBe(false);
    state.features = new Set();
    expect((await setPromotionActive('c1', true)).ok).toBe(false);
    expect((await removePromotion('c1')).ok).toBe(false);
  });
});

describe('reading promotions', () => {
  it('lists a shop’s promotions, a sale read as a sale', async () => {
    state.queue = [{ data: [row, { ...row, id: 's1', kind: 'sale', code: null }], error: null }];
    const list = await listPromotions(fakeDb() as never, 't1');
    expect(list.map((p) => p.kind)).toEqual(['code', 'sale']);
  });
  it('throws a failed read', async () => {
    state.queue = [{ data: null, error: { message: 'down' } }];
    await expect(listPromotions(fakeDb() as never, 't1')).rejects.toThrow('down');
  });
  it('loads a shop’s promotions with its today, or none when Promotions is off', async () => {
    state.queue = [{ data: { time_zone: 'America/New_York' }, error: null }, { data: [row], error: null }];
    const on = await loadShopPromotions(fakeDb() as never, 't1');
    expect(on.promos).toHaveLength(1);
    expect(on.today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    state.features = new Set();
    state.queue = [{ data: null, error: null }];
    expect((await loadShopPromotions(fakeDb() as never, 't1')).promos).toEqual([]);
    state.queue = [{ data: null, error: { message: 'down' } }];
    await expect(loadShopPromotions(fakeDb() as never, 't1')).rejects.toThrow('down');
  });
});
