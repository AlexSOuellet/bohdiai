/** The scene library (the `scenes` table): photos any Scenic site can paint behind
 *  its page, tagged and searchable. Every Scenic build adds the ones it makes. */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

export type LibraryScene = {
  key: string;
  url: string;
  focus: string;
  tone: 'light' | 'dark';
  tags: string[];
  description: string;
};

/** A scene to add: made by a build for a site, or hand-picked for the platform. */
export type NewScene = LibraryScene & { source: 'platform' | 'generated'; madeFor: string | null };

const COLUMNS = 'key, url, focus, tone, tags, description' as const;

type Row = { key: string; url: string; focus: string; tone: string; tags: string[]; description: string };

function sceneOf(r: Row): LibraryScene {
  return { key: r.key, url: r.url, focus: r.focus, tone: r.tone === 'dark' ? 'dark' : 'light', tags: r.tags, description: r.description };
}

/** Search the library by any words (tags and descriptions, "kitchen pottery"); empty words list every scene. Newest first. */
export async function searchScenes(db: SupabaseClient<Database>, words: string, limit = 24): Promise<LibraryScene[]> {
  const terms = words.trim();
  const base = db.from('scenes').select(COLUMNS);
  const query = terms === '' ? base : base.textSearch('search', terms, { type: 'websearch', config: 'english' });
  const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);
  if (error !== null) throw new Error(`Could not search the scene library: ${error.message}`);
  return (data ?? []).map(sceneOf);
}

/** Every scene carrying a tag ("bakery"). */
export async function scenesTagged(db: SupabaseClient<Database>, tag: string): Promise<LibraryScene[]> {
  const { data, error } = await db.from('scenes').select(COLUMNS).contains('tags', [tag]).order('created_at', { ascending: false });
  if (error !== null) throw new Error(`Could not read the scene library: ${error.message}`);
  return (data ?? []).map(sceneOf);
}

/** Add scenes to the library. */
export async function addScenes(db: SupabaseClient<Database>, scenes: readonly NewScene[]): Promise<void> {
  if (scenes.length === 0) return;
  const { error } = await db.from('scenes').insert(
    scenes.map((s) => ({ key: s.key, url: s.url, focus: s.focus, tone: s.tone, tags: s.tags, description: s.description, source: s.source, made_for: s.madeFor })),
  );
  if (error !== null) throw new Error(`Could not add to the scene library: ${error.message}`);
}
