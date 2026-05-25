import type { ReactNode } from 'react';
import meta from './meta';

export { meta };

interface AboutMakerContent {
  headline: string;
  body: string;
}

interface AboutMakerSlots {
  'primary-cta'?: ReactNode;
}

interface AboutMakerProps {
  content: AboutMakerContent;
  slots?: AboutMakerSlots;
}

export default function AboutMaker({ content, slots }: AboutMakerProps) {
  return (
    <section
      style={{
        backgroundColor: 'var(--color-surface)',
        paddingTop: 'var(--spacing-section)',
        paddingBottom: 'var(--spacing-section)',
      }}
    >
      <div className="mx-auto max-w-3xl px-6">
        <h2
          className="mb-6"
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 'var(--heading-weight)',
            letterSpacing: 'var(--heading-letter-spacing)',
            color: 'var(--color-text)',
            fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
            lineHeight: '1.2',
          }}
        >
          {content.headline}
        </h2>

        <p
          className="mb-8 whitespace-pre-line"
          style={{
            fontFamily: 'var(--font-body)',
            lineHeight: 'var(--body-line-height)',
            fontSize: '1.0625rem',
            color: 'var(--color-text-muted)',
          }}
        >
          {content.body}
        </p>

        {slots?.['primary-cta'] !== undefined && (
          <div>{slots['primary-cta']}</div>
        )}
      </div>
    </section>
  );
}
