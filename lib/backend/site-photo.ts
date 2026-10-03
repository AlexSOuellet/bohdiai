/**
 * One photo from the owner's device into the site's public media: checked, shrunk
 * to WebP, stored under the tenant, and recorded in `uploads`. Shared by every
 * feature that takes photos (product photos, the gallery) so they all accept the
 * same files and fail with the same words. Callers check the acting site and its
 * features first.
 */
import { supabaseAdmin } from '@/lib/supabase';
import { shrinkImage } from '@/lib/images/shrink';
import { logger } from '@/lib/logger';
import type { PhotoResult } from './catalog/results';

const PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_PHOTO_BYTES = 20 * 1024 * 1024; // the most the Images binding reads
const MAX_PHOTO_EDGE = 2400;

export async function storeSitePhoto(args: { tenantId: string; userId: string; folder: string; file: FormDataEntryValue | null }): Promise<PhotoResult> {
  const { tenantId, userId, folder, file } = args;
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: 'Pick a photo to upload.' };
  if (!PHOTO_TYPES.has(file.type)) return { ok: false, error: 'Use a JPG, PNG or WebP photo.' };
  if (file.size > MAX_PHOTO_BYTES) return { ok: false, error: 'That photo is over 20MB. Pick a smaller one.' };

  let bytes: Uint8Array;
  try {
    bytes = await shrinkImage(await file.arrayBuffer(), { maxEdge: MAX_PHOTO_EDGE, format: 'webp', quality: 82 });
  } catch (err) {
    logger.warn('site photo: shrink failed', { tenantId, error: String(err) });
    return { ok: false, error: 'That photo couldn’t be read. Try a different one.' };
  }
  const admin = supabaseAdmin();
  const path = `tenant/${tenantId}/${folder}/${crypto.randomUUID()}.webp`;
  const { error: upErr } = await admin.storage.from('tenant-media').upload(path, bytes, { contentType: 'image/webp', upsert: false });
  if (upErr !== null) {
    logger.warn('site photo: upload failed', { tenantId, error: upErr.message });
    return { ok: false, error: 'The photo couldn’t be uploaded. Try again.' };
  }
  const url = admin.storage.from('tenant-media').getPublicUrl(path).data.publicUrl;
  const { data: row, error: insErr } = await admin
    .from('uploads')
    .insert({
      tenant_id: tenantId,
      uploaded_by_user_id: userId,
      storage_bucket: 'tenant-media',
      storage_path: path,
      public_url: url,
      file_name: file.name.slice(0, 200),
      mime_type: 'image/webp',
      size_bytes: bytes.length,
      source: 'user_upload',
      status: 'active',
    })
    .select('id')
    .single();
  if (insErr !== null || row === null) {
    logger.warn('site photo: record failed', { tenantId, error: insErr?.message });
    const { error } = await admin.storage.from('tenant-media').remove([path]);
    if (error !== null) logger.error('site photo: orphaned stored object', { tenantId, path, error: error.message });
    return { ok: false, error: 'The photo couldn’t be saved. Try again.' };
  }
  return { ok: true, uploadId: row.id, url };
}
