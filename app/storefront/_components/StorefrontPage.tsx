import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { archetypeSpec } from '@/lib/archetypes/registry';
import type { ArchetypePage } from '@/lib/archetypes/builder';
import type { ProductView, CatalogMedia, CollectionView } from '@/lib/archetypes/content';
import { seedPreviewReviews } from '@/lib/archetypes/main-street/reviews';
import { seedPreviewFindUs } from '@/lib/archetypes/main-street/findus';
import type { Json } from '@/lib/database.types';
import { loadHomeEnvelope, loadDraftEnvelope, loadTenantChrome } from '@/lib/storefront/load-envelope';
import { verifyPreviewToken } from '@/lib/editor/preview-token';

/** Extract image_url from a listings.metadata JSONB blob. Returns undefined when
 *  metadata is null, not an object, or has no image_url. Narrows once at the
 *  boundary so downstream code can trust the shape. */
function imageUrlFromMetadata(m: Json): string | undefined {
  if (m === null || typeof m !== 'object' || Array.isArray(m)) return undefined;
  const url = (m as Record<string, unknown>)['image_url'];
  return typeof url === 'string' ? url : undefined;
}
import { isKnownSkin } from '@/lib/editor/look-shelf';
import { resolveTextureParams } from '@/lib/editor/texture';
import { resolvePreviewMood } from '@/lib/moods';

interface StorefrontPageProps {
  slug: string;
  /** Owner draft preview — when this verifies (HMAC, unexpired) to the SAME tenant
   *  the request resolved to, the store renders the STAGED draft envelope instead of
   *  the published one. Public visitors have no token, so they always get published.
   *  A token for another tenant, absent, expired, or forged → published. */
  previewToken?: string | undefined;
  /** Editor door-1 preview — re-render the live home in this skin without persisting.
   *  Re-skins the already-public content only; owner-gating is deferred. */
  previewLook?: string | undefined;
  /** Editor door-1 preview — render in this feeling without persisting, so the
   *  preview shows the whole family (section layout, wallpaper, nav), not just the
   *  skin. Ignored unless it's a real mood key; falls back to the stored mood. */
  previewMood?: string | undefined;
  /** Editor door-2 preview — override the family wallpaper URL with a niche texture
   *  (from the niche style sheet) without persisting. Full external CDN URL. */
  previewTexture?: string | undefined;
  /** Editor door-2 preview — override the wallpaper opacity (0–1) for the texture.
   *  Optional — omitted keeps the family's default opacity. */
  previewTextureOpacity?: number | undefined;
  /** Hero-swap preview — render the home with this hero variant without persisting. */
  previewHero?: string | undefined;
  /** Goods-treatment preview — render the goods beat in this treatment without persisting. */
  previewGoods?: string | undefined;
  /** About/founder-treatment preview — render the maker beat in this treatment without persisting. */
  previewFounder?: string | undefined;
  /** Nav-layout preview — render the nav in this variant without persisting. */
  previewNav?: string | undefined;
  /** Collections-band preview — render the collections beat in this treatment without persisting. */
  previewCollections?: string | undefined;
  /** Reviews-beat preview — render the reviews beat in this treatment without persisting. */
  previewReviews?: string | undefined;
  /** Find-us-beat preview — render the find-us beat in this treatment without persisting. */
  previewFindUs?: string | undefined;
}

/** Storefront routes that paint as a sub-page off the home envelope. */
const SLUG_TO_PAGE: Record<string, ArchetypePage> = {
  '/shop': 'shop',
  '/events': 'events',
  '/about': 'about',
  '/contact': 'contact',
  '/collections': 'collections',
  '/testimonials': 'testimonials',
};

/** Resolve the tenant's home envelope + spec, or null when the tenant has no
 *  published home. Shared by the product/content/shell wrappers so every route
 *  paints in the same chrome — including the family-driven nav variant. */
