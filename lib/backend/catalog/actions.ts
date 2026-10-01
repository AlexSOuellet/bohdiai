'use server';

/**
 * Catalog server actions (spec piece 1 §4, §5, §8). Each one re-checks the signed-in
 * admin's acting site and the site's feature switches on the server, re-validates,
 * and writes through the person's own client so RLS applies. Every failure returns
 * a message the maker can act on.
 */
import { revalidatePath } from 'next/cache';
import type { Json } from '@/lib/database.types';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import type { FeatureKey } from '@/lib/backend/features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';
import { shrinkImage } from '@/lib/images/shrink';
import { logger } from '@/lib/logger';
import { slugify, uniqueSlug, slugLookupPrefix } from '@/lib/catalog/slug';
import { buildProductPayload, type ProductForm } from './product-form';
import { buildCollectionPayload, type CollectionForm } from './collection-form';
import type { SaveResult, PhotoResult, FileResult, DoneResult } from './results';

const CATALOG_OFF = 'Products aren’t switched on for this site.';
const DIGITAL_OFF = 'Downloads aren’t switched on for this site.';
const PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_PHOTO_BYTES = 20 * 1024 * 1024; // the most the Images binding reads
const MAX_PHOTO_EDGE = 2400;
const FILE_TYPES: Readonly<Record<string, string>> = {
  'application/pdf': 'pdf',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'application/zip': 'zip',
};
const MAX_FILE_BYTES = 50 * 1024 * 1024; // the tenant-files bucket limit

type DbError = { code?: string; message: string };
type CatalogSite = { tenantId: string; userId: string; on: Set<FeatureKey> };

function saveError(error: DbError, what: 'product' | 'collection', tenantId: string): string {
  if (error.code === '23505') return `Another ${what} already uses that web address. Change the name slightly and save again.`;
  if (error.code === 'P0002') return what === 'product' ? 'That product no longer exists. Go back to Products.' : 'That collection no longer exists. Go back to Collections.';
  if (error.code === 'P0001') return what === 'product' ? 'A photo or file on this product couldn’t be found. Remove it, add it again and save.' : 'A photo or product in this collection couldn’t be found. Remove it, add it again and save.';
  if (error.code === '42501') return 'You don’t have access to change this site.';
  logger.error(`catalog: ${what} save failed`, { tenantId, code: error.code, error: error.message });
  return `The ${what} couldn’t be saved. Try again in a moment.`;
}

async function catalogSite(): Promise<CatalogSite | null> {
  const { user, site } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  return on.has('catalog') ? { tenantId: site.tenantId, userId: user.id, on } : null;
}

async function freeSlug(table: 'listings' | 'collections', tenantId: string, name: string): Promise<string | null> {
  const base = slugify(name);
  const db = await createSupabaseServerClient();
  const { data, error } = await db.from(table).select('slug').eq('tenant_id', tenantId).is('deleted_at', null).ilike('slug', `${slugLookupPrefix(base)}%`);
  if (error !== null) {
    logger.error('catalog: slug lookup failed', { tenantId, error: error.message });
    return null;
  }
  return uniqueSlug(base, new Set((data ?? []).map((r) => r.slug)));
}

const SLUG_FAILED = 'The web address couldn’t be checked. Try again in a moment.';

type RpcResult = { data: string | null; error: DbError | null };

/** Run a save. When creating (`slugFor` given), pick a free web address first; if
 *  another save took it in the meantime (23505), pick again and retry once. */
async function saveWithSlug(
  save: (p: Record<string, unknown>) => PromiseLike<RpcResult>,
  payload: Record<string, unknown>,
  slugFor: (() => Promise<string | null>) | null,
): Promise<{ data: string | null; error: DbError | 'slug' | null }> {
  if (slugFor === null) return save(payload);
  for (let attempt = 0; ; attempt += 1) {
    const slug = await slugFor();
    if (slug === null) return { data: null, error: 'slug' };
    const result = await save({ ...payload, slug });
    if (result.error?.code !== '23505' || attempt >= 1) return result;
  }
}

