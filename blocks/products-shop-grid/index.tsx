import Image from 'next/image';
import meta from './meta';
import { supabaseAdmin } from '@/lib/supabase';

export { meta };

interface ProductsShopGridProps {
  content: Record<string, never>;
  tenantId: string;
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

export default async function ProductsShopGrid({ tenantId }: ProductsShopGridProps) {
  const db = supabaseAdmin();
  const { data: listings } = await db
    .from('listings')
    .select('id, slug, name, short_description, base_price_cents, is_preview, metadata')
    .eq('tenant_id', tenantId)
    .eq('listing_type', 'product')
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('published_at', { ascending: false });

  const items: Listing[] = (listings ?? []).map((l) => ({
    ...l,
    metadata: (l.metadata as { image_url?: string | null } | null) ?? null,
  }));

  return (
    <section className="bg-s-background py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-6">
        {items.length === 0 ? (
          <p className="text-center font-s-body text-s-text/60 py-16">
            New work is on the way. Check back soon.
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
  );
}
