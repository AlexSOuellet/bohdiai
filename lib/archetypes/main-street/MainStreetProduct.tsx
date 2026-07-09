/**
 * Main Street archetype — product page renderer.
 *
 * Reads a single product ROW (the shared ProductView, projected from the
 * listings + variations tables) into Main Street's product container. The
 * product is data, not Bohdi-authored content, so any archetype could render
 * this same row in its own language. Shares the skin, chrome, and atmosphere
 * with the sales page via ./chrome.
 *
 * Class-only: every declaration lives in skinVarsCss under .ms-product-*.
 * Colors are skin vars or derivations, type values are named roles, per-tenant
 * media aspect ratios pass as CSS custom properties on the media element.
 */
import type { CSSProperties } from 'react';
import type { ArchetypeTheme } from '../types';
import type { CatalogMedia, ProductView } from '../content';
import type { MainStreetContent } from './schemas';
import { MainStreetRoot, MainStreetFooter, Nav } from './chrome';
import { Type } from './Type';
import { DEFAULT_STRINGS } from './defaults';
import type { Family } from './families';

/** One media cell — a playable video or a still. A video renders a real
 *  <video> with controls (poster shown until play), so product clips actually
 *  play; a still renders an <img>, or a class-styled placeholder when no URL yet.
 *  The aspect ratio passes as a CSS custom property so tenants can vary it without
 *  the renderer carrying an inline `style` declaration for a design value. */
function MediaTile({ media, aspect }: { media: CatalogMedia; aspect: string }) {
  const aspectVars = { '--ms-tile-aspect': aspect } as CSSProperties;
  if (media.kind === 'video' && media.url) {
    return (
      <video
        className="archetype-photo ms-product-tile"
        style={aspectVars}
        src={media.url}
        poster={media.poster}
        controls
        muted
        playsInline
        aria-label={media.alt}
      />
    );
  }
  return media.url ? (
    <img src={media.url} alt={media.alt} className="archetype-photo ms-product-tile" style={aspectVars} />
  ) : (
    <div className="archetype-photo ms-product-tile ms-product-tile-empty" aria-label={media.alt} style={aspectVars} />
  );
}

export function MainStreetProduct({
  content,
  product,
  skin,
  family,
}: {
  content: MainStreetContent;
  product: ProductView;
  skin: ArchetypeTheme;
  family?: Family | undefined;
}) {
  const primary = product.media[0];
  const rest = product.media.slice(1);
  const soldOut = product.status === 'sold_out';

  return (
    <MainStreetRoot skin={skin} family={family}>
      <nav data-ms-nav className="ms-product-nav">
        <Nav identity={content.identity} currentHref="/shop" />
      </nav>
      <main className="ms-wrap ms-product-section">
        <section className="ms-product-grid">
          <div>
            {primary && <MediaTile media={primary} aspect="4 / 5" />}
            {rest.length > 0 && (
              <div className="ms-product-thumbs">
                {rest.map((m, i) => (
                  <MediaTile key={i} media={m} aspect="1 / 1" />
                ))}
              </div>
            )}
          </div>
          <div>
            <Type as="h1" role="title" className="ms-product-title">
              {product.name}
            </Type>
            <Type as="div" role="title" className="ms-product-price">
              {product.price}
            </Type>
            {product.shortDescription && (
              <Type as="p" role="body" className="ms-product-desc">
                {product.shortDescription}
              </Type>
            )}
            {product.variations.map((v) => (
              <div key={v.name} className="ms-product-var">
                <Type as="div" role="eyebrow" className="ms-product-var-lbl">
                  {v.name}
                </Type>
                <div className="ms-product-var-opts">
                  {v.options.map((opt) => (
                    <Type key={opt} as="span" role="caption" className="ms-product-var-chip">
                      {opt}
                    </Type>
                  ))}
                </div>
              </div>
            ))}
            <div className="ms-product-buy">
              <Type
                as="button"
                role="navLabel"
                type="button"
                disabled={soldOut}
                className="ms-product-cta"
                data-soldout={soldOut ? 'true' : 'false'}
              >
                {soldOut ? DEFAULT_STRINGS.productSoldOut : DEFAULT_STRINGS.productAddToCart}
              </Type>
            </div>
          </div>
        </section>
        <section className="ms-product-story">
          <Type as="div" role="eyebrow" className="ms-product-story-eyebrow">
            {DEFAULT_STRINGS.productDetailsLabel}
          </Type>
          <Type as="p" role="body" className="ms-product-story-body">
            {product.description}
          </Type>
        </section>
      </main>
      <MainStreetFooter shopName={content.shopName} />
    </MainStreetRoot>
  );
}
