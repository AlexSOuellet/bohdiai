/**
 * Main Street archetype — chrome, helpers, and region components.
 *
 * Built fresh off the archetype contract — not carried from another archetype.
 * The look is a warm, crafted storefront with editorial confidence: a keyline
 * frame like a shop window, paper grain, type set BIG, framed imagery, a dark
 * maker band for contrast, and a slow staggered reveal.
 *
 * No specifics are hardcoded: every color is the palette or a derivation, every
 * type value is a named role. Each region takes a `variant` so an arrangement
 * can request a treatment; the archetype wires which variant each arrangement
 * uses, so the family stays curated.
 */
import React from 'react';
import type { ArchetypeTheme, TypeRole } from '../types';
import type { ProductView } from '../content';
import type { MainStreetContent } from './schemas';
import { MAIN_STREET_FONT_HREFS } from './themes';

export interface MainStreetRoles {
  wordmark: TypeRole;
  heroHead: TypeRole;
  makerHead: TypeRole;
  title: TypeRole;
  sectionNo: TypeRole;
  tagline: TypeRole;
  nav: TypeRole;
  label: TypeRole;
  body: TypeRole;
  price: TypeRole;
  caption: TypeRole;
}

const IMG_RADIUS = 3;
const FRAME_SHADOW = '0 1px 2px rgba(0,0,0,0.06), 0 18px 40px rgba(0,0,0,0.12)';

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

