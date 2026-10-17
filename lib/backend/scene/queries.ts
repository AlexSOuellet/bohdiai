/** The photo behind a Scenic site — read and saved. Read by the storefront (service
 *  role) and the backend (the owner's own client, RLS applies); saved by the builder. */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import type { ScenePhoto } from '@/lib/archetypes/main-street/scenes';

/** What a site has chosen: a library scene, or its own uploaded photo (light or dark,
 *  with a clip that loops over it if it has one). A library scene carries its own. */
export type SceneChoice =
  | { kind: 'library'; key: string }
  | { kind: 'own'; uploadId: string; tone: 'light' | 'dark'; videoUploadId: string | null };

const COLUMNS =
  'tone, scene:scenes(url, focus, tone), upload:uploads!site_scenes_upload_id_fkey(public_url), video:uploads!site_scenes_video_upload_id_fkey(public_url)' as const;

/** The site's background photo, or null when it has none (any family but Scenic). */
export async function getSiteScene(db: SupabaseClient<Database>, tenantId: string): Promise<ScenePhoto | null> {
  const { data, error } = await db.from('site_scenes').select(COLUMNS).eq('tenant_id', tenantId).maybeSingle();
  if (error !== null) throw new Error(`Could not load the background photo: ${error.message}`);
  if (data === null) return null;
  const own = data.upload?.public_url ?? null;
  if (own !== null) {
    const video = data.video?.public_url ?? null;
    return { url: own, focus: 'center', ...(data.tone === 'dark' ? { tone: 'dark' as const } : {}), ...(video === null ? {} : { video }) };
  }
  const scene = data.scene;
  return scene === null ? null : { url: scene.url, focus: scene.focus, ...(scene.tone === 'dark' ? { tone: 'dark' as const } : {}) };
}

/** Save a site's background photo choice (one row per site). */
export async function saveSiteScene(db: SupabaseClient<Database>, tenantId: string, choice: SceneChoice): Promise<void> {
  const row: { tenant_id: string; scene_key: string | null; upload_id: string | null; tone: 'light' | 'dark'; video_upload_id: string | null } =
    choice.kind === 'library'
      ? { tenant_id: tenantId, scene_key: choice.key, upload_id: null, tone: 'light', video_upload_id: null }
      : { tenant_id: tenantId, scene_key: null, upload_id: choice.uploadId, tone: choice.tone, video_upload_id: choice.videoUploadId };
  const { error } = await db.from('site_scenes').upsert(row, { onConflict: 'tenant_id' });
  // The library pick must be a real scene (the table's own rule).
  if (error !== null && error.code === '23503' && choice.kind === 'library') throw new Error(`No scene called "${choice.key}" in the library`);
  if (error !== null) throw new Error(`Could not save the background photo: ${error.message}`);
}
