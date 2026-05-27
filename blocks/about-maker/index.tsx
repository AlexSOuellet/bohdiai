import type { ReactNode } from 'react';
import Image from 'next/image';
import meta from './meta';

export { meta };

interface AboutMakerContent {
  headline: string;
  body: string;
  imageUrl?: string;
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

function abbreviate(text: string, charLimit = 320): { teaser: string; truncated: boolean } {
  if (text.length <= charLimit) return { teaser: text, truncated: false };
  // Cut at the last sentence boundary or word boundary before the limit.
  const window = text.slice(0, charLimit);
  const lastPeriod = window.lastIndexOf('. ');
  const cutAt = lastPeriod > charLimit - 120 ? lastPeriod + 1 : window.lastIndexOf(' ');
  const teaser = (cutAt > 0 ? window.slice(0, cutAt) : window).trim();
  return { teaser: `${teaser}…`, truncated: true };
}

export default function AboutMaker({ content, slots }: AboutMakerProps) {
  const bodyText = bodyToText(content.body);
  const { teaser, truncated } = abbreviate(bodyText);
  const hasImage = content.imageUrl !== undefined && content.imageUrl !== '';

  return (
    <section id="about" className="bg-s-surface py-s-section">
      <div className="mx-auto max-w-6xl px-6">
        <div className={hasImage ? 'grid gap-10 md:gap-14 md:grid-cols-2 items-center' : 'max-w-3xl mx-auto'}>
          {hasImage && (
            <div className="relative aspect-[4/5] overflow-hidden order-1 md:order-none">
              <Image
                src={content.imageUrl!}
                alt={content.headline}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          )}

          <div>
            <h2 className="mb-6 sf-heading sf-text-heading">{content.headline}</h2>

            <p className="mb-6 whitespace-pre-line sf-body sf-text-body text-s-muted">
              {teaser}
            </p>

            {truncated && (
              <a
                href="/about"
                className="inline-block mb-6 font-s-body text-xs uppercase tracking-[0.15em] text-s-accent hover:text-s-text transition-colors border-b border-s-accent/40 hover:border-s-text pb-0.5"
              >
                Read more →
              </a>
            )}

            {slots?.['primary-cta'] !== undefined && (
              <div className="mt-2">{slots['primary-cta']}</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
