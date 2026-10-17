/** The photo behind a Scenic site — read and saved. Read by the storefront (service
 *  role) and the backend (the owner's own client, RLS applies); saved by the builder. */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { isSceneKey, scenePhoto, type ScenePhoto } from '@/lib/archetypes/main-street/scenes';

/** What a site has chosen: a library scene, or its own uploaded photo. */
export type SceneChoice = { kind: 'library'; key: string } | { kind: 'own'; uploadId: string };

/** The site's background photo, or null when it has none (any family but Scenic). */
export async function getSiteScene(db: SupabaseClient<Database>, tenantId: string): Promise<ScenePhoto | null> {
  const { data, error } = await db
    .from('site_scenes')
    .select('scene_key, upload:uploads(public_url)')
    .eq('tenant_id', tenantId)
    .maybeSingle();
  if (error !== null) throw new Error(`Could not load the background photo: ${error.message}`);
  if (data === null) return null;
  const own = data.upload?.public_url ?? null;
  if (own !== null) return { url: own, focus: 'center' };
  return data.scene_key === null ? null : scenePhoto(data.scene_key);
}

/** Save a site's background photo choice (one row per site). */
export async function saveSiteScene(db: SupabaseClient<Database>, tenantId: string, choice: SceneChoice): Promise<void> {
  if (choice.kind === 'library' && !isSceneKey(choice.key)) throw new Error(`No scene called "${choice.key}" in the library`);
  const row: { tenant_id: string; scene_key: string | null; upload_id: string | null } =
    choice.kind === 'library'
      ? { tenant_id: tenantId, scene_key: choice.key, upload_id: null }
      : { tenant_id: tenantId, scene_key: null, upload_id: choice.uploadId };
  const { error } = await db.from('site_scenes').upsert(row, { onConflict: 'tenant_id' });
  if (error !== null) throw new Error(`Could not save the background photo: ${error.message}`);
}
