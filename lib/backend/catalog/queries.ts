/**
 * Backend catalog reads (spec piece 1 §4–5). Every read is scoped to the acting
 * site's tenant and runs through the person's own Supabase client, so RLS applies.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/lib/database.types';
import { formatPrice, loadMediaMap, imageUrlFromMetadata } from '@/lib/storefront/catalog';
import { priceRange } from '@/lib/catalog/price';
import { isProductSoldOut } from '@/lib/catalog/stock';
import { syncVariants, formatCents, type ProductForm, type OptionForm, type VariantForm, type ItemStatus, type Kind } from './product-form';
import type { CollectionForm } from './collection-form';

type Db = SupabaseClient<Database>;

export type ProductRowView = {
  id: string;
  name: string;
  status: ItemStatus;
  priceLabel: string;
  stockLabel: string;
  soldOut: boolean;
  photoUrl: string | null;
  photoUploadId: string | null;
  collectionIds: string[];
  /** The owner put this product on the home page. */
  onHome: boolean;
};

export type CollectionRowView = { id: string; name: string; status: ItemStatus; productCount: number };

const PRODUCT_TYPES = ['product', 'digital_product'];

const asStatus = (s: string): ItemStatus => (s === 'active' || s === 'archived' ? s : 'draft');

export function priceRangeLabel(baseCents: number, combinations: readonly { priceCents: number | null }[]): string {
  const { min, max } = priceRange({ basePriceCents: baseCents }, combinations);
  return min === max ? formatPrice(min) : `${formatPrice(min)}–${formatPrice(max)}`;
}

export function stockLabel(input: { inventoryCount: number | null; hasOptions: boolean; combinations: readonly { inventoryCount: number | null }[] }): string {
  if (isProductSoldOut(input)) return 'Sold out';
  const counts = input.hasOptions ? input.combinations.map((c) => c.inventoryCount) : [input.inventoryCount];
  const tracked = counts.filter((c): c is number => c !== null);
  return tracked.length === 0 ? 'Made to order' : `${tracked.reduce((a, b) => a + b, 0)} in stock`;
}

function combination(json: Json): Record<string, string> {
  if (json === null || typeof json !== 'object' || Array.isArray(json)) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(json)) if (typeof v === 'string') out[k] = v;
  return out;
}

export async function listProducts(db: Db, tenantId: string): Promise<ProductRowView[]> {
  const { data, error } = await db
    .from('listings')
    .select('id, name, status, base_price_cents, inventory_count, media_ids, metadata, on_home, variation_attributes(id), listing_variants(price_cents, inventory_count, status), listing_collections(collection_id)')
    .eq('tenant_id', tenantId)
    .in('listing_type', PRODUCT_TYPES)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  if (error !== null) throw new Error(`Could not load products: ${error.message}`);
  const rows = data ?? [];
  const media = await loadMediaMap(db, rows.flatMap((r) => r.media_ids));
  return rows.map((r) => {
    const available = r.listing_variants
      .filter((v) => v.status === 'active')
      .map((v) => ({ priceCents: v.price_cents, inventoryCount: v.inventory_count }));
    const hasOptions = r.variation_attributes.length > 0;
    const stock = { inventoryCount: r.inventory_count, hasOptions, combinations: available };
    // The first photo that still resolves, else the legacy sample photo — matching the
    // storefront (mediaForListing). The sample photo isn't an upload, so its id stays null.
    const first = r.media_ids.find((uploadId) => media.has(uploadId));
    const hit = first === undefined ? undefined : media.get(first);
    return {
      id: r.id,
      name: r.name,
      status: asStatus(r.status),
      priceLabel: priceRangeLabel(r.base_price_cents, hasOptions ? available : []),
      stockLabel: stockLabel(stock),
      soldOut: isProductSoldOut(stock),
      photoUrl: hit?.url ?? imageUrlFromMetadata(r.metadata) ?? null,
      photoUploadId: hit === undefined ? null : (first ?? null),
      collectionIds: r.listing_collections.map((c) => c.collection_id),
      onHome: r.on_home,
    };
  });
}

/** How many of the shop's products are on the home page (not archived, not deleted),
 *  leaving out `exceptId` — the product being edited, whose own tick is in the form. */
export async function countHomeProducts(db: Db, tenantId: string, exceptId: string | null): Promise<number> {
  const { data, error } = await db
    .from('listings')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('on_home', true)
    .neq('status', 'archived')
    .in('listing_type', PRODUCT_TYPES)
    .is('deleted_at', null);
  if (error !== null) throw new Error(`Could not count home products: ${error.message}`);
  return (data ?? []).filter((r) => r.id !== exceptId).length;
}

