/**
 * GOODS — the tags (the Vintage family's pieces; Alex's apothecary-tag
 * reference, 2026-10-15).
 *
 * Each piece on its own die-cut tag: notched corners, a tab at the top with an
 * eyelet, printed ephemera behind (the family's paper), the photo framed in a
 * hairline, and an ornate label below carrying its name and price. A neat rank of
 * tags, like a sheet of printed labels. Each opens the piece's own page.
 *
 * Class-only (`.ms-tag-*`, vintage-styles.ts): the die-cut is a CSS mask; colors
 * are skin vars; the paper is the family's wallpaper var.
 */
import type { ArchetypeTheme } from '../types';
import type { ProductView } from '../content';
import type { MainStreetView } from './schemas';
import { Media } from './chrome';
import { Type } from './Type';
import { GoodsHead, type GoodsViewAll } from './beats';
import { priceLabel } from './price-label';
import type { FamilyWords } from './words';

export function GoodsTags({
  goods,
  products,
  skin,
  words,
  viewAll,
}: {
  goods: MainStreetView['goods'];
  products: ProductView[];
  skin: ArchetypeTheme;
  /** The site's words. */
  words: FamilyWords;
  viewAll?: GoodsViewAll | undefined;
}) {
  return (
    <section id="goods" className="ms-tag-section">
      <GoodsHead goods={goods} skin={skin} viewAll={viewAll} />
      <div className="ms-wrap">
        <ul className="ms-tag-rank">
          {products.map((p) => (
            <li key={p.slug} className="ms-tag-item">
              <a href={`/listings/${p.slug}`} data-ms-tag-piece="" className="ms-tag">
                <span className="ms-tag-eyelet" aria-hidden="true" />
                <span className="ms-tag-frame">
                  <Media media={p.media[0] ?? { kind: 'image', alt: p.name }} className="ms-piece-photo" />
                </span>
                <span className="ms-tag-label">
                  <Type as="span" role="cardTitle" className="ms-tag-name">
                    {p.name}
                  </Type>
                  <Type as="span" role="price" className="ms-tag-price">
                    {priceLabel(p, words)}
                  </Type>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
