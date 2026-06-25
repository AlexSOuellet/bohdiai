'use client';

/**
 * Main Street — a swappable HERO variant: CAROUSEL.
 *
 * A text column (eyebrow / headline / sub / CTA) beside a horizontal rail of
 * featured PRODUCTS. Unlike the other heroes, Carousel needs the product lineup,
 * so it reads `products` from the hero contract (the catalog threads the live
 * catalog rows in). Skin-agnostic: text and cards read --ms-bg / --ms-fg /
 * --ms-accent + the type roles. No family default — it lives in the catalog for
 * the editor, and only earns its place when there are several things to feature.
 *
 * CONTENT GATE / FUNCTIONAL FLOOR: with no products the rail simply doesn't
 * render — the text still stands and nothing breaks. (Whether Carousel is even
 * OFFERED to a maker with too few products is a recipe/editor decision, not this
 * component's.)
 *
 * Reads the shared hero "pile" (eyebrow, brand, sub, CTA); does NOT use the
 * Story fading lines, and does NOT use the hero media clip — its imagery is the
 * product lineup.
 */
import type { ArchetypeTheme } from '../types';
import type { ProductView } from '../content';
import type { MainStreetContent } from './schemas';
import { Nav, linkHref } from './chrome';
import { Type } from './Type';

export function CarouselHero({
  identity,
  moment,
  products,
}: {
  identity: MainStreetContent['identity'];
  moment: MainStreetContent['moment'];
  skin: ArchetypeTheme;
  products: ProductView[];
}) {
  const ctaHref = moment.ctaTarget ? linkHref(moment.ctaTarget) : '/shop';
  const secondaryHref = moment.secondaryCtaTarget ? linkHref(moment.secondaryCtaTarget) : '/shop';

  return (
    <header data-ms-hero="carousel" className="ms-carousel-hero">
      <style>{`
        .ms-carousel-hero{display:flex;flex-direction:column;min-height:100vh;background:var(--ms-bg);color:var(--ms-fg)}
        .ms-carousel-hero .ms-carousel-body{flex:1;display:grid;grid-template-columns:minmax(280px,0.85fr) 1.15fr;align-items:center;gap:clamp(24px,4vw,56px);padding:clamp(24px,4vh,56px) clamp(24px,5vw,60px) clamp(32px,5vh,64px)}
        .ms-carousel-hero .ms-carousel-rail{display:flex;gap:clamp(14px,1.6vw,22px);overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:8px;-webkit-overflow-scrolling:touch}
        .ms-carousel-hero [data-ms-carousel-item]{scroll-snap-align:start;flex:0 0 clamp(200px,24vw,300px);color:inherit}
        .ms-carousel-hero [data-ms-carousel-item] .ms-carousel-shot{aspect-ratio:3/4;overflow:hidden;background:var(--ms-contrast-bg);border:1px solid var(--ms-rule)}
        .ms-carousel-hero [data-ms-carousel-item] img{width:100%;height:100%;object-fit:cover;display:block}
        @media(max-width:860px){.ms-carousel-hero .ms-carousel-body{grid-template-columns:1fr;gap:clamp(20px,4vh,36px)}}
      `}</style>

      <div
        data-ms-hero-nav
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, padding: 'clamp(20px,3vw,32px) clamp(24px,5vw,60px) 0' }}
      >
        <Nav identity={identity} />
      </div>

      <div className="ms-carousel-body">
        <div data-ms-hero-text style={{ display: 'flex', flexDirection: 'column' }}>
          <Type as="div" role="eyebrow" style={{ color: 'var(--ms-accent)', marginBottom: 22 }}>
            {moment.eyebrow}
          </Type>
          <Type as="h1" role="brand" style={{ color: 'var(--ms-fg)', margin: 0 }}>
            {moment.brand}
          </Type>
          {moment.sub && (
            <Type as="p" role="body" data-ms-hero-sub style={{ color: 'var(--ms-fg-muted)', maxWidth: '40ch', marginTop: 22, marginBottom: 0 }}>
              {moment.sub}
            </Type>
          )}
          <div style={{ display: 'flex', gap: 16, marginTop: 32, flexWrap: 'wrap' }}>
            <Type
              as="a"
              role="navLabel"
              href={ctaHref}
              style={{ background: 'var(--ms-accent)', color: 'var(--ms-on-accent)', padding: '16px 26px', borderRadius: 2 }}
            >
              {moment.ctaLabel}
            </Type>
            {moment.secondaryCtaLabel && (
              <Type
                as="a"
                role="navLabel"
                href={secondaryHref}
                style={{ border: '1px solid var(--ms-rule)', color: 'var(--ms-fg)', padding: '16px 26px', borderRadius: 2 }}
              >
                {moment.secondaryCtaLabel}
              </Type>
            )}
          </div>
        </div>

        {products.length > 0 && (
          <div className="ms-carousel-rail" aria-label="Featured products">
            {products.map((p) => {
              const shot = p.media.find((m) => m.kind === 'image');
              return (
                <a key={p.slug} data-ms-carousel-item href={`/listings/${p.slug}`}>
                  <div className="ms-carousel-shot">
                    {shot && <img src={shot.url} alt={shot.alt ?? p.name} />}
                  </div>
                  <Type as="div" role="navLabel" style={{ color: 'var(--ms-fg)', marginTop: 12 }}>
                    {p.name}
                  </Type>
                  <Type as="div" role="body" style={{ color: 'var(--ms-fg-muted)' }}>
                    {p.price}
                  </Type>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}
