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
 * type value is a named role, every word is a content slot.
 */
import type { ArchetypeTheme } from '../types';
import type { ProductView } from '../content';
import type { MainStreetContent } from './schemas';
import { Media, typeRoleCss, roles, linkHref } from './chrome';

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
  skin,
  viewAll,
}: {
  goods: MainStreetContent['goods'];
  skin: ArchetypeTheme;
  viewAll?: GoodsViewAll | undefined;
}) {
  const r = roles(skin);
  return (
    <div
      className="ms-wrap"
      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, flexWrap: 'wrap', marginBottom: 48 }}
    >
      <div>
        {goods.label && (
          <span data-type="eyebrow" style={{ ...typeRoleCss(r.eyebrow), color: 'var(--ms-accent)', display: 'block', marginBottom: 14 }}>
            {goods.label}
          </span>
        )}
        <h2 data-type="goodsHead" style={{ ...typeRoleCss(r.goodsHead), color: 'var(--ms-fg)', maxWidth: '16ch', margin: 0 }}>
          {goods.title}
        </h2>
      </div>
      {viewAll && (
        <a
          href={viewAll.href}
          data-type="navLabel"
          className="ms-viewall"
          style={{ ...typeRoleCss(r.navLabel), color: 'var(--ms-accent)', whiteSpace: 'nowrap' }}
        >
          {viewAll.label} &rarr;
        </a>
      )}
    </div>
  );
}

/** The prominent end-of-sampling CTA. The home goods beat is a TASTE; this is the
 *  clear button that sends the shopper to the full Products page (the small cue in
 *  the heading is secondary). Bohdi's label, with a neutral fallback. */
export function GoodsViewAllCta({ viewAll, skin }: { viewAll?: GoodsViewAll | undefined; skin: ArchetypeTheme }) {
  if (!viewAll) return null;
  const r = roles(skin);
  return (
    <div className="ms-wrap" style={{ display: 'flex', justifyContent: 'center', marginTop: 56 }}>
      <a
        href={viewAll.href}
        data-type="navLabel"
        className="ms-viewall-cta"
        style={{
          ...typeRoleCss(r.navLabel),
          color: 'var(--ms-fg)',
          border: '1px solid var(--ms-rule)',
          padding: '15px 30px',
          borderRadius: 2,
        }}
      >
        {viewAll.label} &rarr;
      </a>
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
  const r = roles(skin);
  // Fill thin catalogs, then duplicate so the -50% scroll loops seamlessly.
  const filled = fillMarquee(products);
  const loop = [...filled, ...filled];
  return (
    <section id="goods" style={{ padding: '96px 0 110px', overflow: 'hidden' }}>
      <GoodsHead goods={goods} skin={skin} viewAll={viewAll} />
      <div className="ms-marquee" style={{ display: 'flex', gap: 18, width: 'max-content', padding: '0 9px' }}>
        {loop.map((p, i) => (
          <article key={p.slug + i} data-ms-card style={{ width: 340, flex: '0 0 auto' }}>
            <a href={`/listings/${p.slug}`} style={{ color: 'inherit', textDecoration: 'none', display: 'block' }}>
              <div
                style={{
                  position: 'relative',
                  aspectRatio: '4 / 5',
                  borderRadius: 3,
                  overflow: 'hidden',
                  background: 'color-mix(in srgb, var(--ms-fg-muted) 40%, var(--ms-bg))',
                }}
              >
                <Media media={p.media[0] ?? { kind: 'image', alt: p.name }} />
                <span
                  data-type="price"
                  style={{
                    ...typeRoleCss(r.price),
                    position: 'absolute',
                    left: 12,
                    bottom: 12,
                    background: 'var(--ms-bg)',
                    color: 'var(--ms-fg)',
                    padding: '6px 10px',
                    borderRadius: 2,
                  }}
                >
                  {p.price}
                </span>
              </div>
              <h3 data-type="cardTitle" style={{ ...typeRoleCss(r.cardTitle), color: 'var(--ms-fg)', margin: '16px 0 2px' }}>
                {p.name}
              </h3>
              {p.shortDescription && (
                <p data-type="caption" style={{ ...typeRoleCss(r.caption), color: 'var(--ms-fg-muted)', margin: 0 }}>
                  {p.shortDescription}
                </p>
              )}
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}

export function Close({ close, skin }: { close: MainStreetContent['close']; skin: ArchetypeTheme }) {
  const r = roles(skin);
  // The close button goes where its label says (D46); legacy rows with no
  // authored target keep the old /contact destination.
  const ctaHref = close.ctaTarget ? linkHref(close.ctaTarget) : '/contact';
  return (
    <section style={{ padding: '130px 40px', textAlign: 'center' }}>
      <span data-type="eyebrow" style={{ ...typeRoleCss(r.eyebrow), color: 'var(--ms-accent)', display: 'block', marginBottom: 22 }}>
        {close.label}
      </span>
      <h2 data-type="closeHead" style={{ ...typeRoleCss(r.closeHead), color: 'var(--ms-fg)', maxWidth: '16ch', margin: '0 auto 36px' }}>
        {close.headline}
      </h2>
      <a
        href={ctaHref}
        data-type="navLabel"
        style={{
          ...typeRoleCss(r.navLabel),
          background: 'var(--ms-accent)',
          color: 'var(--ms-on-accent)',
          padding: '16px 26px',
          borderRadius: 2,
          display: 'inline-block',
        }}
      >
        {close.ctaLabel}
      </a>
    </section>
  );
}
