import type { ReactNode } from 'react';
import Image from 'next/image';
import meta from './meta';
import ScrollReveal from '@/components/storefront/ScrollReveal';

export { meta };

interface HeroCinematicContent {
  tagline?: string;
  headline: string;
  subheadline?: string;
  backgroundImageUrl?: string;
}

interface HeroCinematicSlots {
  'primary-cta'?: ReactNode;
}

interface HeroCinematicProps {
  content: HeroCinematicContent;
  slots?: HeroCinematicSlots;
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

  // Determine split point (first 1 or 2 words depending on length)
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

export default function HeroCinematic({ content, slots }: HeroCinematicProps) {
  const { tagline, headline, subheadline, backgroundImageUrl } = content;
  const hasBackground = backgroundImageUrl !== undefined && backgroundImageUrl !== '';

  return (
    <section className="relative min-h-[90vh] md:min-h-screen w-full flex items-center justify-start overflow-hidden bg-s-background py-16 md:py-24">
      {/* ─── Background Layer (Image vs. Ambient Gradient Fallback) ─── */}
      {hasBackground ? (
        <div className="absolute inset-0 z-0">
          <Image
            src={backgroundImageUrl}
            alt={headline}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center transition-transform duration-[1200ms] ease-out hover:scale-105"
          />
          {/* Studio-Grade Gradient Vignettes for depth and high text contrast */}
          <div 
            className="absolute inset-0 bg-gradient-to-t from-s-background via-s-background/40 to-black/60"
            aria-hidden="true" 
          />
          <div 
            className="absolute inset-0 bg-gradient-to-r from-s-background/90 via-s-background/50 to-transparent"
            aria-hidden="true" 
          />
        </div>
      ) : (
        /* Highly Atmospheric Fallback Background Layer */
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-s-background via-s-surface to-s-background">
          {/* Dramatic ambient accent orb */}
          <div 
            className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[60%] h-[60%] rounded-full bg-s-accent/10 blur-[130px] pointer-events-none"
            aria-hidden="true" 
          />
          <div 
            className="absolute bottom-0 inset-x-0 h-[40%] bg-gradient-to-t from-s-background to-transparent"
            aria-hidden="true" 
          />
        </div>
      )}

      {/* ─── Tactile Local Texture Overlay (Abstracted to globals.css class) ─── */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.04] mix-blend-overlay z-0 sf-noise-grain"
        aria-hidden="true"
      />

      {/* ─── Organic Accent Light Ray ─── */}
      <div 
        className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-s-accent/10 blur-[120px] pointer-events-none z-0" 
        aria-hidden="true"
      />

      {/* ─── Layout Tension and Main Content Area ─── */}
      <div className="relative w-full max-w-7xl mx-auto px-6 md:px-12 z-content grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Asymmetrical Floating Overlay Card with Glassmorphism Border */}
        <div className="col-span-1 lg:col-span-8 flex flex-col items-start text-left">
          
          {/* Tagline / Location Kicker with tokenized fonts and high-fashion spacing */}
          {tagline !== undefined && tagline !== '' && (
            <ScrollReveal delay={0.1} yOffset={15}>
              <div className="mb-4 flex items-center gap-2">
                <span className="h-1 w-6 bg-s-accent rounded-full inline-block" />
                <span className="font-s-body text-xs uppercase tracking-[0.25em] text-s-accent font-semibold">
                  {tagline}
                </span>
              </div>
            </ScrollReveal>
          )}

          {/* Staggered Headline */}
          <ScrollReveal delay={0.25} yOffset={25}>
            <h1 className="mb-6 sf-text-hero leading-[0.9] md:leading-[0.85] tracking-tighter text-left select-none font-s-heading font-black text-s-text">
              {formatHeadline(headline)}
            </h1>
          </ScrollReveal>

          {/* Story-Forward Supporting Narrative Block */}
          {subheadline !== undefined && subheadline !== '' && (
            <ScrollReveal delay={0.4} yOffset={20}>
              <p className="mb-8 max-w-xl sf-body text-base md:text-lg text-s-muted/95 leading-relaxed font-normal">
                {subheadline}
              </p>
            </ScrollReveal>
          )}

          {/* Primary CTA Slot Callout */}
          {slots?.['primary-cta'] !== undefined && (
            <ScrollReveal delay={0.55} yOffset={15}>
              <div className="flex items-center gap-4 group">
                <div className="transition-transform duration-base group-hover:translate-x-1">
                  {slots['primary-cta']}
                </div>
              </div>
            </ScrollReveal>
          )}

        </div>
      </div>
    </section>
  );
}