export async function getProduct(db: Db, tenantId: string, id: string): Promise<ProductForm | null> {
  const { data: r, error } = await db
    .from('listings')
    .select(
      'id, slug, name, short_description, description, status, listing_type, base_price_cents, inventory_count, media_ids, metadata, file_upload_id, on_home, variation_attributes(name, position, variation_options(value, position, kind, file_upload_id)), listing_variants(option_combination, price_cents, inventory_count, status), listing_collections(collection_id)',
    )
    .eq('tenant_id', tenantId)
    .eq('id', id)
    .in('listing_type', PRODUCT_TYPES)
    .is('deleted_at', null)
    .maybeSingle();
  if (error !== null) throw new Error(`Could not load the product: ${error.message}`);
  if (r === null) return null;

  const attrs = [...r.variation_attributes].sort((a, b) => a.position - b.position);
  const fileIds = [r.file_upload_id, ...attrs.flatMap((a) => a.variation_options.map((o) => o.file_upload_id))].filter((x): x is string => x !== null);
  const names = await fileNames(db, fileIds);
  const media = await loadMediaMap(db, r.media_ids);

  const options: OptionForm[] = attrs.map((a) => ({
    name: a.name,
    choices: [...a.variation_options]
      .sort((x, y) => x.position - y.position)
      .map((o) => ({
        value: o.value,
        kind: (o.kind === 'digital' ? 'digital' : 'physical') as Kind,
        fileUploadId: o.file_upload_id,
        fileName: o.file_upload_id === null ? null : (names.get(o.file_upload_id) ?? null),
      })),
  }));
  const stored: VariantForm[] = r.listing_variants.map((v) => ({
    choices: combination(v.option_combination),
    price: formatCents(v.price_cents),
    stock: v.inventory_count === null ? '' : String(v.inventory_count),
    available: v.status === 'active',
  }));

  const photos = r.media_ids.flatMap((uploadId) => {
    const hit = media.get(uploadId);
    return hit === undefined ? [] : [{ uploadId, url: hit.url }];
  });

  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    shortDescription: r.short_description ?? '',
    description: r.description ?? '',
    price: formatCents(r.base_price_cents),
    stock: r.inventory_count === null ? '' : String(r.inventory_count),
    status: asStatus(r.status),
    kind: r.listing_type === 'digital_product' ? 'digital' : 'physical',
    fileUploadId: r.file_upload_id,
    fileName: r.file_upload_id === null ? null : (names.get(r.file_upload_id) ?? null),
    photos,
    samplePhotoUrl: photos.length === 0 ? (imageUrlFromMetadata(r.metadata) ?? null) : null,
    collectionIds: r.listing_collections.map((c) => c.collection_id),
    options,
    variants: syncVariants(options, stored),
    onHome: r.on_home,
  };
}

async function fileNames(db: Db, ids: readonly string[]): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();
  const { data, error } = await db.from('uploads').select('id, file_name').in('id', [...new Set(ids)]);
  if (error !== null) throw new Error(`Could not load file names: ${error.message}`);
  return new Map((data ?? []).map((u) => [u.id, u.file_name]));
}

export async function listCollections(db: Db, tenantId: string): Promise<CollectionRowView[]> {
  const { data, error } = await db
    .from('collections')
    .select('id, name, status, listing_collections(listing_id, listings(status, deleted_at))')
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .order('position', { ascending: true });
  if (error !== null) throw new Error(`Could not load collections: ${error.message}`);
  // Count only live products — what shoppers see: active and not deleted.
  return (data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    status: asStatus(c.status),
    productCount: c.listing_collections.filter((m) => m.listings !== null && m.listings.status === 'active' && m.listings.deleted_at === null).length,
  }));
}

export async function getCollection(db: Db, tenantId: string, id: string): Promise<CollectionForm | null> {
  const { data: c, error } = await db
    .from('collections')
    .select('id, name, description, status, featured_image_id, listing_collections(listing_id, position, listings(deleted_at))')
    .eq('tenant_id', tenantId)
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();
  if (error !== null) throw new Error(`Could not load the collection: ${error.message}`);
  if (c === null) return null;
  return {
    id: c.id,
    name: c.name,
    description: c.description ?? '',
    status: asStatus(c.status),
    featuredImageId: c.featured_image_id,
    // Deleted products drop out: the editor can't show them and save_collection refuses them.
    productIds: c.listing_collections
      .filter((m) => m.listings !== null && m.listings.deleted_at === null)
      .sort((a, b) => a.position - b.position)
      .map((m) => m.listing_id),
  };
}
