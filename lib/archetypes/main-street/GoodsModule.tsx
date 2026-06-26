'use client';

/**
 * GOODS — the module (still, structural treatment).
 *
 * An asymmetric editorial composition: the sampled pieces sit as modules on a
 * strict 12-column grid — varied spans, deliberate vertical drops, one wide
 * piece that breaks the lane — each carrying an index number, the name, a spec,
 * and the price in a hairline-ruled data block. Nothing moves once it lands; the
 * wow is the composition, not a loop (this is the catalog's only STILL body, the
 * Swiss answer to the banned card grid). The single motion is a staggered reveal
 * as the section scrolls in.
 *
 * Skin-agnostic and class-only: every color is a skin var, every type value a
 * named role, every image graded by the skin's own `.archetype-photo` filter
 * (so the same component reads warm for Cozy and cool/mono for Modern). The
 * structural CSS lives in skinVarsCss under `.ms-module-*` — no inline styles,
 * the placement and stagger delays are CSS, never set on the element.
 */
import { useEffect, useRef } from 'react';
import type { ArchetypeTheme } from '../types';
import type { ProductView } from '../content';
import type { MainStreetContent } from './schemas';
import { Media } from './chrome';
import { Type } from './Type';
import { GoodsHead, type GoodsViewAll } from './beats';

export function GoodsModule({
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

  // The composition reveals once, on scroll-in: add `.in` and the skin CSS runs
  // the staggered rise (delays are CSS nth-child rules, not set here). Reduced
  // motion is handled in the CSS — the items show immediately either way.
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
      { threshold: 0.15 },
    );
    io.observe(stage);
    return () => io.disconnect();
  }, []);

  return (
    <section id="goods" className="ms-module-section">
      <GoodsHead goods={goods} skin={skin} viewAll={viewAll} />
      <div className="ms-wrap">
        <div ref={stageRef} className="ms-module-stage" data-count={products.length}>
          {products.map((p, i) => (
            <a key={p.slug} href={`/listings/${p.slug}`} data-ms-module-item="" className="ms-module-item">
              <div className="ms-module-frame">
                <Media media={p.media[0] ?? { kind: 'image', alt: p.name }} />
              </div>
              <div className="ms-module-meta">
                <Type as="span" role="eyebrow" className="ms-module-idx">
                  {String(i + 1).padStart(2, '0')}
                </Type>
                <Type as="h3" role="cardTitle" className="ms-module-name">
                  {p.name}
                </Type>
                <Type as="span" role="price" className="ms-module-price">
                  {p.price}
                </Type>
                {p.shortDescription && (
                  <Type as="span" role="caption" className="ms-module-spec">
                    {p.shortDescription}
                  </Type>
                )}
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