/** Remove a stored object whose uploads record couldn't be written, so it isn't
 *  left orphaned in storage. A failed removal is logged, never shown. */
async function removeStored(admin: ReturnType<typeof supabaseAdmin>, bucket: string, path: string, tenantId: string): Promise<void> {
  const { error } = await admin.storage.from(bucket).remove([path]);
  if (error !== null) logger.error('catalog: orphaned stored object', { tenantId, bucket, path, error: error.message });
}

export async function saveProduct(form: ProductForm): Promise<SaveResult> {
  const site = await catalogSite();
  if (site === null) return { ok: false, error: CATALOG_OFF };
  const built = buildProductPayload(form, { digital: site.on.has('digital_products') });
  if (!built.ok) return built;

  const db = await createSupabaseServerClient();
  const save = (p: Record<string, unknown>) =>
    db.rpc('save_product', { p_tenant_id: site.tenantId, p: p as Json, ...(form.id !== null ? { p_listing_id: form.id } : {}) });
  const { data, error } = await saveWithSlug(save, { ...built.payload }, form.id === null ? () => freeSlug('listings', site.tenantId, built.payload.name) : null);
  if (error === 'slug') return { ok: false, error: SLUG_FAILED };
  if (error !== null || data === null) return { ok: false, error: saveError(error ?? { message: 'no id returned' }, 'product', site.tenantId) };
  revalidatePath('/manage/products');
  revalidatePath('/manage');
  return { ok: true, id: data };
}

/** Copy a product (everything but its web address) as a new draft (spec §4). */
export async function duplicateProduct(form: ProductForm): Promise<SaveResult> {
  // A crafted non-string name passes through untouched so saveProduct refuses it.
  const name = typeof form.name === 'string' ? `${form.name.trim()} (copy)`.slice(0, 120) : form.name;
  return saveProduct({ ...form, id: null, slug: null, name, status: 'draft' });
}

export async function uploadProductPhoto(formData: FormData): Promise<PhotoResult> {
  const site = await catalogSite();
  if (site === null) return { ok: false, error: CATALOG_OFF };
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: 'Pick a photo to upload.' };
  if (!PHOTO_TYPES.has(file.type)) return { ok: false, error: 'Use a JPG, PNG or WebP photo.' };
  if (file.size > MAX_PHOTO_BYTES) return { ok: false, error: 'That photo is over 20MB. Pick a smaller one.' };

  let bytes: Uint8Array;
  try {
    bytes = await shrinkImage(await file.arrayBuffer(), { maxEdge: MAX_PHOTO_EDGE, format: 'webp', quality: 82 });
  } catch (err) {
    logger.warn('catalog: photo shrink failed', { tenantId: site.tenantId, error: String(err) });
    return { ok: false, error: 'That photo couldn’t be read. Try a different one.' };
  }
  const admin = supabaseAdmin();
  const path = `tenant/${site.tenantId}/products/${crypto.randomUUID()}.webp`;
  const { error: upErr } = await admin.storage.from('tenant-media').upload(path, bytes, { contentType: 'image/webp', upsert: false });
  if (upErr !== null) {
    logger.warn('catalog: photo upload failed', { tenantId: site.tenantId, error: upErr.message });
    return { ok: false, error: 'The photo couldn’t be uploaded. Try again.' };
  }
  const url = admin.storage.from('tenant-media').getPublicUrl(path).data.publicUrl;
  const { data: row, error: insErr } = await admin
    .from('uploads')
    .insert({
      tenant_id: site.tenantId,
      uploaded_by_user_id: site.userId,
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
    logger.warn('catalog: photo record failed', { tenantId: site.tenantId, error: insErr?.message });
    await removeStored(admin, 'tenant-media', path, site.tenantId);
    return { ok: false, error: 'The photo couldn’t be saved. Try again.' };
  }
  return { ok: true, uploadId: row.id, url };
}

