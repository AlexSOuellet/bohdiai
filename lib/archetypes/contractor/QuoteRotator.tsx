'use client';

import { useState, type ReactElement } from 'react';
import type { ContractorContent } from './schemas';
import { CONTRACTOR_STRINGS as S } from './strings';

type Review = NonNullable<ContractorContent['reviews']>['items'][number];

/**
 * Reviews as one large quote at a time, moved with arrows (they wrap). No
 * autoplay, so nobody loses a quote mid-read. Used by the blueprint and harbor
 * designs; `prefix` names the design's classes (e.g. the harbor quote is hb-quote).
 */
export function QuoteRotator({ items, prefix }: { items: readonly Review[]; prefix: 'bp' | 'hb' }): ReactElement | null {
  const [i, setI] = useState(0);
  const r = items[i];
  if (r === undefined) return null;
  const n = items.length;

  return (
    <section className={`${prefix}-quotes`} aria-roledescription="carousel" aria-label={S.quotes.label}>
      <figure className={`${prefix}-quote`} key={r.quote} aria-roledescription="slide" aria-label={S.quotes.position(i + 1, n)}>
        <blockquote className={`${prefix}-quote__text`}>“{r.quote}”</blockquote>
        <figcaption className={`${prefix}-quote__who`}>
          <strong>{r.author}</strong>
          {r.job !== undefined && <span>{r.job}</span>}
        </figcaption>
      </figure>
      {n > 1 && (
        <div className={`${prefix}-quotes__nav`}>
          <button type="button" className={`${prefix}-arrow`} aria-label={S.quotes.prev} onClick={() => setI((i - 1 + n) % n)}>
            <span className={`${prefix}-icon`} aria-hidden="true">arrow_back</span>
          </button>
          <span className={`${prefix}-quotes__ticks`} aria-hidden="true">
            {items.map((q, k) => <span key={q.quote} className={k === i ? `${prefix}-tick ${prefix}-tick--on` : `${prefix}-tick`} />)}
          </span>
          <button type="button" className={`${prefix}-arrow`} aria-label={S.quotes.next} onClick={() => setI((i + 1) % n)}>
            <span className={`${prefix}-icon`} aria-hidden="true">arrow_forward</span>
          </button>
        </div>
      )}
    </section>
  );
}
