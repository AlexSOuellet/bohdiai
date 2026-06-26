/**
 * GOODS — the index (type-led catalog list).
 *
 * Each piece is a big typographic row — number, name, a short line, price —
 * separated by hairline rules. The words lead; the photo is secondary and only
 * flicks in (a small print) when the row is hovered or focused. The least
 * image-dependent body in the set: a confident, editorial catalogue. Quiet by
 * nature, so it leans elegant/modern.
 *
 * Skin-agnostic and class-only: colors are skin vars, type is named roles, the
 * thumbnail is graded by the skin's own `.archetype-photo` filter. The layout and
 * the hover reveal live in skinVarsCss under `.ms-index-*` — no inline styles.
 */
import type { ArchetypeTheme } from '../types';
import type { ProductView } from '../content';
import type { MainStreetContent } from './schemas';
import { Media } from './chrome';
import { Type } from './Type';
import { GoodsHead, type GoodsViewAll } from './beats';

export function GoodsIndex({
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
  return (
    <section id="goods" className="ms-index-section">
      <GoodsHead goods={goods} skin={skin} viewAll={viewAll} />
      <div className="ms-wrap">
        <div className="ms-index-list">
          {products.map((p, i) => {
            const shot = p.media.find((m) => m.kind === 'image') ?? p.media[0];
            return (
              <a key={p.slug} href={`/listings/${p.slug}`} data-ms-index-row="" className="ms-index-row">
                <Type as="span" role="eyebrow" className="ms-index-num">
                  {String(i + 1).padStart(2, '0')}
                </Type>
                <Type as="h3" role="cardTitle" className="ms-index-name">
                  {p.name}
                </Type>
                {p.shortDescription && (
                  <Type as="span" role="caption" className="ms-index-desc">
                    {p.shortDescription}
                  </Type>
                )}
                <Type as="span" role="price" className="ms-index-price">
                  {p.price}
                </Type>
                <Media media={shot ?? { kind: 'image', alt: p.name }} className="ms-index-thumb" />
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
