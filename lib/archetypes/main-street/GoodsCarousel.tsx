'use client';

/**
 * GOODS — the carousel (stepped, browsable rail).
 *
 * A horizontal rail of product cards: native scroll-snap for swipe, plus prev/
 * next arrows that step the rail. A few pieces sit in view at once; the shopper
 * browses sideways. This is the rail LIFTED out of the retired Carousel hero —
 * a product rail belongs in goods (one body among six), not in the front door,
 * where it read as the Wix/Shopify AI-builder pattern we avoid (D31).
 *
 * Skin-agnostic and class-only: colors are skin vars, type is named roles, the
 * imagery is graded by the skin's own `.archetype-photo` filter. The layout,
 * snap, and arrow styling live in skinVarsCss under `.ms-gcarousel-*` — no inline
 * styles. (Contrast with the old hero, which carried its CSS inline.)
 */
import { useRef } from 'react';
import type { ArchetypeTheme } from '../types';
import type { ProductView } from '../content';
import type { MainStreetContent } from './schemas';
import { Media } from './chrome';
import { Type } from './Type';
import { GoodsHead, type GoodsViewAll } from './beats';

export function GoodsCarousel({
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
  const railRef = useRef<HTMLDivElement>(null);

  // Step by most of the visible width so a click advances the rail a "page" of
  // cards, snapping to the next start. Swipe works natively via scroll-snap.
  const step = (dir: 1 | -1) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: dir * rail.clientWidth * 0.8, behavior: 'smooth' });
  };

  return (
    <section id="goods" className="ms-gcarousel-section">
      <GoodsHead goods={goods} skin={skin} viewAll={viewAll} />
      <div className="ms-wrap">
        <div className="ms-gcarousel-controls">
          <button
            type="button"
            data-ms-carousel-prev=""
            className="ms-gcarousel-arrow"
            aria-label="Previous products"
            onClick={() => step(-1)}
          >
            <span className="ms-gcarousel-arrow-glyph" aria-hidden>
              &larr;
            </span>
          </button>
          <button
            type="button"
            data-ms-carousel-next=""
            className="ms-gcarousel-arrow"
            aria-label="Next products"
            onClick={() => step(1)}
          >
            <span className="ms-gcarousel-arrow-glyph" aria-hidden>
              &rarr;
            </span>
          </button>
        </div>
        <div ref={railRef} className="ms-gcarousel-rail" aria-label="Products">
          {products.map((p) => (
            <a key={p.slug} href={`/listings/${p.slug}`} data-ms-carousel-item="" className="ms-gcarousel-item">
              <div className="ms-gcarousel-shot">
                <Media media={p.media[0] ?? { kind: 'image', alt: p.name }} />
              </div>
              <Type as="h3" role="cardTitle" className="ms-gcarousel-name">
                {p.name}
              </Type>
              <Type as="span" role="price" className="ms-gcarousel-price">
                {p.price}
              </Type>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
