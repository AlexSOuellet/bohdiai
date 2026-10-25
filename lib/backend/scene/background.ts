/**
 * The Background screen's data (Alex, 2026-10-25): what sits behind her pages. Two
 * separate homes: her own background photo (site_backgrounds; the Rustic look shows
 * it), and the photo behind her site when it wears Scenic (site_scenes: one of the
 * scenes made for her, or her own photo).
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

type Db = SupabaseClient<Database>;

export type SceneOption = { key: string; url: string; description: string };

export type BackgroundView = {
  /** Her own background photo, or null. */
  own: string | null;
  /** Scenic's photo now: the scene she picked (its key) or her own upload (key null). */
  scenic: { key: string | null; url: string } | null;
  /** The scenes made for her site, to pick from. */
  scenes: SceneOption[];
};

export async function getBackgroundView(db: Db, tenantId: string): Promise<BackgroundView> {
  const [own, scenic, scenes] = await Promise.all([
    db.from('site_backgrounds').select('upload:uploads!site_backgrounds_upload_id_fkey(public_url)').eq('tenant_id', tenantId).maybeSingle(),
    db.from('site_scenes').select('scene_key, scene:scenes(url), upload:uploads!site_scenes_upload_id_fkey(public_url)').eq('tenant_id', tenantId).maybeSingle(),
    db.from('scenes').select('key, url, description').eq('made_for', tenantId).order('key'),
  ]);
  if (own.error !== null) throw new Error(`Could not load the background photo: ${own.error.message}`);
  if (scenic.error !== null) throw new Error(`Could not load the Scenic photo: ${scenic.error.message}`);
  if (scenes.error !== null) throw new Error(`Could not load the scenes: ${scenes.error.message}`);
  const s = scenic.data;
  const scenicUrl = s?.upload?.public_url ?? s?.scene?.url ?? null;
  return {
    own: own.data?.upload?.public_url ?? null,
    scenic: s === null || scenicUrl === null ? null : { key: s.upload?.public_url != null ? null : s.scene_key, url: scenicUrl },
    scenes: (scenes.data ?? []).map((r) => ({ key: r.key, url: r.url, description: r.description })),
  };
}
