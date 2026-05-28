import Image from 'next/image';
import meta from './meta';
import { supabaseAdmin } from '@/lib/supabase';
import ScrollReveal from '@/components/storefront/ScrollReveal';
import ParallaxImage from '@/components/storefront/motion/ParallaxImage';

export { meta };

interface ProductsInTheWildContent {
  headline: string;
  subtitle?: string;
}

interface ProductsInTheWildProps {
  content: ProductsInTheWildContent;
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

// Per-product layout assignments. Each product is its own full-bleed scene
// rather than a grid cell. Layouts alternate to break the vertical-stack feel.
const SCENE_LAYOUTS = [
  'image-left-full',     // 0 — image dominates left 70%, text right
  'image-right-portrait',// 1 — narrow portrait image right, text + price left
  'image-full-bleed',    // 2 — image spans entire viewport width, text overlaid
  'image-center-narrow', // 3 — small centered image, generous space, text below
  'image-left-full',     // 4
  'image-right-portrait',// 5
  'image-full-bleed',    // 6
  'image-center-narrow', // 7
];

export default async function ProductsInTheWild({ content, tenantId }: ProductsInTheWildProps) {
  const db = supabaseAdmin();
  const { data: listings } = await db
    .from('listings')
    .select('id, slug, name, short_description, base_price_cents, is_preview, metadata')
    .eq('tenant_id', tenantId)
    .eq('listing_type', 'product')
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('published_at', { ascending: false })
    .limit(8);

  const items: Listing[] = (listings ?? []).map((l) => ({
    ...l,
    metadata: (l.metadata as { image_url?: string | null } | null) ?? null,
  }));

  return (
    <section id="products" className="relative w-full bg-s-background sf-noise-grain">

      {/* Section header */}
      <div className="mx-auto max-w-7xl px-6 pt-s-section pb-12 md:pb-20">
        <ScrollReveal delay={0.05}>
          <h2 className="font-s-heading font-light text-s-text text-4xl md:text-6xl lg:text-7xl tracking-tighter leading-[0.95] max-w-3xl">
            {content.headline}
          </h2>
        </ScrollReveal>
        {content.subtitle !== undefined && content.subtitle !== '' && (
          <ScrollReveal delay={0.15}>
            <p className="mt-6 sf-body text-s-muted text-base md:text-lg max-w-xl leading-relaxed">
              {content.subtitle}
            </p>
          </ScrollReveal>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-center sf-body text-s-muted pb-s-section">Products coming soon.</p>
      ) : (
        <div className="flex flex-col">
          {items.map((listing, i) => {
            const layout = SCENE_LAYOUTS[i % SCENE_LAYOUTS.length];
            return (
              <ProductScene
                key={listing.id}
                listing={listing}
                layout={layout ?? 'image-left-full'}
                index={i}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

function ProductScene({ listing, layout, index }: { listing: Listing; layout: string; index: number }) {
  const imgUrl = listing.metadata?.image_url ?? null;
  const indexLabel = String(index + 1).padStart(2, '0');

  if (layout === 'image-full-bleed') {
    return (
      <a href={`/listings/${listing.slug}`} className="group relative block w-full">
        <div className="relative w-full aspect-[16/10] md:aspect-[21/10] overflow-hidden">
          {imgUrl ? (
            <ParallaxImage amount={50} className="absolute inset-0">
              <Image
                src={imgUrl}
                alt={listing.name}
                fill
                sizes="100vw"
                className="object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.02]"
              />
            </ParallaxImage>
          ) : (
            <div className="absolute inset-0 bg-s-primary/10" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
          <ScrollReveal yOffset={20} className="absolute bottom-0 left-0 right-0 p-8 md:p-16 lg:p-20 text-white">
            <p className="font-s-body text-xs uppercase tracking-[0.3em] opacity-70 mb-3">{indexLabel}</p>
            <h3 className="font-s-heading font-black text-3xl md:text-5xl lg:text-6xl tracking-tighter leading-[0.95] mb-3 max-w-3xl">
              {listing.name}
            </h3>
            <PriceTag listing={listing} className="text-lg md:text-xl" />
          </ScrollReveal>
        </div>
      </a>
    );
  }

  if (layout === 'image-right-portrait') {
    return (
      <a href={`/listings/${listing.slug}`} className="group block w-full py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6 grid grid-cols-12 gap-6 md:gap-12 items-end">
          <ScrollReveal yOffset={24} className="col-span-12 md:col-span-7 lg:col-span-6 order-2 md:order-1">
            <p className="font-s-body text-xs uppercase tracking-[0.3em] text-s-muted mb-4">{indexLabel}</p>
            <h3 className="font-s-heading font-light text-s-text text-3xl md:text-5xl lg:text-6xl tracking-tighter leading-[0.95] mb-4 max-w-xl">
              {listing.name}
            </h3>
            {listing.short_description && (
              <p className="font-s-body text-s-muted text-base leading-relaxed mb-5 max-w-md">
                {listing.short_description}
              </p>
            )}
            <PriceTag listing={listing} className="text-base text-s-accent" />
          </ScrollReveal>
          <div className="col-span-12 md:col-span-5 lg:col-span-5 md:col-start-8 order-1 md:order-2">
            <div className="relative aspect-[3/4] w-full overflow-hidden md:translate-y-[-30px]">
              {imgUrl ? (
                <ParallaxImage amount={70} className="absolute inset-0">
                  <Image
                    src={imgUrl}
                    alt={listing.name}
                    fill
                    sizes="(max-width: 720px) 100vw, 40vw"
                    className="object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.03]"
                  />
                </ParallaxImage>
              ) : (
                <div className="absolute inset-0 bg-s-primary/10" />
              )}
            </div>
          </div>
        </div>
      </a>
    );
  }

  if (layout === 'image-center-narrow') {
    return (
      <a href={`/listings/${listing.slug}`} className="group block w-full py-20 md:py-32">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <div className="relative aspect-square w-full max-w-md mx-auto overflow-hidden mb-8">
            {imgUrl ? (
              <ParallaxImage amount={40} className="absolute inset-0">
                <Image
                  src={imgUrl}
                  alt={listing.name}
                  fill
                  sizes="(max-width: 720px) 100vw, 480px"
                  className="object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.04]"
                />
              </ParallaxImage>
            ) : (
              <div className="absolute inset-0 bg-s-primary/10" />
            )}
          </div>
          <ScrollReveal yOffset={18}>
            <p className="font-s-body text-xs uppercase tracking-[0.3em] text-s-muted mb-3">{indexLabel}</p>
            <h3 className="font-s-heading font-light text-s-text text-2xl md:text-4xl tracking-tighter mb-3">
              {listing.name}
            </h3>
            <PriceTag listing={listing} className="text-base text-s-accent" />
          </ScrollReveal>
        </div>
      </a>
    );
  }

  // image-left-full (default)
  return (
    <a href={`/listings/${listing.slug}`} className="group block w-full py-16 md:py-24">
      <div className="grid grid-cols-12 items-center gap-0">
        <div className="col-span-12 md:col-span-8 relative aspect-[5/4] md:aspect-[3/2]">
          {imgUrl ? (
            <ParallaxImage amount={60} className="absolute inset-0 overflow-hidden">
              <Image
                src={imgUrl}
                alt={listing.name}
                fill
                sizes="(max-width: 720px) 100vw, 66vw"
                className="object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.03]"
              />
            </ParallaxImage>
          ) : (
            <div className="absolute inset-0 bg-s-primary/10" />
          )}
        </div>
        <ScrollReveal yOffset={24} className="col-span-12 md:col-span-4 px-6 md:px-12 lg:px-16 pt-8 md:pt-0">
          <p className="font-s-body text-xs uppercase tracking-[0.3em] text-s-muted mb-3">{indexLabel}</p>
          <h3 className="font-s-heading font-light text-s-text text-3xl md:text-4xl lg:text-5xl tracking-tighter leading-[0.95] mb-4">
            {listing.name}
          </h3>
          {listing.short_description && (
            <p className="font-s-body text-s-muted text-sm md:text-base leading-relaxed mb-5">
              {listing.short_description}
            </p>
          )}
          <PriceTag listing={listing} className="text-base text-s-accent" />
        </ScrollReveal>
      </div>
    </a>
  );
}

function PriceTag({ listing, className }: { listing: Listing; className?: string }) {
  if (listing.is_preview) {
    return (
      <p className={['font-semibold sf-body uppercase tracking-[0.2em] text-[10px]', className ?? ''].join(' ')}>
        Coming Soon
      </p>
    );
  }
  return (
    <p className={['font-semibold sf-body', className ?? ''].join(' ')}>
      {formatPrice(listing.base_price_cents)}
    </p>
  );
}
