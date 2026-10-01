import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { renderArchetypeProductPage, tenantUsesCatalog } from '../../_components/StorefrontPage';
import { storefrontMetadata, storefrontSeoFacts } from '@/lib/storefront/metadata';
import { tenantProductJsonLd } from '@/lib/storefront/seo';
import { loadProduct } from '@/lib/storefront/catalog';

interface ListingPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ListingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tenantId = (await headers()).get('x-tenant-id');
  if (tenantId === null) return {};
  // A page with no catalog (the contractor page) has no products to describe.
  if (!(await tenantUsesCatalog(tenantId))) return {};
  const product = await loadProduct(supabaseAdmin(), tenantId, slug);
  if (product === null) return {};
  const desc = product.view.shortDescription ?? (product.view.description || undefined);
  const img = product.view.media[0]?.url;
  return storefrontMetadata({
    path: `/listings/${slug}`,
    pageName: product.view.name,
    ...(desc ? { description: desc } : {}),
    ...(img ? { imageUrl: img } : {}),
  });
}

export default async function StorefrontListingPage({ params }: ListingPageProps) {
  const { slug } = await params;
  const tenantId = (await headers()).get('x-tenant-id');
  if (tenantId === null) notFound();
  // A page with no catalog (the contractor page) has no product pages, and never reads the catalog.
  if (!(await tenantUsesCatalog(tenantId))) notFound();

  // The one shared projection: every photo, options, prices, sold out.
  const product = await loadProduct(supabaseAdmin(), tenantId, slug);
  if (product === null) notFound();
  const { view } = product;

  // Product structured data, so search engines get rich-result data. A placeholder
  // or sold-out product is not in stock.
  const seoFacts = await storefrontSeoFacts();
  const productLd =
    seoFacts === null ? null : (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            tenantProductJsonLd(seoFacts, {
              name: view.name,
              slug: view.slug,
              description: view.shortDescription ?? (view.description || undefined),
              priceCents: product.priceCents,
              imageUrl: view.media[0]?.url,
              inStock: !product.isPreview && view.status !== 'sold_out',
            }),
          ),
        }}
      />
    );

  const page = await renderArchetypeProductPage(tenantId, view);
  if (page === null) notFound();
  return (
    <>
      {productLd}
      {page}
    </>
  );
}
