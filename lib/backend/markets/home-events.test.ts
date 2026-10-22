import { describe, it, expect, vi } from 'vitest';
import { eventsHome, loadEventsHome } from './home-events';
import type { MarketRowView } from './queries';
import type { MarketResult } from './results';

const m = (id: string, date: string, over: Partial<MarketRowView> = {}): MarketRowView => ({
  id,
  name: `Fair ${id}`,
  date,
  endDate: '',
  town: 'Bristol',
  canceled: false,
  rating: 0,
  costs: '$0',
  ...over,
});
const r = (id: string, date: string, takingsCents: number, costsCents = 0, sales = 1): MarketResult => ({
  id,
  name: `Fair ${id}`,
  date,
  town: 'Bristol',
  rating: 0,
  sales,
  takingsCents,
  costsCents,
  profitCents: takingsCents - costsCents,
});

describe('eventsHome', () => {
  const markets = [m('a', '2026-09-12'), m('b', '2026-10-18'), m('c', '2026-11-21'), m('d', '2026-10-25', { canceled: true }), m('z', '2025-10-04')];
  const results = [r('a', '2026-09-12', 20000, 5000, 4), r('b', '2026-10-18', 28400, 6500, 9), r('c', '2026-11-21', 0, 4000, 0), r('z', '2025-10-04', 15000, 3000)];

  it('finds the next event (canceled ones skipped), the last one with what it took in, and the year so far', () => {
    const view = eventsHome(markets, results, '2026-10-22', true);
    expect(view.next).toMatchObject({ id: 'c', today: false });
    expect(view.last).toMatchObject({ id: 'b', sales: 9, takingsCents: 28400, costsCents: 6500 });
    // Held so far: a and b this year (c is still to come), z last year.
    expect(view.year).toEqual({ year: 2026, markets: 2, takingsCents: 48400, profitCents: 36900, lastYearProfitCents: 12000, lastYearMarkets: 1 });
  });

  it('marks an event on today, including a multi-day one already started', () => {
    expect(eventsHome([m('a', '2026-10-22')], [], '2026-10-22', false).next?.today).toBe(true);
    expect(eventsHome([m('a', '2026-10-21', { endDate: '2026-10-23' })], [], '2026-10-22', false).next?.today).toBe(true);
  });

  it('leaves takings out without the market shop, and the year out without Results', () => {
    const showcase = eventsHome(markets, null, '2026-10-22', false);
    expect(showcase.last).toBeNull();
    expect(showcase.year).toBeNull();
    expect(eventsHome(markets, results, '2026-10-22', false).year).toBeNull();
  });

  it('says nothing about next or last when there are none', () => {
    expect(eventsHome([], [], '2026-10-22', true)).toMatchObject({ next: null, last: null, year: { markets: 0, takingsCents: 0 } });
  });
});

describe('loadEventsHome', () => {
  it('reads the results only where the plan has the market shop', async () => {
    const from = vi.fn((table: string) => {
      const result = table === 'events' ? { data: [], error: null } : { data: [], error: null };
      const chain: Record<string, unknown> = {};
      for (const k of ['select', 'eq', 'order', 'not']) chain[k] = () => chain;
      chain['then'] = (ok: (v: unknown) => unknown) => Promise.resolve(result).then(ok);
      return chain;
    });
    const db = { from } as never;
    expect(await loadEventsHome(db, 't1', '2026-10-22', { shop: false, records: false })).toEqual({ next: null, last: null, year: null });
    expect(from.mock.calls.map((c) => c[0])).toEqual(['events']);
    from.mockClear();
    await loadEventsHome(db, 't1', '2026-10-22', { shop: true, records: true });
    expect(from.mock.calls.map((c) => c[0]).sort()).toEqual(['events', 'events', 'orders']);
  });
});
