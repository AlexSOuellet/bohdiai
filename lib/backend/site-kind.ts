/** Whether a site is a standard site (a family design) rather than a custom site.
 *  Standard-site screens (the gallery switch) only apply to family designs. */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { getFamily } from '@/lib/archetypes/main-street/families';

export async function isFamilySite(db: SupabaseClient<Database>, tenantId: string): Promise<boolean> {
  const { data, error } = await db.from('content_pages').select('layout_tree').eq('tenant_id', tenantId).eq('slug', '/').maybeSingle();
  if (error !== null) throw new Error(`Could not read the site’s design: ${error.message}`);
  const tree = data?.layout_tree as { root?: { archetypeKey?: unknown } } | null | undefined;
  return tree?.root?.archetypeKey === 'main-street';
}

/** Whether the site's design shows the scrolling line (Alex, 2026-10-22: "turn it off
 *  for sites it is not included in the design for"). Every mood whose page has it
 *  shows it, except Scenic, which the shoreline look draws; Spotlight has none
 *  (Session 118); the custom designs never read its phrases. A site without it
 *  gets no Scrolling line screen. */
export async function showsScrollingLine(db: SupabaseClient<Database>, tenantId: string): Promise<boolean> {
  const { data, error } = await db.from('content_pages').select('layout_tree').eq('tenant_id', tenantId).eq('slug', '/').maybeSingle();
  if (error !== null) throw new Error(`Could not read the site’s design: ${error.message}`);
  const root = (data?.layout_tree as { root?: { archetypeKey?: unknown; mood?: unknown } } | null | undefined)?.root;
  if (root?.archetypeKey !== 'main-street') return false;
  const family = getFamily(typeof root.mood === 'string' ? root.mood : undefined);
  return family.key !== 'scenic' && family.sectionStack.some((e) => e.section === 'marquee' && e.on);
}
