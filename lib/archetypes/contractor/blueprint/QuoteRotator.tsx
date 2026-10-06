'use client';

import { useState, type ReactElement } from 'react';
import type { ContractorContent } from '../schemas';
import { CONTRACTOR_STRINGS as S } from '../strings';

type Review = NonNullable<ContractorContent['reviews']>['items'][number];

/**
 * The blueprint design's reviews: one large quote at a time, moved with arrows
 * (they wrap). No autoplay, so nobody loses a quote mid-read.
 */
export function QuoteRotator({ items }: { items: readonly Review[] }): ReactElement | null {
  const [i, setI] = useState(0);
  const r = items[i];
  if (r === undefined) return null;
  const n = items.length;

  return (
    <section className="bp-quotes" aria-roledescription="carousel" aria-label={S.quotes.label}>
      <figure className="bp-quote" key={r.quote} aria-roledescription="slide" aria-label={S.quotes.position(i + 1, n)}>
        <blockquote className="bp-quote__text">“{r.quote}”</blockquote>
        <figcaption className="bp-quote__who">
          <strong>{r.author}</strong>
          {r.job !== undefined && <span>{r.job}</span>}
        </figcaption>
      </figure>
      {n > 1 && (
        <div className="bp-quotes__nav">
          <button type="button" className="bp-arrow" aria-label={S.quotes.prev} onClick={() => setI((i - 1 + n) % n)}>
            <span className="bp-icon" aria-hidden="true">arrow_back</span>
          </button>
          <span className="bp-quotes__ticks" aria-hidden="true">
            {items.map((q, k) => <span key={q.quote} className={k === i ? 'bp-tick bp-tick--on' : 'bp-tick'} />)}
          </span>
          <button type="button" className="bp-arrow" aria-label={S.quotes.next} onClick={() => setI((i + 1) % n)}>
            <span className="bp-icon" aria-hidden="true">arrow_forward</span>
          </button>
        </div>
      )}
    </section>
  );
}
