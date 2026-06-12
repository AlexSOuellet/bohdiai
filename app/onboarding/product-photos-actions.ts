'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type { VisionPerPhoto } from './_components/types';

const BUCKET = 'tenant-logos';
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_PHOTOS = 5;

export interface UploadProductPhotosResult {
  productPhotoUrls: string[];
  visionPerPhoto: VisionPerPhoto[];
  makerWork: string;
}

/**
 * Uploads 1–5 product photos for a tenant-in-progress (subdomain known, tenant
 * row not yet created). Vision read is wired in Task B3; for now visionPerPhoto
 * and makerWork return empty so the build degrades to "treat as skipped" if the
 * Vision call later fails.
 */
export async function uploadProductPhotos(
  subdomain: string,
  formData: FormData,
): Promise<UploadProductPhotosResult> {
  const files = formData.getAll('photos').filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    throw new Error('No photo files provided');
  }
  if (files.length > MAX_PHOTOS) {
    throw new Error(`Upload at most 5 photos`);
  }
  for (const f of files) {
    if (f.size > MAX_BYTES) throw new Error('Each photo must be under 10MB');
    if (!ALLOWED_TYPES.includes(f.type)) throw new Error('Photos must be PNG, JPEG, WebP');
  }

  const db = supabaseAdmin();
  const uploaded: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const f = files[i]!;
    const ext = f.type === 'image/png' ? 'png' : f.type === 'image/webp' ? 'webp' : 'jpg';
    const storagePath = `${subdomain}/product-${i}.${ext}`;
    const buffer = await f.arrayBuffer();
    const { error } = await db.storage.from(BUCKET).upload(storagePath, buffer, {
      contentType: f.type,
      upsert: true,
    });
    if (error) {
      logger.error('product photo upload failed', { subdomain, index: i, error: error.message });
      throw new Error('Could not save your photos. Try again.');
    }
    const { data } = db.storage.from(BUCKET).getPublicUrl(storagePath);
    uploaded.push(data.publicUrl);
  }

  return { productPhotoUrls: uploaded, visionPerPhoto: [], makerWork: '' };
}
