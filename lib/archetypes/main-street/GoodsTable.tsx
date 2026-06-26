'use client';

/**
 * GOODS — the table (a styled tabletop of objects).
 *
 * The sampled pieces sit on a surface like real objects — each a print on a small
 * mat, overlapping its neighbours, softly shadowed, a little rotated. You look
 * down onto a composed tabletop rather than a row of cards. Tactile and abundant;
 * the warm, lively body (Cheerful's default). On scroll-in the prints settle onto
 * the surface one at a time, then rest.
 *
 * Skin-agnostic and class-only: the surface and mats are derived from the skin's
 * own vars, type is named roles, imagery is graded by the skin's `.archetype-photo`
 * filter. Placement, rotation, and the settle stagger live in skinVarsCss under
 * `.ms-table-*` — never inline; the per-object delays are CSS nth-child rules.
 *
 * (The real form wants staged, cut-out product imagery so objects sit ON the
 * surface; until that pipeline exists each product photo reads as a print laid on
 * the table — the same tactile idea, achievable with the images we generate today.)
 */
import { useEffect, useRef } from 'react';
import type { ArchetypeTheme } from '../types';
import type { ProductView } from '../content';
import type { MainStreetContent } from './schemas';
import { Media } from './chrome';
import { Type } from './Type';
import { GoodsHead, type GoodsViewAll } from './beats';

export function GoodsTable({
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
  const stageRef = useRef<HTMLDivElement>(null);

  // Settle the prints onto the surface once, on scroll-in: add `.in` and the skin
  // CSS runs the staggered drop (delays are CSS nth-child rules). Reduced motion
  // shows them placed immediately.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          stage.classList.add('in');
          io.unobserve(stage);
        });
      },
      { threshold: 0.2 },
    );
    io.observe(stage);
    return () => io.disconnect();
  }, []);

  return (
    <section id="goods" className="ms-table-section">
      <GoodsHead goods={goods} skin={skin} viewAll={viewAll} />
      <div className="ms-wrap">
        <div ref={stageRef} className="ms-table-stage" data-count={products.length}>
          {products.map((p) => (
            <a key={p.slug} href={`/listings/${p.slug}`} data-ms-table-item="" className="ms-table-item">
              <span className="ms-table-print">
                <span className="ms-table-shot">
                  <Media media={p.media[0] ?? { kind: 'image', alt: p.name }} />
                </span>
                <span className="ms-table-cap">
                  <Type as="span" role="caption" className="ms-table-name">
                    {p.name}
                  </Type>
                  <Type as="span" role="price" className="ms-table-price">
                    {p.price}
                  </Type>
                </span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
