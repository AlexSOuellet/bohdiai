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
 * vary in width, and overlap — so it survives the narrow screen instead of
 * collapsing to a dead stack. Positions are inline; the fade lives in the skin CSS.
 */
import { useEffect, useRef } from 'react';
import type { ArchetypeTheme } from '../types';
import type { ProductView } from '../content';
import type { MainStreetContent } from './schemas';
import { Media, typeRoleCss, roles } from './chrome';
import { GoodsHead, type GoodsViewAll } from './beats';

/** A scatter slot: left% and top% (of the stage height), width% (of the stage),
 *  and a small rotation. Tuned per card count so 3, 4, or 5 each read composed. */
interface Slot {
  l: number;
  t: number;
  w: number;
  r: number;
}

const LAYOUTS: Record<number, Slot[]> = {
  3: [
    { l: 5, t: 6, w: 30, r: -2 },
    { l: 58, t: 18, w: 26, r: 1.5 },
    { l: 28, t: 52, w: 28, r: 1 },
  ],
  4: [
    { l: 4, t: 4, w: 27, r: -2 },
    { l: 52, t: 12, w: 24, r: 1.5 },
    { l: 20, t: 48, w: 22, r: 1 },
    { l: 60, t: 52, w: 27, r: -1.5 },
  ],
  5: [
    { l: 3, t: 4, w: 26, r: -2.5 },
    { l: 40, t: 16, w: 19, r: 1.5 },
    { l: 70, t: 2, w: 23, r: 2 },
    { l: 22, t: 50, w: 21, r: 1 },
    { l: 62, t: 56, w: 28, r: -1.5 },
  ],
};

/** How tall the scatter stands — a screen-and-a-half for a full five, less for
 *  fewer, so the composition breathes without running on. */
const STAGE_VH: Record<number, number> = { 3: 105, 4: 125, 5: 150 };

function slotsFor(n: number): Slot[] {
  return LAYOUTS[n] ?? LAYOUTS[5]!.slice(0, Math.max(1, n));
}

/** Fisher–Yates — the random order the cards build in (reshuffled each load, so
 *  the assembly never feels mechanical). Presentation only; no SSR concern. */
function shuffle(n: number): number[] {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i]!, a[j]!] = [a[j]!, a[i]!];
  }
  return a;
}

/** Gap between each card landing — slow and deliberate, so the space reads as
 *  building itself rather than snapping in. */
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
  const r = roles(skin);
  const stageRef = useRef<HTMLDivElement>(null);
  const slots = slotsFor(products.length);
  const stageVh = STAGE_VH[products.length] ?? 130;

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
          // Deal each card a random place in the build order via its delay; the
          // skin CSS does the fade. Reduced-motion skips the stagger (the CSS
          // shows the cards immediately anyway).
          if (!reduce) {
            const order = shuffle(cards.length);
            cards.forEach((c, i) => {
              c.style.transitionDelay = `${order[i]! * STEP_MS}ms`;
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
    <section id="goods" style={{ padding: '72px 0 84px' }}>
      <GoodsHead goods={goods} skin={skin} viewAll={viewAll} />
      <div className="ms-wrap">
        <div ref={stageRef} className="ms-const-stage" style={{ position: 'relative', height: `${stageVh}vh` }}>
          {products.map((p, i) => {
            const s = slots[i] ?? slots[slots.length - 1]!;
            return (
              <a
                key={p.slug}
                href={`/listings/${p.slug}`}
                data-ms-const-card=""
                className="ms-const-card"
                style={{
                  position: 'absolute',
                  left: `${s.l}%`,
                  top: `${s.t}%`,
                  width: `${s.w}%`,
                  rotate: `${s.r}deg`,
                  color: 'inherit',
                  textDecoration: 'none',
                }}
              >
                <div
                  className="ms-const-frame"
                  style={{
                    position: 'relative',
                    aspectRatio: '4 / 5',
                    borderRadius: 3,
                    overflow: 'hidden',
                    background: 'color-mix(in srgb, var(--ms-fg-muted) 40%, var(--ms-bg))',
                  }}
                >
                  <Media media={p.media[0] ?? { kind: 'image', alt: p.name }} />
                </div>
                <div className="ms-const-meta" style={{ padding: '12px 2px 0' }}>
                  <h3 data-type="cardTitle" style={{ ...typeRoleCss(r.cardTitle), color: 'var(--ms-fg)', margin: 0 }}>
                    {p.name}
                  </h3>
                  <span
                    data-type="price"
                    style={{ ...typeRoleCss(r.price), color: 'var(--ms-fg-muted)', display: 'inline-block', marginTop: 4 }}
                  >
                    {p.price}
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
