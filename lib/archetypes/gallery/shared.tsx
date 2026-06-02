/**
 * Gallery archetype — shared chrome and helpers.
 *
 * The pieces every Gallery page wears: the root wrapper (fonts, CSS, the
 * atmosphere + reveal), the header (identity + nav + cart), and the footer
 * (columns + guaranteed legal row). Factored here so the home page, the
 * product page, and any future page share one source of truth and cannot
 * drift apart. No specifics are hardcoded — every color is the palette or a
 * derivation, every type value is a named role.
 */
import React from 'react';
import type { ArchetypeTheme, TypeRole } from '../types';
import type { GalleryContent } from './schemas';

export interface GalleryRoles {
  wordmark: TypeRole;
  tagline: TypeRole;
  nav: TypeRole;
  label: TypeRole;
  title: TypeRole;
  makerHead: TypeRole;
  body: TypeRole;
  price: TypeRole;
  caption: TypeRole;
}

/** The tile aspect rhythm the archetype owns — variety regardless of the photos. */
export const TILE_ASPECTS = ['4 / 5', '1 / 1', '3 / 4', '1 / 1', '5 / 6', '4 / 5', '3 / 4', '1 / 1'];

export function typeRoleCss(role: TypeRole): React.CSSProperties {
  return {
    fontFamily: role.family,
    fontSize: role.size,
    fontWeight: role.weight,
    lineHeight: role.lineHeight,
    letterSpacing: role.letterSpacing,
    fontStyle: role.italic ? 'italic' : undefined,
    textTransform: role.uppercase ? 'uppercase' : undefined,
    fontVariationSettings: role.variationSettings,
  };
}

export function fontHrefForTheme(_theme: ArchetypeTheme): string {
  return 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,900;1,9..144,400&family=Archivo:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap';
}

export function rootCss(theme: ArchetypeTheme): string {
  const { palette, atmosphere, motion, spacing } = theme;
  const responsive = Object.entries(theme.type)
    .filter(([, role]) => role.sizeMobile && role.sizeMobile !== role.size)
    .map(
      ([key, role]) =>
        `@media (max-width: 768px) { .arch-gallery [data-type="${key}"] { font-size: ${role.sizeMobile}px; } }`,
    )
    .join('\n');

  return `
    .arch-gallery {
      background: ${palette.bg};
      color: ${palette.fg};
      position: relative;
      isolation: isolate;
      overflow-x: clip;
      min-height: 100vh;
      --g-bg: ${palette.bg};
      --g-fg: ${palette.fg};
      --g-fg-muted: ${palette.fgMuted};
      --g-accent: ${palette.accent};
      --g-rule: ${palette.rule};
      --g-section: ${spacing.section}px;
      --g-loose: ${spacing.loose}px;
      --g-base: ${spacing.base}px;
      --g-tight: ${spacing.tight}px;
    }
    .arch-gallery::after {
      content: ''; position: absolute; inset: 0; pointer-events: none; z-index: 0;
      ${atmosphere.wash ?? ''}
    }
    .arch-gallery > .arch-stage { position: relative; z-index: 1; }

    .arch-gallery .archetype-photo {
      filter: ${atmosphere.photoFilter ?? 'none'};
      display: block; width: 100%; height: 100%; object-fit: cover;
    }
    .arch-gallery .arch-tile { position: relative; break-inside: avoid; margin-bottom: ${spacing.tight}px; overflow: hidden; }
    .arch-gallery .arch-tile::after {
      content: ''; position: absolute; inset: 0; pointer-events: none;
      background: var(--g-accent); opacity: 0.08; mix-blend-mode: multiply;
    }
    .arch-gallery .arch-wall { column-count: 4; column-gap: ${spacing.tight}px; }
    @media (max-width: 980px) { .arch-gallery .arch-wall { column-count: 3; } }
    @media (max-width: 640px)  { .arch-gallery .arch-wall { column-count: 2; } }

    .arch-gallery a { color: var(--g-accent); text-decoration: none; }
    .arch-gallery a:hover { text-decoration: underline; text-underline-offset: 3px; }

    @keyframes archGalleryReveal {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .arch-gallery .arch-stage > * {
      opacity: 0;
      animation: archGalleryReveal ${motion.reveal.duration}ms ${motion.reveal.easing} forwards;
    }
    ${Array.from(
      { length: 8 },
      (_, i) =>
        `.arch-gallery .arch-stage > *:nth-child(${i + 1}) { animation-delay: ${i * motion.reveal.stagger}ms; }`,
    ).join('\n')}
    @media (prefers-reduced-motion: reduce) {
      .arch-gallery .arch-stage > * { animation: none; opacity: 1; transform: none; }
    }
    ${responsive}
  `;
}

