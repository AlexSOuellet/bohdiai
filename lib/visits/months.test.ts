import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { isOnFull, monthKey, saveFinishedMonths, savedMonths } from './months';
import type { SqlRunner } from './queries';

/** A stand-in Supabase: each awaited query gives the next queued result; calls are recorded. */
function fakeDb(queue: unknown[]): { db: SupabaseClient<Database>; calls: string[] } {
  const calls: string[] = [];
  const chain = (): unknown => {
    const p: unknown = new Proxy(() => undefined, {
      get(_t, prop) {
        if (prop === 'then') return (ok: (v: unknown) => unknown, bad: (e: unknown) => unknown) => Promise.resolve(queue.shift() ?? { data: null, error: null }).then(ok, bad);
        return (...args: unknown[]) => {
          calls.push(`${String(prop)}(${args.map((a) => JSON.stringify(a)).join(',')})`);
          return p;
        };
      },
    });
    return p;
  };
  const db = { from: (t: string) => (calls.push(`from(${t})`), chain()) } as unknown as SupabaseClient<Database>;
  return { db, calls };
}

const A = '8213be9b-2089-4500-a598-ad24ba890c37';
const B = '1b7c2d4e-0000-4000-8000-000000000002';
const NOW = new Date('2026-10-20T07:15:00Z');
const run: SqlRunner = (sql) =>
  Promise.resolve(sql.includes('GROUP BY path') ? [{ path: '/', views: 9 }] : sql.includes('GROUP BY source') ? [{ source: 'qr', visits: 2 }] : [{ views: 9, visits: 3 }]);

describe('monthKey', () => {
  it('is the first day as YYYY-MM-DD', () => {
    expect(monthKey(new Date('2026-09-01T00:00:00Z'))).toBe('2026-09-01');
  });
});

describe('saveFinishedMonths', () => {
  it('saves the two finished months for each Full site, skipping months already saved', async () => {
    const { db, calls } = fakeDb([
      { data: [{ id: A }, { id: B }], error: null },
      { data: [{ tenant_id: A, month: '2026-09-01' }], error: null },
      { error: null },
      { error: null },
      { error: null },
    ]);
    const result = await saveFinishedMonths(db, run, NOW);
    expect(result).toEqual({ saved: 3, sites: 2, failed: [] });
    expect(calls).toContain('eq("plan","full")');
    expect(calls.filter((c) => c.startsWith('insert('))).toHaveLength(3);
    expect(calls).toContain(`insert({"tenant_id":"${A}","month":"2026-08-01","visits":3,"page_views":9,"top_pages":[{"path":"/","views":9}],"sources":[{"source":"qr","visits":2}]})`);
  });
  it('does nothing with no Full sites', async () => {
    const { db } = fakeDb([{ data: [], error: null }]);
    expect(await saveFinishedMonths(db, run, NOW)).toEqual({ saved: 0, sites: 0, failed: [] });
  });
  it('names each month it could not save, and goes on with the rest', async () => {
    const { db } = fakeDb([{ data: [{ id: A }], error: null }, { data: [], error: null }, { error: { message: 'dup' } }, { error: null }]);
    const result = await saveFinishedMonths(db, run, NOW);
    expect(result.saved).toBe(1);
    expect(result.failed).toEqual([`${A} 2026-09-01: dup`]);
    const down: SqlRunner = () => Promise.reject('down');
    const again = fakeDb([{ data: [{ id: A }], error: null }, { data: [], error: null }]);
    expect((await saveFinishedMonths(again.db, down, NOW)).failed).toEqual([`${A} 2026-09-01: down`, `${A} 2026-08-01: down`]);
  });
  it('throws when the sites or saved months cannot be read', async () => {
    await expect(saveFinishedMonths(fakeDb([{ data: null, error: { message: 'x' } }]).db, run, NOW)).rejects.toThrow("couldn't list Full sites");
    await expect(saveFinishedMonths(fakeDb([{ data: [{ id: A }], error: null }, { data: null, error: { message: 'x' } }]).db, run, NOW)).rejects.toThrow("couldn't read saved months");
  });
});

describe('isOnFull', () => {
  it('reads the plan', async () => {
    expect(await isOnFull(fakeDb([{ data: { plan: 'full' }, error: null }]).db, A)).toBe(true);
    expect(await isOnFull(fakeDb([{ data: { plan: 'lite' }, error: null }]).db, A)).toBe(false);
    expect(await isOnFull(fakeDb([{ data: null, error: null }]).db, A)).toBe(false);
    await expect(isOnFull(fakeDb([{ data: null, error: { message: 'x' } }]).db, A)).rejects.toThrow("couldn't read the plan");
  });
});

describe('savedMonths', () => {
  it('reads them newest first and keeps only well-formed rows in the lists', async () => {
    const { db, calls } = fakeDb([
      {
        data: [
          { month: '2026-09-01', visits: 3, page_views: 9, top_pages: [{ path: '/', views: 9 }, { path: 1 }, null, [1]], sources: [{ source: 'qr', visits: 2 }, { source: 'x' }, null, []] },
          { month: '2026-08-01', visits: 0, page_views: 0, top_pages: {}, sources: 'x' },
        ],
        error: null,
      },
    ]);
    expect(await savedMonths(db, A)).toEqual([
      { month: '2026-09-01', visits: 3, pageViews: 9, topPages: [{ path: '/', views: 9 }], sources: [{ source: 'qr', visits: 2 }] },
      { month: '2026-08-01', visits: 0, pageViews: 0, topPages: [], sources: [] },
    ]);
    expect(calls).toContain('order("month",{"ascending":false})');
  });
  it('throws when it cannot read them', async () => {
    await expect(savedMonths(fakeDb([{ data: null, error: { message: 'x' } }]).db, A)).rejects.toThrow("couldn't read them");
  });
});