async function resolveEnvelope(tenantId: string) {
  const env = await loadHomeEnvelope(tenantId);
  if (env === null) return null;
  const key = env['archetypeKey'];
  const lookKey = env['lookKey'];
  if (typeof key !== 'string' || typeof lookKey !== 'string') return null;
  const spec = archetypeSpec(key);
  if (spec === undefined) return null;
  const { logoUrl, brandColors } = await loadTenantChrome(tenantId);
  const accentOverride = typeof env['accentOverride'] === 'string' ? (env['accentOverride'] as string) : undefined;
  const mood = typeof env['mood'] === 'string' ? (env['mood'] as string) : undefined;
  return { spec, lookKey, content: env['content'], logoUrl, brandColors, accentOverride, mood };
}

/** Render a product detail page in the tenant's chrome, or null when the tenant
 *  has no published home. */
export async function renderArchetypeProductPage(tenantId: string, product: ProductView) {
  const a = await resolveEnvelope(tenantId);
  if (a === null || a.spec.renderProduct === undefined) return null;
  return a.spec.renderProduct({ content: a.content, lookKey: a.lookKey, product, mood: a.mood, logoUrl: a.logoUrl, brandColors: a.brandColors, accentOverride: a.accentOverride });
}

/** Render a plain content page (legal/maker-added) in the tenant's chrome, or
 *  null when the tenant has no published home. */
export async function renderArchetypeContentPage(
  tenantId: string,
  opts: { title?: string; body?: string[]; html?: string },
) {
  const a = await resolveEnvelope(tenantId);
  if (a === null || a.spec.renderContentPage === undefined) return null;
  return a.spec.renderContentPage({ content: a.content, lookKey: a.lookKey, ...opts, mood: a.mood, logoUrl: a.logoUrl, brandColors: a.brandColors, accentOverride: a.accentOverride });
}

/** Wrap a functional page's body (cart, subscriptions, etc.) in the tenant's
 *  chrome, or null when the tenant has no published home. */
export async function renderArchetypeShell(tenantId: string, children: ReactNode) {
  const a = await resolveEnvelope(tenantId);
  if (a === null || a.spec.renderShell === undefined) return null;
  return a.spec.renderShell({ content: a.content, lookKey: a.lookKey, children, mood: a.mood, logoUrl: a.logoUrl, brandColors: a.brandColors, accentOverride: a.accentOverride });
}

/** Choose the envelope source for a storefront request. A preview token that
 *  verifies to THIS tenant renders the staged draft (falling back to the published
 *  envelope when the draft is empty); every other request — no token, a token for
 *  another tenant, expired, or forged — renders the published envelope. Owner
 *  draft words therefore show in the preview and never leak to the public. */
async function envelopeFor(tenantId: string, previewToken: string | undefined): Promise<Record<string, unknown> | null> {
  if (previewToken !== undefined && verifyPreviewToken(previewToken) === tenantId) {
    const draft = await loadDraftEnvelope(tenantId);
    if (draft !== null) return draft;
  }
  return loadHomeEnvelope(tenantId);
}

export default async function StorefrontPage({ slug, previewToken, previewLook, previewMood, previewTexture, previewTextureOpacity, previewHero, previewGoods, previewFounder, previewNav, previewCollections, previewReviews, previewFindUs }: StorefrontPageProps) {
  const headerStore = await headers();
  const tenantId = headerStore.get('x-tenant-id');
  if (tenantId === null) notFound();

  // Sub-page routes (/shop, /events, ...) render off the SAME stored home
  // envelope, painted as a different page.
  const subPage = SLUG_TO_PAGE[slug];
  if (subPage !== undefined) {
    const env = await envelopeFor(tenantId, previewToken);
    if (env === null) notFound();
    return renderStore(env, tenantId, subPage, previewLook, previewMood, previewHero, previewGoods, previewFounder, previewNav, previewCollections, previewReviews, previewFindUs, previewTexture, previewTextureOpacity);
  }

  // /collections/<slug> — the collection detail page. Same envelope dispatch as
  // the other sub-pages; the products list is filtered to this collection's rows.
  if (slug.startsWith('/collections/') && slug.length > '/collections/'.length) {
    const collectionSlug = slug.slice('/collections/'.length);
    const env = await envelopeFor(tenantId, previewToken);
    if (env === null) notFound();
    return renderStore(env, tenantId, 'collection', previewLook, previewMood, previewHero, previewGoods, previewFounder, previewNav, previewCollections, previewReviews, previewFindUs, previewTexture, previewTextureOpacity, collectionSlug);
  }

  // Home (/): render the store from the tenant's home envelope.
  const env = await envelopeFor(tenantId, previewToken);
  if (env === null) notFound();
  return renderStore(env, tenantId, undefined, previewLook, previewMood, previewHero, previewGoods, previewFounder, previewNav, previewCollections, previewReviews, previewFindUs, previewTexture, previewTextureOpacity);
}

