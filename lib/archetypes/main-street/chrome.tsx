/**
 * Main Street — chrome: the skin→CSS bridge and the shared shell.
 *
 * Owns the one place a skin's values become CSS: `skinVarsCss` emits every
 * color (both surfaces) and every font voice as a `--ms-*` custom property
 * scoped to `.arch-main-street`, plus the structural CSS (grain, scroll reveal,
 * the goods marquee, responsive rules). The beats then reference vars and
 * `color-mix` derivations — never literals. Structure only; no niche words.
 */
import React from 'react';
import Link from 'next/link';
import type { ArchetypeTheme, TypeRole } from '../types';
import type { MainStreetContent, NavEntry, NavItem } from './schemas';
import { MAIN_STREET_FONT_HREFS, type MainStreetRoles } from './skins';
import { LINK_TARGETS, linkHref, type LinkTarget } from './links';
import { MainStreetMobileNav } from './MobileNav';
import { IntroReplayLink } from './IntroReplayLink';

export { LINK_TARGETS, linkHref, type LinkTarget };

// Fluid type: the viewport band over which a size scales from its mobile floor
// up to its full desktop value.
const FLUID_MIN_VW = 360;
const FLUID_MAX_VW = 1280;

/**
 * Turn a fixed desktop font size (px) into a fluid `clamp()` that scales DOWN on
 * narrow screens. Big display type shrinks a lot; body and small labels barely
 * move (the shrink factor eases from ~0.45 at display scale to ~0.95 at caption
 * scale). Emitted INLINE — clamp works inline, which sidesteps the inline-vs-
 * stylesheet precedence that made the old per-skin `sizeMobile` @media override
 * ineffective. When a skin declares `sizeMobile`, it becomes the explicit floor.
 */
export function fluidFontSize(size: number, sizeMobile?: number): string {
  const max = size;
  const factor = Math.min(0.95, Math.max(0.45, 0.45 + 0.5 * (1 - (size - 12) / 72)));
  const min = sizeMobile ?? Math.round(size * factor);
  if (max <= min) return `${max}px`;
  const slope = (max - min) / (FLUID_MAX_VW - FLUID_MIN_VW);
  const intercept = Math.round((min - slope * FLUID_MIN_VW) * 100) / 100;
  const vw = Math.round(slope * 100 * 1000) / 1000;
  return `clamp(${min}px, ${intercept}px + ${vw}vw, ${max}px)`;
}

export function typeRoleCss(role: TypeRole): React.CSSProperties {
  return {
    fontFamily: role.family,
    fontSize: fluidFontSize(role.size, role.sizeMobile),
    fontWeight: role.weight,
    lineHeight: role.lineHeight,
    letterSpacing: role.letterSpacing,
    fontStyle: role.italic ? 'italic' : undefined,
    textTransform: role.uppercase ? 'uppercase' : undefined,
    fontVariationSettings: role.variationSettings,
  };
}

export function fontHref(skin: ArchetypeTheme): string {
  return MAIN_STREET_FONT_HREFS[skin.key] ?? Object.values(MAIN_STREET_FONT_HREFS)[0]!;
}

export function roles(skin: ArchetypeTheme): MainStreetRoles {
  return skin.type as unknown as MainStreetRoles;
}

