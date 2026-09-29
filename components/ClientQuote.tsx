'use client';

import { useId, useState } from 'react';
import type { Testimonial } from '@/lib/site/work';

/** One paragraph of a quote, with the highlight phrase lit up in honey. */
function QuoteParagraph({
  text,
  highlight,
}: {
  text: string;
  highlight: string;
}): React.ReactElement {
  const at = text.indexOf(highlight);
  if (at === -1) return <p>{text}</p>;
  return (
    <p>
      {text.slice(0, at)}
      <mark className="bg-transparent font-sans font-semibold not-italic text-honey-warm [text-shadow:0_0_24px_rgba(243,201,122,0.35)]">
        {highlight}
      </mark>
      {text.slice(at + highlight.length)}
    </p>
  );
}

/**
 * The client's own words, set like a letter pinned under their site: a big honey
 * quote mark hanging off the left, serif italic like the pledge, the best line lit.
 * Only the first paragraph shows until the visitor asks to read more.
 */
export function ClientQuote({
  t,
  tilt = 'none',
}: {
  t: Testimonial;
  tilt?: 'left' | 'right' | 'none';
}): React.ReactElement {
  const [open, setOpen] = useState(false);
  const restId = useId();
  const [lead, ...rest] = t.paragraphs;

  return (
    <figure
      className={[
        'relative rounded-[18px] border border-honey-warm/[0.16] px-6 pb-7 pt-9 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8),0_0_60px_-24px_rgba(243,201,122,0.18)] backdrop-blur-[20px] transition-transform duration-slow ease-out [background:linear-gradient(180deg,rgba(26,20,16,0.8),rgba(10,8,5,0.6))] hover:rotate-0 md:px-9 md:pb-8 md:pt-10',
        tilt === 'left' ? 'md:-rotate-[0.8deg]' : tilt === 'right' ? 'md:rotate-[0.8deg]' : '',
      ].join(' ')}
    >
      <span
        aria-hidden="true"
        className="absolute -top-7 left-5 font-serif text-[96px] leading-none text-honey-warm [text-shadow:0_0_40px_rgba(243,201,122,0.55)] md:-left-4 md:-top-9 md:text-[128px]"
      >
        &ldquo;
      </span>
      <blockquote className="space-y-4 font-serif text-[19px] italic leading-[1.5] text-text-soft md:text-[21px]">
        {lead !== undefined && <QuoteParagraph text={lead} highlight={t.highlight} />}
        {rest.length > 0 && (
          <div id={restId} hidden={!open} className="space-y-4">
            {rest.map((p) => (
              <QuoteParagraph key={p.slice(0, 24)} text={p} highlight={t.highlight} />
            ))}
          </div>
        )}
      </blockquote>
      {rest.length > 0 && (
        <button
          type="button"
          aria-expanded={open}
          aria-controls={restId}
          onClick={() => setOpen((o) => !o)}
          className="mt-4 inline-flex items-center gap-1.5 border-b border-honey-warm/35 pb-0.5 font-sans text-[13px] font-semibold text-honey-warm transition-colors hover:border-honey-warm"
        >
          {open ? 'Show less' : 'Read more'}
          <span
            aria-hidden="true"
            className={open ? 'rotate-180 transition-transform' : 'transition-transform'}
          >
            ↓
          </span>
        </button>
      )}
      <figcaption className="mt-6 flex flex-wrap items-center gap-x-3.5 gap-y-1">
        <span className="h-px w-9 bg-honey-warm/50" />
        <span className="font-sans text-[15px] font-semibold tracking-[-0.005em] text-text">
          {t.name}
        </span>
        <span className="text-[13px] text-muted">{t.role}</span>
      </figcaption>
    </figure>
  );
}

/**
 * Every quote a client gave, side by side under their site like two letters
 * pinned up: tilted apart, the second set a little lower. Stacks on phones.
 */
export function ClientQuotes({ quotes }: { quotes: readonly Testimonial[] }): React.ReactElement {
  return (
    <div
      className={[
        'mt-14 grid items-start gap-12 md:mt-16',
        quotes.length > 1 ? 'md:grid-cols-2 md:gap-10' : 'md:mx-auto md:max-w-[860px]',
      ].join(' ')}
    >
      {quotes.map((q, i) => (
        <div key={q.name} className={i % 2 === 1 ? 'md:mt-12' : ''}>
          <ClientQuote t={q} tilt={quotes.length > 1 ? (i % 2 === 0 ? 'left' : 'right') : 'none'} />
        </div>
      ))}
    </div>
  );
}
