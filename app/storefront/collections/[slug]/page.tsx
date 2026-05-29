import Image from 'next/image';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { loadStorefrontChromeBlocks } from '../../_components/storefront-chrome';

interface CollectionPageProps {
  params: Promise<{ slug: string }>;
}

interface Listing {
  id: string;
  slug: string;
  name: string;
  short_description: string | null;
  base_price_cents: number;
  is_preview: boolean;
  metadata: { image_url?: string | null } | null;
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

export default async function StorefrontCollectionPage({ params }: CollectionPageProps) {
  const { slug } = await params;
  const headerStore = await headers();
  const tenantId = headerStore.get('x-tenant-id');
  if (tenantId === null) notFound();

  const db = supabaseAdmin();

  const { data: collection } = await db
    .from('collections')
    .select('id, name, description')
    .eq('tenant_id', tenantId)
    .eq('slug', slug)
    .eq('status', 'active')
    .is('deleted_at', null)
    .maybeSingle();

  if (collection === null) notFound();

  const { data: listingsRaw } = await db
    .from('listings')
    .select('id, slug, name, short_description, base_price_cents, is_preview, metadata')
    .eq('tenant_id', tenantId)
    .eq('primary_collection_id', collection.id)
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('published_at', { ascending: false });

  const items: Listing[] = (listingsRaw ?? []).map((l) => ({
    ...l,
    metadata: (l.metadata as { image_url?: string | null } | null) ?? null,
  }));

  const { nav, footer } = await loadStorefrontChromeBlocks(tenantId);

  return (
    <>
      {nav}
      <main className="bg-s-background">
        {/* ─── Intro ─── */}
        <section className="pt-28 pb-8 md:pt-32 md:pb-12">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <p className="font-s-body text-xs uppercase tracking-[0.2em] text-s-text/50 mb-4">
              Collection
            </p>
            <h1 className="font-s-heading text-4xl md:text-5xl lg:text-6xl text-s-text">
              {collection.name}
            </h1>
            {collection.description !== null && collection.description !== '' && (
              <p className="mt-5 font-s-body text-lg text-s-text/70 leading-relaxed max-w-2xl mx-auto">
                {collection.description}
              </p>
            )}
          </div>
        </section>

        {/* ─── Products in this collection ─── */}
        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-6xl px-6">
            {items.length === 0 ? (
              <p className="text-center font-s-body text-s-text/60 py-12">
                No products in this collection yet.
              </p>
            ) : (
              <ul className="grid gap-s-card-gap grid-cols-[repeat(auto-fill,minmax(240px,1fr))]">
                {items.map((listing) => (
                  <li key={listing.id}>
                    <a
                      href={`/listings/${listing.slug}`}
                      className="block overflow-hidden sf-card transition-opacity hover:opacity-90"
                    >
                      <div className="relative aspect-square overflow-hidden bg-s-border">
                        {listing.metadata?.image_url != null ? (
                          <Image
                            src={listing.metadata.image_url}
                            alt={listing.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <span className="text-xs font-s-body text-s-text/50">Photo coming soon</span>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <p className="mb-1 font-medium font-s-body text-s-text">{listing.name}</p>
                        {listing.short_description !== null && (
                          <p className="mb-2 line-clamp-2 text-sm font-s-body text-s-text/60 leading-snug">
                            {listing.short_description}
                          </p>
                        )}
                        {listing.is_preview ? (
                          <p className="font-semibold font-s-body text-s-text/50 uppercase tracking-[0.15em] text-xs">
                            Coming Soon
                          </p>
                        ) : (
                          <p className="font-semibold font-s-body text-s-accent">
                            {formatPrice(listing.base_price_cents)}
                          </p>
                        )}
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
      {footer}
    </>
  );
}
