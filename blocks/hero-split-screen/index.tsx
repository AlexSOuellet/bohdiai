import type { ReactNode } from 'react';
import Image from 'next/image';
import meta from './meta';

export { meta };

interface HeroSplitScreenContent {
  tagline?: string;
  headline: string;
  subheadline?: string;
  backgroundImageUrl: string;
  layout?: string;
}

interface HeroSplitScreenSlots {
  'primary-cta'?: ReactNode;
}

interface HeroSplitScreenProps {
  content: HeroSplitScreenContent;
  slots?: HeroSplitScreenSlots;
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
    <span className="flex flex-col">
      <span className="font-s-heading font-light italic text-s-accent tracking-wide mb-2 text-2xl md:text-3xl xl:text-4xl capitalize">
        {kicker}
      </span>
      <span className="font-s-heading font-black tracking-tighter uppercase text-s-text">
        {main}
      </span>
    </span>
  );
}

export default function HeroSplitScreen({ content, slots }: HeroSplitScreenProps) {
  const { tagline, headline, subheadline, backgroundImageUrl, layout } = content;
  const imageRight = layout === 'image-right';

  return (
    <section className={[
      'relative min-h-[90vh] md:min-h-screen w-full flex flex-col items-stretch overflow-hidden bg-s-background sf-noise-grain',
      imageRight ? 'md:flex-row-reverse' : 'md:flex-row',
    ].join(' ')}>

      {/* Photo side */}
      <div className="relative w-full md:w-1/2 min-h-[45vh] md:min-h-screen overflow-hidden group">
        <Image
          src={backgroundImageUrl}
          alt={headline}
          fill
          priority
          sizes="(max-width: 720px) 100vw, 50vw"
          className="object-cover object-center transition-transform duration-[1400ms] ease-out group-hover:scale-105"
        />
        {/* Soft atmospheric gradient depth overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-s-background/60 via-transparent to-transparent pointer-events-none md:hidden" />
        <div className={[
          'absolute inset-0 pointer-events-none hidden md:block',
          imageRight
            ? 'bg-gradient-to-l from-transparent via-transparent to-s-background/45'
            : 'bg-gradient-to-r from-transparent via-transparent to-s-background/45',
        ].join(' ')} />
      </div>

      {/* Typography card side */}
      <div className="relative w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 lg:p-20 bg-s-background">
        
        {/* Ambient background accent ray */}
        <div className="absolute -bottom-[10%] -right-[10%] w-[60%] h-[60%] rounded-full bg-s-accent/10 blur-[120px] pointer-events-none z-0" aria-hidden="true" />

        <div className="relative w-full max-w-xl z-content">

            {/* The Premium Structured Card Panel */}
            <div className="bg-s-surface border border-s-border rounded-s-card p-8 md:p-10 lg:p-12 shadow-2xl relative overflow-hidden sf-noise-grain">
              
              {/* Micro-texture local overlay */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay z-0 sf-noise-grain" aria-hidden="true" />

              {/* Tagline / Location Kicker with border divider */}
              {tagline !== undefined && tagline !== '' && (
                <div className="mb-6 flex items-center gap-3">
                  <span className="font-s-body text-xs uppercase tracking-[0.22em] text-s-accent font-bold pb-2 border-b border-s-accent/30">
                    {tagline}
                  </span>
                </div>
              )}

              {/* Staggered Mixed-Weight Headline */}
              <h1 className="mb-6 text-3xl md:text-4xl xl:text-5xl leading-[1] tracking-tighter text-left select-none font-s-heading font-black text-s-text break-words">
                {formatHeadline(headline)}
              </h1>

              {/* Dividing visual tension line */}
              <div className="w-full border-t border-s-border/60 my-6" aria-hidden="true" />

              {/* Story-Forward Supporting Subheadline */}
              {subheadline !== undefined && subheadline !== '' && (
                <p className="mb-8 font-s-body text-base text-s-muted/95 leading-relaxed font-normal">
                  {subheadline}
                </p>
              )}

              {/* Primary CTA Slot Callout */}
              {slots?.['primary-cta'] !== undefined && (
                <div className="flex items-center justify-start">
                  {slots['primary-cta']}
                </div>
              )}

            </div>

        </div>
      </div>

    </section>
  );
}
