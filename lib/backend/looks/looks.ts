/**
 * Try on a look (Full; Alex, 2026-10-17 and 2026-10-25): the owner sees her own site
 * in every mood, built like bohdiai.com/looks, and keeps the one she likes. A mood
 * opens in its family's own main skin, as on the looks page. Keeping one changes
 * only the page record's settings (its mood and look); her content stays in its homes.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/lib/database.types';
import { LOOKS, type Look } from '@/lib/site/looks';
import type { MoodKey } from '@/lib/moods';

type Db = SupabaseClient<Database>;

/** The site's look as it is now, and whether it has its own photo for Scenic to show behind the page. */
export type CurrentLook = { mood: string | null; skin: string | null; hasScene: boolean };

type Root = { archetypeKey?: unknown; mood?: unknown; lookKey?: unknown } & Record<string, Json | undefined>;

async function homeRoot(db: Db, tenantId: string): Promise<{ id: string; tree: Record<string, Json | undefined>; root: Root } | null> {
  const { data, error } = await db.from('content_pages').select('id, layout_tree').eq('tenant_id', tenantId).eq('slug', '/').maybeSingle();
  if (error !== null) throw new Error(`Could not read the site’s look: ${error.message}`);
  const tree = data?.layout_tree as Record<string, Json | undefined> | null | undefined;
  const root = tree?.['root'] as Root | undefined;
  if (data === null || tree == null || root === undefined || root.archetypeKey !== 'main-street') return null;
  return { id: data.id, tree, root };
}

/** The site's current look, or null when it isn't a standard (family) site. */
export async function currentLook(db: Db, tenantId: string): Promise<CurrentLook | null> {
  const home = await homeRoot(db, tenantId);
  if (home === null) return null;
  const { data, error } = await db.from('site_scenes').select('tenant_id').eq('tenant_id', tenantId).maybeSingle();
  if (error !== null) throw new Error(`Could not read the site’s background photo: ${error.message}`);
  return {
    mood: typeof home.root.mood === 'string' ? home.root.mood : null,
    skin: typeof home.root.lookKey === 'string' ? home.root.lookKey : null,
    hasScene: data !== null,
  };
}

/** The look for a mood, when it is one. */
export function lookFor(mood: string): Look | null {
  return LOOKS.find((l) => l.mood === mood) ?? null;
}

/** Whether a look can be kept on this site: Scenic needs the site's own photo behind
 *  the page (it never falls back to the sample marsh). */
export function canWear(look: Pick<Look, 'mood'>, current: Pick<CurrentLook, 'hasScene'>): boolean {
  return look.mood !== 'scenic' || current.hasScene;
}

/** Keep a mood: the page record's mood and look switch to it; nothing else changes. */
export async function keepLook(db: Db, tenantId: string, mood: MoodKey, skin: string): Promise<void> {
  const home = await homeRoot(db, tenantId);
  if (home === null) throw new Error('Not a standard site');
  const tree = { ...home.tree, root: { ...home.root, mood, lookKey: skin } } as Json;
  const { error } = await db.from('content_pages').update({ layout_tree: tree }).eq('id', home.id);
  if (error !== null) throw new Error(`Could not keep the look: ${error.message}`);
}
