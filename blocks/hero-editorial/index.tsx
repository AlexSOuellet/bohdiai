import type { ReactNode } from 'react';
import meta from './meta';

export { meta };

interface HeroEditorialContent {
  headline: string;
  subheadline?: string;
  backgroundImageUrl?: string;
}

interface HeroEditorialSlots {
  'primary-cta'?: ReactNode;
}

interface HeroEditorialProps {
  content: HeroEditorialContent;
  slots?: HeroEditorialSlots;
}

export default function HeroEditorial({ content, slots }: HeroEditorialProps) {
  const { headline, subheadline, backgroundImageUrl } = content;
  const hasBackground = backgroundImageUrl !== undefined;

  return (
    <section className="relative w-full bg-s-background py-s-section">
      {hasBackground && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          // backgroundImage is a dynamic URL — cannot be expressed as a Tailwind class
          style={{ backgroundImage: `url(${backgroundImageUrl})` }}
          aria-hidden="true"
        >
          <div className="absolute inset-0 bg-black/45" />
        </div>
      )}

      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <h1
          className={[
            'mb-4 sf-heading sf-text-hero',
            hasBackground ? 'text-white' : 'text-s-text',
          ].join(' ')}
        >
          {headline}
        </h1>

        {subheadline !== undefined && (
          <p
            className={[
              'mx-auto mb-8 max-w-xl sf-body sf-text-body',
              hasBackground ? 'text-white/85' : 'text-s-muted',
            ].join(' ')}
          >
            {subheadline}
          </p>
        )}

        {slots?.['primary-cta'] !== undefined && (
          <div className="flex justify-center">{slots['primary-cta']}</div>
        )}
      </div>
    </section>
  );
}