function formatPrice(cents: number): string {
  const dollars = cents / 100;
  return Number.isInteger(dollars) ? `$${dollars}` : `$${dollars.toFixed(2)}`;
}

interface ListingRow {
  slug: string;
  name: string;
  base_price_cents: number;
  short_description: string | null;
  description: string | null;
  metadata: Json;
  primary_collection_id: string | null;
}

interface CollectionRow {
  id: string;
  slug: string;
  name: string;
}

/** Build the home Collections band data from the tenant's `collections` rows, with
 *  the item count and a cover derived from the catalog (the collection's first
 *  product image). Returns [] when the store has no collections. */
function buildCollectionViews(collRows: CollectionRow[], listingRows: ListingRow[]): CollectionView[] {
  const byCollection = new Map<string, { count: number; cover?: CatalogMedia }>();
  for (const r of listingRows) {
    const cid = r.primary_collection_id;
    if (cid === null) continue;
    const entry = byCollection.get(cid) ?? { count: 0 };
    entry.count += 1;
    const url = imageUrlFromMetadata(r.metadata);
    if (entry.cover === undefined && url) entry.cover = { kind: 'image', url, alt: r.name };
    byCollection.set(cid, entry);
  }
  return collRows.map((c) => {
    const agg = byCollection.get(c.id);
    return { slug: c.slug, name: c.name, count: agg?.count ?? 0, cover: agg?.cover };
  });
}

/** Seed plausible sample collections for the ?collections= preview when a store
 *  has none yet — reusing the catalog's own images so every band is viewable on a
 *  real store (the same "placeholder, not labeled" model as sample products/dates). */
function seedPreviewCollections(products: ProductView[]): CollectionView[] {
  const names = ['Signature', 'Seasonal', 'New Arrivals'];
  return names.map((name, i) => ({
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    count: Math.max(1, products.length - i),
    cover: products[i]?.media[0] ?? products[0]?.media[0],
  }));
}

/** Render a stored store: load the real catalog rows as ProductViews and paint
 *  via the chosen spec's registered renderer. An `overrideLook` (editor door-1
 *  preview) re-skins the same content without persisting. */
