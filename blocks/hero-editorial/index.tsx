import type { ReactNode } from 'react';
import meta from './meta';

export { meta };

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

export default function HeroEditorial({ content, slots }: HeroEditorialProps) {
  const { headline, subheadline, backgroundImageUrl } = content;
  const hasBackground = backgroundImageUrl !== undefined;

  return (
    <section
      className="relative w-full"
      style={{
        backgroundColor: 'var(--color-background)',
        paddingTop: 'var(--spacing-section)',
        paddingBottom: 'var(--spacing-section)',
      }}
    >
      {hasBackground && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${backgroundImageUrl})` }}
          aria-hidden="true"
        >
          <div
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
          />
        </div>
      )}

      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <h1
          className="mb-4 leading-tight"
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 'var(--heading-weight)',
            letterSpacing: 'var(--heading-letter-spacing)',
            color: hasBackground ? '#fff' : 'var(--color-text)',
            fontSize: 'clamp(2.5rem, 6vw, 5rem)',
          }}
        >
          {headline}
        </h1>

        {subheadline !== undefined && (
          <p
            className="mx-auto mb-8 max-w-xl leading-relaxed"
            style={{
              fontFamily: 'var(--font-body)',
              lineHeight: 'var(--body-line-height)',
              fontSize: '1.125rem',
              color: hasBackground ? 'rgba(255,255,255,0.85)' : 'var(--color-text-muted)',
            }}
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
