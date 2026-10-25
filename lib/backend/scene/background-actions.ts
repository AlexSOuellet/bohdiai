'use server';

/**
 * The Background screen: her own background photo (add, replace, remove) and the
 * photo behind her site when it wears Scenic (pick one of her scenes, or her own).
 * Each re-checks the acting site and its background switch, and writes through her
 * own client so the homes' rules apply.
 */
import { revalidatePath } from 'next/cache';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { storeSitePhoto } from '@/lib/backend/site-photo';
import { logger } from '@/lib/logger';
import type { DoneResult } from '../catalog/results';
import { saveSiteScene } from './queries';
import { searchScenes } from './library';
import { SCENES_SHOWN, type SceneOption } from './background';

const OFF = 'Changing your background isn’t switched on for this site.';
type PhotoResult = { ok: true; url: string } | { ok: false; error: string };

async function backgroundSite(): Promise<{ tenantId: string; userId: string } | null> {
  const { user, site } = await requireActingSite();
  return (await getSiteFeatures(site.tenantId)).has('background') ? { tenantId: site.tenantId, userId: user.id } : null;
}

function done(): void {
  revalidatePath('/manage/background');
}

/** Her own background photo behind her pages. */
export async function setOwnBackground(formData: FormData): Promise<PhotoResult> {
  const site = await backgroundSite();
  if (site === null) return { ok: false, error: OFF };
  const stored = await storeSitePhoto({ tenantId: site.tenantId, userId: site.userId, folder: 'background', file: formData.get('file') });
  if (!stored.ok) return stored;
  const db = await createSupabaseServerClient();
  const { error } = await db.from('site_backgrounds').upsert({ tenant_id: site.tenantId, upload_id: stored.uploadId });
  if (error !== null) {
    logger.error('background: save failed', { tenantId: site.tenantId, code: error.code, error: error.message });
    return { ok: false, error: 'The photo was uploaded but couldn’t be set as your background. Try again.' };
  }
  done();
  return { ok: true, url: stored.url };
}

export async function removeOwnBackground(): Promise<DoneResult> {
  const site = await backgroundSite();
  if (site === null) return { ok: false, error: OFF };
  const db = await createSupabaseServerClient();
  const { error } = await db.from('site_backgrounds').delete().eq('tenant_id', site.tenantId);
  if (error !== null) {
    logger.error('background: remove failed', { tenantId: site.tenantId, code: error.code, error: error.message });
    return { ok: false, error: 'Your background couldn’t be removed. Try again in a moment.' };
  }
  done();
  return { ok: true };
}

/** Search the whole scene library by any words ("winter barn"); empty words list the newest. */
export async function findScenes(words: string): Promise<{ ok: true; scenes: SceneOption[] } | { ok: false; error: string }> {
  const site = await backgroundSite();
  if (site === null) return { ok: false, error: OFF };
  try {
    const found = await searchScenes(await createSupabaseServerClient(), words.slice(0, 100), SCENES_SHOWN);
    return { ok: true, scenes: found.map((s) => ({ key: s.key, url: s.url, description: s.description, mine: false })) };
  } catch (err) {
    logger.error('background: scene search failed', { tenantId: site.tenantId, error: err instanceof Error ? err.message : String(err) });
    return { ok: false, error: 'The scenes couldn’t be searched. Try again in a moment.' };
  }
}

/** Scenic shows a scene from the library. */
export async function chooseScene(key: string): Promise<DoneResult> {
  const site = await backgroundSite();
  if (site === null) return { ok: false, error: OFF };
  const db = await createSupabaseServerClient();
  const { data, error } = await db.from('scenes').select('key').eq('key', key).maybeSingle();
  if (error !== null) return { ok: false, error: 'Something went wrong. Try again in a moment.' };
  if (data === null) return { ok: false, error: 'That scene isn’t in the library any more.' };
  try {
    await saveSiteScene(db, site.tenantId, { kind: 'library', key });
  } catch (err) {
    logger.error('background: scene save failed', { tenantId: site.tenantId, error: err instanceof Error ? err.message : String(err) });
    return { ok: false, error: 'The scene couldn’t be saved. Try again in a moment.' };
  }
  done();
  return { ok: true };
}

/** Scenic shows her own photo (light or dark, so the words over it read). */
export async function setOwnScene(formData: FormData): Promise<PhotoResult> {
  const site = await backgroundSite();
  if (site === null) return { ok: false, error: OFF };
  const tone = formData.get('tone') === 'dark' ? 'dark' : 'light';
  const stored = await storeSitePhoto({ tenantId: site.tenantId, userId: site.userId, folder: 'scene', file: formData.get('file') });
  if (!stored.ok) return stored;
  try {
    await saveSiteScene(await createSupabaseServerClient(), site.tenantId, { kind: 'own', uploadId: stored.uploadId, tone, videoUploadId: null });
  } catch (err) {
    logger.error('background: own scene save failed', { tenantId: site.tenantId, error: err instanceof Error ? err.message : String(err) });
    return { ok: false, error: 'The photo was uploaded but couldn’t be set behind your Scenic site. Try again.' };
  }
  done();
  return { ok: true, url: stored.url };
}
