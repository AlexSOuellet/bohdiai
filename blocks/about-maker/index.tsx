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

function bodyToText(raw: string): string {
  return raw
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .trim();
}

export default function AboutMaker({ content, slots }: AboutMakerProps) {
  const bodyText = bodyToText(content.body);
  return (
    <section id="about" className="bg-s-surface py-s-section">
      <div className="mx-auto max-w-3xl px-6">
        <h2 className="mb-6 sf-heading sf-text-heading">{content.headline}</h2>

        <p className="mb-8 whitespace-pre-line sf-body sf-text-body text-s-muted">
          {bodyText}
        </p>

        {slots?.['primary-cta'] !== undefined && (
          <div>{slots['primary-cta']}</div>
        )}
      </div>
    </section>
  );
}
