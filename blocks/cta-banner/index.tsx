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
    <section className="bg-s-surface py-s-section text-center">
      <div className="mx-auto max-w-3xl px-6">
        <h2 className="mb-4 sf-heading sf-text-heading text-s-text">
          {content.headline}
        </h2>

        {content.subheadline !== undefined && content.subheadline !== '' && (
          <p className="mb-8 sf-body sf-text-body text-s-text/75">
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
