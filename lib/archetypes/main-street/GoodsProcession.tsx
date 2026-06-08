/**
 * GOODS — the procession (mid-catalog treatment).
 *
 * Each product gets a full-width row, image and words trading sides down the
 * page, the image settling out of a slow zoom as it scrolls into frame. The
 * motion is tied to the scroll, so it feels earned rather than looping — a mid
 * catalog where every piece deserves its own moment. Structure only; the
 * zoom-settle lives in the skin CSS, keyed off the reveal class.
 */
import type { ArchetypeTheme } from '../types';
import type { ProductView } from '../content';
import type { MainStreetContent } from './schemas';
import { Media, typeRoleCss, roles } from './chrome';
import { GoodsHead, type GoodsViewAll } from './beats';
import { Reveal } from './Reveal';

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
  return (
    <section id="goods" style={{ padding: '72px 0 80px' }}>
      <GoodsHead goods={goods} skin={skin} viewAll={viewAll} />
      {/* Narrower than the page wrap so the one-per-row march stays calm, not
          billboard-sized. Scale is tunable here: container width, row gap, the
          image column ratio, and the aspect. */}
      <div className="ms-wrap" style={{ maxWidth: 940, display: 'flex', flexDirection: 'column', gap: 64 }}>
        {products.map((p, i) => (
          <Reveal key={p.slug}>
            <a
              href={`/listings/${p.slug}`}
              className={`ms-proc-row${i % 2 === 1 ? ' alt' : ''}`}
              style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: 48, alignItems: 'center', color: 'inherit', textDecoration: 'none' }}
            >
              <div
                className="ms-proc-frame"
                style={{
                  position: 'relative',
                  aspectRatio: '4 / 5',
                  borderRadius: 3,
                  overflow: 'hidden',
                  background: 'color-mix(in srgb, var(--ms-fg-muted) 40%, var(--ms-bg))',
                }}
              >
                <div className="ms-proc-img" style={{ width: '100%', height: '100%' }}>
                  <Media media={p.media[0] ?? { kind: 'image', alt: p.name }} />
                </div>
              </div>
              <div className="ms-proc-words">
                <h3 data-type="title" style={{ ...typeRoleCss(r.title), color: 'var(--ms-fg)', margin: 0 }}>
                  {p.name}
                </h3>
                {p.shortDescription && (
                  <p data-type="body" style={{ ...typeRoleCss(r.body), color: 'var(--ms-fg-muted)', margin: '14px 0 0', maxWidth: '34ch' }}>
                    {p.shortDescription}
                  </p>
                )}
                <span data-type="price" style={{ ...typeRoleCss(r.price), color: 'var(--ms-fg)', display: 'inline-block', marginTop: 22 }}>
                  {p.price}
                </span>
              </div>
            </a>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
