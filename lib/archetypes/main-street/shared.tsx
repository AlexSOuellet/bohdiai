/**
 * Main Street archetype — shared chrome, helpers, and region components.
 *
 * The pieces every Main Street page wears (root wrapper, header, footer) plus
 * the five region components the arrangements compose (hero, featured, maker,
 * secondary, stay-in-touch). Factored here so the home page, the product page,
 * and every arrangement share one source of truth and cannot drift.
 *
 * No specifics are hardcoded: every color is the palette or a derivation, every
 * type value is a named role, structure (grid, columns, spacing) is the
 * archetype's. Each region takes a `variant` so an arrangement can request a
 * treatment; the archetype — never Bohdi — wires which variant each arrangement
 * uses, so the family stays curated, not recombined.
 */
import React from 'react';
import type { ArchetypeTheme, TypeRole } from '../types';
import type { ProductView } from '../content';
import type { MainStreetContent } from './schemas';

export interface MainStreetRoles {
  wordmark: TypeRole;
  tagline: TypeRole;
  nav: TypeRole;
  label: TypeRole;
  heroHead: TypeRole;
  makerHead: TypeRole;
  title: TypeRole;
  body: TypeRole;
  price: TypeRole;
  caption: TypeRole;
}

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
  return 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700&family=Mulish:wght@400;600;700&family=DM+Mono:wght@400;500&display=swap';
}

export function rootCss(theme: ArchetypeTheme): string {
  const { palette, atmosphere, motion, spacing } = theme;
  const responsive = Object.entries(theme.type)
    .filter(([, role]) => role.sizeMobile && role.sizeMobile !== role.size)
    .map(
      ([key, role]) =>
        `@media (max-width: 768px) { .arch-main-street [data-type="${key}"] { font-size: ${role.sizeMobile}px; } }`,
    )
    .join('\n');

  return `
    .arch-main-street {
      background: ${palette.bg};
      color: ${palette.fg};
      position: relative;
      isolation: isolate;
      overflow-x: clip;
      min-height: 100vh;
      --ms-bg: ${palette.bg};
      --ms-fg: ${palette.fg};
      --ms-fg-muted: ${palette.fgMuted};
      --ms-accent: ${palette.accent};
      --ms-rule: ${palette.rule};
      --ms-section: ${spacing.section}px;
      --ms-loose: ${spacing.loose}px;
      --ms-base: ${spacing.base}px;
      --ms-tight: ${spacing.tight}px;
    }
    .arch-main-street::after {
      content: ''; position: absolute; inset: 0; pointer-events: none; z-index: 0;
      ${atmosphere.wash ?? ''}
    }
    .arch-main-street > .arch-stage { position: relative; z-index: 1; }

    .arch-main-street .archetype-photo {
      filter: ${atmosphere.photoFilter ?? 'none'};
      display: block; width: 100%; height: 100%; object-fit: cover;
    }

    .arch-main-street a { color: var(--ms-accent); text-decoration: none; }
    .arch-main-street a:hover { text-decoration: underline; text-underline-offset: 3px; }

    @keyframes archMainStreetReveal {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .arch-main-street .arch-stage > * {
      opacity: 0;
      animation: archMainStreetReveal ${motion.reveal.duration}ms ${motion.reveal.easing} forwards;
    }
    ${Array.from(
      { length: 10 },
      (_, i) =>
        `.arch-main-street .arch-stage > *:nth-child(${i + 1}) { animation-delay: ${i * motion.reveal.stagger}ms; }`,
    ).join('\n')}
    @media (prefers-reduced-motion: reduce) {
      .arch-main-street .arch-stage > * { animation: none; opacity: 1; transform: none; }
    }
    ${responsive}
  `;
}

/** Root wrapper: fonts + compiled CSS + the staged main column. */
export function MainStreetRoot({
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
      <div className="arch-main-street">
        <main
          className="arch-stage"
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: `${theme.spacing.loose}px ${theme.spacing.loose}px ${theme.spacing.page}px`,
          }}
        >
          {children}
        </main>
      </div>
    </>
  );
}

