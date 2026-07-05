'use client';

/**
 * GOODS — the switcher (small-catalog treatment).
 *
 * One big image on the left, the list of pieces down the right. Pointing at (or
 * focusing) a row cross-fades the main image to that piece. The motion is the
 * swap; it reads as a maker showing you one thing at a time — curated, not a
 * wall. Structure only: every color is a skin var, every type value a named
 * role. Class-only via .ms-switch-* in skinVarsCss; active-vs-idle state is
 * data-driven (data-on), never inline.
 */
import { useState } from 'react';
import type { ArchetypeTheme } from '../types';
import type { ProductView } from '../content';
import type { MainStreetContent } from './schemas';
import { Media } from './chrome';
import { Type } from './Type';
import { GoodsHead, type GoodsViewAll } from './beats';

export function GoodsSwitcher({
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
  const current = products[active] ?? products[0];
  return (
    <section id="goods" className="ms-switch-section">
      <GoodsHead goods={goods} skin={skin} viewAll={viewAll} />
      <div className="ms-wrap ms-switch-grid">
        <div className="ms-switch-stage">
          {products.map((p, i) => (
            <div
              key={p.slug}
              className="ms-switch-layer"
              data-on={i === active ? 'true' : 'false'}
              aria-hidden={i !== active}
            >
              <Media media={p.media[0] ?? { kind: 'image', alt: p.name }} />
            </div>
          ))}
          {current && (
            <Type as="span" role="price" className="ms-switch-price-tag">
              {current.price}
            </Type>
          )}
        </div>
        <ul className="ms-switch-list">
          {products.map((p, i) => {
            const on = i === active;
            return (
              <li key={p.slug} className="ms-switch-row" data-on={on ? 'true' : 'false'}>
                <a
                  href={`/listings/${p.slug}`}
                  data-ms-switch-row={on ? 'on' : 'off'}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  className="ms-switch-link"
                >
                  <span className="ms-switch-line">
                    <Type as="span" role="cardTitle" className="ms-switch-name">
                      {p.name}
                    </Type>
                    <Type as="span" role="price" className="ms-switch-price">
                      {p.price}
                    </Type>
                  </span>
                  {on && p.shortDescription && (
                    <Type as="span" role="caption" className="ms-switch-desc">
                      {p.shortDescription}
                    </Type>
                  )}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
