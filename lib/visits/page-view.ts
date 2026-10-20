/**
 * Visitor numbers (Alex, 2026-10-20): every page a shopper sees on a maker's site
 * is counted in Cloudflare's Workers Analytics Engine (the VISITS dataset in
 * wrangler.jsonc). No cookies and nothing personal: one data point names the
 * site, the page, and, when the shopper arrived from outside the site, where
 * they came from.
 *
 * A **page view** is every page shown, a full load or a click inside the site.
 * A **visit** is an arrival from outside the site (no address of this site in
 * the Referer). Without a cookie we can't tell a returning person apart; a
 * visit is the honest cookie-free count.
 *
 * Data point layout (read back in `queries.ts`):
 *   indexes[0] = tenant id (also the sampling key)
 *   blobs      = [tenant id, path, source ('' when not a visit)]
 *   doubles    = [1 when a visit, else 0]
 */

/** The query flag every printed QR code carries, so a visit from one is named. */
export const QR_PARAM = 'qr';

/** Where visits come from: a few named places, otherwise the referring site's own name. */
export type Source = 'direct' | 'qr' | 'search' | 'facebook' | 'instagram' | 'pinterest' | 'tiktok' | 'etsy' | 'bohdiai' | string;

export type PageView = { path: string; visit: boolean; source: string };

export type PageViewRequest = {
  method: string;
  host: string;
  path: string;
  search: URLSearchParams;
  headers: { get(name: string): string | null };
};

/** Crawlers, link previews, monitors and scripts: never counted. */
const BOT = /bot|crawl|spider|slurp|preview|monitor|facebookexternalhit|whatsapp|headless|lighthouse|curl|wget|python|httpclient|go-http|okhttp|java\//i;

const SEARCH = /(^|\.)(google|bing|duckduckgo|yahoo|ecosia|yandex|baidu|startpage|brave)\./;

const NAMED: readonly [RegExp, Source][] = [
  [/(^|\.)(facebook\.com|fb\.com|fb\.me|messenger\.com)$/, 'facebook'],
  [/(^|\.)instagram\.com$/, 'instagram'],
  [/(^|\.)(pinterest\.[a-z.]+|pin\.it)$/, 'pinterest'],
  [/(^|\.)tiktok\.com$/, 'tiktok'],
  [/(^|\.)etsy\.com$/, 'etsy'],
  [/(^|\.)bohdiai\.com$/, 'bohdiai'],
];

/** Where an arrival came from, from its Referer (null host: typed, bookmarked, or an app). */
export function sourceOf(refererHost: string | null, fromQr: boolean): Source {
  if (fromQr) return 'qr';
  if (refererHost === null) return 'direct';
  const host = refererHost.toLowerCase().replace(/^www\./, '');
  if (SEARCH.test(`${host}.`)) return 'search';
  for (const [pattern, name] of NAMED) if (pattern.test(host)) return name;
  return host;
}

function hostOf(url: string | null): string | null {
  if (url === null || url === '') return null;
  try {
    return new URL(url).host.toLowerCase();
  } catch {
    return null;
  }
}

/** A page path as counted: no trailing slash, at most 200 characters. */
export function countedPath(path: string): string {
  const trimmed = path.length > 1 ? path.replace(/\/+$/, '') : path;
  return (trimmed === '' ? '/' : trimmed).slice(0, 200);
}

/**
 * The page view this request is, or null when it isn't one: not a GET, an API
 * call, a prefetch, a file, or a bot. A full page load asks for HTML; a click
 * inside the site is a Next.js navigation (the `rsc` header) that isn't a prefetch.
 */
export function pageViewOf(req: PageViewRequest): PageView | null {
  if (req.method !== 'GET') return null;
  if (req.path.startsWith('/api/') || req.path.startsWith('/_next/') || /\.[a-z0-9]{2,5}$/i.test(req.path)) return null;
  const ua = req.headers.get('user-agent') ?? '';
  if (ua === '' || BOT.test(ua)) return null;
  if (req.headers.get('next-router-prefetch') !== null || req.headers.get('purpose') === 'prefetch' || req.headers.get('sec-purpose')?.includes('prefetch') === true) return null;
  const navigation = req.headers.get('rsc') === '1';
  const document = (req.headers.get('accept') ?? '').includes('text/html');
  if (!navigation && !document) return null;
  const from = hostOf(req.headers.get('referer'));
  const visit = !navigation && from !== req.host.toLowerCase();
  return { path: countedPath(req.path), visit, source: visit ? sourceOf(from, req.search.has(QR_PARAM)) : '' };
}

/** Count one page view for a site. Never throws: a counting problem never stops a page. */
export function recordPageView(dataset: AnalyticsEngineDataset | undefined, tenantId: string, view: PageView): void {
  if (dataset === undefined) return;
  try {
    dataset.writeDataPoint({ indexes: [tenantId], blobs: [tenantId, view.path, view.source], doubles: [view.visit ? 1 : 0] });
  } catch (err) {
    // The page always comes first; the miss is logged, never shown to the shopper.
    console.error('[visits] page view not counted:', err instanceof Error ? err.message : String(err));
  }
}
