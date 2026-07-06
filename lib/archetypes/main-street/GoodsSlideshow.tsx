'use client';

/**
 * GOODS — the slideshow (small-catalog, cinematic treatment).
 *
 * One product at a time, large, auto-advancing on a slow cross-fade with a
 * gentle drift across the image (the Ken Burns push-in that makes a still feel
 * alive). Hands-off and atmospheric — the passive cousin of the switcher. Pauses
 * on hover; does not auto-advance under reduced-motion. Class-only; active-vs-idle
 * state is data-driven (data-on), never inline.
 */
import { useEffect, useRef, useState } from 'react';
import type { ArchetypeTheme } from '../types';
import type { ProductView } from '../content';
import type { MainStreetContent } from './schemas';
import { Media } from './chrome';
import { Type } from './Type';
import { GoodsHead, type GoodsViewAll } from './beats';
import { DEFAULT_STRINGS } from './defaults';

const DWELL_MS = 3200;

export function GoodsSlideshow({
  goods,
  products,
  skin,
  viewAll,
}: {
  goods: MainStreetContent['goods'];
  products: ProductView[];
  skin: ArchetypeTheme;
  viewAll?: GoodsViewAll | undefined;
}) {
  const [active, setActive] = useState(0);
  const paused = useRef(false);

  useEffect(() => {
    if (products.length < 2) return undefined;
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }
    const id = window.setInterval(() => {
      if (!paused.current) setActive((i) => (i + 1) % products.length);
    }, DWELL_MS);
    return () => window.clearInterval(id);
  }, [products.length]);

  const current = products[active] ?? products[0];
  return (
    <section id="goods" className="ms-slide-section">
      <GoodsHead goods={goods} skin={skin} viewAll={viewAll} />
      <div
        className="ms-wrap"
        onMouseEnter={() => {
          paused.current = true;
        }}
        onMouseLeave={() => {
          paused.current = false;
        }}
      >
        <a
          href={current ? `/listings/${current.slug}` : undefined}
          className="ms-slide-stage"
        >
          {products.map((p, i) => {
            const media = p.media[0] ?? { kind: 'image' as const, alt: p.name };
            return (
              <div
                key={p.slug}
                className="ms-slide-layer"
                data-on={i === active ? 'true' : 'false'}
                aria-hidden={i !== active}
              >
                <Media media={media} className="ms-slide-backdrop" />
                <div key={`${p.slug}-${i === active ? active : 'idle'}`} className={i === active ? 'ms-kb ms-slide-fg-wrap' : 'ms-slide-fg-wrap'}>
                  <Media media={media} className="ms-slide-fg" />
                </div>
              </div>
            );
          })}
        </a>
        <a href={current ? `/listings/${current.slug}` : undefined} className="ms-slide-caption">
          <div>
            <Type as="h3" role="cardTitle" className="ms-slide-name">
              {current?.name}
            </Type>
            {current?.shortDescription && (
              <Type as="p" role="caption" className="ms-slide-desc">
                {current.shortDescription}
              </Type>
            )}
          </div>
          <Type as="span" role="price" className="ms-slide-price">
            {current?.price}
          </Type>
        </a>
        <div role="tablist" aria-label={DEFAULT_STRINGS.ariaSlides} className="ms-slide-dots">
          {products.map((p, i) => (
            <button
              key={p.slug}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={p.name}
              onClick={() => setActive(i)}
              className="ms-slide-dot"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
