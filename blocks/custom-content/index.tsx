import type { ReactNode } from 'react';
import meta from './meta';

export { meta };

interface CustomContentContent {
  headline: string;
  body: string;
}

interface CustomContentSlots {
  'primary-cta'?: ReactNode;
}

interface CustomContentProps {
  content: CustomContentContent;
  slots?: CustomContentSlots;
}

export default function CustomContent({ content, slots }: CustomContentProps) {
  return (
    <section
      style={{
        backgroundColor: 'var(--color-background)',
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
