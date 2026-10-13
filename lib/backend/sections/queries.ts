/** Section words — read. Used by the backend (the person's own client, RLS
 *  applies) and by the storefront (service role). */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { sectionsFromRows, type SiteSections } from './sections-form';

export const SECTION_COLUMNS = 'section, kicker, title, lede, more_label, more_target, empty_text, nav_label, page_title';

export async function getSiteSections(db: SupabaseClient<Database>, tenantId: string): Promise<SiteSections> {
  const { data, error } = await db.from('site_sections').select(SECTION_COLUMNS).eq('tenant_id', tenantId);
  if (error !== null) throw new Error(`Could not load the section words: ${error.message}`);
  return sectionsFromRows(data ?? []);
}
