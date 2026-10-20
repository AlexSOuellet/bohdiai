/**
 * The backend home's visitor numbers (Alex, 2026-10-20), on every plan: visits and
 * pages seen this week against last week, the most-seen pages and where visits
 * came from over the last 30 days. Full sites also show their saved months.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { lastDays, summary, totals, type SqlRunner } from './queries';
import { isOnFull, savedMonths, type SavedMonth } from './months';

type Db = SupabaseClient<Database>;

export type NamedCount = { name: string; count: number };

export type VisitsView =
  | { kind: 'off' }
  | { kind: 'draft' }
  | { kind: 'failed' }
  | {
      kind: 'numbers';
      week: { visits: number; pageViews: number };
      lastWeek: { visits: number; pageViews: number };
      topPages: NamedCount[];
      sources: NamedCount[];
      /** Full only: saved months, newest first. Null when the site isn't on Full. */
      months: SavedMonth[] | null;
    };

const PAGE_NAMES: Record<string, string> = {
  '/': 'Home page',
  '/shop': 'Shop',
  '/about': 'About',
  '/events': 'Markets',
  '/contact': 'Contact',
  '/collections': 'Collections',
  '/cart': 'Cart',
  '/market': 'Market shop',
  '/testimonials': 'Reviews',
  '/privacy': 'Privacy',
  '/terms': 'Terms',
};

const SOURCE_NAMES: Record<string, string> = {
  direct: 'Typed in, bookmarked or from an app',
  qr: 'Your QR codes',
  search: 'Google and other searches',
  facebook: 'Facebook',
  instagram: 'Instagram',
  pinterest: 'Pinterest',
  tiktok: 'TikTok',
  etsy: 'Etsy',
  bohdiai: 'BohdiAI',
};

export function sourceName(source: string): string {
  return SOURCE_NAMES[source] ?? source;
}

/** A page's name: the product or collection it shows, or the page's own name. */
export function pageName(path: string, products: ReadonlyMap<string, string>, collections: ReadonlyMap<string, string>): string {
  const fixed = PAGE_NAMES[path];
  if (fixed !== undefined) return fixed;
  const [, kind, slug] = path.split('/');
  const decoded = slug === undefined ? '' : safeDecode(slug);
  if (kind === 'listings' && decoded !== '') return products.get(decoded) ?? decoded;
  if (kind === 'collections' && decoded !== '') return collections.get(decoded) ?? decoded;
  return path;
}

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

async function names(db: Db, tenantId: string, table: 'listings' | 'collections', slugs: string[]): Promise<Map<string, string>> {
  if (slugs.length === 0) return new Map();
  const { data, error } = await db.from(table).select('slug, name').eq('tenant_id', tenantId).in('slug', slugs);
  if (error !== null) throw new Error(`visitor numbers: couldn't name pages: ${error.message}`);
  return new Map(data.flatMap((r) => (r.slug !== null && r.name !== null ? [[r.slug, r.name] as const] : [])));
}

function slugsUnder(paths: string[], kind: string): string[] {
  return paths.flatMap((p) => {
    const [, k, slug] = p.split('/');
    return k === kind && slug !== undefined && slug !== '' ? [safeDecode(slug)] : [];
  });
}

/** Everything the home's visitor section shows. Never throws: a failure is its own view. */
export async function loadVisits(opts: { db: Db; run: SqlRunner | null; tenantId: string; draft: boolean; now: Date; onError: (err: unknown) => void }): Promise<VisitsView> {
  if (opts.draft) return { kind: 'draft' };
  if (opts.run === null) return { kind: 'off' };
  const run = opts.run;
  try {
    const week = lastDays(opts.now, 7);
    const month = lastDays(opts.now, 30).current;
    const [now7, prev7, last30, months] = await Promise.all([
      totals(run, opts.tenantId, week.current),
      totals(run, opts.tenantId, week.previous),
      summary(run, opts.tenantId, month),
      isOnFull(opts.db, opts.tenantId).then((full) => (full ? savedMonths(opts.db, opts.tenantId) : null)),
    ]);
    const paths = last30.topPages.map((p) => p.path);
    const [products, collections] = await Promise.all([
      names(opts.db, opts.tenantId, 'listings', slugsUnder(paths, 'listings')),
      names(opts.db, opts.tenantId, 'collections', slugsUnder(paths, 'collections')),
    ]);
    return {
      kind: 'numbers',
      week: now7,
      lastWeek: prev7,
      topPages: last30.topPages.slice(0, 5).map((p) => ({ name: pageName(p.path, products, collections), count: p.views })),
      sources: last30.sources.slice(0, 5).map((s) => ({ name: sourceName(s.source), count: s.visits })),
      months,
    };
  } catch (err) {
    opts.onError(err);
    return { kind: 'failed' };
  }
}
