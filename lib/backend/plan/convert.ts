import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { slugify, uniqueSlug } from '@/lib/catalog/slug';
import { NO_PRICE_CENTS } from '@/lib/catalog/price';
import { HOME_MAX } from '@/lib/catalog/home';


export type GalleryPhoto = { uploadId: string; caption: string };

export type NewProduct = {
  slug: string;
  name: string;
  media_ids: string[];
  base_price_cents: number;
  on_home: boolean;
};

/**
 * Upgrading from Showcase (Saltmarsh & Lace demo spec, stage two): each gallery
 * photo that isn't a product yet becomes one, named from its caption, with no price
 * yet ("Ask for price"), in gallery order; the first ones fill the home page up to
 * its limit (HOME_MAX, the same limit every product save checks).
 * Pure, so the naming and order are testable.
 */
export function productsFromGallery(
  photos: readonly GalleryPhoto[],
  usedUploadIds: ReadonlySet<string>,
  takenSlugs: ReadonlySet<string>,
  homeTaken: number,
): NewProduct[] {
  const taken = new Set(takenSlugs);
  let homeLeft = Math.max(0, HOME_MAX - homeTaken);
  return photos
    .filter((p) => !usedUploadIds.has(p.uploadId))
    .map((p, i) => {
      const name = p.caption.trim() === '' ? `Piece ${i + 1}` : p.caption.trim();
      const slug = uniqueSlug(slugify(name), taken);
      taken.add(slug);
      const onHome = homeLeft > 0;
      if (onHome) homeLeft -= 1;
      return { slug, name, media_ids: [p.uploadId], base_price_cents: NO_PRICE_CENTS, on_home: onHome };
    });
}

/** Write the products for a site's gallery photos. Runs with the service role
 *  inside a plan change the caller has already allowed. Adds only; never edits or
 *  removes a product, so running it twice adds nothing the second time. */
export async function galleryToProducts(db: SupabaseClient<Database>, tenantId: string): Promise<{ ok: true; added: number } | { ok: false; error: string }> {
  const [gallery, listings] = await Promise.all([
    db.from('gallery_items').select('upload_id, caption, position, created_at').eq('tenant_id', tenantId).order('position', { ascending: true }).order('created_at', { ascending: true }),
    db.from('listings').select('slug, media_ids, on_home, deleted_at').eq('tenant_id', tenantId),
  ]);
  if (gallery.error !== null) return { ok: false, error: `gallery: ${gallery.error.message}` };
  if (listings.error !== null) return { ok: false, error: `products: ${listings.error.message}` };
  const rows = listings.data ?? [];
  const live = rows.filter((r) => r.deleted_at === null);
  const created = productsFromGallery(
    (gallery.data ?? []).map((g) => ({ uploadId: g.upload_id, caption: g.caption ?? '' })),
    new Set(live.flatMap((r) => r.media_ids)),
    new Set(rows.map((r) => r.slug)),
    live.filter((r) => r.on_home).length,
  );
  if (created.length === 0) return { ok: true, added: 0 };
  const now = Date.now();
  const { error } = await db.from('listings').insert(
    created.map((p, i) => ({
      tenant_id: tenantId,
      listing_type: 'product',
      status: 'active',
      requires_shipping: true,
      // One moment apart, so the shop keeps gallery order (it sorts by when each was added).
      created_at: new Date(now + i).toISOString(),
      published_at: new Date(now + i).toISOString(),
      ...p,
    })),
  );
  if (error !== null) return { ok: false, error: `products: ${error.message}` };
  return { ok: true, added: created.length };
}

export type ShowcasePick = { id: string; name: string; uploadId: string };

/** The ids she may pick for Showcase: her live products that have a photo, at most
 *  GALLERY_LIMIT, in the order she ticked them. Unknown ids are dropped. */
export function pickedForShowcase(ids: readonly string[], products: readonly ShowcasePick[], limit: number): ShowcasePick[] {
  const byId = new Map(products.map((p) => [p.id, p]));
  const seen = new Set<string>();
  const picked: ShowcasePick[] = [];
  for (const id of ids) {
    const p = byId.get(id);
    if (p === undefined || seen.has(id)) continue;
    seen.add(id);
    picked.push(p);
    if (picked.length === limit) break;
  }
  return picked;
}

/** Her live products that can stand in the Showcase gallery: each with its main photo. */
export async function showcaseCandidates(db: SupabaseClient<Database>, tenantId: string): Promise<{ ok: true; products: (ShowcasePick & { url: string })[] } | { ok: false; error: string }> {
  const { data, error } = await db
    .from('listings')
    .select('id, name, media_ids, on_home, created_at')
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .is('deleted_at', null)
    .in('listing_type', ['product', 'digital_product'])
    .order('created_at', { ascending: true });
  if (error !== null) return { ok: false, error: `products: ${error.message}` };
  const rows = (data ?? []).filter((r) => r.media_ids.length > 0);
  const firstIds = rows.map((r) => r.media_ids[0] as string);
  const { data: ups, error: uErr } = firstIds.length === 0 ? { data: [], error: null } : await db.from('uploads').select('id, public_url').in('id', firstIds);
  if (uErr !== null) return { ok: false, error: `photos: ${uErr.message}` };
  const urls = new Map((ups ?? []).map((u) => [u.id, u.public_url]));
  return {
    ok: true,
    products: rows.flatMap((r) => {
      const uploadId = r.media_ids[0] as string;
      const url = urls.get(uploadId);
      return url === undefined || url === null ? [] : [{ id: r.id, name: r.name, uploadId, url }];
    }),
  };
}

/** Make the chosen products her Showcase gallery: their main photos, captioned with
 *  their names, in her order. The old gallery entries are only references to photos,
 *  so replacing them loses no photo; every product stays saved. */
export async function galleryFromProducts(db: SupabaseClient<Database>, tenantId: string, ids: readonly string[], limit: number): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  const found = await showcaseCandidates(db, tenantId);
  if (!found.ok) return found;
  const picked = pickedForShowcase(ids, found.products, limit);
  if (picked.length === 0) return { ok: true, count: 0 };
  const { error: dErr } = await db.from('gallery_items').delete().eq('tenant_id', tenantId);
  if (dErr !== null) return { ok: false, error: `gallery: ${dErr.message}` };
  const { error } = await db.from('gallery_items').insert(picked.map((p, position) => ({ tenant_id: tenantId, upload_id: p.uploadId, position, caption: p.name })));
  if (error !== null) return { ok: false, error: `gallery: ${error.message}` };
  // The family designs read Showcase's gallery from the catalog's ticks: tick exactly the picked ones.
  const { error: cErr } = await db.from('listings').update({ in_gallery: false }).eq('tenant_id', tenantId).eq('in_gallery', true);
  if (cErr !== null) return { ok: false, error: `gallery ticks: ${cErr.message}` };
  const { error: tErr } = await db.from('listings').update({ in_gallery: true }).eq('tenant_id', tenantId).in('id', picked.map((p) => p.id));
  if (tErr !== null) return { ok: false, error: `gallery ticks: ${tErr.message}` };
  return { ok: true, count: picked.length };
}
