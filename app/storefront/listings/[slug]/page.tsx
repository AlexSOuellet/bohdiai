import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { renderArchetypeProductPage } from '../../_components/StorefrontPage';
import { storefrontMetadata, storefrontSeoFacts } from '@/lib/storefront/metadata';
import { tenantProductJsonLd } from '@/lib/storefront/seo';
import { loadMediaMap, mediaForListing, type ListingRow } from '@/lib/storefront/catalog';
import type { ProductView } from '@/lib/archetypes/content';

interface ListingPageProps {
  params: Promise<{ slug: string }>;
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

export async function generateMetadata({ params }: ListingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const headerStore = await headers();
  const tenantId = headerStore.get('x-tenant-id');
  if (tenantId === null) return {};
  const { data: listing } = await supabaseAdmin()
    .from('listings')
    .select('name, short_description, description, metadata')
    .eq('tenant_id', tenantId)
    .eq('slug', slug)
    .eq('status', 'active')
    .is('deleted_at', null)
    .maybeSingle();
  if (listing === null) return {};
  const img = (listing.metadata as { image_url?: string | null } | null)?.image_url;
  const desc = listing.short_description ?? listing.description ?? undefined;
  return storefrontMetadata({
    path: `/listings/${slug}`,
    pageName: listing.name,
    ...(desc ? { description: desc } : {}),
    ...(img ? { imageUrl: img } : {}),
  });
}

export default async function StorefrontListingPage({ params }: ListingPageProps) {
  const { slug } = await params;
  const headerStore = await headers();
  const tenantId = headerStore.get('x-tenant-id');
  if (tenantId === null) notFound();

  const db = supabaseAdmin();

  const { data: listing } = await db
    .from('listings')
    .select(
      'id, slug, listing_type, name, short_description, description, base_price_cents, is_preview, subscription_interval, primary_collection_id, metadata, media_ids',
    )
    .eq('tenant_id', tenantId)
    .eq('slug', slug)
    .eq('status', 'active')
    .is('deleted_at', null)
    .maybeSingle();

  if (listing === null) notFound();

  // Resolve the product's photo the same way the catalog does: the maker's uploaded
  // media first, then the legacy metadata url (placeholders).
  const mediaMap = await loadMediaMap(db, (listing.media_ids ?? []) as string[]);
  const media = mediaForListing(listing as unknown as ListingRow, mediaMap);
  const primaryImage = media[0]?.url;
  const productView: ProductView = {
    slug: listing.slug,
    name: listing.name,
    price: formatPrice(listing.base_price_cents),
    ...(listing.short_description ? { shortDescription: listing.short_description } : {}),
    description: listing.description ?? '',
    status: 'active',
    media,
    variations: [],
  };
  // Product structured data — rendered so search engines get rich-result data.
  const seoFacts = await storefrontSeoFacts();
  const productLd =
    seoFacts === null ? null : (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            tenantProductJsonLd(seoFacts, {
              name: listing.name,
              slug: listing.slug,
              description: listing.short_description ?? listing.description ?? undefined,
              priceCents: listing.base_price_cents,
              imageUrl: primaryImage ?? undefined,
              inStock: !listing.is_preview,
            }),
          ),
        }}
      />
    );

  const page = await renderArchetypeProductPage(tenantId, productView);
  if (page === null) notFound();
  return (
    <>
      {productLd}
      {page}
    </>
  );
}
