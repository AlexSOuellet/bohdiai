/**
 * Collection DB helpers for the walk's collections step. Thin, ownership-agnostic
 * operations over `collections` + product assignment via `listings.primary_collection_id`
 * (what the storefront reads to group products and derive a band cover). Real
 * collections are `is_preview = false`; the onboarding seeds are `is_preview = true`
 * and clear when the maker makes their store real.
 *
 * A product belongs to one collection here (its primary) — the walk's simple model;
 * many-to-many is the later Listings admin. Every function takes an injected client so
 * it's unit-testable with a fake.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { slugifyName } from './product-queries';

type Db = SupabaseClient<Database>;

export interface CollectionInput {
  name: string;
  description?: string | null;
  /** Ids of the maker's real products that belong in this collection. */
  productIds: string[];
}

/** One of the maker's real collections, shaped for the editor. */
export interface WalkCollection {
  id: string;
  name: string;
  description: string;
  productIds: string[];
}

/** Find a free collection slug for this tenant: base, else base-2, base-3, … */
async function pickUniqueCollectionSlug(db: Db, tenantId: string, name: string): Promise<string> {
  const base = slugifyName(name);
  const { data } = await db.from('collections').select('slug').eq('tenant_id', tenantId).is('deleted_at', null);
  const taken = new Set((data ?? []).map((r) => r.slug));
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

/** Whether the tenant has any REAL collection (is_preview = false, live). */
export async function hasRealCollections(db: Db, tenantId: string): Promise<boolean> {
  const { count } = await db
    .from('collections')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('is_preview', false)
    .is('deleted_at', null);
  return (count ?? 0) > 0;
}

/** Whether the tenant still has seeded placeholder collections (is_preview = true). */
export async function hasPlaceholderCollections(db: Db, tenantId: string): Promise<boolean> {
  const { count } = await db
    .from('collections')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('is_preview', true)
    .is('deleted_at', null);
  return (count ?? 0) > 0;
}

/** Soft-delete every seeded placeholder collection for the tenant, and detach the
 *  products that were assigned to them (they pointed at the fake collections). */
export async function clearPlaceholderCollections(db: Db, tenantId: string): Promise<void> {
  const { data: seeded } = await db
    .from('collections')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('is_preview', true)
    .is('deleted_at', null);
  const ids = (seeded ?? []).map((c) => c.id);
  if (ids.length > 0) {
    await db.from('listings').update({ primary_collection_id: null }).eq('tenant_id', tenantId).in('primary_collection_id', ids);
  }
  await db
    .from('collections')
    .update({ deleted_at: new Date().toISOString() })
    .eq('tenant_id', tenantId)
    .eq('is_preview', true)
    .is('deleted_at', null);
}

/** Assign the given products to a collection (as their primary). When `clearExisting`
 *  is set, first detach every product currently in this collection — so an edit both
 *  adds newly-checked products and drops unchecked ones. */
async function assignProducts(db: Db, tenantId: string, collectionId: string, productIds: string[], clearExisting: boolean): Promise<void> {
  if (clearExisting) {
    await db.from('listings').update({ primary_collection_id: null }).eq('tenant_id', tenantId).eq('primary_collection_id', collectionId);
  }
  if (productIds.length > 0) {
    await db.from('listings').update({ primary_collection_id: collectionId }).eq('tenant_id', tenantId).in('id', productIds);
  }
}

/** Create a real collection and assign its products. Returns the new id + slug. */
export async function createCollection(db: Db, tenantId: string, input: CollectionInput): Promise<{ id: string; slug: string }> {
  const slug = await pickUniqueCollectionSlug(db, tenantId, input.name);
  const { data, error } = await db
    .from('collections')
    .insert({
      tenant_id: tenantId,
      slug,
      name: input.name,
      description: input.description ?? null,
      status: 'active',
      is_preview: false,
    })
    .select('id, slug')
    .single();
  if (error || !data) throw new Error(`createCollection failed: ${error?.message ?? 'no row'}`);
  await assignProducts(db, tenantId, data.id, input.productIds, false);
  return { id: data.id, slug: data.slug };
}

/** Update a real collection's name/description and re-assign its products. */
export async function updateCollection(db: Db, tenantId: string, id: string, input: CollectionInput): Promise<void> {
  const { error } = await db
    .from('collections')
    .update({ name: input.name, description: input.description ?? null })
    .eq('tenant_id', tenantId)
    .eq('id', id);
  if (error) throw new Error(`updateCollection failed: ${error.message}`);
  await assignProducts(db, tenantId, id, input.productIds, true);
}

/** Soft-delete a real collection and detach its products. */
export async function deleteCollection(db: Db, tenantId: string, id: string): Promise<void> {
  await db.from('listings').update({ primary_collection_id: null }).eq('tenant_id', tenantId).eq('primary_collection_id', id);
  const { error } = await db
    .from('collections')
    .update({ deleted_at: new Date().toISOString() })
    .eq('tenant_id', tenantId)
    .eq('id', id);
  if (error) throw new Error(`deleteCollection failed: ${error.message}`);
}

/** Load the tenant's real collections with the ids of the products in each, for the
 *  editor. Products are grouped by their `primary_collection_id`. */
export async function loadWalkCollections(db: Db, tenantId: string): Promise<WalkCollection[]> {
  const { data: cols } = await db
    .from('collections')
    .select('id, name, description')
    .eq('tenant_id', tenantId)
    .eq('is_preview', false)
    .is('deleted_at', null)
    .order('position', { ascending: true });

  const { data: products } = await db
    .from('listings')
    .select('id, primary_collection_id')
    .eq('tenant_id', tenantId)
    .eq('listing_type', 'product')
    .eq('is_preview', false)
    .is('deleted_at', null);

  const byCollection = new Map<string, string[]>();
  for (const p of products ?? []) {
    const cid = p.primary_collection_id;
    if (cid === null) continue;
    const list = byCollection.get(cid) ?? [];
    list.push(p.id);
    byCollection.set(cid, list);
  }

  return (cols ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description ?? '',
    productIds: byCollection.get(c.id) ?? [],
  }));
}
