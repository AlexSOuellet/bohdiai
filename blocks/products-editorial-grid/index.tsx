import Image from 'next/image';
import meta from './meta';
import { supabaseAdmin } from '@/lib/supabase';
import ScrollReveal from '@/components/storefront/ScrollReveal';

export { meta };

interface ProductsEditorialGridContent {
  headline: string;
  subtitle?: string;
}

interface ProductsEditorialGridProps {
  content: ProductsEditorialGridContent;
  tenantId: string;
}

interface Listing {
  id: string;
  slug: string;
  name: string;
  short_description: string | null;
  base_price_cents: number;
  metadata: { image_url?: string | null } | null;
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

export default async function ProductsEditorialGrid({ content, tenantId }: ProductsEditorialGridProps) {
  const db = supabaseAdmin();
  const { data: listings } = await db
    .from('listings')
    .select('id, slug, name, short_description, base_price_cents, metadata')
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('published_at', { ascending: false })
    .limit(12);

  const items: Listing[] = (listings ?? []).map((l) => ({
    ...l,
    metadata: (l.metadata as { image_url?: string | null } | null) ?? null,
  }));

  return (
    <section id="products" className="bg-s-background py-s-section sf-noise-grain relative overflow-hidden">
      
      {/* Soft background ambient blur orb */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[60%] h-[40%] rounded-full bg-s-primary/5 blur-[120px] pointer-events-none z-0" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-6 z-content">
        
        {/* Asymmetrical Left-Aligned Header Block */}
        <div className="mb-16 md:mb-24 text-left max-w-2xl border-l-[3px] border-s-accent pl-6">
          <ScrollReveal delay={0.1} yOffset={15}>
            <h2 className="sf-heading sf-text-heading font-black tracking-tighter uppercase leading-[0.95]">
              {content.headline}
            </h2>
          </ScrollReveal>
          {content.subtitle !== undefined && content.subtitle !== '' && (
            <ScrollReveal delay={0.2} yOffset={15}>
              <p className="mt-3 font-s-body text-s-muted text-base md:text-lg leading-relaxed">
                {content.subtitle}
              </p>
            </ScrollReveal>
          )}
        </div>

        {items.length === 0 ? (
          <p className="text-left font-s-body text-s-muted">Our collection is currently undergoing curation. Please check back shortly.</p>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-16 md:gap-x-12 lg:gap-x-16 items-start">
            {items.map((listing, index) => {
              // Alternate vertical portrait vs landscape aspects and vertical offsets to break standard grids
              const isEven = index % 2 === 0;
              
              return (
                <li 
                  key={listing.id}
                  className={isEven ? '' : 'md:translate-y-12 lg:translate-y-16'}
                >
                  <ScrollReveal delay={(index % 3) * 0.15} yOffset={25} className="w-full">
                    <a
                      href={`/listings/${listing.slug}`}
                      className="block group"
                    >
                      {/* Photographic Container with Dynamic Aspect Ratios */}
                      <div 
                        className={[
                          'relative w-full rounded-s-card overflow-hidden shadow-2xl border border-s-border bg-s-surface mb-6 transition-all duration-base group-hover:shadow-3xl',
                          isEven ? 'aspect-[1/1.25]' : 'aspect-[1.4/1]'
                        ].join(' ')}
                      >
                        {listing.metadata?.image_url != null ? (
                          <Image
                            src={listing.metadata.image_url}
                            alt={listing.name}
                            fill
                            className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <span className="text-xs font-s-body text-s-muted">Curation in progress</span>
                          </div>
                        )}

                        {/* Subtle atmospheric vignette over image */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent pointer-events-none" />

                        {/* Floating glassmorphism price tag */}
                        <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-md py-1.5 px-3 rounded-pill shadow-lg z-raised">
                          <p className="font-s-heading font-black text-white text-sm tracking-tight leading-none">
                            {formatPrice(listing.base_price_cents)}
                          </p>
                        </div>
                      </div>

                      {/* Editorial Product Details */}
                      <div className="px-1 flex flex-col items-start text-left">
                        <h3 className="font-s-heading font-bold text-s-text text-lg uppercase tracking-tight transition-colors group-hover:text-s-accent">
                          {listing.name}
                        </h3>
                        {listing.short_description !== null && (
                          <p className="font-s-body text-s-muted text-sm leading-relaxed mt-2 line-clamp-2">
                            {listing.short_description}
                          </p>
                        )}
                        <span className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-s-accent font-bold group-hover:underline">
                          View details &rarr;
                        </span>
                      </div>
                    </a>
                  </ScrollReveal>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      
    </section>
  );
}
