import type { ReactNode } from 'react';
import meta from './meta';

export { meta };

interface CtaBannerContent {
  headline: string;
  subheadline?: string;
}

interface CtaBannerSlots {
  'primary-cta'?: ReactNode;
  'secondary-cta'?: ReactNode;
}

interface CtaBannerProps {
  content: CtaBannerContent;
  slots?: CtaBannerSlots;
}

export default function CtaBanner({ content, slots }: CtaBannerProps) {
  return (
    <section
      className="text-center"
      style={{
        backgroundColor: 'var(--color-primary)',
        paddingTop: 'var(--spacing-section)',
        paddingBottom: 'var(--spacing-section)',
      }}
    >
      <div className="mx-auto max-w-3xl px-6">
        <h2
          className="mb-4"
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 'var(--heading-weight)',
            letterSpacing: 'var(--heading-letter-spacing)',
            color: 'var(--color-background)',
            fontSize: 'clamp(1.75rem, 4vw, 3rem)',
            lineHeight: '1.15',
          }}
        >
          {content.headline}
        </h2>

        {content.subheadline !== undefined && content.subheadline !== '' && (
          <p
            className="mb-8"
            style={{
              fontFamily: 'var(--font-body)',
              lineHeight: 'var(--body-line-height)',
              fontSize: '1.0625rem',
              color: 'rgba(255,255,255,0.75)',
            }}
          >
            {content.subheadline}
          </p>
        )}

        {(slots?.['primary-cta'] !== undefined || slots?.['secondary-cta'] !== undefined) && (
          <div className="flex flex-wrap items-center justify-center gap-4">
            {slots?.['primary-cta']}
            {slots?.['secondary-cta']}
          </div>
        )}
      </div>
    </section>
  );
}
