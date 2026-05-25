import Image from 'next/image';
import meta from './meta';
import { supabaseAdmin } from '@/lib/supabase';
import ScrollReveal from '@/components/storefront/ScrollReveal';

export { meta };

interface ProductsBloomGridContent {
  headline: string;
  subtitle?: string;
}

interface ProductsBloomGridProps {
  content: ProductsBloomGridContent;
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

/**
 * Alternating masonry slot pattern across a 3-column grid.
 *
 * Group 0 (indices 0–1): [wide-feature × 2 cols] [tall × 1 col]
 * Group 1 (indices 2–3): [tall × 1 col] [wide-feature × 2 cols]
 * Group 2 (indices 4–5): [wide-feature × 2 cols] [tall × 1 col]
 * …and so on.
 *
 * This creates organic brick-like visual tension without a framework or JS layout engine.
 */
function getSlot(index: number): 'feature' | 'tall' {
  const groupIndex = Math.floor(index / 2);
  const posInGroup = index % 2;
  // Even groups: feature first, tall second
  // Odd groups:  tall first, feature second
  return groupIndex % 2 === 0
    ? posInGroup === 0 ? 'feature' : 'tall'
    : posInGroup === 0 ? 'tall' : 'feature';
}

export default async function ProductsBloomGrid({ content, tenantId }: ProductsBloomGridProps) {
  const db = supabaseAdmin();
  const { data: listings } = await db
    .from('listings')
    .select('id, slug, name, short_description, base_price_cents, metadata')
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('published_at', { ascending: false })
    .limit(10);

  const items: Listing[] = (listings ?? []).map((l) => ({
    ...l,
    metadata: (l.metadata as { image_url?: string | null } | null) ?? null,
  }));

  return (
    <section className="relative bg-s-background py-s-section overflow-hidden">

      {/* ─── Botanical ambient glow orbs — give the section a living, garden-like warmth ─── */}
      <div
        className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-s-primary/8 blur-[120px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-24 -right-24 w-[400px] h-[400px] rounded-full bg-s-accent/10 blur-[100px] pointer-events-none"
        aria-hidden="true"
      />

      {/* ─── Grain texture overlay — only here, at low opacity with blend mode ─── */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04] mix-blend-overlay sf-noise-grain"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-6 md:px-10">

        {/* ─── Section header: centered with botanical ornament rule ─── */}
        <ScrollReveal delay={0.05} yOffset={20} className="mb-16 md:mb-20 text-center">
          <div className="flex items-center justify-center gap-4 mb-5">
            <span className="h-px flex-1 max-w-[80px] bg-s-border" aria-hidden="true" />
            <span className="font-s-body text-[10px] uppercase tracking-[0.3em] text-s-accent font-bold">
              Collection
            </span>
            <span className="h-px flex-1 max-w-[80px] bg-s-border" aria-hidden="true" />
          </div>
          <h2 className="font-s-heading font-black sf-text-heading tracking-tight text-s-text leading-[0.95]">
            {content.headline}
          </h2>
          {content.subtitle !== undefined && content.subtitle !== '' && (
            <p className="mx-auto mt-4 max-w-lg font-s-body text-s-muted text-base md:text-lg leading-relaxed">
              {content.subtitle}
            </p>
          )}
        </ScrollReveal>

        {/* ─── Asymmetric masonry grid ─── */}
        {items.length === 0 ? (
          <p className="text-center font-s-body text-s-muted">Products coming soon.</p>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 items-start">
            {items.map((listing, index) => {
              const slot = getSlot(index);
              const isFeature = slot === 'feature';

              // Stagger delay caps at 0.35s so late items don't feel dead
              const revealDelay = Math.min(index * 0.08, 0.35);

              return (
                <li
                  key={listing.id}
                  className={isFeature ? 'lg:col-span-2' : 'lg:col-span-1'}
                >
                  <ScrollReveal
                    delay={revealDelay}
                    yOffset={isFeature ? 32 : 22}
                    duration={0.75}
                  >
                    <a
                      href={`/listings/${listing.slug}`}
                      className="block group relative overflow-hidden rounded-3xl shadow-lg border border-s-border/30 bg-s-surface"
                    >
                      {/* ─── Photo container: feature cells are landscape; tall cells are portrait ─── */}
                      <div
                        className={[
                          'relative w-full overflow-hidden',
                          isFeature ? 'aspect-[16/9]' : 'aspect-[3/4]',
                        ].join(' ')}
                      >
                        {listing.metadata?.image_url != null ? (
                          <Image
                            src={listing.metadata.image_url}
                            alt={listing.name}
                            fill
                            sizes={
                              isFeature
                                ? '(max-width: 720px) 100vw, (max-width: 1024px) 100vw, 66vw'
                                : '(max-width: 720px) 100vw, (max-width: 1024px) 50vw, 33vw'
                            }
                            className="object-cover transition-transform duration-[1100ms] ease-out group-hover:scale-[1.04]"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-s-surface">
                            <span className="font-s-body text-xs text-s-muted">
                              Coming soon
                            </span>
                          </div>
                        )}

                        {/* ─── Gradient vignette so text overlay always reads clearly ─── */}
                        <div
                          className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent pointer-events-none"
                          aria-hidden="true"
                        />

                        {/* ─── Text overlay: name + price anchored to the bottom of the image ─── */}
                        <div className="absolute bottom-0 inset-x-0 p-5 flex items-end justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-s-heading font-bold text-white leading-tight text-lg md:text-xl truncate group-hover:opacity-90 transition-opacity">
                              {listing.name}
                            </p>
                            {listing.short_description !== null && isFeature && (
                              <p className="font-s-body text-white/70 text-sm mt-1 line-clamp-1">
                                {listing.short_description}
                              </p>
                            )}
                          </div>

                          {/* ─── Bold pill price badge — joyful for Bazaar, clean for Meadow ─── */}
                          <span className="flex-shrink-0 bg-s-accent text-white font-s-heading font-black text-sm px-3 py-1.5 rounded-full leading-none shadow-lg ring-1 ring-white/10 whitespace-nowrap">
                            {formatPrice(listing.base_price_cents)}
                          </span>
                        </div>
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
