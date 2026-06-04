'use client';

/**
 * GOODS — the switcher (small-catalog treatment).
 *
 * One big image on the left, the list of pieces down the right. Pointing at (or
 * focusing, or tapping) a row cross-fades the main image to that piece. The
 * motion is the swap; it reads as a maker showing you one thing at a time —
 * curated, not a wall. Structure only: every color is a skin var, every type
 * value a named role.
 */
import { useState } from 'react';
import type { ArchetypeTheme } from '../types';
import type { ProductView } from '../content';
import type { MainStreetContent } from './schemas';
import { Media, typeRoleCss, roles } from './chrome';
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
  const r = roles(skin);
  const [active, setActive] = useState(0);
  const current = products[active] ?? products[0];

  return (
    <section id="goods" style={{ padding: '96px 0 110px' }}>
      <GoodsHead goods={goods} skin={skin} viewAll={viewAll} />
      <div className="ms-wrap ms-switch-grid" style={{ display: 'grid', gridTemplateColumns: '1.15fr .85fr', gap: 56, alignItems: 'stretch' }}>
        <div
          className="ms-switch-stage"
          style={{
            position: 'relative',
            aspectRatio: '4 / 5',
            borderRadius: 3,
            overflow: 'hidden',
            background: 'color-mix(in srgb, var(--ms-fg-muted) 40%, var(--ms-bg))',
          }}
        >
          {products.map((p, i) => (
            <div
              key={p.slug}
              className="ms-switch-layer"
              style={{ position: 'absolute', inset: 0, opacity: i === active ? 1 : 0 }}
              aria-hidden={i !== active}
            >
              <Media media={p.media[0] ?? { kind: 'image', alt: p.name }} />
            </div>
          ))}
          {current && (
            <span
              data-type="price"
              style={{
                ...typeRoleCss(r.price),
                position: 'absolute',
                left: 14,
                bottom: 14,
                background: 'var(--ms-bg)',
                color: 'var(--ms-fg)',
                padding: '7px 11px',
                borderRadius: 2,
              }}
            >
              {current.price}
            </span>
          )}
        </div>

        <ul className="ms-switch-list" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' }}>
          {products.map((p, i) => {
            const on = i === active;
            return (
              <li key={p.slug} style={{ borderTop: '1px solid var(--ms-rule)', flex: 'none' }}>
                <button
                  type="button"
                  data-ms-switch-row={on ? 'on' : 'off'}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onClick={() => setActive(i)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '20px 4px',
                    display: 'block',
                  }}
                >
                  <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16 }}>
                    <span
                      data-type="cardTitle"
                      style={{ ...typeRoleCss(r.cardTitle), color: on ? 'var(--ms-accent)' : 'var(--ms-fg)' }}
                    >
                      {p.name}
                    </span>
                    <span data-type="price" style={{ ...typeRoleCss(r.price), color: 'var(--ms-fg-muted)' }}>
                      {p.price}
                    </span>
                  </span>
                  {on && p.shortDescription && (
                    <span
                      data-type="caption"
                      style={{ ...typeRoleCss(r.caption), color: 'var(--ms-fg-muted)', display: 'block', marginTop: 6 }}
                    >
                      {p.shortDescription}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