export function fontHrefForTheme(theme: ArchetypeTheme): string {
  return MAIN_STREET_FONT_HREFS[theme.key] ?? MAIN_STREET_FONT_HREFS['main-street-hearth']!;
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
    /* paper grain — absolute so it scrolls with the page, not fixed over it */
    .arch-main-street .ms-grain { position: absolute; inset: 0; z-index: 0; pointer-events: none; opacity: 0.05; mix-blend-mode: multiply; background-image: ${atmosphere.grain ?? 'none'}; }
    .arch-main-street > .arch-stage { position: relative; z-index: 1; }
    /* fixed navbar — the site scrolls behind it */
    .arch-main-street .ms-head { position: sticky; top: 0; z-index: 30; background: ${palette.bg}; border-bottom: 1px solid ${palette.rule}; animation: none !important; opacity: 1 !important; transform: none !important; }

    .arch-main-street .archetype-photo { filter: ${atmosphere.photoFilter ?? 'none'}; display: block; width: 100%; height: 100%; object-fit: cover; }

    .arch-main-street a { color: var(--ms-accent); text-decoration: none; }

    @keyframes archMainStreetRise { from { opacity: 0; transform: translateY(22px); } to { opacity: 1; transform: translateY(0); } }
    .arch-main-street .arch-stage > * {
      opacity: 0;
      animation: archMainStreetRise ${motion.reveal.duration}ms ${motion.reveal.easing} forwards;
    }
    ${Array.from(
      { length: 12 },
      (_, i) =>
        `.arch-main-street .arch-stage > *:nth-child(${i + 1}) { animation-delay: ${i * motion.reveal.stagger}ms; }`,
    ).join('\n')}
    @media (prefers-reduced-motion: reduce) {
      .arch-main-street .arch-stage > * { animation: none; opacity: 1; transform: none; }
    }

    /* layout — in classes so it can respond (inline styles cannot) */
    .arch-main-street .ms-wrap { max-width: 1160px; margin-inline: auto; padding-inline: 48px; }
    .arch-main-street .ms-hero { display: grid; grid-template-columns: 1.05fr 0.95fr; gap: ${spacing.section}px; align-items: end; }
    .arch-main-street .ms-featgrid { display: grid; grid-template-columns: repeat(3, 1fr); gap: ${spacing.loose}px; }
    .arch-main-street .ms-featgrid.cols2 { grid-template-columns: repeat(2, 1fr); }
    .arch-main-street .ms-maker-inner { display: grid; grid-template-columns: 0.8fr 1.2fr; gap: ${spacing.section}px; align-items: center; }
    .arch-main-street .ms-footgrid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: ${spacing.loose}px; }
    @media (max-width: 860px) {
      .arch-main-street .ms-hero, .arch-main-street .ms-maker-inner { grid-template-columns: 1fr; gap: ${spacing.loose}px; }
      .arch-main-street .ms-featgrid, .arch-main-street .ms-featgrid.cols2 { grid-template-columns: repeat(2, 1fr); }
      .arch-main-street .ms-footgrid { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 560px) {
      .arch-main-street .ms-wrap { padding-inline: 22px; }
      .arch-main-street .ms-featgrid, .arch-main-street .ms-featgrid.cols2 { grid-template-columns: 1fr; }
      .arch-main-street .ms-footgrid { grid-template-columns: 1fr; }
    }
    ${responsive}
  `;
}

/** Root: fonts + compiled CSS + the keyline frame, grain, and staged column. */
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
        <div className="ms-grain" aria-hidden />
        <main className="arch-stage">{children}</main>
      </div>
    </>
  );
}

/** Photo or a graceful placeholder, sharing the archetype's grade. */
function Photo({
  photo,
  theme,
  aspectRatio,
  radius = IMG_RADIUS,
}: {
  photo: { url?: string | undefined; alt: string };
  theme: ArchetypeTheme;
  aspectRatio: string;
  radius?: number;
}) {
  if (photo.url) {
    return <img src={photo.url} alt={photo.alt} className="archetype-photo" style={{ aspectRatio, borderRadius: radius }} />;
  }
  return (
    <div
      className="archetype-photo"
      aria-label={photo.alt}
      style={{ aspectRatio, borderRadius: radius, background: theme.palette.fgMuted, opacity: 0.2 }}
    />
  );
}

/** Header: wordmark in the display face + nav. */
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
  const pad = variant === 'home' ? 18 : 14;
  return (
    <header className="ms-head">
      <div className="ms-wrap" style={{ paddingTop: pad, paddingBottom: pad, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: sp.base }}>
        <a href="/" data-type="wordmark" style={{ ...typeRoleCss(t.wordmark), color: theme.palette.fg }}>
          {identity.wordmark}
        </a>
        <nav style={{ display: 'flex', gap: 24, alignItems: 'baseline' }}>
          {identity.nav.map((item) => (
            <span key={item} data-type="nav" style={{ ...typeRoleCss(t.nav), color: theme.palette.fgMuted }}>
              {item}
            </span>
          ))}
          <a href="/cart" data-type="nav" style={{ ...typeRoleCss(t.nav), color: theme.palette.fg }}>
            Bag (0)
          </a>
        </nav>
      </div>
    </header>
  );
}

/** A primary CTA — ink on the inverted pair, always readable. */
function Cta({ label, theme, tone = 'ink' }: { label: string; theme: ArchetypeTheme; tone?: 'ink' | 'accent' }) {
  const t = theme.type as unknown as MainStreetRoles;
  return (
    <span
      data-type="nav"
      style={{
        ...typeRoleCss(t.nav),
        display: 'inline-block',
        background: tone === 'accent' ? theme.palette.accent : theme.palette.fg,
        color: theme.palette.bg,
        padding: '15px 26px',
        marginTop: theme.spacing.base + theme.spacing.tight,
      }}
    >
      {label}
    </span>
  );
}

/* ============================ REGIONS ============================ */

/** Hero. `bleed` = the big editorial hero; `band` = a tinted brand panel; `closer` = a quiet closing hero. */
export function HeroRegion({ hero, theme, variant }: { hero: MainStreetContent['hero']; theme: ArchetypeTheme; variant: 'bleed' | 'band' | 'closer' }) {
  const t = theme.type as unknown as MainStreetRoles;
  const sp = theme.spacing;

  if (variant === 'band') {
    return (
      <section className="ms-wrap" style={{ marginTop: sp.section }}>
        <div style={{ background: 'color-mix(in srgb, var(--ms-accent) 12%, var(--ms-bg))', padding: `${sp.section}px ${sp.loose}px`, textAlign: 'center' }}>
          <h2 data-type="heroHead" style={{ ...typeRoleCss(t.heroHead), color: theme.palette.fg, margin: 0, maxWidth: '14ch', marginInline: 'auto' }}>{hero.headline}</h2>
          <p data-type="body" style={{ ...typeRoleCss(t.body), color: theme.palette.fgMuted, maxWidth: '40ch', margin: `${sp.base}px auto 0` }}>{hero.sub}</p>
          <Cta label={hero.ctaLabel} theme={theme} />
        </div>
      </section>
    );
  }

  if (variant === 'closer') {
    return (
      <section className="ms-wrap" style={{ marginTop: sp.section, textAlign: 'center', paddingTop: sp.loose, borderTop: `1px solid ${theme.palette.rule}` }}>
        <h2 data-type="title" style={{ ...typeRoleCss(t.title), color: theme.palette.fg, margin: 0 }}>{hero.headline}</h2>
        <p data-type="body" style={{ ...typeRoleCss(t.body), color: theme.palette.fgMuted, maxWidth: '40ch', margin: `${sp.tight}px auto 0` }}>{hero.sub}</p>
        <Cta label={hero.ctaLabel} theme={theme} />
      </section>
    );
  }

  // bleed — the big editorial hero: oversized headline left, framed image right.
  return (
    <section className="ms-wrap ms-hero" style={{ marginTop: sp.base, paddingBottom: sp.section }}>
      <div>
        <h1 data-type="heroHead" style={{ ...typeRoleCss(t.heroHead), color: theme.palette.fg, margin: 0, maxWidth: '12ch' }}>{hero.headline}</h1>
        <p data-type="body" style={{ ...typeRoleCss(t.body), color: theme.palette.fgMuted, maxWidth: '34ch', marginTop: sp.loose }}>{hero.sub}</p>
        <Cta label={hero.ctaLabel} theme={theme} />
      </div>
      <div style={{ position: 'relative', borderRadius: IMG_RADIUS, overflow: 'hidden', boxShadow: FRAME_SHADOW }}>
        <Photo photo={hero.photo} theme={theme} aspectRatio="4 / 5" radius={0} />
      </div>
    </section>
  );
}

/** Featured selection — numbered section head, framed cards on a recessed panel. */
export function FeaturedRegion({ featured, products, theme, variant }: { featured: MainStreetContent['featured']; products: ProductView[]; theme: ArchetypeTheme; variant: 'grid3' | 'grid2' }) {
  const t = theme.type as unknown as MainStreetRoles;
  const sp = theme.spacing;
  const cols = variant === 'grid2' ? 2 : 3;

  return (
    <section className="ms-wrap" style={{ marginTop: sp.section }}>
      <h2 data-type="title" style={{ ...typeRoleCss(t.title), color: theme.palette.fg, margin: `0 0 ${sp.loose}px` }}>{featured.title}</h2>
      <div style={{ background: 'color-mix(in srgb, var(--ms-fg) 7%, var(--ms-bg))', padding: sp.loose }}>
        <div className={`ms-featgrid${cols === 2 ? ' cols2' : ''}`}>
          {products.map((p, i) => (
            <a key={p.slug + i} href={`/shop/${p.slug}`} style={{ display: 'block', background: theme.palette.bg, padding: sp.tight, boxShadow: FRAME_SHADOW, color: theme.palette.fg }}>
              <Photo photo={p.media[0] ?? { alt: p.name }} theme={theme} aspectRatio="4 / 5" />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: `${sp.tight}px ${sp.tight}px 0`, gap: sp.tight }}>
                <span data-type="title" style={{ ...typeRoleCss(t.title), fontSize: 21, color: theme.palette.fg }}>{p.name}</span>
                <span data-type="price" style={{ ...typeRoleCss(t.price), color: theme.palette.accent }}>{p.price}</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

/** The maker. `dark` = a full-bleed espresso band (the inverted pair); `editorial` = light, face beside text. */
export function MakerRegion({ maker, theme, variant }: { maker: MainStreetContent['maker']; theme: ArchetypeTheme; variant: 'dark' | 'editorial' }) {
  const t = theme.type as unknown as MainStreetRoles;
  const sp = theme.spacing;
  const dark = variant === 'dark';
  const bg = dark ? theme.palette.fg : 'color-mix(in srgb, var(--ms-fg) 5%, var(--ms-bg))';
  const fg = dark ? theme.palette.bg : theme.palette.fg;
  const muted = dark ? 'color-mix(in srgb, var(--ms-bg) 72%, var(--ms-fg))' : theme.palette.fgMuted;
  const accent = dark ? 'color-mix(in srgb, var(--ms-accent) 60%, var(--ms-bg))' : theme.palette.accent;

  return (
    <section style={{ marginTop: sp.section, background: bg, color: fg }}>
      <div className="ms-wrap ms-maker-inner" style={{ paddingTop: sp.section, paddingBottom: sp.section }}>
        <div style={{ borderRadius: IMG_RADIUS, overflow: 'hidden' }}>
          <Photo photo={maker.photo} theme={theme} aspectRatio="4 / 5" />
        </div>
        <div>
          <div data-type="label" style={{ ...typeRoleCss(t.label), color: accent }}>{maker.label}</div>
          <h2 data-type="makerHead" style={{ ...typeRoleCss(t.makerHead), color: fg, margin: `${sp.tight}px 0 ${sp.base}px` }}>{maker.headline}</h2>
          <p data-type="body" style={{ ...typeRoleCss(t.body), color: muted, maxWidth: '50ch', margin: 0 }}>{maker.body}</p>
          <a data-type="nav" href="/about" style={{ ...typeRoleCss(t.nav), display: 'inline-block', marginTop: sp.base, color: accent, borderBottom: `1px solid ${accent}`, paddingBottom: 4 }}>{maker.ctaLabel} &rarr;</a>
        </div>
      </div>
    </section>
  );
}

/** Optional supporting band — a single ruled strip. */
export function SecondaryRegion({ secondary, theme }: { secondary: NonNullable<MainStreetContent['secondary']>; theme: ArchetypeTheme }) {
  const t = theme.type as unknown as MainStreetRoles;
  const sp = theme.spacing;
  return (
    <section className="ms-wrap" style={{ marginTop: sp.section }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: sp.base, borderTop: `1px solid ${theme.palette.rule}`, borderBottom: `1px solid ${theme.palette.rule}`, padding: `${sp.loose}px 0` }}>
        <span data-type="title" style={{ ...typeRoleCss(t.title), color: theme.palette.fg }}>{secondary.headline}</span>
        <span data-type="body" style={{ ...typeRoleCss(t.body), color: theme.palette.fgMuted, maxWidth: '46ch' }}>
          <span data-type="label" style={{ ...typeRoleCss(t.label), color: theme.palette.accent, marginRight: sp.tight }}>{secondary.label}</span>
          {secondary.body}
        </span>
      </div>
    </section>
  );
}

/** Optional email-capture beat. */
export function StayInTouchRegion({ stayInTouch, theme }: { stayInTouch: NonNullable<MainStreetContent['stayInTouch']>; theme: ArchetypeTheme }) {
  const t = theme.type as unknown as MainStreetRoles;
  const sp = theme.spacing;
  return (
    <section className="ms-wrap" style={{ marginTop: sp.section, textAlign: 'center' }}>
      <h2 data-type="title" style={{ ...typeRoleCss(t.title), color: theme.palette.fg, margin: 0 }}>{stayInTouch.headline}</h2>
      <p data-type="body" style={{ ...typeRoleCss(t.body), color: theme.palette.fgMuted, maxWidth: '40ch', margin: `${sp.tight}px auto 0` }}>{stayInTouch.body}</p>
      <div style={{ display: 'inline-flex', marginTop: sp.loose, border: `1px solid ${theme.palette.fg}` }}>
        <span data-type="caption" style={{ ...typeRoleCss(t.caption), color: theme.palette.fgMuted, padding: '14px 18px', minWidth: 220, textAlign: 'left' }}>you@email.com</span>
        <span data-type="nav" style={{ ...typeRoleCss(t.nav), background: theme.palette.accent, color: theme.palette.bg, padding: '0 22px', display: 'inline-flex', alignItems: 'center' }}>{stayInTouch.ctaLabel}</span>
      </div>
    </section>
  );
}

/** Footer: brand + blurb, columns, and the platform-guaranteed legal row. */
export function MainStreetFooter({ shopName, footer, theme }: { shopName: string; footer: MainStreetContent['footer']; theme: ArchetypeTheme }) {
  const t = theme.type as unknown as MainStreetRoles;
  const sp = theme.spacing;
  return (
    <footer style={{ marginTop: sp.section, background: 'color-mix(in srgb, var(--ms-fg) 7%, var(--ms-bg))', paddingTop: sp.section, paddingBottom: sp.loose }}>
      <div className="ms-wrap">
        <div className="ms-footgrid">
          <div>
            <div data-type="title" style={{ ...typeRoleCss(t.title), color: theme.palette.fg }}>{shopName}</div>
            <p data-type="caption" style={{ ...typeRoleCss(t.caption), color: theme.palette.fgMuted, marginTop: sp.tight, maxWidth: '32ch' }}>{footer.blurb}</p>
          </div>
          {footer.columns.map((col, i) => (
            <div key={col.title + i}>
              <div data-type="label" style={{ ...typeRoleCss(t.label), color: theme.palette.fg }}>{col.title}</div>
              <div style={{ marginTop: sp.base, display: 'flex', flexDirection: 'column', gap: sp.tight }}>
                {col.items.map((item) => (
                  <span key={item} data-type="caption" style={{ ...typeRoleCss(t.caption), color: theme.palette.fgMuted }}>{item}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: sp.base, marginTop: sp.section, paddingTop: sp.base, borderTop: `1px solid ${theme.palette.rule}` }}>
          <div style={{ display: 'flex', gap: sp.loose }}>
            <a href="/" data-type="caption" style={{ ...typeRoleCss(t.caption) }}>Home</a>
            <a href="/privacy" data-type="caption" style={{ ...typeRoleCss(t.caption) }}>Privacy</a>
            <a href="/terms" data-type="caption" style={{ ...typeRoleCss(t.caption) }}>Terms</a>
          </div>
          <span data-type="caption" style={{ ...typeRoleCss(t.caption), color: theme.palette.fgMuted }}>&copy; {shopName}</span>
        </div>
      </div>
    </footer>
  );
}