export function skinVarsCss(skin: ArchetypeTheme): string {
  const p = skin.palette;
  const c = p.contrast ?? { bg: p.fg, fg: p.bg, fgMuted: p.fgMuted };
  const sp = skin.spacing;
  const a = skin.atmosphere;
  const mo = skin.motion;
  const r = roles(skin);
  // Type sizes are fluid at the source (see fluidFontSize) — emitted inline as
  // clamp(), so no per-role mobile @media overrides are needed here.
  return `
    .arch-main-street{
      --ms-bg:${p.bg};--ms-fg:${p.fg};--ms-fg-muted:${p.fgMuted};--ms-accent:${p.accent};--ms-on-accent:${p.onAccent ?? p.bg};--ms-rule:${p.rule};
      --ms-contrast-bg:${c.bg};--ms-contrast-fg:${c.fg};--ms-contrast-fg-muted:${c.fgMuted};
      /* on-media: a fixed, skin-agnostic near-white for text painted OVER hero
         media. The video's luminance is unknown and a skin's contrast surface
         can itself be light, so over-media text never reads from the skin — it
         reads from these legibility tokens (the scrim guarantees a dark backdrop). */
      --ms-on-media:#F7F5F2;--ms-on-media-muted:rgba(247,245,242,.74);
      --ms-disp:${r.brand.family};--ms-body:${r.body.family};--ms-mono:${r.eyebrow.family};
      --ms-section:${sp.section}px;--ms-loose:${sp.loose}px;--ms-base:${sp.base}px;--ms-tight:${sp.tight}px;
      background:var(--ms-bg);color:var(--ms-fg);position:relative;isolation:isolate;min-height:100vh;
      font-family:var(--ms-body);line-height:1.6;
    }
    .arch-main-street a{color:var(--ms-accent);text-decoration:none}
    /* logo lockup — the logo is bare: no plate. Contrast is guaranteed by the
       header surface itself (navContrast in SubHeader / MomentHero). */
    .arch-main-street [data-ms-logo]{height:52px;width:auto}
    @media(max-width:768px){.arch-main-street [data-ms-logo]{height:40px}}
    .arch-main-street .ms-grain{position:fixed;inset:0;z-index:60;pointer-events:none;opacity:.05;mix-blend-mode:multiply;background-image:${a.grain ?? 'none'}}
    .arch-main-street .archetype-photo{filter:${a.photoFilter ?? 'none'};display:block;width:100%;height:100%;object-fit:cover}
    .arch-main-street .ms-wrap{max-width:1200px;margin-inline:auto;padding-inline:40px}
    @media(max-width:860px){.arch-main-street .ms-wrap{padding-inline:20px}}
    /* Header nav: full link row on desktop, a menu button + full-screen overlay
       on phones. The breakpoint hides one and shows the other; the overlay reads
       the skin's own --ms-* vars so it matches the store. */
    .arch-main-street .ms-nav-links{display:flex;gap:30px;align-items:center}
    .arch-main-street .ms-nav-toggle{display:none}
    @media(max-width:640px){
      .arch-main-street .ms-nav-links{display:none}
      .arch-main-street .ms-nav-toggle{display:inline-flex}
    }
    .arch-main-street .ms-burger{background:none;border:0;color:inherit;cursor:pointer;padding:8px;display:inline-flex;flex-direction:column;gap:5px}
    .arch-main-street .ms-burger-line{display:block;width:24px;height:2px;background:currentColor}
    .arch-main-street .ms-mobile-overlay{position:fixed;inset:0;z-index:100;background:var(--ms-bg);color:var(--ms-fg);display:flex;flex-direction:column;justify-content:center;align-items:center;animation:ms-overlay-in .4s ${mo.reveal.easing}}
    @keyframes ms-overlay-in{from{opacity:0}to{opacity:1}}
    .arch-main-street .ms-burger-close{position:absolute;top:20px;right:24px;width:34px;height:34px;background:none;border:0;color:inherit;cursor:pointer;display:inline-flex;align-items:center;justify-content:center}
    .arch-main-street .ms-burger-x{position:absolute;width:26px;height:2px;background:currentColor}
    .arch-main-street .ms-burger-x:first-child{transform:rotate(45deg)}
    .arch-main-street .ms-burger-x:last-child{transform:rotate(-45deg)}
    .arch-main-street .ms-mobile-links{display:flex;flex-direction:column;gap:6px;text-align:center}
    .arch-main-street .ms-mobile-links a{color:inherit;font-family:var(--ms-disp);font-size:clamp(30px,9vw,46px);line-height:1.18;letter-spacing:.01em;opacity:0;transform:translateY(14px);animation:ms-link-in .55s ${mo.reveal.easing} forwards}
    @keyframes ms-link-in{to{opacity:1;transform:none}}
    @media(prefers-reduced-motion:reduce){
      .arch-main-street .ms-mobile-overlay{animation:none}
      .arch-main-street .ms-mobile-links a{animation:none;opacity:1;transform:none}
    }
    /* Sub-page <main> sits under the fixed SubHeader; pad it down by the nav height. */
    .arch-main-street .ms-subpage-main{padding-top:80px}
    @media(max-width:768px){.arch-main-street .ms-subpage-main{padding-top:68px}}
    /* scroll reveal — arrives once, resolves to stillness */
    .arch-main-street .ms-reveal{opacity:0;transform:translateY(30px);transition:opacity 1.1s ${mo.reveal.easing},transform 1.1s ${mo.reveal.easing}}
    .arch-main-street .ms-reveal.in{opacity:1;transform:none}
    .arch-main-street .ms-reveal.d1{transition-delay:.12s}
    /* goods marquee — slow, edge-to-edge, pauses on hover */
    .arch-main-street .ms-marquee{animation:ms-scroll 38s linear infinite}
    .arch-main-street .ms-marquee:hover{animation-play-state:paused}
    @keyframes ms-scroll{to{transform:translateX(-50%)}}
    /* goods switcher — image cross-fades as you point down the list */
    .arch-main-street .ms-switch-layer{transition:opacity .7s ${mo.reveal.easing}}
    .arch-main-street .ms-switch-list{justify-content:center}
    .arch-main-street .ms-switch-list li:last-child{border-bottom:1px solid var(--ms-rule)}
    /* goods slideshow — cross-fade + a slow Ken Burns pull-BACK on the live slide.
       The camera reveals the composition rather than investigating into it: tight
       maker shots land on the photographer's intended frame, AI-generated wides do
       the same. Inverting "push in" was the Session 41 fix. */
    .arch-main-street .ms-slide-layer{transition:opacity 0.8s ${mo.reveal.easing}}
    .arch-main-street .ms-kb{animation:ms-kenburns 6.5s ${mo.reveal.easing} forwards}
    @keyframes ms-kenburns{from{transform:scale(1.075) translateY(-1.2%)}to{transform:scale(1.005)}}
    /* goods procession — a CONSTELLATION: scattered cards that each fade in once
       (random order, staggered via an inline transition-delay) and then rest. */
    .arch-main-street .ms-const-card{opacity:0;transform:translateY(34px) scale(.965);transition:opacity 1.5s ${mo.reveal.easing},transform 1.6s ${mo.reveal.easing}}
    .arch-main-street .ms-const-stage.in .ms-const-card{opacity:1;transform:none}
    /* product detail — two columns that stack on small screens */
    .arch-main-street .ms-product-grid{display:grid;grid-template-columns:1.1fr 0.9fr;gap:var(--ms-section);align-items:start}
    @media(max-width:768px){
      .arch-main-street .ms-product-grid{grid-template-columns:1fr;gap:28px}
      .arch-main-street [data-ms-nav]{padding-left:20px!important;padding-right:20px!important}
    }
    @media(max-width:860px){
      .arch-main-street .ms-founder-grid{grid-template-columns:1fr!important;gap:36px!important}
      .arch-main-street .ms-founder-findus{grid-template-columns:1fr!important;gap:40px!important}
      .arch-main-street .ms-marquee [data-ms-card]{width:74vw}
      .arch-main-street .ms-switch-grid{grid-template-columns:1fr!important;gap:32px!important}
      /* the constellation goes vertical on a phone — a designed drift, not a
         dead stack: cards hug left then right, vary in width, and overlap. */
      .arch-main-street .ms-const-stage{aspect-ratio:auto!important;height:auto!important;display:flex;flex-direction:column}
      .arch-main-street .ms-const-card{position:static!important;left:auto!important;top:auto!important;rotate:0!important}
      .arch-main-street .ms-const-card:nth-child(1){width:80%!important;align-self:flex-start}
      .arch-main-street .ms-const-card:nth-child(2){width:64%!important;align-self:flex-end;margin-top:-7%}
      .arch-main-street .ms-const-card:nth-child(3){width:88%!important;align-self:flex-start;margin-top:-3%}
      .arch-main-street .ms-const-card:nth-child(4){width:58%!important;align-self:flex-end;margin-top:-9%}
      .arch-main-street .ms-const-card:nth-child(5){width:74%!important;align-self:flex-start;margin-top:-2%}
      .arch-main-street .ms-catalog-grid{grid-template-columns:repeat(2,1fr)!important}
    }
    @media(max-width:560px){
      .arch-main-street .ms-catalog-grid{grid-template-columns:1fr!important}
    }
    @media(prefers-reduced-motion:reduce){
      .arch-main-street .ms-reveal{opacity:1;transform:none;transition:none}
      .arch-main-street .ms-marquee{animation:none}
      .arch-main-street .ms-kb{animation:none}
      .arch-main-street .ms-const-card{opacity:1;transform:none;transition:none}
    }
    /* Overflow discipline (D57). The schema no longer caps string length — the
       build never fails on copy on ANY field — so the renderer carries visual
       restraint. Each type role gets the strategy that fits its slot: nav and
       button labels stay one line and ellipsis at a sane max; story lines and
       card lines line-clamp; display headlines wrap with a max-width so they
       can grow without breaking layout; body prose wraps naturally with a
       comfortable measure. */
    .arch-main-street [data-type="navLabel"]{max-width:240px;display:inline-block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;vertical-align:middle}
    .arch-main-street [data-type="wordmark"]{max-width:360px;display:inline-block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;vertical-align:middle}
    .arch-main-street [data-type="eyebrow"]{display:inline-block;max-width:60ch;overflow-wrap:break-word}
    .arch-main-street [data-type="storyline"]{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:break-word;max-width:24ch;margin-inline:auto}
    .arch-main-street [data-type="cardTitle"]{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:break-word}
    .arch-main-street [data-type="caption"]{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:break-word}
    .arch-main-street [data-type="brand"]{max-width:18ch;margin-inline:auto;overflow-wrap:break-word}
    .arch-main-street [data-type="goodsHead"]{max-width:24ch;overflow-wrap:break-word}
    .arch-main-street [data-type="closeHead"]{max-width:22ch;margin-inline:auto;overflow-wrap:break-word}
    .arch-main-street [data-type="title"]{max-width:30ch;overflow-wrap:break-word}
    .arch-main-street [data-type="quote"]{max-width:62ch;overflow-wrap:break-word}
    .arch-main-street [data-type="body"]{max-width:70ch;overflow-wrap:break-word}
    .arch-main-street [data-type="sig"]{display:inline-block;max-width:32ch;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;vertical-align:middle}
    .arch-main-street [data-type="price"]{white-space:nowrap}
    .arch-main-street [data-type="day"]{white-space:nowrap}
    .arch-main-street [data-type="where"]{display:inline-block;max-width:38ch;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;vertical-align:middle}
    .arch-main-street [data-type="legal"]{white-space:nowrap}
  `;
}

