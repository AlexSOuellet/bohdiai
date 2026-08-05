/**
 * Product DB helpers for the walk's goods step. Thin, ownership-agnostic operations
 * over the `listings` table (the caller enforces tenant ownership). Real products are
 * `is_preview = false`; the AI placeholders the store ships with are `is_preview =
 * true`. The walk adds real products, and the first real one clears the placeholders.
 *
 * Every function takes an injected Supabase client so it's unit-testable with a fake.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { resolveMediaMap, imageUrlFromMetadata, type UploadRow } from '@/lib/storefront/catalog';
import { formatCents } from './price';

type Db = SupabaseClient<Database>;

/** What the maker fills in for a walk product (same fields the placeholders carry). */
export interface WalkProductInput {
  name: string;
  priceCents: number;
  shortDescription?: string | null;
  description?: string | null;
  /** The uploaded photo's id (from `uploadProductPhoto`). */
  uploadId?: string | null;
}

/** One of the maker's real products, shaped for the editor list. */
export interface WalkProduct {
  id: string;
  name: string;
  price: string;
  shortDescription: string;
  description: string;
  imageUrl: string | null;
}

/** Slugify a product name to a url-safe slug (falls back to "product" when empty). */
export function slugifyName(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug.length > 0 ? slug : 'product';
}

/** Find a free slug for this tenant: the base slug, else base-2, base-3, … */
export async function pickUniqueSlug(db: Db, tenantId: string, name: string): Promise<string> {
  const base = slugifyName(name);
  const { data } = await db
    .from('listings')
    .select('slug')
    .eq('tenant_id', tenantId)
    .is('deleted_at', null);
  const taken = new Set((data ?? []).map((r) => r.slug));
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

/** Whether the tenant has any REAL product (is_preview = false, live). */
export async function hasRealProducts(db: Db, tenantId: string): Promise<boolean> {
  const { count } = await db
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('listing_type', 'product')
    .eq('is_preview', false)
    .is('deleted_at', null);
  return (count ?? 0) > 0;
}

/** Whether the tenant still has AI placeholder products (is_preview = true, live). */
export async function hasPlaceholderProducts(db: Db, tenantId: string): Promise<boolean> {
  const { count } = await db
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('listing_type', 'product')
    .eq('is_preview', true)
    .is('deleted_at', null);
  return (count ?? 0) > 0;
}

/** Soft-delete every placeholder product for the tenant (they step aside for real ones). */
export async function clearPlaceholderProducts(db: Db, tenantId: string): Promise<void> {
  await db
    .from('listings')
    .update({ deleted_at: new Date().toISOString() })
    .eq('tenant_id', tenantId)
    .eq('listing_type', 'product')
    .eq('is_preview', true)
    .is('deleted_at', null);
}

/** Insert one real product, returning its id + slug. */
export async function insertRealProduct(
  db: Db,
  tenantId: string,
  input: WalkProductInput,
): Promise<{ id: string; slug: string }> {
  const slug = await pickUniqueSlug(db, tenantId, input.name);
  const { data, error } = await db
    .from('listings')
    .insert({
      tenant_id: tenantId,
      listing_type: 'product',
      slug,
      name: input.name,
      short_description: input.shortDescription ?? null,
      description: input.description ?? null,
      base_price_cents: input.priceCents,
      status: 'active',
      is_preview: false,
      requires_shipping: true,
      currency: 'USD',
      media_ids: input.uploadId ? [input.uploadId] : [],
      published_at: new Date().toISOString(),
    })
    .select('id, slug')
    .single();
  if (error || !data) throw new Error(`insertRealProduct failed: ${error?.message ?? 'no row'}`);
  return { id: data.id, slug: data.slug };
}

/** Update one real product's fields. A new uploadId replaces the photo; omitted leaves it. */
export async function updateRealProduct(
  db: Db,
  tenantId: string,
  id: string,
  input: WalkProductInput,
): Promise<void> {
  const patch: Database['public']['Tables']['listings']['Update'] = {
    name: input.name,
    short_description: input.shortDescription ?? null,
    description: input.description ?? null,
    base_price_cents: input.priceCents,
  };
  if (input.uploadId) patch.media_ids = [input.uploadId];
  const { error } = await db.from('listings').update(patch).eq('tenant_id', tenantId).eq('id', id);
  if (error) throw new Error(`updateRealProduct failed: ${error.message}`);
}

/** Soft-delete one product (used for the maker removing a real product). */
export async function softDeleteProduct(db: Db, tenantId: string, id: string): Promise<void> {
  const { error } = await db
    .from('listings')
    .update({ deleted_at: new Date().toISOString() })
    .eq('tenant_id', tenantId)
    .eq('id', id);
  if (error) throw new Error(`softDeleteProduct failed: ${error.message}`);
}

/** Load the tenant's real products for the editor list, resolving each photo through
 *  the uploads table (falling back to the legacy metadata url). */
export async function loadWalkProducts(db: Db, tenantId: string): Promise<WalkProduct[]> {
  const { data } = await db
    .from('listings')
    .select('id, name, base_price_cents, short_description, description, metadata, media_ids')
    .eq('tenant_id', tenantId)
    .eq('listing_type', 'product')
    .eq('is_preview', false)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });
  const rows = data ?? [];

  const ids = [...new Set(rows.flatMap((r) => (r.media_ids ?? []) as string[]))];
  let map = new Map<string, { url: string; alt: string | null }>();
  if (ids.length > 0) {
    const { data: uploads } = await db
      .from('uploads')
      .select('id, public_url, alt_text')
      .in('id', ids)
      .is('deleted_at', null);
    map = resolveMediaMap((uploads ?? []) as UploadRow[]);
  }

  return rows.map((r) => {
    const fromUpload = ((r.media_ids ?? []) as string[]).map((id) => map.get(id)).find((m) => m !== undefined);
    const imageUrl = fromUpload?.url ?? imageUrlFromMetadata(r.metadata) ?? null;
    return {
      id: r.id,
      name: r.name,
      price: formatCents(r.base_price_cents),
      shortDescription: r.short_description ?? '',
      description: r.description ?? '',
      imageUrl,
    };
  });
}
