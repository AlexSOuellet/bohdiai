import type { ReactNode } from 'react';
import Image from 'next/image';
import meta from './meta';
import ScrollReveal from '@/components/storefront/ScrollReveal';

export { meta };

interface HeroSplitGalleryContent {
  tagline?: string;
  headline: string;
  subheadline?: string;
  primaryImageUrl?: string;
  secondaryImageUrl?: string;
}

interface HeroSplitGallerySlots {
  'primary-cta'?: ReactNode;
}

interface HeroSplitGalleryProps {
  content: HeroSplitGalleryContent;
  slots?: HeroSplitGallerySlots;
}

/**
 * Splits and formats the headline to create high-fashion, studio-grade visual contrast
 * using tokenized fonts and dynamic weight variations. Pairings combine refined
 * light serif/headings with bold, block-lettered heading forms.
 */
function formatHeadline(text: string) {
  if (text === undefined || text === '') return '';
  const words = text.split(' ');
  if (words.length <= 1) {
    return <span className="font-s-heading font-black tracking-tighter uppercase">{text}</span>;
  }

  const splitIndex = words.length > 3 ? 2 : 1;
  const kicker = words.slice(0, splitIndex).join(' ');
  const main = words.slice(splitIndex).join(' ');

  return (
    <span className="flex flex-col md:inline">
      <span className="font-s-heading font-light italic text-s-accent tracking-wide mb-2 md:mb-0 md:mr-4 block md:inline text-4xl md:text-5xl lg:text-6xl capitalize">
        {kicker}
      </span>
      <span className="font-s-heading font-black tracking-tighter uppercase text-s-text">
        {main}
      </span>
    </span>
  );
}

export default function HeroSplitGallery({ content, slots }: HeroSplitGalleryProps) {
  const { tagline, headline, subheadline, primaryImageUrl, secondaryImageUrl } = content;
  const hasPrimary = primaryImageUrl !== undefined && primaryImageUrl !== '';
  const hasSecondary = secondaryImageUrl !== undefined && secondaryImageUrl !== '';

  return (
    <section className="relative min-h-[90vh] md:min-h-screen w-full flex flex-col md:flex-row items-stretch overflow-hidden bg-s-background sf-noise-grain">

      {/* ─── Left Column: Full Viewport Portrait Photo ─── */}
      <div className="relative w-full md:w-1/2 min-h-[50vh] md:min-h-screen overflow-hidden group">
        {hasPrimary ? (
          <>
            <Image
              src={primaryImageUrl}
              alt={headline}
              fill
              priority
              sizes="(max-width: 720px) 100vw, 50vw"
              className="object-cover object-center transition-transform duration-[1400ms] ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-s-background/50 via-transparent to-black/15 pointer-events-none" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-s-surface via-s-background to-s-surface">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] rounded-full bg-s-accent/10 blur-[100px] pointer-events-none" />
          </div>
        )}
      </div>

      {/* ─── Right Column: High-Tension Typography & Overlapping Horizontal Card ─── */}
      <div className="relative w-full md:w-1/2 flex flex-col justify-center items-start px-6 py-12 md:p-16 lg:p-24 bg-s-background">
        
        {/* Ambient background glow orb */}
        <div className="absolute top-1/4 right-0 w-[50%] h-[50%] rounded-full bg-s-accent/5 blur-[100px] pointer-events-none z-0" aria-hidden="true" />
        
        <div className="relative z-content w-full max-w-lg">
          
          {/* Aesthetic Tagline Kicker */}
          {tagline !== undefined && tagline !== '' && (
            <ScrollReveal delay={0.1} yOffset={15}>
              <div className="mb-4 flex items-center gap-2">
                <span className="h-[2px] w-5 bg-s-accent inline-block" />
                <span className="font-s-body text-xs uppercase tracking-[0.2em] text-s-accent font-bold">
                  {tagline}
                </span>
              </div>
            </ScrollReveal>
          )}

          {/* Staggered Headline */}
          <ScrollReveal delay={0.25} yOffset={25}>
            <h1 className="mb-6 sf-text-hero leading-[0.95] md:leading-[0.9] tracking-tighter text-left select-none font-s-heading font-black text-s-text">
              {formatHeadline(headline)}
            </h1>
          </ScrollReveal>

          {/* Subheadline Prose */}
          {subheadline !== undefined && subheadline !== '' && (
            <ScrollReveal delay={0.4} yOffset={20}>
              <p className="mb-8 sf-body text-base md:text-lg text-s-muted/95 leading-relaxed font-normal">
                {subheadline}
              </p>
            </ScrollReveal>
          )}

          {/* Slots CTA */}
          {slots?.['primary-cta'] !== undefined && (
            <ScrollReveal delay={0.55} yOffset={15}>
              <div className="mb-12 md:mb-16">
                {slots['primary-cta']}
              </div>
            </ScrollReveal>
          )}

          {/* Secondary Overlapping Landscape Photo */}
          {hasSecondary && (
            <ScrollReveal delay={0.7} yOffset={30} className="w-full">
              <div className="relative aspect-[1.6/1] md:absolute md:bottom-[-80px] md:left-[-140px] md:w-[320px] lg:w-[400px] rounded-s-card overflow-hidden shadow-2xl border border-s-border bg-s-surface group z-raised hidden md:block">
                <Image
                  src={secondaryImageUrl ?? ''}
                  alt={headline}
                  fill
                  sizes="(max-width: 720px) 100vw, 400px"
                  className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
              </div>
            </ScrollReveal>
          )}

        </div>
      </div>
      
    </section>
  );
}
