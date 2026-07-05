'use client';

/**
 * GOODS — the procession, rebuilt as a CONSTELLATION (mid/small-catalog treatment).
 *
 * Not a grid and not a march of full-width rows (the old procession ran ~three
 * screens). The sampled pieces are scattered across a screen-and-a-half in a
 * composed, asymmetric field — varied sizes, a little drift, a whisper of
 * rotation — and when the section scrolls into view they fade in ONE AT A TIME
 * in a random order, as if the space is building itself, then rest. Once landed
 * they hold still (a resolved section is shoppable; the wow is the assembly, not
 * a loop). On a phone the scatter goes vertical — cards hug left then right,
 * vary in width, and overlap.
 *
 * Class-only. Per-card position/rotation come from CSS custom properties written
 * on each card (--ms-const-x/y/w/r), never as literal inline `left`/`top`/`rotate`.
 * The random stagger delay is set on the card via `--ms-const-d` at mount. All the
 * fade-in and layout rules live in skinVarsCss.
 */
import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import type { ArchetypeTheme } from '../types';
import type { ProductView } from '../content';
import type { MainStreetContent } from './schemas';
import { Media } from './chrome';
import { Type } from './Type';
import { GoodsHead, type GoodsViewAll } from './beats';

interface Slot {
  l: number;
  t: number;
  w: number;
  r: number;
}

const LAYOUTS: Record<number, Slot[]> = {
  3: [
    { l: 6, t: 6, w: 26, r: -2 },
    { l: 62, t: 14, w: 25, r: 2 },
    { l: 30, t: 52, w: 27, r: 1 },
  ],
  4: [
    { l: 5, t: 4, w: 26, r: -2 },
    { l: 60, t: 8, w: 26, r: 1.5 },
    { l: 10, t: 56, w: 24, r: 1 },
    { l: 58, t: 54, w: 27, r: -1.5 },
  ],
  5: [
    { l: 4, t: 3, w: 25, r: -2 },
    { l: 38, t: 34, w: 19, r: 1.5 },
    { l: 64, t: 6, w: 24, r: 2 },
    { l: 8, t: 60, w: 23, r: 1 },
    { l: 58, t: 54, w: 27, r: -1.5 },
  ],
};

function slotsFor(n: number): Slot[] {
  return LAYOUTS[n] ?? LAYOUTS[5]!.slice(0, Math.max(1, n));
}

/** Fisher–Yates — the random order the cards build in. Presentation only. */
function shuffle(n: number): number[] {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i]!, a[j]!] = [a[j]!, a[i]!];
  }
  return a;
}

const STEP_MS = 430;

export function GoodsProcession({
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
  const slots = slotsFor(products.length);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || typeof IntersectionObserver === 'undefined') return undefined;
    const cards = Array.from(stage.querySelectorAll<HTMLElement>('[data-ms-const-card]'));
    const reduce =
      typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          if (!reduce) {
            const order = shuffle(cards.length);
            cards.forEach((c, i) => {
              c.style.setProperty('--ms-const-d', `${order[i]! * STEP_MS}ms`);
            });
          }
          stage.classList.add('in');
          io.unobserve(stage);
        });
      },
      { threshold: 0.2 },
    );
    io.observe(stage);
    return () => io.disconnect();
  }, [products.length]);

  return (
    <section id="goods" className="ms-const-section">
      <GoodsHead goods={goods} skin={skin} viewAll={viewAll} />
      <div className="ms-wrap">
        <div ref={stageRef} className="ms-const-stage">
          {products.map((p, i) => {
            const s = slots[i] ?? slots[slots.length - 1]!;
            const cardVars = {
              '--ms-const-x': `${s.l}%`,
              '--ms-const-y': `${s.t}%`,
              '--ms-const-w': `${s.w}%`,
              '--ms-const-r': `${s.r}deg`,
            } as CSSProperties;
            return (
              <a
                key={p.slug}
                href={`/listings/${p.slug}`}
                data-ms-const-card=""
                className="ms-const-card"
                style={cardVars}
              >
                <div className="ms-const-frame">
                  <Media media={p.media[0] ?? { kind: 'image', alt: p.name }} />
                </div>
                <div className="ms-const-meta">
                  <Type as="h3" role="cardTitle" className="ms-const-name">
                    {p.name}
                  </Type>
                  <Type as="span" role="price" className="ms-const-price">
                    {p.price}
                  </Type>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