export function MainStreetRoot({ skin, children }: { skin: ArchetypeTheme; children: React.ReactNode }) {
  return (
    <>
      <link rel="stylesheet" href={fontHref(skin)} />
      <style dangerouslySetInnerHTML={{ __html: skinVarsCss(skin) }} />
      <div className="arch-main-street">
        <div className="ms-grain" aria-hidden />
        {children}
      </div>
    </>
  );
}

export function Media({
  media,
  className,
  style,
}: {
  media: { kind?: 'video' | 'image' | 'still'; url?: string | undefined; poster?: string | undefined; alt: string };
  className?: string;
  style?: React.CSSProperties;
}) {
  const cls = ['archetype-photo', className].filter(Boolean).join(' ');
  if (media.kind === 'video' && media.url) {
    return (
      <video className={cls} style={style} src={media.url} poster={media.poster} autoPlay loop muted playsInline aria-label={media.alt} />
    );
  }
  if (media.url) return <img className={cls} style={style} src={media.url} alt={media.alt} />;
  return <div className={cls} aria-label={media.alt} style={{ ...style, background: 'var(--ms-fg-muted)', opacity: 0.18 }} />;
}

/** The fallback nav — real routes used when a tenant has no authored nav (legacy
 *  rows, or any row whose nav predates authored targets). Shared by the home hero
 *  nav and every sub-page header. New builds author their own nav (D46). */
