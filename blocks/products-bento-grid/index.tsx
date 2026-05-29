import Image from 'next/image';
import meta from './meta';
import { supabaseAdmin } from '@/lib/supabase';
import ScrollReveal from '@/components/storefront/ScrollReveal';

export { meta };

interface ProductsBentoGridContent {
  headline: string;
  subtitle?: string;
}

interface ProductsBentoGridProps {
  content: ProductsBentoGridContent;
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

// Bento layout assignments by index. First item is the feature (large).
// Subsequent items get progressively smaller. Up to 7 cells supported; more
// listings beyond that fall back into uniform smaller cards.
const BENTO_CLASSES = [
  'col-span-2 row-span-2',        // 0 — hero feature
  'col-span-1 row-span-1',        // 1
  'col-span-1 row-span-1',        // 2
  'col-span-2 row-span-1',        // 3 — wide
  'col-span-1 row-span-1',        // 4
  'col-span-1 row-span-1',        // 5
  'col-span-2 row-span-1',        // 6 — wide
];

export default async function ProductsBentoGrid({ content, tenantId }: ProductsBentoGridProps) {
  const db = supabaseAdmin();
  const { data: listings } = await db
    .from('listings')
    .select('id, slug, name, short_description, base_price_cents, is_preview, metadata')
    .eq('tenant_id', tenantId)
    .eq('listing_type', 'product')
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('published_at', { ascending: false })
    .limit(7);

  const items: Listing[] = (listings ?? []).map((l) => ({
    ...l,
    metadata: (l.metadata as { image_url?: string | null } | null) ?? null,
  }));

  return (
    <section id="products" className="bg-s-background py-s-section sf-noise-grain">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12">
          <ScrollReveal delay={0.05}>
            <h2 className="sf-heading sf-text-heading text-s-text">{content.headline}</h2>
          </ScrollReveal>
          {content.subtitle !== undefined && content.subtitle !== '' && (
            <ScrollReveal delay={0.15}>
              <p className="mt-3 max-w-xl sf-body text-s-muted">{content.subtitle}</p>
            </ScrollReveal>
          )}
        </div>

        {items.length === 0 ? (
          <p className="text-center sf-body text-s-muted">Products coming soon.</p>
        ) : (
          <ul className="grid grid-cols-4 grid-flow-dense auto-rows-[minmax(160px,1fr)] gap-3 md:gap-4 md:auto-rows-[minmax(220px,1fr)]">
            {items.map((listing, i) => {
              const cellClass = BENTO_CLASSES[i] ?? 'col-span-1 row-span-1';
              const isFeature = i === 0;
              return (
                <ScrollReveal key={listing.id} delay={0.05 + i * 0.06} className={cellClass}>
                  <a
                    href={`/listings/${listing.slug}`}
                    className="group block relative h-full w-full overflow-hidden rounded-s-card border border-s-border bg-s-surface"
                  >
                    {listing.metadata?.image_url != null ? (
                      <Image
                        src={listing.metadata.image_url}
                        alt={listing.name}
                        fill
                        className="object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-105"
                        sizes={isFeature ? '(max-width: 720px) 100vw, 50vw' : '(max-width: 720px) 50vw, 25vw'}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-s-primary/10">
                        <span className="text-xs sf-body text-s-muted">Photo coming soon</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent pointer-events-none" />
                    <div className={[
                      'absolute inset-0 flex flex-col justify-end text-white',
                      isFeature ? 'p-6 md:p-8' : 'p-4',
                    ].join(' ')}>
                      <p className={[
                        'font-medium mb-1 leading-tight',
                        isFeature ? 'text-xl md:text-2xl font-s-heading font-black tracking-tight' : 'text-sm md:text-base sf-body',
                      ].join(' ')}>
                        {listing.name}
                      </p>
                      {listing.is_preview ? (
                        <p className="font-semibold sf-body text-white/85 uppercase tracking-[0.15em] text-[10px]">
                          Coming Soon
                        </p>
                      ) : (
                        <p className={['font-semibold sf-body text-white/95', isFeature ? 'text-base md:text-lg' : 'text-xs'].join(' ')}>
                          {formatPrice(listing.base_price_cents)}
                        </p>
                      )}
                    </div>
                  </a>
                </ScrollReveal>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
