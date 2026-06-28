/**
 * Main Street archetype — product page renderer.
 *
 * Reads a single product ROW (the shared ProductView, projected from the
 * listings + variations tables) into Main Street's product container. The
 * product is data, not Bohdi-authored content, so any archetype could render
 * this same row in its own language. Shares the skin, chrome, and atmosphere
 * with the sales page via ./chrome.
 *
 * No specifics hardcoded — colors are skin vars or derivations, type values are
 * named roles. (The full product-page redesign is a later thread; this keeps
 * the page set consistent with the new skin/roles.)
 */
import type { ArchetypeTheme } from '../types';
import type { CatalogMedia, ProductView } from '../content';
import type { MainStreetContent } from './schemas';
import { MainStreetRoot, MainStreetFooter, Nav } from './chrome';
import { Type } from './Type';

/** One media cell — a playable video or a still. A video renders a real
 *  <video> with controls (poster shown until play), so product clips actually
 *  play; a still renders an <img>, or a muted placeholder when no URL yet. */
function MediaTile({ media, aspect }: { media: CatalogMedia; aspect: string }) {
  if (media.kind === 'video' && media.url) {
    return (
      <video
        className="archetype-photo"
        style={{ aspectRatio: aspect }}
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
    <img src={media.url} alt={media.alt} className="archetype-photo" style={{ aspectRatio: aspect }} />
  ) : (
    <div className="archetype-photo" aria-label={media.alt} style={{ aspectRatio: aspect, background: 'var(--ms-fg-muted)', opacity: 0.18 }} />
  );
}

export function MainStreetProduct({
  content,
  product,
  skin,
}: {
  content: MainStreetContent;
  product: ProductView;
  skin: ArchetypeTheme;
}) {
  const sp = skin.spacing;
  const primary = product.media[0];
  const rest = product.media.slice(1);
  const soldOut = product.status === 'sold_out';

  return (
    <MainStreetRoot skin={skin}>
      <nav
        data-ms-nav
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 40px',
          background: 'var(--ms-bg)',
          color: 'var(--ms-fg)',
          borderBottom: '1px solid var(--ms-rule)',
        }}
      >
        <Nav identity={content.identity} currentHref="/shop" />
      </nav>

      <div className="ms-wrap" style={{ paddingTop: sp.section, paddingBottom: sp.section }}>
        {/* ============ PRODUCT DETAIL ============ */}
        <section className="ms-product-grid">
          {/* media gallery */}
          <div>
            {primary && <MediaTile media={primary} aspect="4 / 5" />}
            {rest.length > 0 && (
              <div style={{ marginTop: sp.tight, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: sp.tight }}>
                {rest.map((m, i) => (
                  <MediaTile key={i} media={m} aspect="1 / 1" />
                ))}
              </div>
            )}
          </div>

          {/* buy column */}
          <div>
            <Type as="h1" role="title" style={{ color: 'var(--ms-fg)', margin: 0 }}>
              {product.name}
            </Type>
            <Type as="div" role="title" style={{ color: 'var(--ms-fg)', marginTop: sp.base }}>
              {product.price}
            </Type>
            {product.shortDescription && (
              <Type as="p" role="body" style={{ color: 'var(--ms-fg-muted)', marginTop: sp.base, maxWidth: 460 }}>
                {product.shortDescription}
              </Type>
            )}

            {/* seller-defined variations */}
            {product.variations.map((v) => (
              <div key={v.name} style={{ marginTop: sp.loose }}>
                <Type as="div" role="eyebrow" style={{ color: 'var(--ms-fg)' }}>
                  {v.name}
                </Type>
                <div style={{ marginTop: sp.tight, display: 'flex', flexWrap: 'wrap', gap: sp.tight }}>
                  {v.options.map((opt) => (
                    <Type
                      key={opt}
                      as="span"
                      role="caption"
                      style={{ color: 'var(--ms-fg)', border: '1px solid var(--ms-rule)', padding: '7px 12px' }}
                    >
                      {opt}
                    </Type>
                  ))}
                </div>
              </div>
            ))}

            {/* add to cart — accent background, paper as readable text */}
            <div style={{ marginTop: sp.loose }}>
              <Type
                as="button"
                role="navLabel"
                type="button"
                disabled={soldOut}
                style={{
                  background: soldOut ? 'var(--ms-fg-muted)' : 'var(--ms-accent)',
                  color: 'var(--ms-on-accent)',
                  border: 'none',
                  padding: `${sp.base}px ${sp.loose}px`,
                  cursor: soldOut ? 'default' : 'pointer',
                }}
              >
                {soldOut ? 'Sold out' : 'Add to cart'}
              </Type>
            </div>
          </div>
        </section>

        {/* ============ FULL DESCRIPTION ============ */}
        <section style={{ paddingTop: sp.section }}>
          <Type as="div" role="eyebrow" style={{ color: 'var(--ms-accent)', marginBottom: sp.base }}>
            Details
          </Type>
          <Type as="p" role="body" style={{ color: 'var(--ms-fg)', maxWidth: 640, margin: 0 }}>
            {product.description}
          </Type>
        </section>
      </div>

      <MainStreetFooter shopName={content.shopName} />
    </MainStreetRoot>
  );
}
