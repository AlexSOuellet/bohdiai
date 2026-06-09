'use client';

/**
 * GOODS — the slideshow (small-catalog, cinematic treatment).
 *
 * One product at a time, large, auto-advancing on a slow cross-fade with a
 * gentle drift across the image (the Ken Burns push-in that makes a still feel
 * alive). Hands-off and atmospheric — the passive cousin of the switcher. Pauses
 * on hover; does not auto-advance under reduced-motion. Structure only.
 */
import { useEffect, useRef, useState } from 'react';
import type { ArchetypeTheme } from '../types';
import type { ProductView } from '../content';
import type { MainStreetContent } from './schemas';
import { Media, typeRoleCss, roles } from './chrome';
import { GoodsHead, type GoodsViewAll } from './beats';

// How long each slide holds before advancing. Brisk enough not to drag (the
// 5s original read as sluggish) while still leaving each product legible.
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
  const r = roles(skin);
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
    <section id="goods" style={{ padding: '96px 0 110px' }}>
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
          style={{
            position: 'relative',
            aspectRatio: '3 / 2',
            borderRadius: 3,
            overflow: 'hidden',
            background: 'color-mix(in srgb, var(--ms-fg-muted) 40%, var(--ms-bg))',
            display: 'block',
            color: 'inherit',
            textDecoration: 'none',
          }}
        >
          {products.map((p, i) => (
            <div
              key={p.slug}
              className="ms-slide-layer"
              style={{ position: 'absolute', inset: 0, opacity: i === active ? 1 : 0 }}
              aria-hidden={i !== active}
            >
              <div key={`${p.slug}-${i === active ? active : 'idle'}`} className={i === active ? 'ms-kb' : undefined} style={{ width: '100%', height: '100%' }}>
                <Media media={p.media[0] ?? { kind: 'image', alt: p.name }} />
              </div>
            </div>
          ))}
        </a>

        <a
          href={current ? `/listings/${current.slug}` : undefined}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, marginTop: 22, flexWrap: 'wrap', color: 'inherit', textDecoration: 'none' }}
        >
          <div>
            <h3 data-type="cardTitle" style={{ ...typeRoleCss(r.cardTitle), color: 'var(--ms-fg)', margin: 0 }}>
              {current?.name}
            </h3>
            {current?.shortDescription && (
              <p data-type="caption" style={{ ...typeRoleCss(r.caption), color: 'var(--ms-fg-muted)', margin: '4px 0 0' }}>
                {current.shortDescription}
              </p>
            )}
          </div>
          <span data-type="price" style={{ ...typeRoleCss(r.price), color: 'var(--ms-fg)' }}>
            {current?.price}
          </span>
        </a>

        <div role="tablist" aria-label="Slides" style={{ display: 'flex', gap: 9, marginTop: 20 }}>
          {products.map((p, i) => (
            <button
              key={p.slug}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={p.name}
              onClick={() => setActive(i)}
              style={{
                width: i === active ? 26 : 9,
                height: 9,
                borderRadius: 9,
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                background: i === active ? 'var(--ms-accent)' : 'var(--ms-rule)',
                transition: 'width .4s ease, background .4s ease',
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
