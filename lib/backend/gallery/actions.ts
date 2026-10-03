'use server';

/**
 * Gallery — add, order and caption, remove (card site spec). Each action re-checks
 * the acting site and its `gallery` switch on the server and writes through the
 * person's own client so RLS applies. Removing a photo keeps its upload (old photos
 * stay reusable); only the gallery entry goes.
 */
import { revalidatePath } from 'next/cache';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { storeSitePhoto } from '@/lib/backend/site-photo';
import { logger } from '@/lib/logger';
import type { DoneResult } from '../catalog/results';
import { GALLERY_LIMIT, buildGalleryOrder, type GalleryItem } from './gallery-form';

const GALLERY_OFF = 'The gallery isn’t switched on for this site.';
const FULL = `Your gallery holds up to ${GALLERY_LIMIT} photos. Remove one to add another.`;

export type GalleryPhotoResult = { ok: true; item: GalleryItem } | { ok: false; error: string };

async function gallerySite(): Promise<{ tenantId: string; userId: string } | null> {
  const { user, site } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  return on.has('gallery') ? { tenantId: site.tenantId, userId: user.id } : null;
}

function done(): void {
  revalidatePath('/manage/gallery');
  revalidatePath('/manage');
}

export async function uploadGalleryPhoto(formData: FormData): Promise<GalleryPhotoResult> {
  const site = await gallerySite();
  if (site === null) return { ok: false, error: GALLERY_OFF };
  const db = await createSupabaseServerClient();
  const { data: rows, error: countErr } = await db.from('gallery_items').select('position').eq('tenant_id', site.tenantId);
  if (countErr !== null) {
    logger.error('gallery: count failed', { tenantId: site.tenantId, error: countErr.message });
    return { ok: false, error: 'Your gallery couldn’t be checked. Try again in a moment.' };
  }
  if ((rows ?? []).length >= GALLERY_LIMIT) return { ok: false, error: FULL };

  const stored = await storeSitePhoto({ tenantId: site.tenantId, userId: site.userId, folder: 'gallery', file: formData.get('file') });
  if (!stored.ok) return stored;

  const position = Math.max(-1, ...(rows ?? []).map((r) => r.position)) + 1;
  const { data: row, error } = await db
    .from('gallery_items')
    .insert({ tenant_id: site.tenantId, upload_id: stored.uploadId, position })
    .select('id')
    .single();
  if (error !== null || row === null) {
    logger.error('gallery: add failed', { tenantId: site.tenantId, error: error?.message });
    return { ok: false, error: 'The photo was uploaded but couldn’t be added to your gallery. Try again.' };
  }
  done();
  return { ok: true, item: { id: row.id, url: stored.url, caption: '' } };
}

/** The owner's order and captions, saved together. */
export async function saveGallery(items: { id: string; caption: string }[]): Promise<DoneResult> {
  const site = await gallerySite();
  if (site === null) return { ok: false, error: GALLERY_OFF };
  const db = await createSupabaseServerClient();
  const { data: current, error: readErr } = await db.from('gallery_items').select('id').eq('tenant_id', site.tenantId);
  if (readErr !== null) {
    logger.error('gallery: read failed', { tenantId: site.tenantId, error: readErr.message });
    return { ok: false, error: 'Your gallery couldn’t be saved. Try again in a moment.' };
  }
  const built = buildGalleryOrder(items, new Set((current ?? []).map((r) => r.id)));
  if (!built.ok) return built;

  const results = await Promise.all(
    built.rows.map((r) => db.from('gallery_items').update({ caption: r.caption, position: r.position }).eq('tenant_id', site.tenantId).eq('id', r.id)),
  );
  const failed = results.find((r) => r.error !== null);
  if (failed !== undefined) {
    logger.error('gallery: save failed', { tenantId: site.tenantId, error: failed.error?.message });
    return { ok: false, error: 'Your gallery couldn’t be saved. Try again in a moment.' };
  }
  done();
  return { ok: true };
}

export async function removeGalleryPhoto(id: string): Promise<DoneResult> {
  const site = await gallerySite();
  if (site === null) return { ok: false, error: GALLERY_OFF };
  const db = await createSupabaseServerClient();
  const { error } = await db.from('gallery_items').delete().eq('tenant_id', site.tenantId).eq('id', id);
  if (error !== null) {
    logger.error('gallery: remove failed', { tenantId: site.tenantId, error: error.message });
    return { ok: false, error: 'The photo couldn’t be removed. Try again in a moment.' };
  }
  done();
  return { ok: true };
}