/** Top identity bar. `home` = the shop header; `compact` = inner-page bar. */
export function MainStreetHeader({
  identity,
  theme,
  variant = 'home',
}: {
  identity: MainStreetContent['identity'];
  theme: ArchetypeTheme;
  variant?: 'home' | 'compact';
}) {
  const t = theme.type as unknown as MainStreetRoles;
  const sp = theme.spacing;
  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        paddingBottom: variant === 'home' ? sp.loose : sp.base,
        marginBottom: variant === 'home' ? sp.section : sp.loose,
        borderBottom: `1px solid ${theme.palette.rule}`,
        flexWrap: 'wrap',
        gap: sp.base,
      }}
    >
      <a href="/" data-type="wordmark" style={{ ...typeRoleCss(t.wordmark), color: theme.palette.fg }}>
        {identity.wordmark}
      </a>
      <nav style={{ display: 'flex', gap: sp.loose, alignItems: 'baseline' }}>
        {identity.nav.map((item) => (
          <span key={item} data-type="nav" style={{ ...typeRoleCss(t.nav), color: theme.palette.fgMuted }}>
            {item}
          </span>
        ))}
        <a href="/cart" data-type="nav" style={{ ...typeRoleCss(t.nav), color: theme.palette.accent }}>
          Cart (0)
        </a>
      </nav>
    </header>
  );
}