/** A download file, stored privately (plan 1b decision 2). Delivery is piece 2. */
export async function uploadProductFile(formData: FormData): Promise<FileResult> {
  const site = await catalogSite();
  if (site === null) return { ok: false, error: CATALOG_OFF };
  if (!site.on.has('digital_products')) return { ok: false, error: DIGITAL_OFF };
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: 'Pick a file to upload.' };
  const ext = FILE_TYPES[file.type];
  if (ext === undefined) return { ok: false, error: 'Use a PDF, PNG, JPG, WebP, SVG or ZIP file.' };
  if (file.size > MAX_FILE_BYTES) return { ok: false, error: 'That file is over 50MB. Pick a smaller one.' };

  const admin = supabaseAdmin();
  const path = `tenant/${site.tenantId}/files/${crypto.randomUUID()}.${ext}`;
  const { error: upErr } = await admin.storage.from('tenant-files').upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: false });
  if (upErr !== null) {
    logger.warn('catalog: file upload failed', { tenantId: site.tenantId, error: upErr.message });
    return { ok: false, error: 'The file couldn’t be uploaded. Try again.' };
  }
  const fileName = file.name.slice(0, 200);
  const { data: row, error: insErr } = await admin
    .from('uploads')
    .insert({
      tenant_id: site.tenantId,
      uploaded_by_user_id: site.userId,
      storage_bucket: 'tenant-files',
      storage_path: path,
      public_url: null,
      file_name: fileName,
      mime_type: file.type,
      size_bytes: file.size,
      source: 'user_upload',
      status: 'active',
    })
    .select('id')
    .single();
  if (insErr !== null || row === null) {
    logger.warn('catalog: file record failed', { tenantId: site.tenantId, error: insErr?.message });
    await removeStored(admin, 'tenant-files', path, site.tenantId);
    return { ok: false, error: 'The file couldn’t be saved. Try again.' };
  }
  return { ok: true, uploadId: row.id, fileName };
}

export async function saveCollection(form: CollectionForm): Promise<SaveResult> {
  const site = await catalogSite();
  if (site === null) return { ok: false, error: CATALOG_OFF };
  const built = buildCollectionPayload(form);
  if (!built.ok) return built;
  const db = await createSupabaseServerClient();
  const save = (p: Record<string, unknown>) =>
    db.rpc('save_collection', { p_tenant_id: site.tenantId, p: p as Json, ...(form.id !== null ? { p_collection_id: form.id } : {}) });
  const { data, error } = await saveWithSlug(save, { ...built.payload }, form.id === null ? () => freeSlug('collections', site.tenantId, built.payload.name) : null);
  if (error === 'slug') return { ok: false, error: SLUG_FAILED };
  if (error !== null || data === null) return { ok: false, error: saveError(error ?? { message: 'no id returned' }, 'collection', site.tenantId) };
  revalidatePath('/manage/collections');
  revalidatePath('/manage');
  return { ok: true, id: data };
}

export async function createCollection(name: string): Promise<SaveResult> {
  return saveCollection({ id: null, name, description: '', status: 'draft', featuredImageId: null, productIds: [] });
}

export async function orderCollections(ids: string[]): Promise<DoneResult> {
  const site = await catalogSite();
  if (site === null) return { ok: false, error: CATALOG_OFF };
  const db = await createSupabaseServerClient();
  const { error } = await db.rpc('order_collections', { p_tenant_id: site.tenantId, p_ids: ids });
  if (error !== null) {
    logger.error('catalog: order collections failed', { tenantId: site.tenantId, error: error.message });
    return { ok: false, error: 'The new order couldn’t be saved. Try again.' };
  }
  revalidatePath('/manage/collections');
  return { ok: true };
}
