/**
 * The buttons and labels a new site starts with, copied from a family site that
 * has every one the design shows: the moods' set and the shoreline design's
 * (Scenic is drawn by it, so every site can wear it). Shared by the hand-run
 * builder and the automatic build.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { siteWordKeys } from './site-plan';

type Db = SupabaseClient<Database>;

export async function referenceWords(db: Db, from?: string): Promise<Record<string, string>> {
  const need = siteWordKeys('family');
  const read = async (tenantId: string): Promise<Map<string, string>> => {
    const { data, error } = await db.from('site_words').select('key, text').eq('tenant_id', tenantId);
    if (error !== null) throw new Error(`reading words failed: ${error.message}`);
    return new Map((data ?? []).map((r) => [r.key, r.text]));
  };
  const complete = (words: Map<string, string>): boolean => need.every((k) => words.has(k));
  const pick = (words: Map<string, string>): Record<string, string> => Object.fromEntries(need.map((k) => [k, words.get(k) ?? '']));
  if (from !== undefined) {
    const { data } = await db.from('tenants').select('id').eq('subdomain', from).maybeSingle();
    if (data === null) throw new Error(`no site called ${from}`);
    const words = await read(data.id);
    if (!complete(words)) throw new Error(`${from} is missing some of the design's words: ${need.filter((k) => !words.has(k)).slice(0, 5).join(', ')}…`);
    return pick(words);
  }
  const { data: pages, error } = await db.from('content_pages').select('tenant_id, layout_tree');
  if (error !== null) throw new Error(`reading pages failed: ${error.message}`);
  const ids = [...new Set((pages ?? []).filter((p) => (p.layout_tree as { root?: { archetypeKey?: unknown } } | null)?.root?.archetypeKey === 'main-street').map((p) => p.tenant_id))];
  for (const id of ids) {
    const words = await read(id);
    if (complete(words)) return pick(words);
  }
  throw new Error('no family site has every word the design shows');
}