/** Footer: brand + blurb, the maker's columns, and the platform-guaranteed legal row. */
export function MainStreetFooter({
  shopName,
  footer,
  theme,
}: {
  shopName: string;
  footer: MainStreetContent['footer'];
  theme: ArchetypeTheme;
}) {
  const t = theme.type as unknown as MainStreetRoles;
  const sp = theme.spacing;
  return (
    <footer
      style={{
        marginTop: sp.section,
        background: 'color-mix(in srgb, var(--ms-fg) 6%, var(--ms-bg))',
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

/** A primary CTA — accent background with the palette's bg as readable text. */
function CtaButton({ label, theme }: { label: string; theme: ArchetypeTheme }) {
  const t = theme.type as unknown as MainStreetRoles;
  return (
    <span
      data-type="nav"
      style={{
        ...typeRoleCss(t.nav),
        display: 'inline-block',
        background: theme.palette.accent,
        color: theme.palette.bg,
        padding: '12px 22px',
        marginTop: theme.spacing.base,
      }}
    >
      {label}
    </span>
  );
}

/** The archetype's image framing — the dressed-up, matted-print look: a
 *  rounded card with a thin rule and a soft lift, the photo rounded inside. */
const FRAME_RADIUS = 12;
const IMG_RADIUS = 8;
const FRAME_SHADOW = '0 1px 2px rgba(0, 0, 0, 0.05), 0 10px 26px rgba(0, 0, 0, 0.06)';

/** Photo or a graceful placeholder, sharing the archetype's grade. */
function Photo({
  photo,
  theme,
  aspectRatio,
  radius = 0,
}: {
  photo: { url?: string | undefined; alt: string };
  theme: ArchetypeTheme;
  aspectRatio: string;
  radius?: number;
}) {
  if (photo.url) {
    return (
      <img src={photo.url} alt={photo.alt} className="archetype-photo" style={{ aspectRatio, borderRadius: radius }} />
    );
  }
  return (
    <div
      className="archetype-photo"
      aria-label={photo.alt}
      style={{ aspectRatio, borderRadius: radius, background: theme.palette.fgMuted, opacity: 0.18 }}
    />
  );
}

/* ============================ REGIONS ============================ */

/** Hero. `bleed` = off-axis headline beside a bleeding image; `band` = full-
 *  width tinted brand band (used mid-page); `closer` = a quieter closing hero. */
export function HeroRegion({
  hero,
  theme,
  variant,
}: {
  hero: MainStreetContent['hero'];
  theme: ArchetypeTheme;
  variant: 'bleed' | 'band' | 'closer';
}) {
  const t = theme.type as unknown as MainStreetRoles;
  const sp = theme.spacing;

  if (variant === 'band') {
    return (
      <section
        style={{
          marginTop: sp.section,
          width: '100vw',
          marginLeft: 'calc(50% - 50vw)',
          background: 'color-mix(in srgb, var(--ms-accent) 12%, var(--ms-bg))',
          padding: `${sp.section}px ${sp.loose}px`,
          textAlign: 'center',
        }}
      >
        <h2 data-type="heroHead" style={{ ...typeRoleCss(t.heroHead), color: theme.palette.fg, margin: 0, maxWidth: 760, marginInline: 'auto' }}>
          {hero.headline}
        </h2>
        <p data-type="body" style={{ ...typeRoleCss(t.body), color: theme.palette.fgMuted, maxWidth: 520, margin: `${sp.base}px auto 0` }}>
          {hero.sub}
        </p>
        <CtaButton label={hero.ctaLabel} theme={theme} />
      </section>
    );
  }

  if (variant === 'closer') {
    return (
      <section style={{ marginTop: sp.section, textAlign: 'center', paddingTop: sp.loose, borderTop: `1px solid ${theme.palette.rule}` }}>
        <h2 data-type="title" style={{ ...typeRoleCss(t.title), color: theme.palette.fg, margin: 0 }}>
          {hero.headline}
        </h2>
        <p data-type="body" style={{ ...typeRoleCss(t.body), color: theme.palette.fgMuted, maxWidth: 480, margin: `${sp.tight}px auto 0` }}>
          {hero.sub}
        </p>
        <CtaButton label={hero.ctaLabel} theme={theme} />
      </section>
    );
  }

  // bleed (default) — off-axis: text left, a larger framed image right.
  return (
    <section
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(280px, 1fr) 1.15fr',
        gap: sp.section,
        alignItems: 'center',
      }}
    >
      <div>
        <h1 data-type="heroHead" style={{ ...typeRoleCss(t.heroHead), color: theme.palette.fg, margin: 0 }}>
          {hero.headline}
        </h1>
        <p data-type="body" style={{ ...typeRoleCss(t.body), color: theme.palette.fgMuted, maxWidth: 460, marginTop: sp.base }}>
          {hero.sub}
        </p>
        <CtaButton label={hero.ctaLabel} theme={theme} />
      </div>
      <div style={{ borderRadius: FRAME_RADIUS, overflow: 'hidden', boxShadow: FRAME_SHADOW }}>
        <Photo photo={hero.photo} theme={theme} aspectRatio="4 / 3" />
      </div>
    </section>
  );
}

/** Featured selection — reads catalog rows. `grid3` = three up; `grid2` = two. */
export function FeaturedRegion({
  featured,
  products,
  theme,
  variant,
}: {
  featured: MainStreetContent['featured'];
  products: ProductView[];
  theme: ArchetypeTheme;
  variant: 'grid3' | 'grid2';
}) {
  const t = theme.type as unknown as MainStreetRoles;
  const sp = theme.spacing;
  const cols = variant === 'grid2' ? 2 : 3;
  const aspect = variant === 'grid2' ? '4 / 3' : '4 / 5';

  return (
    <section style={{ marginTop: sp.section }}>
      <h2 data-type="title" style={{ ...typeRoleCss(t.title), color: theme.palette.fg, marginBottom: sp.loose }}>
        {featured.title}
      </h2>
      <div
        className="ms-featured-grid"
        style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: sp.loose }}
      >
        {products.map((p, i) => (
          <a
            key={p.slug + i}
            href={`/shop/${p.slug}`}
            style={{
              color: theme.palette.fg,
              textDecoration: 'none',
              display: 'block',
              background: theme.palette.bg,
              border: `1px solid ${theme.palette.rule}`,
              borderRadius: FRAME_RADIUS,
              padding: sp.tight,
              boxShadow: FRAME_SHADOW,
            }}
          >
            <Photo photo={p.media[0] ?? { alt: p.name }} theme={theme} aspectRatio={aspect} radius={IMG_RADIUS} />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginTop: sp.tight,
                padding: `0 ${sp.tight}px ${sp.tight}px`,
                gap: sp.tight,
              }}
            >
              <span data-type="body" style={{ ...typeRoleCss(t.body), color: theme.palette.fg, fontWeight: 600 }}>
                {p.name}
              </span>
              <span data-type="price" style={{ ...typeRoleCss(t.price), color: theme.palette.fgMuted }}>
                {p.price}
              </span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

/** The maker. `dark` = the palette's pair inverted; `editorial` = light, face beside text. */
export function MakerRegion({
  maker,
  theme,
  variant,
}: {
  maker: MainStreetContent['maker'];
  theme: ArchetypeTheme;
  variant: 'dark' | 'editorial';
}) {
  const t = theme.type as unknown as MainStreetRoles;
  const sp = theme.spacing;
  const dark = variant === 'dark';
  const bg = dark ? theme.palette.fg : 'color-mix(in srgb, var(--ms-fg) 4%, var(--ms-bg))';
  const fg = dark ? theme.palette.bg : theme.palette.fg;
  const muted = dark
    ? 'color-mix(in srgb, var(--ms-bg) 72%, var(--ms-fg))'
    : theme.palette.fgMuted;

  return (
    <section
      style={{
        marginTop: sp.section,
        background: bg,
        color: fg,
        display: 'grid',
        gridTemplateColumns: 'minmax(220px, 0.8fr) 1.2fr',
        gap: sp.section,
        alignItems: 'center',
        padding: sp.section,
      }}
    >
      <div style={{ borderRadius: FRAME_RADIUS, overflow: 'hidden' }}>
        <Photo photo={maker.photo} theme={theme} aspectRatio="4 / 5" />
      </div>
      <div>
        <div data-type="label" style={{ ...typeRoleCss(t.label), color: theme.palette.accent }}>
          {maker.label}
        </div>
        <h2 data-type="makerHead" style={{ ...typeRoleCss(t.makerHead), color: fg, margin: `${sp.tight}px 0 ${sp.base}px` }}>
          {maker.headline}
        </h2>
        <p data-type="body" style={{ ...typeRoleCss(t.body), color: muted, maxWidth: 560, margin: 0 }}>
          {maker.body}
        </p>
        <a
          data-type="nav"
          href="/about"
          style={{ ...typeRoleCss(t.nav), display: 'inline-block', marginTop: sp.base, color: theme.palette.accent }}
        >
          {maker.ctaLabel} &rarr;
        </a>
      </div>
    </section>
  );
}

/** Optional supporting band — a note, what's new, where to find the maker. */
export function SecondaryRegion({
  secondary,
  theme,
}: {
  secondary: NonNullable<MainStreetContent['secondary']>;
  theme: ArchetypeTheme;
}) {
  const t = theme.type as unknown as MainStreetRoles;
  const sp = theme.spacing;
  return (
    <section
      style={{
        marginTop: sp.section,
        background: 'color-mix(in srgb, var(--ms-fg) 6%, var(--ms-bg))',
        padding: `${sp.loose}px ${sp.section}px`,
        display: 'flex',
        flexDirection: 'column',
        gap: sp.tight,
      }}
    >
      <div data-type="label" style={{ ...typeRoleCss(t.label), color: theme.palette.accent }}>
        {secondary.label}
      </div>
      <h2 data-type="title" style={{ ...typeRoleCss(t.title), color: theme.palette.fg, margin: 0 }}>
        {secondary.headline}
      </h2>
      <p data-type="body" style={{ ...typeRoleCss(t.body), color: theme.palette.fgMuted, maxWidth: 620, margin: 0 }}>
        {secondary.body}
      </p>
    </section>
  );
}

/** Optional email-capture beat. */
export function StayInTouchRegion({
  stayInTouch,
  theme,
}: {
  stayInTouch: NonNullable<MainStreetContent['stayInTouch']>;
  theme: ArchetypeTheme;
}) {
  const t = theme.type as unknown as MainStreetRoles;
  const sp = theme.spacing;
  return (
    <section style={{ marginTop: sp.section, textAlign: 'center', paddingTop: sp.loose }}>
      <h2 data-type="title" style={{ ...typeRoleCss(t.title), color: theme.palette.fg, margin: 0 }}>
        {stayInTouch.headline}
      </h2>
      <p data-type="body" style={{ ...typeRoleCss(t.body), color: theme.palette.fgMuted, maxWidth: 460, margin: `${sp.tight}px auto ${sp.base}px` }}>
        {stayInTouch.body}
      </p>
      <div style={{ display: 'inline-flex', gap: sp.tight, alignItems: 'stretch', flexWrap: 'wrap', justifyContent: 'center' }}>
        <span
          data-type="caption"
          style={{
            ...typeRoleCss(t.caption),
            color: theme.palette.fgMuted,
            border: `1px solid ${theme.palette.rule}`,
            background: theme.palette.bg,
            padding: '12px 16px',
            minWidth: 220,
            textAlign: 'left',
          }}
        >
          you@email.com
        </span>
        <span
          data-type="nav"
          style={{
            ...typeRoleCss(t.nav),
            background: theme.palette.accent,
            color: theme.palette.bg,
            padding: '12px 22px',
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          {stayInTouch.ctaLabel}
        </span>
      </div>
    </section>
  );
}
