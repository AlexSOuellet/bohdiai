import { describe, it, expect, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { loadVisits, pageName, sourceName } from './home';
import type { SqlRunner } from './queries';

const T = '8213be9b-2089-4500-a598-ad24ba890c37';
const NOW = new Date('2026-10-20T12:00:00Z');

/** Supabase stand-in answering by table: tenants (the plan), listings/collections (names), site_visit_months. */
function db(answers: Record<string, unknown>): SupabaseClient<Database> {
  const chain = (table: string): unknown => {
    const p: unknown = new Proxy(() => undefined, {
      get(_t, prop) {
        if (prop === 'then') return (ok: (v: unknown) => unknown) => Promise.resolve(answers[table] ?? { data: [], error: null }).then(ok);
        return () => p;
      },
    });
    return p;
  };
  return { from: (t: string) => chain(t) } as unknown as SupabaseClient<Database>;
}

const run: SqlRunner = (sql) => {
  if (sql.includes('GROUP BY path')) return Promise.resolve([{ path: '/', views: 9 }, { path: '/listings/blue%20pot', views: 4 }, { path: '/collections/cups', views: 2 }, { path: '/listings/gone', views: 1 }]);
  if (sql.includes('GROUP BY source')) return Promise.resolve([{ source: 'qr', visits: 3 }, { source: 'craftblog.example', visits: 1 }]);
  // This week's range starts on the 13th; last week's on the 6th.
  return Promise.resolve(sql.includes("'2026-10-13 12:00:00') AND timestamp < toDateTime('2026-10-20") ? [{ views: 20, visits: 6 }] : [{ views: 10, visits: 4 }]);
};

describe('pageName and sourceName', () => {
  it('name pages by what they show', () => {
    const products = new Map([['teapot', 'Blue teapot']]);
    const collections = new Map([['cups', 'Cups']]);
    expect(pageName('/', products, collections)).toBe('Home page');
    expect(pageName('/listings/teapot', products, collections)).toBe('Blue teapot');
    expect(pageName('/listings/old', products, collections)).toBe('old');
    expect(pageName('/collections/cups', products, collections)).toBe('Cups');
    expect(pageName('/collections/%E0%A4%A', products, collections)).toBe('%E0%A4%A');
    expect(pageName('/listings', products, collections)).toBe('/listings');
    expect(pageName('/somewhere', products, collections)).toBe('/somewhere');
  });
  it('name sources plainly', () => {
    expect(sourceName('qr')).toBe('Your QR codes');
    expect(sourceName('direct')).toBe('Typed in, bookmarked or from an app');
    expect(sourceName('craftblog.example')).toBe('craftblog.example');
  });
});

describe('loadVisits', () => {
  const base = { tenantId: T, now: NOW, onError: vi.fn() };
  it('says the numbers start at publish for a draft, and are off without settings', async () => {
    expect(await loadVisits({ ...base, db: db({}), run, draft: true })).toEqual({ kind: 'draft' });
    expect(await loadVisits({ ...base, db: db({}), run: null, draft: false })).toEqual({ kind: 'off' });
  });
  it('shows this week against last, named pages and sources; no months off Full', async () => {
    const view = await loadVisits({
      ...base,
      db: db({ tenants: { data: { plan: 'lite' }, error: null }, listings: { data: [{ slug: 'blue pot', name: 'Blue pot' }, { slug: null, name: 'x' }], error: null }, collections: { data: [{ slug: 'cups', name: 'Cups' }], error: null } }),
      run,
      draft: false,
    });
    expect(view).toEqual({
      kind: 'numbers',
      week: { visits: 6, pageViews: 20 },
      lastWeek: { visits: 4, pageViews: 10 },
      topPages: [
        { name: 'Home page', count: 9 },
        { name: 'Blue pot', count: 4 },
        { name: 'Cups', count: 2 },
        { name: 'gone', count: 1 },
      ],
      sources: [
        { name: 'Your QR codes', count: 3 },
        { name: 'craftblog.example', count: 1 },
      ],
      months: null,
    });
  });
  it('adds the saved months on Full', async () => {
    const view = await loadVisits({
      ...base,
      db: db({ tenants: { data: { plan: 'full' }, error: null }, site_visit_months: { data: [{ month: '2026-09-01', visits: 3, page_views: 9, top_pages: [], sources: [] }], error: null } }),
      run,
      draft: false,
    });
    expect(view.kind === 'numbers' && view.months).toEqual([{ month: '2026-09-01', visits: 3, pageViews: 9, topPages: [], sources: [] }]);
  });
  it('turns any failure into its own view and reports it', async () => {
    const onError = vi.fn();
    const down: SqlRunner = () => Promise.reject(new Error('down'));
    expect(await loadVisits({ ...base, onError, db: db({ tenants: { data: { plan: 'lite' }, error: null } }), run: down, draft: false })).toEqual({ kind: 'failed' });
    expect(onError).toHaveBeenCalledTimes(1);
    const badNames = db({ tenants: { data: { plan: 'lite' }, error: null }, listings: { data: null, error: { message: 'x' } } });
    expect(await loadVisits({ ...base, onError, db: badNames, run, draft: false })).toEqual({ kind: 'failed' });
  });
});
