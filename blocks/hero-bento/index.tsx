import type { ReactNode } from 'react';
import Image from 'next/image';
import meta from './meta';
import ScrollReveal from '@/components/storefront/ScrollReveal';

export { meta };

interface HeroBentoContent {
  tagline?: string;
  headline: string;
  subheadline?: string;
  featureImageUrl: string;
  portraitImageUrl?: string;
  detailImageUrl?: string;
  accentImageUrl?: string;
}

interface HeroBentoSlots {
  'primary-cta'?: ReactNode;
}

interface HeroBentoProps {
  content: HeroBentoContent;
  slots?: HeroBentoSlots;
}

export default function HeroBento({ content, slots }: HeroBentoProps) {
  const { tagline, headline, subheadline, featureImageUrl, portraitImageUrl, detailImageUrl, accentImageUrl } = content;

  return (
    <section className="relative w-full bg-s-background py-s-section sf-noise-grain">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-12 grid-rows-[minmax(280px,1fr)_minmax(220px,1fr)] gap-3 md:gap-4 min-h-[80vh]">

          {/* Feature cell — large, headline overlay */}
          <ScrollReveal delay={0.05} className="col-span-12 md:col-span-8 row-span-1 relative overflow-hidden rounded-s-card border border-s-border bg-s-surface group">
            <Image
              src={featureImageUrl}
              alt={headline}
              fill
              priority
              sizes="(max-width: 720px) 100vw, 66vw"
              className="object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
            <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12 text-white">
              {tagline !== undefined && tagline !== '' && (
                <span className="mb-3 font-s-body text-[0.7rem] uppercase tracking-[0.22em] text-white/85 font-bold">
                  {tagline}
                </span>
              )}
              <h1 className="font-s-heading font-black tracking-tight text-3xl md:text-5xl lg:text-6xl leading-[0.95] mb-4 max-w-2xl">
                {headline}
              </h1>
              {subheadline !== undefined && subheadline !== '' && (
                <p className="font-s-body text-sm md:text-base text-white/90 max-w-xl mb-6 leading-relaxed">
                  {subheadline}
                </p>
              )}
              {slots?.['primary-cta'] !== undefined && (
                <div>{slots['primary-cta']}</div>
              )}
            </div>
          </ScrollReveal>

          {/* Portrait cell — tall narrow */}
          <ScrollReveal delay={0.15} className="col-span-12 md:col-span-4 row-span-2 relative overflow-hidden rounded-s-card border border-s-border bg-s-surface group">
            {portraitImageUrl !== undefined && portraitImageUrl !== '' ? (
              <Image
                src={portraitImageUrl}
                alt=""
                fill
                sizes="(max-width: 720px) 100vw, 33vw"
                className="object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 bg-s-primary/10" aria-hidden="true" />
            )}
          </ScrollReveal>

          {/* Detail cell */}
          <ScrollReveal delay={0.25} className="col-span-6 md:col-span-4 row-span-1 relative overflow-hidden rounded-s-card border border-s-border bg-s-surface group">
            {detailImageUrl !== undefined && detailImageUrl !== '' ? (
              <Image
                src={detailImageUrl}
                alt=""
                fill
                sizes="(max-width: 720px) 50vw, 33vw"
                className="object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 bg-s-accent/10" aria-hidden="true" />
            )}
          </ScrollReveal>

          {/* Accent cell */}
          <ScrollReveal delay={0.35} className="col-span-6 md:col-span-4 row-span-1 relative overflow-hidden rounded-s-card border border-s-border bg-s-surface group">
            {accentImageUrl !== undefined && accentImageUrl !== '' ? (
              <Image
                src={accentImageUrl}
                alt=""
                fill
                sizes="(max-width: 720px) 50vw, 33vw"
                className="object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 bg-s-primary/10" aria-hidden="true" />
            )}
          </ScrollReveal>

        </div>
      </div>
    </section>
  );
}
