import { describe, it, expect } from 'vitest';
import { change, loadMarketResults, marketResults, rankedForYear, signedMoney, yearTotals } from './results';

const markets = [
  { id: 'a', name: 'Harvest Fair', date: '2026-10-24', town: 'Bristol', canceled: false, rating: 5, costsCents: 5000 },
  { id: 'b', name: 'Holiday Market', date: '2026-11-14', town: 'Warren', canceled: false, rating: 3, costsCents: 9000 },
  { id: 'c', name: 'Rained out', date: '2026-09-01', town: '', canceled: true, rating: 0, costsCents: 2000 },
  { id: 'd', name: 'Harvest Fair', date: '2025-10-25', town: 'Bristol', canceled: false, rating: 4, costsCents: 4000 },
];
const sales = [
  { eventId: 'a', totalCents: 2800 },
  { eventId: 'a', totalCents: 6200 },
  { eventId: 'b', totalCents: 3400 },
  { eventId: 'd', totalCents: 7000 },
];

describe('market results', () => {
  const results = marketResults(markets, sales);

  it('adds up each market’s takings, costs and profit, leaving canceled ones out', () => {
    expect(results.map((r) => r.id)).toEqual(['a', 'b', 'd']);
    expect(results[0]).toMatchObject({ sales: 2, takingsCents: 9000, costsCents: 5000, profitCents: 4000 });
    expect(results[1]).toMatchObject({ sales: 1, takingsCents: 3400, profitCents: -5600 });
  });

  it('totals a year and compares it with the last', () => {
    expect(yearTotals(results, 2026)).toEqual({ year: 2026, markets: 2, takingsCents: 12400, costsCents: 14000, profitCents: -1600 });
    expect(yearTotals(results, 2025).profitCents).toBe(3000);
    expect(change(12400, 7000)).toBe('+$54');
    expect(change(-1600, 3000)).toBe('−$46');
    expect(change(5, 5)).toBe('$0');
    expect(signedMoney(-5600)).toBe('−$56');
    expect(signedMoney(4000)).toBe('$40');
  });

  it('ranks a year’s markets best profit first', () => {
    expect(rankedForYear(results, 2026).map((r) => r.id)).toEqual(['a', 'b']);
    expect(rankedForYear(results, 2024)).toEqual([]);
  });
});

function fakeDb(events: unknown[], orders: unknown[], fail: { events?: string; orders?: string } = {}) {
  const res = (data: unknown[], err?: string) => ({ data: err === undefined ? data : null, error: err === undefined ? null : { message: err } });
  const chain = (r: unknown) => {
    const c: Record<string, unknown> = {};
    for (const k of ['select', 'eq', 'not']) c[k] = () => c;
    c['then'] = (f: (v: unknown) => unknown) => Promise.resolve(r).then(f);
    return c;
  };
  return { from: (t: string) => (t === 'events' ? chain(res(events, fail.events)) : chain(res(orders, fail.orders))) } as unknown as Parameters<typeof loadMarketResults>[0];
}

describe('loading results', () => {
  it('reads her markets with their costs and her paid market sales', async () => {
    const db = fakeDb(
      [{ id: 'a', name: 'Harvest Fair', event_date: '2026-10-24', location: null, status: 'scheduled', rating: null, event_expenses: [{ amount_cents: 1500 }, { amount_cents: 500 }] }],
      [{ event_id: 'a', total_cents: 2800 }, { event_id: null, total_cents: 999 }],
    );
    expect(await loadMarketResults(db, 't1')).toEqual([{ id: 'a', name: 'Harvest Fair', date: '2026-10-24', town: '', rating: 0, sales: 1, takingsCents: 2800, costsCents: 2000, profitCents: 800 }]);
  });

  it('says which read failed', async () => {
    await expect(loadMarketResults(fakeDb([], [], { events: 'down' }), 't1')).rejects.toThrow('Could not load your markets: down');
    await expect(loadMarketResults(fakeDb([], [], { orders: 'down' }), 't1')).rejects.toThrow('Could not load your market sales: down');
  });
});
