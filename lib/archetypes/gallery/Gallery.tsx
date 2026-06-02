/**
 * Gallery archetype — home renderer.
 *
 * Composition (identity → wall → collections → maker → markets → footer) is
 * baked in here. Identity, footer chrome, and the shared CSS/atmosphere/reveal
 * come from ./shared so every Gallery page matches. The home-only regions —
 * the wall, the collections band, the maker band, the markets strip — live
 * here. Bohdi's content fills the slots; he cannot author shape.
 *
 * No specifics: every color is the palette or a derivation, every type value
 * is a named role, structure (grid, columns, tile rhythm, spacing) is the
 * archetype's.
 */
import type { ArchetypeTheme } from '../types';
import type { GalleryContent } from './schemas';
import {
  GalleryRoot,
  GalleryHeader,
  GalleryFooter,
  TILE_ASPECTS,
  typeRoleCss,
  type GalleryRoles,
} from './shared';

export function Gallery({
  content,
  theme,
}: {
  content: GalleryContent;
  theme: ArchetypeTheme;
}) {
  const t = theme.type as unknown as GalleryRoles;
  const sp = theme.spacing;

  return (
    <GalleryRoot theme={theme}>
      <GalleryHeader identity={content.identity} theme={theme} variant="home" />

      {/* ============ THE WALL ============ */}
      <section>
        <div className="arch-wall">
          {content.wall.products.map((p, i) => (
            <div className="arch-tile" key={p.name + i}>
              {p.photo.url ? (
                <img
                  src={p.photo.url}
                  alt={p.photo.alt}
                  title={p.name}
                  className="archetype-photo"
                  style={{ aspectRatio: TILE_ASPECTS[i % TILE_ASPECTS.length] }}
                />
              ) : (
                <div
                  className="archetype-photo"
                  aria-label={p.photo.alt}
                  title={p.name}
                  style={{
                    aspectRatio: TILE_ASPECTS[i % TILE_ASPECTS.length],
                    background: theme.palette.fgMuted,
                    opacity: 0.18,
                  }}
                />
              )}

              {/* price chip — the palette's own pair, so always readable */}
              <span
                data-type="price"
                style={{
                  ...typeRoleCss(t.price),
                  position: 'absolute',
                  left: sp.tight,
                  bottom: sp.tight,
                  background: theme.palette.bg,
                  color: theme.palette.fg,
                  border: `1px solid ${theme.palette.rule}`,
                  padding: '5px 9px',
                  zIndex: 2,
                }}
              >
                {p.price}
              </span>

              {/* optional marker — the inverted pair, a dark chip */}
              {p.tag && (
                <span
                  data-type="label"
                  style={{
                    ...typeRoleCss(t.label),
                    position: 'absolute',
                    top: sp.tight,
                    left: sp.tight,
                    background: theme.palette.fg,
                    color: theme.palette.bg,
                    padding: '5px 8px',
                    zIndex: 2,
                  }}
                >
                  {p.tag}
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ============ COLLECTIONS (optional) ============ */}
      {/* Its own full-width contrasting band + an authored eyebrow, so it reads
          as a distinct zone, not more of the wall. Band tone is a color-mix
          of the palette — no new color. */}
      {content.collections && content.collections.items.length > 0 && (
        <section
          style={{
            marginTop: sp.section,
            width: '100vw',
            marginLeft: 'calc(50% - 50vw)',
            background: 'color-mix(in srgb, var(--g-fg) 8%, var(--g-bg))',
            padding: `${sp.section}px 0`,
          }}
        >
          <div style={{ maxWidth: 1320, margin: '0 auto', padding: `0 ${sp.loose}px` }}>
            <div
              data-type="label"
              style={{
                ...typeRoleCss(t.label),
                color: theme.palette.accent,
                textAlign: 'center',
                marginBottom: sp.loose,
              }}
            >
              {content.collections.title}
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${content.collections.items.length}, 1fr)`,
                gap: sp.base,
              }}
            >
              {content.collections.items.map((c, i) => (
                <div className="arch-tile" style={{ margin: 0 }} key={c.name + i}>
                  {c.photo.url ? (
                    <img
                      src={c.photo.url}
                      alt={c.photo.alt}
                      className="archetype-photo"
                      style={{ aspectRatio: '3 / 2' }}
                    />
                  ) : (
                    <div
                      className="archetype-photo"
                      aria-label={c.photo.alt}
                      style={{ aspectRatio: '3 / 2', background: theme.palette.fgMuted, opacity: 0.18 }}
                    />
                  )}
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: 2,
                      background: theme.palette.fg,
                      padding: `${sp.base}px`,
                    }}
                  >
                    <div data-type="title" style={{ ...typeRoleCss(t.title), color: theme.palette.bg }}>
                      {c.name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============ THE MAKER ============ */}
      {/* The dark contrast band = the palette's own pair, inverted. */}
      <section
        style={{
          marginTop: sp.section,
          background: theme.palette.fg,
          color: theme.palette.bg,
          display: 'grid',
          gridTemplateColumns: 'minmax(220px, 0.8fr) 1.2fr',
          gap: sp.section,
          alignItems: 'center',
          padding: sp.section,
        }}
      >
        <div className="arch-tile" style={{ margin: 0 }}>
          {content.maker.photo.url ? (
            <img
              src={content.maker.photo.url}
              alt={content.maker.photo.alt}
              className="archetype-photo"
              style={{ aspectRatio: '4 / 5' }}
            />
          ) : (
            <div
              className="archetype-photo"
              aria-label={content.maker.photo.alt}
              style={{ aspectRatio: '4 / 5', background: theme.palette.bg, opacity: 0.18 }}
            />
          )}
        </div>
        <div>
          <div data-type="label" style={{ ...typeRoleCss(t.label), color: theme.palette.accent }}>
            {content.maker.label}
          </div>
          <h2
            data-type="makerHead"
            style={{ ...typeRoleCss(t.makerHead), color: theme.palette.bg, margin: `${sp.tight}px 0 ${sp.base}px` }}
          >
            {content.maker.headline}
          </h2>
          <p
            data-type="body"
            style={{
              ...typeRoleCss(t.body),
              color: 'color-mix(in srgb, var(--g-bg) 72%, var(--g-fg))',
              maxWidth: 560,
              margin: 0,
            }}
          >
            {content.maker.body}
          </p>
          <a
            data-type="nav"
            href="#"
            style={{ ...typeRoleCss(t.nav), display: 'inline-block', marginTop: sp.base, color: theme.palette.accent }}
          >
            {content.maker.ctaLabel} &rarr;
          </a>
        </div>
      </section>

      {/* ============ MARKETS (optional) ============ */}
      {content.markets && (
        <section
          style={{
            marginTop: sp.section,
            paddingTop: sp.loose,
            borderTop: `1px solid ${theme.palette.rule}`,
            display: 'flex',
            gap: sp.section,
            alignItems: 'baseline',
            flexWrap: 'wrap',
          }}
        >
          <div data-type="title" style={{ ...typeRoleCss(t.title), color: theme.palette.fg }}>
            {content.markets.title}
          </div>
          <div style={{ display: 'flex', gap: sp.loose, flexWrap: 'wrap', alignItems: 'baseline' }}>
            {content.markets.events.map((e, i) => (
              <span key={e.name + i} style={{ display: 'inline-flex', gap: sp.tight, alignItems: 'baseline' }}>
                <span data-type="price" style={{ ...typeRoleCss(t.price), color: theme.palette.accent }}>
                  {e.dateLabel}
                </span>
                <span data-type="body" style={{ ...typeRoleCss(t.body), color: theme.palette.fgMuted }}>
                  {e.name}
                </span>
              </span>
            ))}
          </div>
        </section>
      )}

      <GalleryFooter shopName={content.shopName} footer={content.footer} theme={theme} />
    </GalleryRoot>
  );
}