/** Root wrapper: fonts + compiled CSS + the staged main column. */
export function GalleryRoot({
  theme,
  children,
}: {
  theme: ArchetypeTheme;
  children: React.ReactNode;
}) {
  return (
    <>
      <link rel="stylesheet" href={fontHrefForTheme(theme)} />
      <style dangerouslySetInnerHTML={{ __html: rootCss(theme) }} />
      <div className="arch-gallery">
        <main
          className="arch-stage"
          style={{
            maxWidth: 1320,
            margin: '0 auto',
            padding: `${theme.spacing.section}px ${theme.spacing.loose}px ${theme.spacing.page}px`,
          }}
        >
          {children}
        </main>
      </div>
    </>
  );
}

/** Identity header. `home` = full centered masthead; `compact` = slim inner-page bar. */
export function GalleryHeader({
  identity,
  theme,
  variant = 'home',
}: {
  identity: GalleryContent['identity'];
  theme: ArchetypeTheme;
  variant?: 'home' | 'compact';
}) {
  const t = theme.type as unknown as GalleryRoles;
  const sp = theme.spacing;
  const cart = (
    <a href="/cart" data-type="nav" style={{ ...typeRoleCss(t.nav) }}>
      Cart (0)
    </a>
  );

  if (variant === 'compact') {
    return (
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          paddingBottom: sp.loose,
          borderBottom: `1px solid ${theme.palette.rule}`,
          flexWrap: 'wrap',
          gap: sp.base,
        }}
      >
        <a href="/" data-type="title" style={{ ...typeRoleCss(t.title), color: theme.palette.fg }}>
          {identity.wordmark}
        </a>
        <nav style={{ display: 'flex', gap: sp.loose, alignItems: 'baseline' }}>
          {identity.nav.map((item) => (
            <span key={item} data-type="nav" style={{ ...typeRoleCss(t.nav), color: theme.palette.fgMuted }}>
              {item}
            </span>
          ))}
          {cart}
        </nav>
      </header>
    );
  }

  return (
    <header style={{ textAlign: 'center', paddingBottom: sp.section }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: sp.base, textAlign: 'left' }}>
        {cart}
      </div>
      <div data-type="wordmark" style={{ ...typeRoleCss(t.wordmark), color: theme.palette.fg }}>
        {identity.wordmark}
      </div>
      <div
        data-type="tagline"
        style={{
          ...typeRoleCss(t.tagline),
          color: theme.palette.fgMuted,
          marginTop: sp.tight,
          maxWidth: 560,
          marginInline: 'auto',
        }}
      >
        {identity.tagline}
      </div>
      <nav style={{ display: 'flex', justifyContent: 'center', gap: sp.loose, marginTop: sp.base + sp.tight }}>
        {identity.nav.map((item) => (
          <span key={item} data-type="nav" style={{ ...typeRoleCss(t.nav), color: theme.palette.fgMuted }}>
            {item}
          </span>
        ))}
      </nav>
    </header>
  );
}

/** Footer: brand + blurb, the maker's columns, and the platform-guaranteed legal row. */
export function GalleryFooter({
  shopName,
  footer,
  theme,
}: {
  shopName: string;
  footer: GalleryContent['footer'];
  theme: ArchetypeTheme;
}) {
  const t = theme.type as unknown as GalleryRoles;
  const sp = theme.spacing;
  return (
    <footer
      style={{
        marginTop: sp.section,
        background: 'color-mix(in srgb, var(--g-fg) 6%, var(--g-bg))',
        borderTop: `1px solid ${theme.palette.rule}`,
        padding: sp.section,
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: sp.section }}>
        <div>
          <div data-type="title" style={{ ...typeRoleCss(t.title), color: theme.palette.fg }}>
            {shopName}
          </div>
          <p
            data-type="caption"
            style={{ ...typeRoleCss(t.caption), color: theme.palette.fgMuted, marginTop: sp.tight, maxWidth: 320 }}
          >
            {footer.blurb}
          </p>
        </div>
        {footer.columns.map((col, i) => (
          <div key={col.title + i}>
            <div data-type="label" style={{ ...typeRoleCss(t.label), color: theme.palette.fg }}>
              {col.title}
            </div>
            <div style={{ marginTop: sp.base, display: 'flex', flexDirection: 'column', gap: sp.tight }}>
              {col.items.map((item) => (
                <span key={item} data-type="caption" style={{ ...typeRoleCss(t.caption), color: theme.palette.fgMuted }}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Platform-guaranteed legal row — Home / Privacy / Terms, per the
          page-architecture policy. Compliance furniture, not Bohdi content. */}
      <div
        style={{
          marginTop: sp.section,
          paddingTop: sp.base,
          borderTop: `1px solid ${theme.palette.rule}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          flexWrap: 'wrap',
          gap: sp.base,
        }}
      >
        <div style={{ display: 'flex', gap: sp.loose }}>
          <a href="/" data-type="caption" style={{ ...typeRoleCss(t.caption) }}>Home</a>
          <a href="/privacy" data-type="caption" style={{ ...typeRoleCss(t.caption) }}>Privacy</a>
          <a href="/terms" data-type="caption" style={{ ...typeRoleCss(t.caption) }}>Terms</a>
        </div>
        <span data-type="caption" style={{ ...typeRoleCss(t.caption), color: theme.palette.fgMuted }}>
          &copy; {shopName}
        </span>
      </div>
    </footer>
  );
}
