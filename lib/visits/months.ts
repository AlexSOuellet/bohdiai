/**
 * Full sites keep their visitor numbers month by month for as long as they're on
 * Full (Alex, 2026-10-20). Cloudflare keeps three months; the daily job saves
 * each finished month into site_visit_months before it's gone. Saved months are
 * never changed afterwards, and stay if the site steps down from Full.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/lib/database.types';
import { monthRange, savableMonths, summary, type PageCount, type SourceCount, type SqlRunner } from './queries';

type Db = SupabaseClient<Database>;

export type SavedMonth = { month: string; visits: number; pageViews: number; topPages: PageCount[]; sources: SourceCount[] };

/** 'YYYY-MM-01' for a month's first day. */
export function monthKey(month: Date): string {
  return month.toISOString().slice(0, 10);
}

/** The Full sites (live, not deleted) whose months are saved. */
async function fullSites(db: Db): Promise<string[]> {
  const { data, error } = await db.from('tenants').select('id').eq('plan', 'full').eq('status', 'active').is('deleted_at', null);
  if (error !== null) throw new Error(`visit months: couldn't list Full sites: ${error.message}`);
  return data.map((t) => t.id);
}

/** Whether a site is on Full (its months are kept). */
export async function isOnFull(db: Db, tenantId: string): Promise<boolean> {
  const { data, error } = await db.from('tenants').select('plan').eq('id', tenantId).maybeSingle();
  if (error !== null) throw new Error(`visit months: couldn't read the plan: ${error.message}`);
  return data?.plan === 'full';
}

export type SaveResult = { saved: number; sites: number; failed: string[] };

/** Save every Full site's finished months that aren't saved yet. Safe to run any number of times. */
export async function saveFinishedMonths(db: Db, run: SqlRunner, now: Date): Promise<SaveResult> {
  const sites = await fullSites(db);
  const months = savableMonths(now).map(monthKey);
  const result: SaveResult = { saved: 0, sites: sites.length, failed: [] };
  if (sites.length === 0) return result;
  const { data: have, error } = await db.from('site_visit_months').select('tenant_id, month').in('tenant_id', sites).in('month', months);
  if (error !== null) throw new Error(`visit months: couldn't read saved months: ${error.message}`);
  const done = new Set(have.map((r) => `${r.tenant_id}|${r.month}`));
  for (const tenantId of sites) {
    for (const month of months) {
      if (done.has(`${tenantId}|${month}`)) continue;
      try {
        const s = await summary(run, tenantId, monthRange(new Date(`${month}T00:00:00Z`)));
        const { error: insertError } = await db.from('site_visit_months').insert({
          tenant_id: tenantId,
          month,
          visits: s.visits,
          page_views: s.pageViews,
          top_pages: s.topPages as unknown as Json,
          sources: s.sources as unknown as Json,
        });
        if (insertError !== null) throw new Error(insertError.message);
        result.saved++;
      } catch (err) {
        result.failed.push(`${tenantId} ${month}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }
  return result;
}

function pages(v: Json): PageCount[] {
  if (!Array.isArray(v)) return [];
  return v.flatMap((p) => (p !== null && typeof p === 'object' && !Array.isArray(p) && typeof p['path'] === 'string' && typeof p['views'] === 'number' ? [{ path: p['path'], views: p['views'] }] : []));
}

function froms(v: Json): SourceCount[] {
  if (!Array.isArray(v)) return [];
  return v.flatMap((s) => (s !== null && typeof s === 'object' && !Array.isArray(s) && typeof s['source'] === 'string' && typeof s['visits'] === 'number' ? [{ source: s['source'], visits: s['visits'] }] : []));
}

/** A site's saved months, newest first. */
export async function savedMonths(db: Db, tenantId: string): Promise<SavedMonth[]> {
  const { data, error } = await db.from('site_visit_months').select('month, visits, page_views, top_pages, sources').eq('tenant_id', tenantId).order('month', { ascending: false });
  if (error !== null) throw new Error(`visit months: couldn't read them: ${error.message}`);
  return data.map((r) => ({ month: r.month, visits: r.visits, pageViews: r.page_views, topPages: pages(r.top_pages), sources: froms(r.sources) }));
}
