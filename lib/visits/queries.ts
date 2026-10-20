/**
 * Reading visitor numbers back from Cloudflare (Workers Analytics Engine SQL API).
 * The data point layout is in page-view.ts. Cloudflare may sample at high volume,
 * so every count sums `_sample_interval` instead of counting rows.
 *
 * Needs two settings: CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_ANALYTICS_TOKEN (an API
 * token with Account Analytics: Read). Without them `visitsReader` is null and the
 * home page says the numbers aren't switched on yet.
 */

export const VISITS_DATASET = 'bohdiai_visits';

export type Range = { from: Date; to: Date };
export type Totals = { visits: number; pageViews: number };
export type PageCount = { path: string; views: number };
export type SourceCount = { source: string; visits: number };
export type Summary = Totals & { topPages: PageCount[]; sources: SourceCount[] };

/** Runs one SQL statement and returns its rows. */
export type SqlRunner = (sql: string) => Promise<Record<string, unknown>[]>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TOP = 10;

/** The SQL runner for this deployment, or null when its settings are missing. */
export function visitsReader(env: { accountId: string | undefined; token: string | undefined }, fetcher: typeof fetch = fetch): SqlRunner | null {
  const { accountId, token } = env;
  if (accountId === undefined || accountId === '' || token === undefined || token === '') return null;
  return async (sql) => {
    const res = await fetcher(`https://api.cloudflare.com/client/v4/accounts/${accountId}/analytics_engine/sql`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: `${sql} FORMAT JSON`,
    });
    if (!res.ok) throw new Error(`visitor numbers: Cloudflare answered ${res.status}`);
    const body = (await res.json()) as { data?: unknown };
    if (!Array.isArray(body.data)) throw new Error('visitor numbers: unexpected answer from Cloudflare');
    return body.data as Record<string, unknown>[];
  };
}

/** The reader from the app's own settings. */
export function appVisitsReader(): SqlRunner | null {
  return visitsReader({ accountId: process.env['CLOUDFLARE_ACCOUNT_ID'], token: process.env['CLOUDFLARE_ANALYTICS_TOKEN'] });
}

function stamp(d: Date): string {
  // 'YYYY-MM-DD HH:MM:SS' in UTC, the form toDateTime reads.
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

function where(tenantId: string, range: Range): string {
  if (!UUID.test(tenantId)) throw new Error('visitor numbers: not a site id');
  return `index1 = '${tenantId}' AND timestamp >= toDateTime('${stamp(range.from)}') AND timestamp < toDateTime('${stamp(range.to)}')`;
}

function num(v: unknown): number {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
  return Number.isFinite(n) ? Math.round(n) : 0;
}

function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

export async function totals(run: SqlRunner, tenantId: string, range: Range): Promise<Totals> {
  const rows = await run(
    `SELECT SUM(_sample_interval) AS views, SUM(_sample_interval * double1) AS visits FROM ${VISITS_DATASET} WHERE ${where(tenantId, range)}`,
  );
  const row = rows[0] ?? {};
  return { pageViews: num(row['views']), visits: num(row['visits']) };
}

export async function topPages(run: SqlRunner, tenantId: string, range: Range): Promise<PageCount[]> {
  const rows = await run(
    `SELECT blob2 AS path, SUM(_sample_interval) AS views FROM ${VISITS_DATASET} WHERE ${where(tenantId, range)} GROUP BY path ORDER BY views DESC LIMIT ${TOP}`,
  );
  return rows.map((r) => ({ path: str(r['path']), views: num(r['views']) })).filter((p) => p.path !== '' && p.views > 0);
}

export async function sources(run: SqlRunner, tenantId: string, range: Range): Promise<SourceCount[]> {
  const rows = await run(
    `SELECT blob3 AS source, SUM(_sample_interval) AS visits FROM ${VISITS_DATASET} WHERE ${where(tenantId, range)} AND double1 = 1 GROUP BY source ORDER BY visits DESC LIMIT ${TOP}`,
  );
  return rows.map((r) => ({ source: str(r['source']), visits: num(r['visits']) })).filter((s) => s.source !== '' && s.visits > 0);
}

export async function summary(run: SqlRunner, tenantId: string, range: Range): Promise<Summary> {
  const [t, pages, from] = await Promise.all([totals(run, tenantId, range), topPages(run, tenantId, range), sources(run, tenantId, range)]);
  return { ...t, topPages: pages, sources: from };
}

const DAY = 24 * 60 * 60 * 1000;

/** The last `days` days up to `now`, and the same length just before it. */
export function lastDays(now: Date, days: number): { current: Range; previous: Range } {
  const to = now;
  const from = new Date(now.getTime() - days * DAY);
  return { current: { from, to }, previous: { from: new Date(from.getTime() - days * DAY), to: from } };
}

/** The calendar month (UTC) starting at `month`'s first day. */
export function monthRange(month: Date): Range {
  const from = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), 1));
  return { from, to: new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1)) };
}

/**
 * The finished months Cloudflare still holds (it keeps three months), newest
 * first: the two whole months before this one. The month three back is only
 * partly kept, so it's never saved.
 */
export function savableMonths(now: Date): Date[] {
  return [1, 2].map((back) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - back, 1)));
}
