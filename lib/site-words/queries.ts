/** A site's words — read. The storefront reads with the service role. */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { logger } from '@/lib/logger';
import { wordsFrom, type WordShape, type Words } from './words';

/** The site's words for one design's spots. A spot with no word shows blank and
 *  is logged, so a gap is seen and fixed, never filled with a made-up word. */
export async function getSiteWords<S extends WordShape>(db: SupabaseClient<Database>, tenantId: string, shape: S, prefix: string): Promise<Words<S>> {
  const { data, error } = await db.from('site_words').select('key, text').eq('tenant_id', tenantId).like('key', `${prefix}.%`);
  if (error !== null) throw new Error(`Could not load the site’s words: ${error.message}`);
  const missing: string[] = [];
  const words = wordsFrom(shape, prefix, new Map((data ?? []).map((r) => [r.key, r.text])), missing);
  if (missing.length > 0) logger.warn('site words: spots with no word', { tenantId, prefix, missing });
  return words;
}