export const MAIN_STREET_NAV: ReadonlyArray<{ href: string; label: string }> = [
  { href: '/shop', label: 'Shop' },
  { href: '/about', label: 'About' },
  { href: '/events', label: 'Events' },
  { href: '/contact', label: 'Contact' },
];

/** Turn the authored nav entries into real `{ href, label }` links. The maker's
 *  authored nav is used verbatim (D46), each label pointed at its target's route.
 *  A nav that is legacy strings (labels that never carried a destination) or empty
 *  falls back to the platform's fixed nav, so old stored rows render unchanged. */
export function resolveNav(nav: ReadonlyArray<NavEntry>): ReadonlyArray<{ href: string; label: string }> {
  const authored = nav.filter((n): n is NavItem => typeof n === 'object');
  if (authored.length > 0 && authored.length === nav.length) {
    return authored.map((n) => ({ href: linkHref(n.target), label: n.label }));
  }
  return MAIN_STREET_NAV;
}

/** The brand lockup in a header. When the maker has uploaded a logo (a dashboard
 *  task post-launch), it sits ALONGSIDE the typographic wordmark — a true lockup,
 *  not a replacement. With no logo, the wordmark stands alone. The header surface
 *  guarantees logo contrast (via navContrast in SubHeader / MomentHero); no plate. */
