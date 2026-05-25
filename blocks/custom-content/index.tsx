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
    <section className="bg-s-background py-s-section">
      <div className="mx-auto max-w-3xl px-6">
        <h2 className="mb-6 sf-heading sf-text-heading">{content.headline}</h2>

        <p className="mb-8 whitespace-pre-line sf-body sf-text-body text-s-muted">
          {content.body}
        </p>

        {slots?.['primary-cta'] !== undefined && (
          <div>{slots['primary-cta']}</div>
        )}
      </div>
    </section>
  );
}