async function renderStore(env: Record<string, unknown>, tenantId: string, page?: ArchetypePage, overrideLook?: string, previewMood?: string, previewHero?: string, previewGoods?: string, previewFounder?: string, previewNav?: string, previewCollections?: string, previewReviews?: string, previewFindUs?: string, previewTexture?: string, previewTextureOpacity?: number, collectionSlug?: string) {
  const archetypeKey = env['archetypeKey'];
  const lookKey = env['lookKey'];
  if (typeof archetypeKey !== 'string' || typeof lookKey !== 'string') notFound();
  const effectiveLook =
    overrideLook !== undefined && overrideLook !== '' && isKnownSkin(overrideLook) ? overrideLook : (lookKey as string);

  const spec = archetypeSpec(archetypeKey as string);
  if (spec === undefined) notFound();

  const { data: rows } = await supabaseAdmin()
    .from('listings')
    .select('slug, name, base_price_cents, short_description, description, metadata, primary_collection_id')
    .eq('tenant_id', tenantId)
    .eq('listing_type', 'product')
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  const products: ProductView[] = (rows ?? []).map((r) => {
    const url = imageUrlFromMetadata(r.metadata);
    const media: CatalogMedia[] = url ? [{ kind: 'image', url, alt: r.name }] : [];
    return {
      slug: r.slug,
      name: r.name,
      price: formatPrice(r.base_price_cents),
      ...(r.short_description ? { shortDescription: r.short_description } : {}),
      description: r.description ?? '',
      status: 'active',
      media,
      variations: [],
    };
  });

  // Collections band data — the tenant's own collections (count + cover derived
  // from the catalog). When the store has none and ?collections= is set, seed
  // sample ones so every band is viewable. Absent → no Collections beat renders.
  const { data: collRows } = await supabaseAdmin()
    .from('collections')
    .select('id, slug, name')
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('position', { ascending: true });
  let collections = buildCollectionViews(collRows ?? [], rows ?? []);
  if (collections.length === 0 && previewCollections !== undefined && previewCollections !== '') {
    collections = seedPreviewCollections(products);
  }

  // Collection detail page: filter products down to those whose primary_collection_id
  // matches this collection. If the slug names no known collection, 404.
  let effectiveProducts = products;
  if (page === 'collection' && collectionSlug !== undefined) {
    const collection = (collRows ?? []).find((c) => c.slug === collectionSlug);
    if (collection === undefined) notFound();
    const idsInCollection = new Set(
      (rows ?? [])
        .filter((r) => r.primary_collection_id === collection.id)
        .map((r) => r.slug),
    );
    effectiveProducts = products.filter((p) => idsInCollection.has(p.slug));
  }

  // Editor door-1 preview overrides the feeling; a normal visit uses the stored mood.
  const storedMood = typeof env['mood'] === 'string' ? (env['mood'] as string) : undefined;
  const mood = resolvePreviewMood(previewMood, storedMood);
  const catalogSize = typeof env['catalogSize'] === 'number' ? (env['catalogSize'] as number) : undefined;
  const accentOverride = typeof env['accentOverride'] === 'string' ? (env['accentOverride'] as string) : undefined;
  const { logoUrl, brandColors } = await loadTenantChrome(tenantId);
  // ?reviews= names a treatment; when the store has no authored reviews, seed sample
  // testimonials into the content so every treatment is viewable (non-persisting,
  // same "placeholder, not labeled" model as the collections/marquee previews).
  let content = env['content'];
  const wantReviews = previewReviews !== undefined && previewReviews !== '';
  if (
    wantReviews &&
    content !== null &&
    typeof content === 'object' &&
    !Array.isArray(content) &&
    (content as Record<string, unknown>)['reviews'] === undefined
  ) {
    content = { ...(content as Record<string, unknown>), reviews: seedPreviewReviews() };
  }
  // ?findus= names a treatment; when the store has no authored dates, seed sample
  // ones into content.founder.findUs so every treatment is viewable (non-persisting,
  // same "placeholder, not labeled" model as the reviews/collections previews).
  const wantFindUs = previewFindUs !== undefined && previewFindUs !== '';
  if (wantFindUs && content !== null && typeof content === 'object' && !Array.isArray(content)) {
    const founder = (content as Record<string, unknown>)['founder'];
    if (founder !== null && typeof founder === 'object' && !Array.isArray(founder) && (founder as Record<string, unknown>)['findUs'] === undefined) {
      content = { ...(content as Record<string, unknown>), founder: { ...(founder as Record<string, unknown>), findUs: seedPreviewFindUs() } };
    }
  }
  // Editor preview texture params (URL) win; on a normal visit the saved texture
  // setting on the envelope applies. See lib/editor/texture.
  const texture = resolveTextureParams(previewTexture, previewTextureOpacity, env['texture']);
  return spec.render({ content, lookKey: effectiveLook, products: effectiveProducts, mood, catalogSize, page, collectionSlug, logoUrl, brandColors, accentOverride, tenantId, heroVariant: previewHero, goodsTreatment: previewGoods, collections, collectionsTreatment: previewCollections, reviewsTreatment: previewReviews, findUsTreatment: previewFindUs, founderTreatment: previewFounder, navVariant: previewNav, previewTexture: texture.previewTexture, previewTextureOpacity: texture.previewTextureOpacity });
}
