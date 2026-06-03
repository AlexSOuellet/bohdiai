/**
 * Main Street archetype — product page renderer.
 *
 * Reads a single product ROW (the shared ProductView, projected from the
 * listings + variations tables) into Main Street's product container. The
 * product is data, not Bohdi-authored content, so any archetype could render
 * this same row in its own language. Shares header, footer, CSS, and atmosphere
 * with the home page via ./shared.
 *
 * No specifics hardcoded — colors are the palette or derivations, type values
 * are named roles.
 */
import type { ArchetypeTheme } from '../types';
import type { CatalogMedia, ProductView } from '../content';
import type { MainStreetContent } from './schemas';
import {
  MainStreetRoot,
  MainStreetHeader,
  MainStreetFooter,
  typeRoleCss,
  type MainStreetRoles,
} from './shared';

function MediaTile({
  media,
  theme,
  aspect,
}: {
  media: CatalogMedia;
  theme: ArchetypeTheme;
  aspect: string;
}) {
  const t = theme.type as unknown as MainStreetRoles;
  const src = media.kind === 'video' ? media.poster : media.url;
  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      {src ? (
        <img src={src} alt={media.alt} className="archetype-photo" style={{ aspectRatio: aspect }} />
      ) : (
        <div
          className="archetype-photo"
          aria-label={media.alt}
          style={{ aspectRatio: aspect, background: theme.palette.fgMuted, opacity: 0.18 }}
        />
      )}
      {media.kind === 'video' && (
        <span
          data-type="label"
          style={{
            ...typeRoleCss(t.label),
            position: 'absolute',
            left: theme.spacing.tight,
            top: theme.spacing.tight,
            background: theme.palette.fg,
            color: theme.palette.bg,
            padding: '5px 8px',
            zIndex: 2,
          }}
        >
          &#9658; Video
        </span>
      )}
    </div>
  );
}

export function MainStreetProduct({
  content,
  product,
  theme,
}: {
  content: MainStreetContent;
  product: ProductView;
  theme: ArchetypeTheme;
}) {
  const t = theme.type as unknown as MainStreetRoles;
  const sp = theme.spacing;
  const primary = product.media[0];
  const rest = product.media.slice(1);
  const soldOut = product.status === 'sold_out';

  return (
    <MainStreetRoot theme={theme}>
      <MainStreetHeader identity={content.identity} theme={theme} variant="compact" />

      {/* ============ PRODUCT DETAIL ============ */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: '1.1fr 0.9fr',
          gap: sp.section,
          alignItems: 'start',
        }}
      >
        {/* media gallery */}
        <div>
          {primary && <MediaTile media={primary} theme={theme} aspect="4 / 5" />}
          {rest.length > 0 && (
            <div
              style={{
                marginTop: sp.tight,
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: sp.tight,
              }}
            >
              {rest.map((m, i) => (
                <MediaTile key={i} media={m} theme={theme} aspect="1 / 1" />
              ))}
            </div>
          )}
        </div>

        {/* buy column */}
        <div>
          <h1 data-type="makerHead" style={{ ...typeRoleCss(t.makerHead), color: theme.palette.fg, margin: 0 }}>
            {product.name}
          </h1>
          <div data-type="title" style={{ ...typeRoleCss(t.title), color: theme.palette.fg, marginTop: sp.base }}>
            {product.price}
          </div>
          {product.shortDescription && (
            <p
              data-type="body"
              style={{ ...typeRoleCss(t.body), color: theme.palette.fgMuted, marginTop: sp.base, maxWidth: 460 }}
            >
              {product.shortDescription}
            </p>
          )}

          {/* seller-defined variations */}
          {product.variations.map((v) => (
            <div key={v.name} style={{ marginTop: sp.loose }}>
              <div data-type="label" style={{ ...typeRoleCss(t.label), color: theme.palette.fg }}>
                {v.name}
              </div>
              <div style={{ marginTop: sp.tight, display: 'flex', flexWrap: 'wrap', gap: sp.tight }}>
                {v.options.map((opt) => (
                  <span
                    key={opt}
                    data-type="caption"
                    style={{
                      ...typeRoleCss(t.caption),
                      color: theme.palette.fg,
                      border: `1px solid ${theme.palette.rule}`,
                      padding: '7px 12px',
                    }}
                  >
                    {opt}
                  </span>
                ))}
              </div>
            </div>
          ))}

          {/* add to cart — accent background, palette bg as readable text */}
          <div style={{ marginTop: sp.loose }}>
            <button
              type="button"
              disabled={soldOut}
              data-type="nav"
              style={{
                ...typeRoleCss(t.nav),
                background: soldOut ? theme.palette.fgMuted : theme.palette.accent,
                color: theme.palette.bg,
                border: 'none',
                padding: `${sp.base}px ${sp.loose}px`,
                cursor: soldOut ? 'default' : 'pointer',
              }}
            >
              {soldOut ? 'Sold out' : 'Add to cart'}
            </button>
          </div>
        </div>
      </section>

      {/* ============ FULL DESCRIPTION ============ */}
      <section style={{ paddingTop: sp.section }}>
        <div data-type="label" style={{ ...typeRoleCss(t.label), color: theme.palette.accent, marginBottom: sp.base }}>
          Details
        </div>
        <p data-type="body" style={{ ...typeRoleCss(t.body), color: theme.palette.fg, maxWidth: 640, margin: 0 }}>
          {product.description}
        </p>
      </section>

      <MainStreetFooter shopName={content.shopName} footer={content.footer} theme={theme} />
    </MainStreetRoot>
  );
}