export function WordmarkLink({
  wordmark,
  logoUrl,
  role,
}: {
  wordmark: string;
  logoUrl?: string | undefined;
  role: TypeRole;
}) {
  return (
    <Link href="/" data-type="wordmark" style={{ ...typeRoleCss(role), color: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 14 }}>
      {logoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt="" data-ms-logo style={{ display: 'block' }} />
      )}
      <span>{wordmark}</span>
    </Link>
  );
}

export function Nav({ identity, skin }: { identity: MainStreetContent['identity']; skin: ArchetypeTheme }) {
  const r = roles(skin);
  const items = resolveNav(identity.nav);
  const allItems = [...items, { href: '/cart', label: 'Cart' }];
  return (
    <>
      <WordmarkLink wordmark={identity.wordmark} logoUrl={identity.logoUrl} role={r.wordmark} />
      <div className="ms-nav-links">
        {allItems.map((item) => (
          <a key={item.href} href={item.href} data-type="navLabel" style={{ ...typeRoleCss(r.navLabel), color: 'inherit', opacity: 0.85 }}>
            {item.label}
          </a>
        ))}
      </div>
      <MainStreetMobileNav items={allItems} />
    </>
  );
}

export function MainStreetFooter({ shopName, skin }: { shopName: string; skin: ArchetypeTheme }) {
  const r = roles(skin);
  return (
    <footer
      style={{
        background: 'var(--ms-contrast-bg)',
        color: 'var(--ms-contrast-fg)',
        padding: '54px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 20,
      }}
    >
      <span data-type="wordmark" style={{ ...typeRoleCss(r.wordmark) }}>
        {shopName}
      </span>
      <div style={{ display: 'flex', gap: 20, alignItems: 'baseline' }}>
        <Link href="/" data-type="legal" style={{ ...typeRoleCss(r.legal), color: 'inherit', opacity: 0.6 }}>
          Home
        </Link>
        <IntroReplayLink style={{ ...typeRoleCss(r.legal), color: 'inherit', opacity: 0.6 }}>
          Intro
        </IntroReplayLink>
        <a href="/privacy" data-type="legal" style={{ ...typeRoleCss(r.legal), color: 'inherit', opacity: 0.6 }}>
          Privacy
        </a>
        <a href="/terms" data-type="legal" style={{ ...typeRoleCss(r.legal), color: 'inherit', opacity: 0.6 }}>
          Terms
        </a>
        <span data-type="legal" style={{ ...typeRoleCss(r.legal), opacity: 0.5 }}>
          &copy; {shopName}
        </span>
      </div>
    </footer>
  );
}
