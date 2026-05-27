import Image from 'next/image';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import NavSplit from '@/blocks/nav-split';
import FooterClassic from '@/blocks/footer-classic';
import NotifyForm from '../../_components/NotifyForm';
import { loadStorefrontChrome } from '../../_components/storefront-chrome';

interface ListingPageProps {
  params: Promise<{ slug: string }>;
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

function intervalLabel(interval: string | null): string {
  if (interval === 'week') return '/wk';
  if (interval === 'quarter') return '/qtr';
  if (interval === 'year') return '/yr';
  return '/mo';
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
      'id, slug, listing_type, name, short_description, description, base_price_cents, is_preview, subscription_interval, primary_collection_id, metadata',
    )
    .eq('tenant_id', tenantId)
    .eq('slug', slug)
    .eq('status', 'active')
    .is('deleted_at', null)
    .maybeSingle();

  if (listing === null) notFound();

  const meta = (listing.metadata as { image_url?: string | null } | null) ?? null;

  let collection: { name: string; slug: string } | null = null;
  if (listing.primary_collection_id !== null) {
    const { data: col } = await db
      .from('collections')
      .select('name, slug')
      .eq('id', listing.primary_collection_id)
      .maybeSingle();
    if (col !== null) collection = col;
  }

  const { shopName, sections } = await loadStorefrontChrome(tenantId);
  const sectionsJson = JSON.stringify(sections);

  const isSubscription = listing.listing_type === 'subscription';
  const linkClass = 'font-s-body text-xs uppercase tracking-[0.15em] text-s-text/60 hover:text-s-text transition-colors';

  return (
    <>
      <NavSplit content={{ shopName, sections: sectionsJson }} />
      <main className="bg-s-background pt-28 pb-20 md:pt-32">
        <div className="max-w-6xl mx-auto px-6">
          {/* ─── Breadcrumb ─── */}
          <nav className="mb-8 flex items-center gap-2 text-xs" aria-label="Breadcrumb">
            <a href="/" className={linkClass}>Home</a>
            <span className="text-s-text/30">/</span>
            {isSubscription ? (
              <a href="/subscriptions" className={linkClass}>Subscriptions</a>
            ) : collection !== null ? (
              <a href={`/collections/${collection.slug}`} className={linkClass}>{collection.name}</a>
            ) : (
              <a href="/shop" className={linkClass}>Shop</a>
            )}
            <span className="text-s-text/30">/</span>
            <span className="font-s-body text-xs uppercase tracking-[0.15em] text-s-text">
              {listing.name}
            </span>
          </nav>

          <div className="grid gap-10 md:grid-cols-2 md:gap-16 items-start">
            {/* ─── Image ─── */}
            <div className="relative aspect-square overflow-hidden bg-s-surface border border-s-border">
              {meta?.image_url != null ? (
                <Image
                  src={meta.image_url}
                  alt={listing.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <span className="font-s-body text-sm text-s-text/50">Photo coming soon</span>
                </div>
              )}
              {listing.is_preview && (
                <div className="absolute top-4 left-4 bg-black/70 text-white font-s-body text-[10px] uppercase tracking-[0.2em] px-3 py-1.5 rounded-full">
                  Preview
                </div>
              )}
            </div>

            {/* ─── Detail ─── */}
            <div>
              <h1 className="font-s-heading text-3xl md:text-4xl lg:text-5xl text-s-text mb-4">
                {listing.name}
              </h1>

              {listing.short_description !== null && (
                <p className="font-s-body text-lg text-s-text/70 leading-relaxed mb-6">
                  {listing.short_description}
                </p>
              )}

              {/* Price or Coming Soon / Get Notified */}
              <div className="mb-8">
                {listing.is_preview ? (
                  isSubscription ? (
                    <>
                      <p className="font-s-heading text-2xl text-s-text mb-2">
                        {formatPrice(listing.base_price_cents)}
                        <span className="text-base text-s-text/60">
                          {intervalLabel(listing.subscription_interval)}
                        </span>
                      </p>
                      <p className="font-s-body text-sm text-s-text/60 italic mb-4">
                        Coming soon — get on the list and we&apos;ll let you know.
                      </p>
                      <NotifyForm tenantId={tenantId} listingId={listing.id} />
                    </>
                  ) : (
                    <p className="font-s-heading text-xl text-s-text/60 uppercase tracking-[0.15em]">
                      Coming Soon
                    </p>
                  )
                ) : (
                  <>
                    <p className="font-s-heading text-3xl text-s-accent mb-4">
                      {formatPrice(listing.base_price_cents)}
                      {isSubscription && (
                        <span className="text-base text-s-text/60">
                          {intervalLabel(listing.subscription_interval)}
                        </span>
                      )}
                    </p>
                    {/* Real purchase CTA — wires to cart once commerce ships. */}
                    <button
                      type="button"
                      className="w-full md:w-auto px-8 py-3 bg-s-accent text-white font-s-body uppercase tracking-[0.15em] text-sm hover:opacity-90 transition-opacity"
                    >
                      {isSubscription ? 'Subscribe' : 'Add to Cart'}
                    </button>
                  </>
                )}
              </div>

              {/* Long description */}
              {listing.description !== null && listing.description !== '' && (
                <div className="border-t border-s-border pt-8 mt-8">
                  <h2 className="font-s-heading text-sm uppercase tracking-[0.2em] text-s-text/60 mb-4">
                    Details
                  </h2>
                  <p className="font-s-body text-base text-s-text/80 leading-relaxed whitespace-pre-line">
                    {listing.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <FooterClassic content={{ shopName, sections: sectionsJson }} />
    </>
  );
}
