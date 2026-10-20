import { describe, it, expect, vi } from 'vitest';
import { appVisitsReader, lastDays, monthRange, savableMonths, sources, summary, topPages, totals, visitsReader, type SqlRunner } from './queries';

const T = '8213be9b-2089-4500-a598-ad24ba890c37';
const RANGE = { from: new Date('2026-10-13T00:00:00Z'), to: new Date('2026-10-20T00:00:00Z') };

describe('visitsReader', () => {
  it('is off without both settings', () => {
    expect(visitsReader({ accountId: undefined, token: 'x' })).toBeNull();
    expect(visitsReader({ accountId: 'a', token: '' })).toBeNull();
    expect(visitsReader({ accountId: '', token: 'x' })).toBeNull();
    expect(visitsReader({ accountId: 'a', token: undefined })).toBeNull();
  });
  it('asks Cloudflare with the token and returns the rows', async () => {
    const fetcher = vi.fn(() => Promise.resolve(new Response(JSON.stringify({ data: [{ views: 3 }] }), { status: 200 })));
    const run = visitsReader({ accountId: 'acct', token: 'tok' }, fetcher as unknown as typeof fetch)!;
    expect(await run('SELECT 1')).toEqual([{ views: 3 }]);
    expect(fetcher).toHaveBeenCalledWith('https://api.cloudflare.com/client/v4/accounts/acct/analytics_engine/sql', {
      method: 'POST',
      headers: { Authorization: 'Bearer tok' },
      body: 'SELECT 1 FORMAT JSON',
    });
  });
  it('throws on a refused or odd answer', async () => {
    const refused = visitsReader({ accountId: 'a', token: 't' }, (() => Promise.resolve(new Response('no', { status: 403 }))) as unknown as typeof fetch)!;
    await expect(refused('SELECT 1')).rejects.toThrow('Cloudflare answered 403');
    const odd = visitsReader({ accountId: 'a', token: 't' }, (() => Promise.resolve(new Response('{}', { status: 200 }))) as unknown as typeof fetch)!;
    await expect(odd('SELECT 1')).rejects.toThrow('unexpected answer');
  });
  it('reads the app settings', () => {
    vi.stubEnv('CLOUDFLARE_ACCOUNT_ID', '');
    expect(appVisitsReader()).toBeNull();
    vi.stubEnv('CLOUDFLARE_ACCOUNT_ID', 'a');
    vi.stubEnv('CLOUDFLARE_ANALYTICS_TOKEN', 't');
    expect(appVisitsReader()).not.toBeNull();
    vi.unstubAllEnvs();
  });
});

describe('the counts', () => {
  it('totals sums sampled rows for the site and the range', async () => {
    const run = vi.fn<SqlRunner>(() => Promise.resolve([{ views: '12', visits: 4 }]));
    expect(await totals(run, T, RANGE)).toEqual({ pageViews: 12, visits: 4 });
    const sql = run.mock.calls[0]![0];
    expect(sql).toContain(`index1 = '${T}'`);
    expect(sql).toContain("toDateTime('2026-10-13 00:00:00')");
    expect(sql).toContain('SUM(_sample_interval)');
  });
  it('totals reads an empty answer as nothing', async () => {
    expect(await totals(() => Promise.resolve([]), T, RANGE)).toEqual({ pageViews: 0, visits: 0 });
    expect(await totals(() => Promise.resolve([{ views: null, visits: 'x' }]), T, RANGE)).toEqual({ pageViews: 0, visits: 0 });
  });
  it('refuses anything but a site id in the query', async () => {
    await expect(totals(() => Promise.resolve([]), "x' OR 1=1 --", RANGE)).rejects.toThrow('not a site id');
  });
  it('topPages and sources drop empty rows', async () => {
    const pages = await topPages(() => Promise.resolve([{ path: '/', views: 5 }, { path: '', views: 2 }, { path: 7, views: 1 }, { path: '/x', views: 0 }]), T, RANGE);
    expect(pages).toEqual([{ path: '/', views: 5 }]);
    const from = await sources(() => Promise.resolve([{ source: 'qr', visits: 3 }, { source: '', visits: 9 }]), T, RANGE);
    expect(from).toEqual([{ source: 'qr', visits: 3 }]);
  });
  it('summary puts the three together', async () => {
    const run: SqlRunner = (sql) =>
      Promise.resolve(sql.includes('GROUP BY path') ? [{ path: '/', views: 2 }] : sql.includes('GROUP BY source') ? [{ source: 'direct', visits: 1 }] : [{ views: 2, visits: 1 }]);
    expect(await summary(run, T, RANGE)).toEqual({ pageViews: 2, visits: 1, topPages: [{ path: '/', views: 2 }], sources: [{ source: 'direct', visits: 1 }] });
  });
});

describe('ranges', () => {
  it('lastDays is the last n days and the n before', () => {
    const now = new Date('2026-10-20T12:00:00Z');
    const { current, previous } = lastDays(now, 7);
    expect(current).toEqual({ from: new Date('2026-10-13T12:00:00Z'), to: now });
    expect(previous).toEqual({ from: new Date('2026-10-06T12:00:00Z'), to: new Date('2026-10-13T12:00:00Z') });
  });
  it('monthRange is the whole calendar month', () => {
    expect(monthRange(new Date('2026-12-15T00:00:00Z'))).toEqual({ from: new Date('2026-12-01T00:00:00Z'), to: new Date('2027-01-01T00:00:00Z') });
  });
  it('savableMonths are the two whole months Cloudflare still holds', () => {
    expect(savableMonths(new Date('2026-01-05T00:00:00Z'))).toEqual([new Date('2025-12-01T00:00:00Z'), new Date('2025-11-01T00:00:00Z')]);
  });
});
