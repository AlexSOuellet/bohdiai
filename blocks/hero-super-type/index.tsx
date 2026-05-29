import type { ReactNode } from 'react';
import Image from 'next/image';
import meta from './meta';
import ScrollReveal from '@/components/storefront/ScrollReveal';
import SplitReveal from '@/components/storefront/motion/SplitReveal';
import ParallaxImage from '@/components/storefront/motion/ParallaxImage';

export { meta };

interface HeroSuperTypeContent {
  kicker?: string;
  headline: string;
  subheadline?: string;
  belowImageUrl?: string;
}

interface HeroSuperTypeSlots {
  'primary-cta'?: ReactNode;
}

interface HeroSuperTypeProps {
  content: HeroSuperTypeContent;
  slots?: HeroSuperTypeSlots;
}

export default function HeroSuperType({ content, slots }: HeroSuperTypeProps) {
  const { kicker, headline, subheadline, belowImageUrl } = content;

  return (
    <section className="relative w-full bg-s-background sf-noise-grain overflow-hidden">

      {/* Typography block */}
      <div className="relative pt-24 md:pt-32 lg:pt-40 pb-12 md:pb-16 px-6 md:px-12">

        {/* Ambient accent glow */}
        <div className="absolute -top-1/4 left-1/4 w-[60vw] h-[60vw] rounded-full bg-s-accent/8 blur-[150px] pointer-events-none z-0" aria-hidden="true" />

        <div className="relative z-content max-w-[1600px] mx-auto">

          {kicker !== undefined && kicker !== '' && (
            <ScrollReveal delay={0.1} yOffset={20}>
              <p className="mb-6 md:mb-8 font-s-heading font-light italic text-s-accent text-2xl md:text-4xl lg:text-5xl tracking-wide">
                {kicker}
              </p>
            </ScrollReveal>
          )}

          <h1 className="font-s-heading font-black text-s-text uppercase tracking-tighter leading-[0.88] hyphens-auto [overflow-wrap:anywhere] text-[clamp(2.75rem,9vw,9rem)]">
            <SplitReveal text={headline} by="char" stagger={0.025} delay={0.2} />
          </h1>

          <div className="mt-8 md:mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-end">
            {subheadline !== undefined && subheadline !== '' && (
              <ScrollReveal delay={0.4} yOffset={18}>
                <p className="font-s-body text-base md:text-lg text-s-muted leading-relaxed max-w-xl">
                  {subheadline}
                </p>
              </ScrollReveal>
            )}
            {slots?.['primary-cta'] !== undefined && (
              <ScrollReveal delay={0.5} yOffset={14} className="md:justify-self-end">
                {slots['primary-cta']}
              </ScrollReveal>
            )}
          </div>

        </div>
      </div>

      {/* Wide landscape image below the fold — parallaxes against scroll */}
      {belowImageUrl !== undefined && belowImageUrl !== '' && (
        <ParallaxImage amount={60} className="relative w-full aspect-[21/9] md:aspect-[21/7] overflow-hidden">
          <Image
            src={belowImageUrl}
            alt={headline}
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-s-background/40 via-transparent to-s-background/40 pointer-events-none" />
        </ParallaxImage>
      )}

    </section>
  );
}
