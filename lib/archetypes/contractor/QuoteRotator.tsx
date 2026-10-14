'use client';

import { useState, type ReactElement } from 'react';
import type { ContractorContent } from './schemas';
import { fill } from '@/lib/site-words/words';
import type { ContractorWords } from './words';

type Review = NonNullable<ContractorContent['reviews']>['items'][number];

/**
 * Reviews as one large quote at a time, moved with arrows (they wrap). No
 * autoplay, so nobody loses a quote mid-read. `prefix` names the design's
 * classes (the harbor quote is hb-quote).
 */
export function QuoteRotator({ items, prefix, words }: { items: readonly Review[]; prefix: 'hb'; words: Pick<ContractorWords, 'quotes' | 'quoted'> }): ReactElement | null {
  const [i, setI] = useState(0);
  const r = items[i];
  if (r === undefined) return null;
  const n = items.length;
  const w = words.quotes;

  return (
    <section className={`${prefix}-quotes`} aria-roledescription={w.carousel} aria-label={w.label}>
      <figure className={`${prefix}-quote`} key={r.quote} aria-roledescription={w.slide} aria-label={fill(w.position, { n: i + 1, of: n })}>
        <blockquote className={`${prefix}-quote__text`}>{fill(words.quoted, { quote: r.quote })}</blockquote>
        <figcaption className={`${prefix}-quote__who`}>
          <strong>{r.author}</strong>
          {r.job !== undefined && <span>{r.job}</span>}
        </figcaption>
      </figure>
      {n > 1 && (
        <div className={`${prefix}-quotes__nav`}>
          <button type="button" className={`${prefix}-arrow`} aria-label={w.prev} onClick={() => setI((i - 1 + n) % n)}>
            <span className={`${prefix}-icon`} aria-hidden="true">arrow_back</span>
          </button>
          <span className={`${prefix}-quotes__ticks`} aria-hidden="true">
            {items.map((q, k) => <span key={q.quote} className={k === i ? `${prefix}-tick ${prefix}-tick--on` : `${prefix}-tick`} />)}
          </span>
          <button type="button" className={`${prefix}-arrow`} aria-label={w.next} onClick={() => setI((i + 1) % n)}>
            <span className={`${prefix}-icon`} aria-hidden="true">arrow_forward</span>
          </button>
        </div>
      )}
    </section>
  );
}
