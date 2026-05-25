import meta from './meta';
import { supabaseAdmin } from '@/lib/supabase';
import ScrollReveal from '@/components/storefront/ScrollReveal';
import CarouselWrapper from './CarouselWrapper';

export { meta };

interface ProductsSplitCarouselContent {
  headline: string;
  subtitle?: string;
}

interface ProductsSplitCarouselProps {
  content: ProductsSplitCarouselContent;
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

export default async function ProductsSplitCarousel({ content, tenantId }: ProductsSplitCarouselProps) {
  const db = supabaseAdmin();
  const { data: listings } = await db
    .from('listings')
    .select('id, slug, name, short_description, base_price_cents, metadata')
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('published_at', { ascending: false })
    .limit(8);

  const items: Listing[] = (listings ?? []).map((l) => ({
    ...l,
    metadata: (l.metadata as { image_url?: string | null } | null) ?? null,
  }));

  return (
    <section id="products" className="bg-s-background py-s-section sf-noise-grain relative overflow-hidden">
      
      {/* Background ambient lighting ray */}
      <div className="absolute top-1/4 right-1/4 w-[50%] h-[50%] rounded-full bg-s-accent/5 blur-[120px] pointer-events-none z-0" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-6 z-content">
        
        {/* Asymmetrical Left-Aligned Header Block */}
        <div className="mb-16 md:mb-20 text-left max-w-2xl border-l-[3px] border-s-accent pl-6">
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

        {/* Staggered Interactive Slide Columns Container */}
        <ScrollReveal delay={0.3} yOffset={30} className="w-full">
          <CarouselWrapper items={items} />
        </ScrollReveal>
        
      </div>
      
    </section>
  );
}
