import type { ReactNode } from 'react';
import Image from 'next/image';
import meta from './meta';
import ScrollReveal from '@/components/storefront/ScrollReveal';

export { meta };

interface HeroLavaContent {
  tagline?: string;
  headline: string;
  subheadline?: string;
  primaryImageUrl: string;
  secondaryImageUrl?: string;
}

interface HeroLavaSlots {
  'primary-cta'?: ReactNode;
}

interface HeroLavaProps {
  content: HeroLavaContent;
  slots?: HeroLavaSlots;
}

// Organic blob shapes via aggressive asymmetric border-radius. The shapes
// look irregular but are deterministic so the layout doesn't shift between
// renders.
const PRIMARY_BLOB_RADIUS = '58% 42% 64% 36% / 52% 38% 62% 48%';
const TEXT_BLOB_RADIUS = '42% 58% 50% 50% / 60% 40% 60% 40%';
const SECONDARY_BLOB_RADIUS = '50% 50% 38% 62% / 44% 56% 44% 56%';

export default function HeroLava({ content, slots }: HeroLavaProps) {
  const { tagline, headline, subheadline, primaryImageUrl, secondaryImageUrl } = content;

  return (
    <section className="relative w-full bg-s-background sf-noise-grain min-h-[90vh] md:min-h-screen overflow-hidden flex items-center">
      <div className="relative w-full max-w-[1600px] mx-auto px-6 py-16 md:py-20 lg:py-24">

        {/* Ambient warm accent glow */}
        <div className="absolute top-[10%] right-[15%] w-[40vw] h-[40vw] rounded-full bg-s-accent/10 blur-[120px] pointer-events-none z-0" aria-hidden="true" />
        <div className="absolute bottom-[5%] left-[5%] w-[30vw] h-[30vw] rounded-full bg-s-primary/8 blur-[100px] pointer-events-none z-0" aria-hidden="true" />

        <div className="relative z-content grid grid-cols-12 gap-6 md:gap-8 items-center">

          {/* Primary blob — large image left */}
          <ScrollReveal delay={0.1} yOffset={30} className="col-span-12 md:col-span-7 relative">
            <div
              className="relative aspect-[5/6] w-full overflow-hidden shadow-2xl border border-s-border"
              style={{ borderRadius: PRIMARY_BLOB_RADIUS }}
            >
              <Image
                src={primaryImageUrl}
                alt={headline}
                fill
                priority
                sizes="(max-width: 720px) 100vw, 55vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-black/30 via-transparent to-transparent pointer-events-none" />
            </div>
          </ScrollReveal>

          {/* Right column — text blob + small secondary blob, stacked */}
          <div className="col-span-12 md:col-span-5 flex flex-col gap-6 md:gap-8 -ml-0 md:-ml-12">

            {/* Text blob */}
            <ScrollReveal delay={0.25} yOffset={28}>
              <div
                className="relative bg-s-surface border border-s-border p-8 md:p-10 lg:p-12 shadow-xl"
                style={{ borderRadius: TEXT_BLOB_RADIUS }}
              >
                {tagline !== undefined && tagline !== '' && (
                  <span className="mb-4 inline-block font-s-body text-[0.7rem] uppercase tracking-[0.22em] text-s-accent font-bold">
                    {tagline}
                  </span>
                )}
                <h1 className="font-s-heading font-black text-s-text tracking-tight leading-[0.95] text-3xl md:text-4xl lg:text-5xl mb-5">
                  {headline}
                </h1>
                {subheadline !== undefined && subheadline !== '' && (
                  <p className="font-s-body text-sm md:text-base text-s-muted leading-relaxed mb-7">
                    {subheadline}
                  </p>
                )}
                {slots?.['primary-cta'] !== undefined && (
                  <div>{slots['primary-cta']}</div>
                )}
              </div>
            </ScrollReveal>

            {/* Secondary blob — smaller, optional */}
            {secondaryImageUrl !== undefined && secondaryImageUrl !== '' && (
              <ScrollReveal delay={0.4} yOffset={24} className="self-end w-2/3 md:w-3/4">
                <div
                  className="relative aspect-square overflow-hidden border border-s-border shadow-lg"
                  style={{ borderRadius: SECONDARY_BLOB_RADIUS }}
                >
                  <Image
                    src={secondaryImageUrl}
                    alt=""
                    fill
                    sizes="(max-width: 720px) 50vw, 25vw"
                    className="object-cover"
                  />
                </div>
              </ScrollReveal>
            )}

          </div>

        </div>
      </div>
    </section>
  );
}
