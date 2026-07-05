/**
 * Main Street — BEATS 2-4.
 *
 *  2. GOODS IN MOTION — a slow, edge-to-edge marquee of catalog rows (never a
 *     card grid, the banned AI-builder tell). Hover to pause.
 *  3. FOUNDER + a real "find us this week" CALENDAR — the maker's voice and
 *     face beside where to meet them, on the skin's CONTRAST surface (so the
 *     same bones invert correctly for a dark skin with zero code change).
 *  4. CLOSE — a big-type sign-off + an order/pickup CTA.
 *
 * Structure only: every color is a skin var or a color-mix derivation, every
 * type value is a named role, every word is a content slot. Class-only —
 * every declaration lives in skinVarsCss under .ms-goodshead-*, .ms-marq-*, or
 * .ms-close-*. Nothing inline.
 */
import type { ArchetypeTheme } from '../types';
import type { ProductView } from '../content';
import type { MainStreetContent } from './schemas';
import { Media, linkHref } from './chrome';
import { Type } from './Type';

/** The view-all cue pointing home's sampling at the full Products page. */
export interface GoodsViewAll {
  href: string;
  label: string;
}

/** The shared goods heading row — an optional small label, the title, and the
 *  "see the full catalog" cue that marks this beat as a SAMPLING and sends the
 *  shopper to the Products page. Every goods treatment opens with this so the
 *  beat reads consistently whichever body the system picked. */
export function GoodsHead({
  goods,
  viewAll,
}: {
  goods: MainStreetContent['goods'];
  skin?: ArchetypeTheme;
  viewAll?: GoodsViewAll | undefined;
}) {
  return (
    <div className="ms-wrap ms-goodshead">
      <div>
        {goods.label && (
          <Type as="span" role="eyebrow" className="ms-goodshead-eyebrow">
            {goods.label}
          </Type>
        )}
        <Type as="h2" role="goodsHead" className="ms-goodshead-title">
          {goods.title}
        </Type>
      </div>
      {viewAll && (
        <Type as="a" role="navLabel" href={viewAll.href} className="ms-viewall ms-goodshead-cue">
          {viewAll.label} &rarr;
        </Type>
      )}
    </div>
  );
}

/** The prominent end-of-sampling CTA. The home goods beat is a TASTE; this is the
 *  clear button that sends the shopper to the full Products page (the small cue in
 *  the heading is secondary). Bohdi's label; only renders when authored. */
export function GoodsViewAllCta({ viewAll }: { viewAll?: GoodsViewAll | undefined; skin?: ArchetypeTheme }) {
  if (!viewAll) return null;
  return (
    <div className="ms-wrap ms-shopcue-wrap">
      <Type as="a" role="navLabel" href={viewAll.href} className="ms-viewall-cta ms-shopcue-btn">
        {viewAll.label} &rarr;
      </Type>
    </div>
  );
}

/** A marquee reads thin on a small catalog. Repeat the sampling up to a floor so
 *  the drift always looks full — reusing the maker's few photos is fine (the
 *  marquee loops anyway). */
const MARQUEE_MIN_CARDS = 10;
function fillMarquee(products: ProductView[]): ProductView[] {
  if (products.length === 0) return products;
  const out: ProductView[] = [];
  while (out.length < Math.max(MARQUEE_MIN_CARDS, products.length)) out.push(...products);
  return out;
}

export function GoodsMarquee({
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
  // Fill thin catalogs, then duplicate so the -50% scroll loops seamlessly.
  const filled = fillMarquee(products);
  const loop = [...filled, ...filled];
  return (
    <section id="goods" className="ms-marq-section">
      <GoodsHead goods={goods} skin={skin} viewAll={viewAll} />
      <div className="ms-marquee ms-marq-track">
        {loop.map((p, i) => (
          <article key={p.slug + i} data-ms-card className="ms-marq-card">
            <a href={`/listings/${p.slug}`} className="ms-marq-link">
              <div className="ms-marq-media">
                <Media media={p.media[0] ?? { kind: 'image', alt: p.name }} />
                <Type as="span" role="price" className="ms-marq-price">
                  {p.price}
                </Type>
              </div>
              <Type as="h3" role="cardTitle" className="ms-marq-name">
                {p.name}
              </Type>
              {p.shortDescription && (
                <Type as="p" role="caption" className="ms-marq-desc">
                  {p.shortDescription}
                </Type>
              )}
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}

export function Close({ close }: { close: MainStreetContent['close']; skin?: ArchetypeTheme }) {
  // The close button goes where its label says (D46); legacy rows with no
  // authored target keep the old /contact destination.
  const ctaHref = close.ctaTarget ? linkHref(close.ctaTarget) : '/contact';
  return (
    <section className="ms-close-section">
      <Type as="span" role="eyebrow" className="ms-close-eyebrow">
        {close.label}
      </Type>
      <Type as="h2" role="closeHead" className="ms-close-head">
        {close.headline}
      </Type>
      <Type as="a" role="navLabel" href={ctaHref} className="ms-close-cta">
        {close.ctaLabel}
      </Type>
    </section>
  );
}
