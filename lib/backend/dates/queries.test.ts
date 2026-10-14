import { describe, it, expect } from 'vitest';
import { listMarketDates, listVisitorMarketDates } from './queries';

type Result = { data: unknown; error: { message: string } | null };

/** A stand-in client that records the filters it was given. */
function fakeDb(result: Result, calls: string[]) {
  const chain = {
    select: () => chain,
    eq: (c: string, v: string) => (calls.push(`eq ${c} ${v}`), chain),
    neq: (c: string, v: string) => (calls.push(`neq ${c} ${v}`), chain),
    order: (c: string) => (calls.push(`order ${c}`), c === 'created_at' ? Promise.resolve(result) : chain),
  };
  return { from: () => chain } as unknown as Parameters<typeof listMarketDates>[0];
}

const row = { id: 'm1', event_date: '2026-10-17', end_date: null, name: 'Fair', location: 'Bristol', hours: null, address: null, booth: null, url: null, status: 'upcoming', created_at: 'x' };

describe('market date reads', () => {
  it('the owner sees every market, finished ones too', async () => {
    const calls: string[] = [];
    expect(await listMarketDates(fakeDb({ data: [row], error: null }, calls), 't1')).toMatchObject([{ id: 'm1', name: 'Fair', town: 'Bristol' }]);
    expect(calls).not.toContain('neq status completed');
  });
  it('a visitor sees every market except those marked finished', async () => {
    const calls: string[] = [];
    expect(await listVisitorMarketDates(fakeDb({ data: [row], error: null }, calls), 't1')).toMatchObject([{ id: 'm1' }]);
    expect(calls).toEqual(['eq tenant_id t1', 'neq status completed', 'order event_date', 'order created_at']);
  });
  it('says so when the markets can’t be read, and treats no rows as none', async () => {
    await expect(listVisitorMarketDates(fakeDb({ data: null, error: { message: 'boom' } }, []), 't1')).rejects.toThrow('Could not load the market dates: boom');
    await expect(listMarketDates(fakeDb({ data: null, error: { message: 'boom' } }, []), 't1')).rejects.toThrow('Could not load the market dates: boom');
    expect(await listVisitorMarketDates(fakeDb({ data: null, error: null }, []), 't1')).toEqual([]);
  });
});
