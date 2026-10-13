'use server';
/**
 * The moment — save its words, set its photo, and add, order or remove its extra
 * photos (Modular Plan step 2). Each action re-checks the acting site and its
 * `moment` switch on the server and writes through the person's own client so
 * RLS applies. Removing a photo keeps its upload (old photos stay reusable).
 */
import { revalidatePath } from 'next/cache';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { storeSitePhoto } from '@/lib/backend/site-photo';
import { logger } from '@/lib/logger';
import type { DoneResult } from '../catalog/results';
import { MOMENT_PHOTOS_LIMIT, buildMomentRow, type MomentForm } from './moment-form';

const MOMENT_OFF = 'The moment isn’t switched on for this site.';
const TRY_AGAIN = 'Your changes couldn’t be saved. Try again in a moment.';

export type MomentPhotoResult = { ok: true; id: string; url: string } | { ok: false; error: string };

async function momentSite(): Promise<{ tenantId: string; userId: string } | null> {
  const { user, site } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  return on.has('moment') ? { tenantId: site.tenantId, userId: user.id } : null;
}

function done(): void {
  revalidatePath('/manage/moment');
  revalidatePath('/manage');
}

export async function saveMoment(form: MomentForm): Promise<DoneResult> {
  const site = await momentSite();
  if (site === null) return { ok: false, error: MOMENT_OFF };
  const built = buildMomentRow(form);
  if (!built.ok) return built;
  const db = await createSupabaseServerClient();
  const { error } = await db.from('site_moments').upsert({ tenant_id: site.tenantId, ...built.row });
  if (error !== null) {
    if (error.code === '42501') return { ok: false, error: 'You don’t have access to change this site.' };
    logger.error('moment: save failed', { tenantId: site.tenantId, code: error.code, error: error.message });
    return { ok: false, error: TRY_AGAIN };
  }
  done();
  return { ok: true };
}

/** The moment's main photo. */
export async function setMomentPhoto(formData: FormData): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const site = await momentSite();
  if (site === null) return { ok: false, error: MOMENT_OFF };
  const stored = await storeSitePhoto({ tenantId: site.tenantId, userId: site.userId, folder: 'moment', file: formData.get('file') });
  if (!stored.ok) return stored;
  const db = await createSupabaseServerClient();
  const { error } = await db.from('site_moments').upsert({ tenant_id: site.tenantId, media_upload_id: stored.uploadId, poster_upload_id: null });
  if (error !== null) {
    logger.error('moment: photo link failed', { tenantId: site.tenantId, code: error.code, error: error.message });
    return { ok: false, error: 'The photo was uploaded but couldn’t be set on the moment. Try again.' };
  }
  done();
  return { ok: true, url: stored.url };
}

export async function clearMomentPhoto(): Promise<DoneResult> {
  const site = await momentSite();
  if (site === null) return { ok: false, error: MOMENT_OFF };
  const db = await createSupabaseServerClient();
  const { error } = await db.from('site_moments').update({ media_upload_id: null, poster_upload_id: null }).eq('tenant_id', site.tenantId);
  if (error !== null) {
    logger.error('moment: photo clear failed', { tenantId: site.tenantId, code: error.code, error: error.message });
    return { ok: false, error: 'The photo couldn’t be removed. Try again in a moment.' };
  }
  done();
  return { ok: true };
}

/** One more photo for designs that show several, added at the end. */
export async function addMomentPhoto(formData: FormData): Promise<MomentPhotoResult> {
  const site = await momentSite();
  if (site === null) return { ok: false, error: MOMENT_OFF };
  const db = await createSupabaseServerClient();
  const { data: rows, error: countErr } = await db.from('site_moment_photos').select('position').eq('tenant_id', site.tenantId);
  if (countErr !== null) {
    logger.error('moment: photo count failed', { tenantId: site.tenantId, error: countErr.message });
    return { ok: false, error: 'The moment’s photos couldn’t be checked. Try again in a moment.' };
  }
  if ((rows ?? []).length >= MOMENT_PHOTOS_LIMIT) {
    return { ok: false, error: `The moment holds up to ${MOMENT_PHOTOS_LIMIT} extra photos. Remove one to add another.` };
  }
  const stored = await storeSitePhoto({ tenantId: site.tenantId, userId: site.userId, folder: 'moment', file: formData.get('file') });
  if (!stored.ok) return stored;
  const position = Math.max(-1, ...(rows ?? []).map((r) => r.position)) + 1;
  const { data: row, error } = await db
    .from('site_moment_photos')
    .insert({ tenant_id: site.tenantId, upload_id: stored.uploadId, position })
    .select('id')
    .single();
  if (error !== null || row === null) {
    logger.error('moment: photo add failed', { tenantId: site.tenantId, error: error?.message });
    return { ok: false, error: 'The photo was uploaded but couldn’t be added to the moment. Try again.' };
  }
  done();
  return { ok: true, id: row.id, url: stored.url };
}

/** The extra photos in the owner's order. Every current photo must be listed once. */
export async function orderMomentPhotos(ids: string[]): Promise<DoneResult> {
  const site = await momentSite();
  if (site === null) return { ok: false, error: MOMENT_OFF };
  const db = await createSupabaseServerClient();
  const { data: current, error: readErr } = await db.from('site_moment_photos').select('id').eq('tenant_id', site.tenantId);
  if (readErr !== null) {
    logger.error('moment: photo read failed', { tenantId: site.tenantId, error: readErr.message });
    return { ok: false, error: TRY_AGAIN };
  }
  const known = new Set((current ?? []).map((r) => r.id));
  if (ids.length !== known.size || new Set(ids).size !== ids.length || ids.some((id) => !known.has(id))) {
    return { ok: false, error: 'The photos changed while you were ordering them. Reload and try again.' };
  }
  const results = await Promise.all(
    ids.map((id, position) => db.from('site_moment_photos').update({ position }).eq('tenant_id', site.tenantId).eq('id', id)),
  );
  const failed = results.find((r) => r.error !== null);
  if (failed !== undefined) {
    logger.error('moment: photo order failed', { tenantId: site.tenantId, error: failed.error?.message });
    return { ok: false, error: TRY_AGAIN };
  }
  done();
  return { ok: true };
}

export async function removeMomentPhoto(id: string): Promise<DoneResult> {
  const site = await momentSite();
  if (site === null) return { ok: false, error: MOMENT_OFF };
  const db = await createSupabaseServerClient();
  const { error } = await db.from('site_moment_photos').delete().eq('tenant_id', site.tenantId).eq('id', id);
  if (error !== null) {
    logger.error('moment: photo remove failed', { tenantId: site.tenantId, error: error.message });
    return { ok: false, error: 'The photo couldn’t be removed. Try again in a moment.' };
  }
  done();
  return { ok: true };
}
