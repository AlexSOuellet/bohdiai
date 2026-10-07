import { describe, it, expect, vi, beforeEach } from 'vitest';

/** A stand-in for a Supabase query: any chain of calls, awaited, gives `result`.
 *  Every call is recorded as "method(args)" so tests can see what was asked. */
function chain(result: unknown, calls: string[]): unknown {
  const p: unknown = new Proxy(() => undefined, {
    get(_t, prop) {
      if (prop === 'then') return (ok: (v: unknown) => unknown, bad: (e: unknown) => unknown) => Promise.resolve(result).then(ok, bad);
      return (...args: unknown[]) => {
        calls.push(`${String(prop)}(${args.map((a) => JSON.stringify(a)).join(',')})`);
        return p;
      };
    },
  });
  return p;
}

const state = vi.hoisted(() => ({
  features: new Set<string>(['market_dates']),
  result: { data: null as unknown, error: null as unknown },
  rpc: { data: 'm1' as unknown, error: null as unknown },
  calls: [] as string[],
}));
const revalidatePath = vi.hoisted(() => vi.fn());
const logger = vi.hoisted(() => ({ error: vi.fn(), warn: vi.fn() }));

vi.mock('@/lib/backend/current-site', () => ({ requireActingSite: async () => ({ user: { id: 'u1' }, site: { tenantId: 't1' } }) }));
vi.mock('@/lib/backend/site-features', () => ({ getSiteFeatures: async () => state.features }));
vi.mock('@/lib/supabase-server', () => ({
  createSupabaseServerClient: async () => ({
    from: (t: string) => {
      state.calls.push(`from(${t})`);
      return chain(state.result, state.calls);
    },
    rpc: async (name: string, args: unknown) => {
      state.calls.push(`rpc(${name},${JSON.stringify(args)})`);
      return state.rpc;
    },
  }),
}));
vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('@/lib/logger', () => ({ logger }));

const { saveMarket, removeMarket } = await import('./actions');
const { listMarkets, getMarket } = await import('./queries');
const { emptyMarketForm } = await import('./market-form');

const form = { ...emptyMarketForm(), name: 'Holly Fair', date: '2026-11-21' };
const db = async () => (await (await import('@/lib/supabase-server')).createSupabaseServerClient()) as never;

beforeEach(() => {
  state.features = new Set(['market_dates']);
  state.result = { data: null, error: null };
  state.rpc = { data: 'm1', error: null };
  state.calls = [];
  revalidatePath.mockReset();
  logger.error.mockReset();
});

describe('saveMarket', () => {
  it('saves a new market through save_market and refreshes the list', async () => {
    expect(await saveMarket(form)).toEqual({ ok: true, id: 'm1' });
    expect(state.calls[0]).toContain('rpc(save_market,{"p_tenant_id":"t1","p":{"name":"Holly Fair"');
    expect(state.calls[0]).not.toContain('p_event_id');
    expect(revalidatePath).toHaveBeenCalledWith('/manage/markets');
  });
  it('saves over an existing market by its id', async () => {
    await saveMarket({ ...form, id: 'm7' });
    expect(state.calls[0]).toContain('"p_event_id":"m7"');
  });
  it('refuses when Markets is off, and when the form is wrong', async () => {
    state.features = new Set();
    expect(await saveMarket(form)).toEqual({ ok: false, error: 'Markets aren’t switched on for this site.' });
    state.features = new Set(['market_dates']);
    expect(await saveMarket({ ...form, name: '' })).toEqual({ ok: false, error: 'Add the market’s name.' });
    expect(state.calls).toEqual([]);
  });
  it('turns database refusals into plain words', async () => {
    for (const [code, words] of [
      ['P0031', 'up to 40 markets'],
      ['P0030', 'up to 20 costs'],
      ['P0002', 'was removed'],
      ['XX000', 'couldn’t be saved'],
    ] as const) {
      state.rpc = { data: null, error: { code, message: 'x' } };
      const r = await saveMarket(form);
      expect(r.ok).toBe(false);
      expect(r.ok ? '' : r.error).toContain(words);
    }
    expect(logger.error).toHaveBeenCalledTimes(1);
  });
});

describe('removeMarket', () => {
  it('removes the market of this site', async () => {
    expect(await removeMarket('m1')).toEqual({ ok: true });
    expect(state.calls).toEqual(['from(events)', 'delete()', 'eq("tenant_id","t1")', 'eq("id","m1")']);
  });
  it('says so when it fails, or when Markets is off', async () => {
    state.result = { data: null, error: { message: 'down' } };
    expect(await removeMarket('m1')).toEqual({ ok: false, error: 'The market couldn’t be removed. Try again in a moment.' });
    state.features = new Set();
    expect((await removeMarket('m1')).ok).toBe(false);
  });
});

describe('market reads', () => {
  it('lists markets with their costs added up', async () => {
    state.result = {
      data: [
        { id: 'a', name: 'Holly Fair', event_date: '2026-11-21', end_date: null, location: null, status: 'canceled', rating: null, event_expenses: [] },
        { id: 'b', name: 'Scituate', event_date: '2026-10-10', end_date: '2026-10-12', location: 'Scituate', status: 'upcoming', rating: 4, event_expenses: [{ amount_cents: 4000 }, { amount_cents: 1250 }] },
      ],
      error: null,
    };
    expect(await listMarkets(await db(), 't1')).toEqual([
      { id: 'a', name: 'Holly Fair', date: '2026-11-21', endDate: '', town: '', canceled: true, rating: 0, costs: '$0' },
      { id: 'b', name: 'Scituate', date: '2026-10-10', endDate: '2026-10-12', town: 'Scituate', canceled: false, rating: 4, costs: '$52.50' },
    ]);
  });

  it('throws a read failure rather than show an empty list', async () => {
    state.result = { data: null, error: { message: 'down' } };
    await expect(listMarkets(await db(), 't1')).rejects.toThrow('Could not load your markets: down');
    await expect(getMarket(await db(), 't1', 'b')).rejects.toThrow('Could not load the market: down');
  });

  it('is null for a market that is not there, and empty for a site with none', async () => {
    expect(await getMarket(await db(), 't1', 'b')).toBeNull();
    expect(await listMarkets(await db(), 't1')).toEqual([]);
  });

  it('reads one market back into the form, costs in the order added', async () => {
    state.result = {
      data: {
        id: 'b',
        name: 'Scituate',
        event_date: '2026-10-10',
        end_date: '2026-10-12',
        hours: '10-5',
        location: 'Scituate',
        address: '1 Main',
        booth: 'B4',
        url: 'https://fair.org/',
        status: 'upcoming',
        organizer_name: 'Ann',
        organizer_phone: null,
        organizer_email: null,
        notes: null,
        rating: 4,
        go_back: 'maybe',
        review: null,
        event_expenses: [
          { description: 'Gas', amount_cents: 1250, created_at: '2026-10-02' },
          { description: 'Booth fee', amount_cents: 4000, created_at: '2026-10-01' },
        ],
      },
      error: null,
    };
    expect(await getMarket(await db(), 't1', 'b')).toMatchObject({
      id: 'b',
      endDate: '2026-10-12',
      organizerName: 'Ann',
      organizerPhone: '',
      goBack: 'maybe',
      costs: [
        { description: 'Booth fee', amount: '40' },
        { description: 'Gas', amount: '12.50' },
      ],
    });
  });
});
