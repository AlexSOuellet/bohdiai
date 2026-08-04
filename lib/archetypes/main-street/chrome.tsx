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
import type { MainStreetContent } from './schemas';
import { MAIN_STREET_FONT_HREFS, type MainStreetRoles } from './skins';
import { LINK_TARGETS, linkHref, type LinkTarget } from './links';
import { MainStreetMobileNav } from './MobileNav';
import { IntroReplayLink } from './IntroReplayLink';
import { Type } from './Type';
import { DEFAULT_STRINGS } from './defaults';
import { relativeLuminance } from './logo-contrast';

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

/**
 * @deprecated Do NOT use in archetype code. Type is now declarative: render text
 * with the `Type` component (`<Type role="brand" as="h1">`), which the per-role
 * CSS in `skinVarsCss` paints from `--ms-t-*` variables. Inline type can't do
 * media queries and wins specificity by brute force (the old editorial-masthead
 * dead-CSS bug). Only the `app/archetype-test/*` dev-preview pages still call this
 * pending their delete-or-gate decision; it gets removed when they do.
 */
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

/**
 * Emit a skin's type system as CSS — variables on the root plus one base rule per
 * role keyed off the `data-type` hook the `Type` component stamps. This is the
 * one place a skin's type becomes CSS (the color/font-voice analogue of the
 * `--ms-*` vars). Sizes are the same fluid `clamp()` `typeRoleCss` used, so type
 * still shrinks on narrow screens — but from the stylesheet now, where the
 * cascade and media queries work, instead of inline where they don't.
 */
function typeRoleVarDecls(roles: Record<string, TypeRole>): string {
  return Object.entries(roles)
    .map(([name, role]) =>
      [
        `--ms-t-${name}-family:${role.family};`,
        `--ms-t-${name}-size:${fluidFontSize(role.size, role.sizeMobile)};`,
        `--ms-t-${name}-weight:${role.weight};`,
        `--ms-t-${name}-line:${role.lineHeight};`,
        `--ms-t-${name}-tracking:${role.letterSpacing ?? 'normal'};`,
        `--ms-t-${name}-style:${role.italic ? 'italic' : 'normal'};`,
        `--ms-t-${name}-transform:${role.uppercase ? 'uppercase' : 'none'};`,
        role.variationSettings ? `--ms-t-${name}-vsettings:${role.variationSettings};` : '',
      ].join(''),
    )
    .join('');
}

function typeRoleBaseRules(roles: Record<string, TypeRole>): string {
  return Object.keys(roles)
    .map(
      (name) =>
        `.arch-main-street [data-type="${name}"]{` +
        `font-family:var(--ms-t-${name}-family);` +
        `font-size:var(--ms-t-${name}-size);` +
        `font-weight:var(--ms-t-${name}-weight);` +
        `line-height:var(--ms-t-${name}-line);` +
        `letter-spacing:var(--ms-t-${name}-tracking);` +
        `font-style:var(--ms-t-${name}-style);` +
        `text-transform:var(--ms-t-${name}-transform);` +
        `font-variation-settings:var(--ms-t-${name}-vsettings,normal);}`,
    )
    .join('');
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
  // Drop-shadow token. A black shadow vanishes on a dark surface, so its strength
  // tracks the skin's background luminance — subtle on light skins, much stronger
  // on dark ones — keeping tactile depth (the table prints, the lookbook images)
  // readable on every skin. One token; treatments never hardcode a shadow color.
  const shadow = relativeLuminance(p.bg) <= 0.5 ? 'rgba(0,0,0,.52)' : 'rgba(0,0,0,.20)';
  // Type sizes are fluid at the source (see fluidFontSize) — emitted inline as
  // clamp(), so no per-role mobile @media overrides are needed here.
  return `
    .arch-main-street{
      --ms-bg:${p.bg};--ms-fg:${p.fg};--ms-fg-muted:${p.fgMuted};--ms-accent:${p.accent};--ms-on-accent:${p.onAccent ?? p.bg};--ms-rule:${p.rule};
      --ms-shadow:${shadow};
      --ms-contrast-bg:${c.bg};--ms-contrast-fg:${c.fg};--ms-contrast-fg-muted:${c.fgMuted};
      /* on-media: a fixed, skin-agnostic near-white for text painted OVER hero
         media. The video's luminance is unknown and a skin's contrast surface
         can itself be light, so over-media text never reads from the skin — it
         reads from these legibility tokens (the scrim guarantees a dark backdrop). */
      --ms-on-media:#F7F5F2;--ms-on-media-muted:rgba(247,245,242,.74);
      --ms-disp:${r.brand.family};--ms-body:${r.body.family};--ms-mono:${r.eyebrow.family};
      --ms-section:${sp.section}px;--ms-loose:${sp.loose}px;--ms-base:${sp.base}px;--ms-tight:${sp.tight}px;
      ${typeRoleVarDecls(skin.type)}
      background:var(--ms-bg);color:var(--ms-fg);position:relative;isolation:isolate;min-height:100vh;
      font-family:var(--ms-body);line-height:1.6;
    }
    /* Type system — each role's font, driven by the --ms-t-* vars above. The
       Type component stamps data-type; these rules paint it. A component that
       AMPLIFIES a role (the editorial masthead, an italic letter quote) writes a
       more specific scoped rule against the same [data-type] hook — a real rule,
       so it can use media queries and the cascade, never inline. */
    ${typeRoleBaseRules(skin.type)}
    /* Treatment type accents — skin-agnostic, scoped to a treatment's own class
       so they win over the base role rule without any inline style. */
    .arch-main-street .ms-founder-card [data-type="quote"]{font-style:italic}
    .arch-main-street a{color:var(--ms-accent);text-decoration:none}
    /* logo lockup — the logo is bare: no plate. Contrast is guaranteed by the
       header surface itself (navContrast in SubHeader / MomentHero). */
    .arch-main-street [data-ms-logo]{height:52px;width:auto}
    @media(max-width:768px){.arch-main-street [data-ms-logo]{height:40px}}
    .arch-main-street .ms-grain{position:fixed;inset:0;z-index:60;pointer-events:none;opacity:.05;mix-blend-mode:multiply;background-image:${a.grain ?? 'none'}}
    /* Family texture — a fixed material layer painted behind every section using
       the family's default wallpaper. Positioned fixed so the texture doesn't
       scroll (feels like paper/wood/marble UNDER the page, not a repeating strip
       moving with content). z-index:-1 clamps to the bottom of the stacking
       context created by isolation:isolate on .arch-main-street — so it sits
       above the container's surface color but below every section. Without the
       clamp a positioned z-index:0 element paints ABOVE non-positioned in-flow
       sections, which is the wash bug the layer used to cause. Opacity comes
       from the family so linen and marble stay whisper-subtle and concrete /
       confetti read louder. Editor Door 2 will let the maker swap to another
       wallpaper in the family's bench by rewriting --ms-texture-url. */
    .arch-main-street .ms-family-texture{position:fixed;inset:0;z-index:-1;pointer-events:none;background-image:var(--ms-texture-url);background-size:cover;background-position:center;background-repeat:no-repeat;opacity:var(--ms-texture-opacity,0)}
    /* Niche texture BLEND modes (Editor Door 2). The texture PNG is black-ink-on-
       transparent. Rather than repainting the page in an ink color (which shifts
       the maker's hue), we BLEND the black pattern onto the existing background so
       the color is preserved and only the pattern's shadow/highlight is added.
       - multiply (light families): black pattern DEEPENS the current color; the
         transparent ground leaves the color untouched. Beige stays beige, just
         woven-darker where the threads sit.
       - screen (dark families): invert the pattern to white first, then screen so
         it LIGHTENS the near-black background — same idea in the other direction,
         since a black pattern would vanish on a dark page. */
    .arch-main-street[data-ms-texture-mode="multiply"] .ms-family-texture{
      background-size:cover;background-position:center;background-repeat:no-repeat;
      mix-blend-mode:multiply;
    }
    .arch-main-street[data-ms-texture-mode="screen"] .ms-family-texture{
      background-size:cover;background-position:center;background-repeat:no-repeat;
      filter:invert(1);mix-blend-mode:screen;
    }
    .arch-main-street .archetype-photo{filter:${a.photoFilter ?? 'none'};display:block;width:100%;height:100%;object-fit:cover}
    .arch-main-street .ms-wrap{max-width:1200px;margin-inline:auto;padding-inline:40px}
    @media(max-width:860px){.arch-main-street .ms-wrap{padding-inline:20px}}
    /* Per-beat wrapper — layout-transparent so the live page is unchanged; a hook
       the editor's single-section preview spotlights via [data-ms-beat]. */
    .arch-main-street .ms-beat{display:contents}
    /* Header nav: full link row on desktop, a menu button + full-screen overlay
       on phones. The breakpoint hides one and shows the other; the overlay reads
       the skin's own --ms-* vars so it matches the store. */
    .arch-main-street .ms-nav-links{display:flex;gap:30px;align-items:center}
    .arch-main-street .ms-nav-toggle{display:none}
    @media(max-width:640px){
      .arch-main-street .ms-nav-links{display:none}
      .arch-main-street .ms-nav-toggle{display:inline-flex}
    }
    /* split nav — the wordmark centered with links flanking it. Middle column is
       fit-content(50%) so a long wordmark ("Heavenly Scents", "Estate Sales of New
       England") can't consume the whole nav and squeeze the flanking labels down to
       a letter + ellipsis; caps at half the nav width, and the wordmark itself is
       allowed to wrap inside its cell (overriding the base wordmark nowrap/ellipsis)
       instead of truncating. Link groups keep at least ~25% of the nav each.
       On a phone the link groups hide and the burger appears, so the grid collapses
       to the same wordmark-left / burger-right shape as the standard bar. */
    .arch-main-street .ms-nav-split{width:100%;min-width:0;display:grid;grid-template-columns:minmax(0,1fr) fit-content(50%) minmax(0,1fr);align-items:center;gap:24px}
    .arch-main-street .ms-nav-split-left{justify-content:flex-start;min-width:0}
    .arch-main-street .ms-nav-split-right{justify-content:flex-end;min-width:0}
    .arch-main-street .ms-nav-split [data-type="wordmark"]{max-width:100%;white-space:normal;overflow:visible;text-overflow:clip;line-height:1.05;text-align:center}
    @media(max-width:640px){
      .arch-main-street .ms-nav-split{grid-template-columns:1fr auto;gap:0}
    }
    /* menu-reveal — the trigger shows at ALL widths and reads as a word, not a
       burger; the links live in the full-screen overlay behind the click. */
    .arch-main-street .ms-nav-toggle--always{display:inline-flex}
    .arch-main-street .ms-menu-trigger{background:none;border:0;color:inherit;cursor:pointer;padding:6px 2px;display:inline-flex;align-items:center;position:relative}
    .arch-main-street .ms-menu-trigger::after{content:"";position:absolute;left:2px;right:2px;bottom:0;height:1px;background:currentColor;opacity:.5;transform:scaleX(0);transform-origin:left;transition:transform .35s ${mo.reveal.easing}}
    .arch-main-street .ms-menu-trigger:hover::after{transform:scaleX(1)}
    @media(prefers-reduced-motion:reduce){.arch-main-street .ms-menu-trigger::after{transition:none}}
    /* cta-forward — one link elevated to a filled accent button (the shop). */
    .arch-main-street .ms-nav-cta{background:var(--ms-accent);color:var(--ms-on-accent);padding:9px 18px;border-radius:2px;transition:opacity .3s ease}
    .arch-main-street .ms-nav-cta:hover{opacity:.88}
    /* current-page highlight — the active link reads full-strength with a thin
       underline in the surface's OWN text color, so it shows over a hero image or
       on a solid sub-page header alike (accent could vanish over media). */
    .arch-main-street .ms-nav-link{color:inherit;opacity:.85;transition:opacity .25s ease}
    .arch-main-street .ms-nav-link:hover{opacity:1}
    .arch-main-street .ms-nav-link--active{opacity:1;position:relative}
    .arch-main-street .ms-nav-link--active::after{content:"";position:absolute;left:0;right:0;bottom:-5px;height:2px;background:currentColor;opacity:.7}
    .arch-main-street .ms-burger{background:none;border:0;color:inherit;cursor:pointer;padding:8px;display:inline-flex;flex-direction:column;gap:5px}
    .arch-main-street .ms-burger-line{display:block;width:24px;height:2px;background:currentColor}
    .arch-main-street .ms-mobile-overlay{position:fixed;inset:0;z-index:100;background:var(--ms-bg);color:var(--ms-fg);display:flex;flex-direction:column;justify-content:center;align-items:center;animation:ms-overlay-in .4s ${mo.reveal.easing}}
    @keyframes ms-overlay-in{from{opacity:0}to{opacity:1}}
    .arch-main-street .ms-burger-close{position:absolute;top:20px;right:24px;width:34px;height:34px;background:none;border:0;color:inherit;cursor:pointer;display:inline-flex;align-items:center;justify-content:center}
    .arch-main-street .ms-burger-x{position:absolute;width:26px;height:2px;background:currentColor}
    .arch-main-street .ms-burger-x:first-child{transform:rotate(45deg)}
    .arch-main-street .ms-burger-x:last-child{transform:rotate(-45deg)}
    .arch-main-street .ms-mobile-links{display:flex;flex-direction:column;gap:6px;text-align:center}
    .arch-main-street .ms-mobile-links a{color:inherit;font-family:var(--ms-disp);font-size:clamp(30px,9vw,46px);line-height:1.18;letter-spacing:.01em;opacity:0;transform:translateY(14px);animation:ms-link-in .55s ${mo.reveal.easing} forwards;animation-delay:.12s}
    .arch-main-street .ms-mobile-links a[data-ms-stagger="1"]{animation-delay:.18s}
    .arch-main-street .ms-mobile-links a[data-ms-stagger="2"]{animation-delay:.24s}
    .arch-main-street .ms-mobile-links a[data-ms-stagger="3"]{animation-delay:.30s}
    .arch-main-street .ms-mobile-links a[data-ms-stagger="4"]{animation-delay:.36s}
    .arch-main-street .ms-mobile-links a[data-ms-stagger="5"]{animation-delay:.42s}
    .arch-main-street .ms-mobile-links a[data-ms-stagger="6"]{animation-delay:.48s}
    .arch-main-street .ms-mobile-links a[data-ms-stagger="7"]{animation-delay:.54s}
    .arch-main-street .ms-mobile-links a[data-ms-stagger="8"]{animation-delay:.60s}
    @keyframes ms-link-in{to{opacity:1;transform:none}}
    @media(prefers-reduced-motion:reduce){
      .arch-main-street .ms-mobile-overlay{animation:none}
      .arch-main-street .ms-mobile-links a{animation:none;opacity:1;transform:none}
    }
    /* Sub-page <main> sits under the fixed SubHeader; pad it down by the nav height. */
    .arch-main-street .ms-subpage-main{padding-top:80px}
    @media(max-width:768px){.arch-main-street .ms-subpage-main{padding-top:68px}}
    /* Visually-hidden but screen-reader-accessible. Used for structural h1s (About
       page) where the visual hero already carries the page identity. */
    .arch-main-street .ms-sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
    /* Keyboard focus ring — family-consistent, uses the skin's accent so it lands
       in the palette. Only applies to :focus-visible so mouse users don't see it. */
    .arch-main-street :focus-visible{outline:2px solid var(--ms-accent);outline-offset:3px;border-radius:1px}
    /* ── sub-page shell — class-only; the two contrast surfaces mirror navContrast's
       fixed chrome states (like the on-media color), keyed on a data attribute so
       the header never carries an inline style. ── */
    .arch-main-street .ms-subheader{position:fixed;top:0;left:0;right:0;z-index:50;display:flex;justify-content:space-between;align-items:center;gap:24px;padding:14px 40px;border-bottom:1px solid var(--ms-rule);background:var(--ms-bg);color:var(--ms-fg);flex-wrap:wrap}
    .arch-main-street .ms-subheader[data-ms-subhead="light"]{background:#F7F5F2;color:#1a1a1a}
    .arch-main-street .ms-subheader[data-ms-subhead="dark"]{background:#1b1b1b;color:#F7F5F2}
    @media(max-width:768px){.arch-main-street .ms-subheader{padding-left:20px;padding-right:20px}}
    /* page masthead — eyebrow + title, centered */
    .arch-main-street .ms-pagehead{padding:88px 40px 36px;text-align:center}
    .arch-main-street .ms-pagehead-eyebrow{color:var(--ms-accent);display:block;margin-bottom:14px}
    .arch-main-street .ms-pagehead-title{color:var(--ms-fg);margin:0}
    /* generic page body sections */
    .arch-main-street .ms-page{padding:24px 40px 120px}
    .arch-main-street .ms-page-narrow{max-width:780px}
    .arch-main-street .ms-page-prose{max-width:760px}
    .arch-main-street .ms-page-legal{padding:72px 40px 110px;max-width:760px}
    .arch-main-street .ms-page-prose p{color:var(--ms-fg);margin:0 0 20px;max-width:66ch}
    .arch-main-street .ms-page-empty{color:var(--ms-fg-muted);text-align:center}
    /* shop — the full catalog grid (home shows a sampling, this shows everything) */
    .arch-main-street .ms-catalog-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:28px}
    .arch-main-street .ms-catalog-card{color:inherit;display:block}
    .arch-main-street .ms-catalog-media{position:relative;aspect-ratio:4 / 5;border-radius:3px;overflow:hidden;background:color-mix(in srgb, var(--ms-fg-muted) 40%, var(--ms-bg))}
    .arch-main-street .ms-catalog-price{position:absolute;left:12px;bottom:12px;background:var(--ms-bg);color:var(--ms-fg);padding:6px 10px;border-radius:2px}
    .arch-main-street .ms-catalog-name{color:var(--ms-fg);margin:16px 0 2px}
    .arch-main-street .ms-catalog-desc{color:var(--ms-fg-muted);margin:0}
    /* collections — the sub-page editorial spread: one collection per band,
       alternating image left/right down the page. One shape across all six
       families; family paint (colors, type, texture) does the differentiation.
       The home band treatments (cupboard/crates/portals/chapters/lanes/cascade)
       stay as teasers on the home only; the /collections page has its own
       library shape here. */
    .arch-main-street .ms-cs-list{display:flex;flex-direction:column}
    .arch-main-street .ms-cs-spread{display:grid;grid-template-columns:1fr 1fr;gap:clamp(32px,5vw,88px);align-items:center;padding:clamp(56px,8vw,112px) 0;border-bottom:1px solid color-mix(in srgb, var(--ms-fg-muted) 40%, transparent);color:inherit;text-decoration:none}
    .arch-main-street .ms-cs-spread:last-child{border-bottom:0}
    .arch-main-street .ms-cs-spread.right .ms-cs-cover{order:2}
    .arch-main-street .ms-cs-spread.right .ms-cs-body{order:1}
    .arch-main-street .ms-cs-cover{position:relative;aspect-ratio:5 / 6;border-radius:4px;overflow:hidden;background:color-mix(in srgb, var(--ms-fg-muted) 40%, var(--ms-bg));box-shadow:0 40px 60px -40px var(--ms-shadow);transition:transform .5s ease,box-shadow .5s ease}
    .arch-main-street .ms-cs-spread:hover .ms-cs-cover{transform:translateY(-4px);box-shadow:0 46px 66px -38px var(--ms-shadow)}
    .arch-main-street .ms-cs-cover img,.arch-main-street .ms-cs-cover video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
    .arch-main-street .ms-cs-body{display:flex;flex-direction:column;gap:20px;padding:12px 0}
    .arch-main-street .ms-cs-num{color:var(--ms-fg-muted)}
    .arch-main-street .ms-cs-name{color:var(--ms-fg);margin:0}
    .arch-main-street .ms-cs-enter{color:var(--ms-fg);border-bottom:2px solid var(--ms-accent);padding-bottom:4px;align-self:flex-start}
    @media(max-width:820px){
      .arch-main-street .ms-cs-spread{grid-template-columns:1fr;gap:36px;padding:56px 0}
      .arch-main-street .ms-cs-spread.right .ms-cs-cover{order:1}
      .arch-main-street .ms-cs-spread.right .ms-cs-body{order:2}
    }
    /* events — the sub-page chronological list. First (next) event carries a
       subtle left accent stripe. One shape across all six families; family paint
       does the differentiation. The home find-us treatments (board / calendar /
       passes / next-stop / itinerary / poster) stay as teasers on the home only;
       the /events page has its own library shape here. */
    .arch-main-street .ms-ev-list{display:flex;flex-direction:column;margin-top:12px}
    .arch-main-street .ms-ev-row{display:grid;grid-template-columns:150px 1fr auto;gap:32px;padding:28px 0;border-bottom:1px dashed color-mix(in srgb, var(--ms-fg-muted) 40%, transparent);align-items:baseline;transition:background .4s ease}
    .arch-main-street .ms-ev-row:hover{background:color-mix(in srgb, var(--ms-fg-muted) 6%, transparent)}
    .arch-main-street .ms-ev-row:first-child{border-top:1px dashed color-mix(in srgb, var(--ms-fg-muted) 40%, transparent);padding-left:20px;border-left:3px solid var(--ms-accent);margin-left:-20px}
    .arch-main-street .ms-ev-date{display:flex;flex-direction:column;gap:2px;align-self:flex-start}
    .arch-main-street .ms-ev-dow{color:var(--ms-accent)}
    .arch-main-street .ms-ev-num{color:var(--ms-fg);line-height:.9}
    .arch-main-street .ms-ev-mon{color:var(--ms-fg-muted)}
    .arch-main-street .ms-ev-day{color:var(--ms-fg)}
    .arch-main-street .ms-ev-info{display:flex;flex-direction:column;gap:8px}
    .arch-main-street .ms-ev-kind{display:inline-block;color:var(--ms-fg-muted);padding:3px 8px 2px;border:1px solid color-mix(in srgb, var(--ms-fg-muted) 40%, transparent);border-radius:2px;align-self:flex-start}
    .arch-main-street .ms-ev-where{color:var(--ms-fg);margin:0}
    .arch-main-street .ms-ev-time{color:var(--ms-fg);white-space:nowrap;align-self:flex-start}
    .arch-main-street .ms-ev-directions{color:var(--ms-accent);display:inline-block;margin-top:6px}
    /* testimonials — the sub-page wall of reviews. A two-column grid of quote
       cards, each with a big opening mark, the quote, the author, and an
       optional location. Optional summary bar (score + count) sits above the
       grid. One shape across all six families; family paint (colors, type,
       texture) does the differentiation. The home reviews treatments (rating /
       pull-quote / guestbook / texts) stay as teasers on the home only. */
    .arch-main-street .ms-tw-summary{display:flex;align-items:baseline;gap:22px;padding:24px 0 20px;border-top:1px solid var(--ms-rule);border-bottom:1px solid var(--ms-rule);margin-top:12px}
    .arch-main-street .ms-tw-score{color:var(--ms-fg)}
    .arch-main-street .ms-tw-count{color:var(--ms-fg-muted)}
    .arch-main-street .ms-tw-grid{display:grid;grid-template-columns:1fr 1fr;gap:36px 32px;margin-top:48px}
    .arch-main-street .ms-tw-card{display:flex;flex-direction:column;gap:14px;padding:32px 28px;background:color-mix(in srgb, var(--ms-fg-muted) 4%, var(--ms-bg));border:1px solid var(--ms-rule);border-radius:4px}
    .arch-main-street .ms-tw-mark{color:var(--ms-accent);line-height:.8;margin-bottom:-6px;align-self:flex-start}
    .arch-main-street .ms-tw-quote{color:var(--ms-fg);margin:0;line-height:1.55;flex:1}
    .arch-main-street .ms-tw-attribution{margin-top:auto;padding-top:10px;border-top:1px solid color-mix(in srgb, var(--ms-fg-muted) 30%, transparent)}
    .arch-main-street .ms-tw-author{color:var(--ms-fg);display:block}
    .arch-main-street .ms-tw-loc{color:var(--ms-fg-muted);display:block;margin-top:2px}
    @media(max-width:820px){
      .arch-main-street .ms-tw-grid{grid-template-columns:1fr;gap:24px}
    }
    /* the /events sub-page stacks the calendar over the detail list — the list
       hangs its anchor targets that the calendar cells scroll into */
    .arch-main-street [data-ms-events] .ms-fu-cal-section{margin-bottom:48px}
    .arch-main-street [data-ms-events] .ms-ev-row{scroll-margin-top:80px}
    .arch-main-street [data-ms-events] .ms-ev-row:target{background:color-mix(in srgb, var(--ms-accent) 10%, transparent);transition:background 1.6s ease}
    @media(max-width:820px){
      .arch-main-street .ms-ev-row{grid-template-columns:1fr;gap:12px;padding:24px 0}
      .arch-main-street .ms-ev-row:first-child{padding-left:16px;margin-left:-16px}
      .arch-main-street .ms-ev-time{justify-self:flex-start}
    }
    /* about page — the maker's story at length under the family's about look.
       The FounderBeat treatment renders at the top (representative of the home
       teaser); the full authored story renders below in class-only prose (skipped
       for editorial, which already sets the full story inline in its columns). */
    .arch-main-street .ms-aboutstory{max-width:820px;padding:56px 40px 24px;margin-inline:auto}
    .arch-main-street .ms-aboutstory-para{color:var(--ms-fg);margin:0 0 22px;max-width:64ch}
    .arch-main-street .ms-aboutstory-sig{color:var(--ms-fg-muted);margin-top:14px}
    /* contact page — an authored invitation, centered */
    .arch-main-street .ms-contactpage{max-width:680px;text-align:center}
    .arch-main-street .ms-contactpage-intro{color:var(--ms-fg);margin:0 auto;max-width:52ch}
    .arch-main-street .ms-contactpage-form{margin-top:44px}
    /* scroll reveal — arrives once, resolves to stillness */
    .arch-main-street .ms-reveal{opacity:0;transform:translateY(30px);transition:opacity 1.1s ${mo.reveal.easing},transform 1.1s ${mo.reveal.easing}}
    .arch-main-street .ms-reveal.in{opacity:1;transform:none}
    .arch-main-street .ms-reveal.d1{transition-delay:.12s}
    /* goods marquee — slow, edge-to-edge, pauses on hover */
    .arch-main-street .ms-marquee{animation:ms-scroll 38s linear infinite}
    .arch-main-street .ms-marquee:hover{animation-play-state:paused}
    @keyframes ms-scroll{to{transform:translateX(-50%)}}
    /* MARQUEE band (its own section, not the goods rail) — a loud scrolling
       type band painted in the skin's accent. Same shape every family; the
       accent colour and the goodsHead voice make it look like the family. Two
       rows (mirroring the original mockup): a bright voice line over a dim,
       reversed logistics line. Each row duplicates its run so the -50% loop is
       seamless (reuses ms-scroll); pauses on hover; static under reduced-motion. */
    .arch-main-street .ms-mq-band{background:var(--ms-accent);color:var(--ms-on-accent);overflow:hidden;padding:20px 0}
    .arch-main-street .ms-mq-track{display:flex;width:max-content;line-height:1;animation:ms-scroll 46s linear infinite}
    .arch-main-street .ms-mq-track + .ms-mq-track{margin-top:14px}
    .arch-main-street .ms-mq-track.rev{animation-direction:reverse}
    .arch-main-street .ms-mq-track.dim{opacity:.42;animation-duration:60s}
    .arch-main-street .ms-mq-band:hover .ms-mq-track{animation-play-state:paused}
    .arch-main-street .ms-mq-run{display:flex;align-items:center;flex:0 0 auto}
    .arch-main-street .ms-mq-cell{display:inline-flex;align-items:center;flex:0 0 auto}
    .arch-main-street .ms-mq-item{white-space:nowrap;padding:0 30px;line-height:1}
    .arch-main-street .ms-mq-sep{white-space:nowrap;opacity:.5;line-height:1}
    @media(prefers-reduced-motion:reduce){.arch-main-street .ms-mq-track{animation:none}}
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
       (random order, staggered via a CSS custom-property delay) and then rest.
       Position + rotation come from CSS vars written on each card (x/y/w/r); the
       stagger delay comes from --ms-const-d set by the mount effect. The rotate
       property is separate from transform, so the fade-in translate/scale doesn't
       fight the per-card rotation. */
    .arch-main-street .ms-const-card{position:absolute;left:var(--ms-const-x);top:var(--ms-const-y);width:var(--ms-const-w);rotate:var(--ms-const-r,0deg);color:inherit;text-decoration:none;opacity:0;transform:translateY(34px) scale(.965);transition:opacity 1.5s ${mo.reveal.easing},transform 1.6s ${mo.reveal.easing};transition-delay:var(--ms-const-d,0s)}
    .arch-main-street .ms-const-stage.in .ms-const-card{opacity:1;transform:none}
    /* goods module — a STILL, structural composition (the Swiss answer to the
       banned card grid). Asymmetric modules on a strict 12-col grid; index
       numbers, specs, hairline rules. Skin-agnostic: colors are skin vars, type
       is roles, imagery is graded by the skin's own .archetype-photo filter (warm
       for Cozy, cool/mono for Modern). Placement + the staggered reveal are all
       classes here — never inline; the delays live on nth-child, not the element. */
    .arch-main-street .ms-module-section{padding:96px 0 110px}
    .arch-main-street .ms-module-stage{display:grid;grid-template-columns:repeat(12,1fr);column-gap:28px;row-gap:64px;grid-auto-flow:dense}
    .arch-main-street .ms-module-item{display:block;color:inherit;text-decoration:none;opacity:0;transform:translateY(20px);transition:opacity .9s ${mo.reveal.easing},transform .9s ${mo.reveal.easing}}
    .arch-main-street .ms-module-stage.in .ms-module-item{opacity:1;transform:none}
    .arch-main-street .ms-module-stage.in .ms-module-item:nth-child(1){transition-delay:.04s}
    .arch-main-street .ms-module-stage.in .ms-module-item:nth-child(2){transition-delay:.12s}
    .arch-main-street .ms-module-stage.in .ms-module-item:nth-child(3){transition-delay:.20s}
    .arch-main-street .ms-module-stage.in .ms-module-item:nth-child(4){transition-delay:.28s}
    .arch-main-street .ms-module-stage.in .ms-module-item:nth-child(5){transition-delay:.36s}
    .arch-main-street .ms-module-stage.in .ms-module-item:nth-child(6){transition-delay:.44s}
    /* asymmetric placement: varied spans + deliberate vertical drops + one wide
       piece that breaks the lane. grid-auto-flow:dense backfills holes so a
       small catalog (3-5) still reads composed. */
    .arch-main-street .ms-module-item:nth-child(1){grid-column:span 7}
    .arch-main-street .ms-module-item:nth-child(2){grid-column:span 5;margin-top:92px}
    .arch-main-street .ms-module-item:nth-child(3){grid-column:span 5}
    .arch-main-street .ms-module-item:nth-child(4){grid-column:span 4;margin-top:48px}
    .arch-main-street .ms-module-item:nth-child(5){grid-column:span 3}
    .arch-main-street .ms-module-item:nth-child(6){grid-column:span 6;margin-top:12px}
    .arch-main-street .ms-module-frame{position:relative;overflow:hidden;aspect-ratio:4 / 5;border:1px solid var(--ms-rule);background:color-mix(in srgb, var(--ms-fg-muted) 40%, var(--ms-bg))}
    .arch-main-street .ms-module-item:nth-child(1) .ms-module-frame{aspect-ratio:7 / 6}
    .arch-main-street .ms-module-item:nth-child(4) .ms-module-frame{aspect-ratio:1 / 1}
    .arch-main-street .ms-module-item:nth-child(6) .ms-module-frame{aspect-ratio:16 / 9}
    .arch-main-street .ms-module-frame .archetype-photo{transition:transform .6s ${mo.reveal.easing}}
    .arch-main-street .ms-module-item:hover .ms-module-frame .archetype-photo{transform:scale(1.04)}
    /* the Swiss data block under each piece — index | name | price, spec beneath */
    .arch-main-street .ms-module-meta{display:grid;grid-template-columns:auto 1fr auto;align-items:baseline;gap:0 16px;margin-top:16px;padding-top:13px;border-top:1px solid var(--ms-rule)}
    .arch-main-street .ms-module-idx{color:var(--ms-accent)}
    .arch-main-street .ms-module-name{color:var(--ms-fg);margin:0}
    .arch-main-street .ms-module-item:hover .ms-module-name{color:var(--ms-accent)}
    .arch-main-street .ms-module-price{color:var(--ms-fg-muted)}
    .arch-main-street .ms-module-spec{grid-column:2 / 3;color:var(--ms-fg-muted);display:block;margin-top:5px}
    @media(max-width:880px){
      .arch-main-street .ms-module-stage{row-gap:44px}
      .arch-main-street .ms-module-item:nth-child(n){grid-column:span 12;margin-top:0}
      .arch-main-street .ms-module-item:nth-child(1) .ms-module-frame,
      .arch-main-street .ms-module-item:nth-child(4) .ms-module-frame{aspect-ratio:4 / 3}
    }
    @media(prefers-reduced-motion:reduce){
      .arch-main-street .ms-module-item{opacity:1;transform:none;transition:none}
      .arch-main-street .ms-module-frame .archetype-photo{transition:none}
    }
    /* goods index — a type-led catalogue list; words lead, the photo flicks in on
       hover. Skin vars + type roles; thumb graded by the skin. No inline. */
    .arch-main-street .ms-index-section{padding:96px 0 110px}
    .arch-main-street .ms-index-list{border-top:1px solid var(--ms-rule)}
    .arch-main-street .ms-index-row{display:grid;grid-template-columns:58px 1fr auto;align-items:baseline;gap:0 26px;padding:26px 8px;border-bottom:1px solid var(--ms-rule);position:relative;color:inherit;text-decoration:none;transition:padding-left .35s ${mo.reveal.easing}}
    .arch-main-street .ms-index-row:hover{padding-left:22px}
    .arch-main-street .ms-index-num{color:var(--ms-accent)}
    .arch-main-street .ms-index-name{margin:0;color:var(--ms-fg)}
    .arch-main-street .ms-index-row:hover .ms-index-name{color:var(--ms-accent)}
    .arch-main-street .ms-index-desc{grid-column:2;color:var(--ms-fg-muted);margin-top:9px}
    .arch-main-street .ms-index-price{color:var(--ms-fg);align-self:center}
    .arch-main-street .ms-index-thumb{position:absolute;right:120px;top:50%;width:128px;height:auto;aspect-ratio:3/4;transform:translateY(-50%) rotate(-4deg);box-shadow:0 16px 34px var(--ms-shadow);opacity:0;pointer-events:none;transition:opacity .3s ease;z-index:4}
    .arch-main-street .ms-index-row:hover .ms-index-thumb{opacity:1}
    @media(max-width:860px){.arch-main-street .ms-index-thumb{display:none}}
    @media(prefers-reduced-motion:reduce){.arch-main-street .ms-index-row{transition:none}}
    /* goods lookbook — big alternating image+text spreads, magazine. Skin vars +
       type roles; the flip is a modifier class on every other row. No inline. */
    .arch-main-street .ms-lookbook{display:flex;flex-direction:column;gap:clamp(56px,8vh,104px)}
    .arch-main-street .ms-lookbook-row{display:grid;grid-template-columns:1.08fr .92fr;gap:clamp(28px,5vw,72px);align-items:center;color:inherit;text-decoration:none}
    .arch-main-street .ms-lookbook-row--flip .ms-lookbook-media{order:2}
    .arch-main-street .ms-lookbook-media{aspect-ratio:4/3;overflow:hidden;border-radius:3px;box-shadow:0 26px 60px var(--ms-shadow)}
    .arch-main-street .ms-lookbook-media .archetype-photo{transition:transform .8s ${mo.reveal.easing}}
    .arch-main-street .ms-lookbook-row:hover .ms-lookbook-media .archetype-photo{transform:scale(1.04)}
    .arch-main-street .ms-lookbook-eyebrow{color:var(--ms-accent);display:flex;align-items:center;gap:12px;margin-bottom:18px}
    .arch-main-street .ms-lookbook-eyebrow::before{content:"";width:30px;height:2px;background:var(--ms-accent)}
    .arch-main-street .ms-lookbook-name{margin:0 0 14px;color:var(--ms-fg)}
    .arch-main-street .ms-lookbook-price{display:block;color:var(--ms-fg-muted);margin-bottom:20px}
    .arch-main-street .ms-lookbook-desc{color:var(--ms-fg-muted);margin:0 0 24px}
    .arch-main-street .ms-lookbook-view{color:var(--ms-fg);border-bottom:2px solid var(--ms-fg);padding-bottom:3px;display:inline-block}
    .arch-main-street .ms-lookbook-row:hover .ms-lookbook-view{color:var(--ms-accent);border-color:var(--ms-accent)}
    @media(max-width:820px){
      .arch-main-street .ms-lookbook-row,.arch-main-street .ms-lookbook-row--flip{grid-template-columns:1fr;gap:26px}
      .arch-main-street .ms-lookbook-row--flip .ms-lookbook-media{order:0}
    }
    @media(prefers-reduced-motion:reduce){.arch-main-street .ms-lookbook-media .archetype-photo{transition:none}}
    /* goods table — a styled tabletop: prints on mats, overlapping, shadowed,
       rotated, settling on scroll-in. Surface + mats derived from skin vars; type
       roles; placement + rotation + settle delays are CSS, never inline. */
    .arch-main-street .ms-table-section{padding:80px 0 96px}
    .arch-main-street .ms-table-stage{position:relative;aspect-ratio:3/2;border-radius:4px;overflow:hidden;background:color-mix(in srgb, var(--ms-fg) 12%, var(--ms-bg));box-shadow:inset 0 0 90px var(--ms-shadow)}
    .arch-main-street .ms-table-item{position:absolute;color:inherit;text-decoration:none;opacity:0;transform:translateY(-22px) rotate(var(--r,0deg));transition:opacity .7s ${mo.reveal.easing},transform .75s ${mo.reveal.easing}}
    .arch-main-street .ms-table-stage.in .ms-table-item{opacity:1;transform:translateY(0) rotate(var(--r,0deg))}
    .arch-main-street .ms-table-stage.in .ms-table-item:nth-child(1){transition-delay:.06s}
    .arch-main-street .ms-table-stage.in .ms-table-item:nth-child(2){transition-delay:.20s}
    .arch-main-street .ms-table-stage.in .ms-table-item:nth-child(3){transition-delay:.12s}
    .arch-main-street .ms-table-stage.in .ms-table-item:nth-child(4){transition-delay:.30s}
    .arch-main-street .ms-table-stage.in .ms-table-item:nth-child(5){transition-delay:.24s}
    .arch-main-street .ms-table-stage.in .ms-table-item:nth-child(6){transition-delay:.36s}
    .arch-main-street .ms-table-item:nth-child(1){left:3%;top:8%;width:25%;--r:-5deg}
    .arch-main-street .ms-table-item:nth-child(2){left:28%;top:25%;width:21%;--r:3.5deg}
    .arch-main-street .ms-table-item:nth-child(3){left:52%;top:6%;width:26%;--r:-2deg}
    .arch-main-street .ms-table-item:nth-child(4){left:15%;top:52%;width:22%;--r:4deg}
    .arch-main-street .ms-table-item:nth-child(5){left:58%;top:48%;width:21%;--r:-6deg}
    .arch-main-street .ms-table-item:nth-child(6){left:38%;top:36%;width:19%;--r:2deg}
    .arch-main-street .ms-table-print{display:block;background:var(--ms-bg);padding:9px 9px 0;border:1px solid var(--ms-rule);box-shadow:0 22px 45px var(--ms-shadow),0 4px 10px var(--ms-shadow)}
    .arch-main-street .ms-table-shot{display:block;position:relative;aspect-ratio:4/3;overflow:hidden}
    .arch-main-street .ms-table-cap{display:flex;justify-content:space-between;gap:10px;padding:8px 2px 10px}
    .arch-main-street .ms-table-name{color:var(--ms-fg)}
    .arch-main-street .ms-table-price{color:var(--ms-accent)}
    @media(max-width:820px){
      .arch-main-street .ms-table-stage{aspect-ratio:auto!important;display:flex;flex-direction:column;gap:22px;padding:10px}
      .arch-main-street .ms-table-item{position:static!important;left:auto!important;top:auto!important;width:auto!important;transform:none!important;opacity:1!important}
    }
    @media(prefers-reduced-motion:reduce){
      .arch-main-street .ms-table-item{opacity:1;transform:rotate(var(--r,0deg));transition:none}
    }
    /* product detail — two columns that stack on small screens */
    .arch-main-street .ms-product-grid{display:grid;grid-template-columns:1.1fr 0.9fr;gap:var(--ms-section);align-items:start}
    @media(max-width:768px){
      .arch-main-street .ms-product-grid{grid-template-columns:1fr;gap:28px}
      .arch-main-street [data-ms-nav]{padding-left:20px!important;padding-right:20px!important}
    }
    @media(max-width:860px){
      .arch-main-street .ms-founder-quote{grid-template-columns:1fr!important;gap:36px!important}
      .arch-main-street .ms-founder-findus{grid-template-columns:1fr!important;gap:40px!important}
      .arch-main-street .ms-marquee [data-ms-card]{width:74vw}
      .arch-main-street .ms-switch-grid{grid-template-columns:1fr!important;gap:32px!important}
      /* Mobile constellation — designed drift, no image-over-image collisions.
         Cards hug left then right and vary in width (the composition read); the
         negative margin-tops the original had made left-card and right-card image
         bounds overlap in the horizontal middle band, which visually collided into
         the section above/below on a phone. On mobile the wow lives in the width
         and side alternation, not in Y overlap that reads muddled at small size. */
      .arch-main-street .ms-const-stage{aspect-ratio:auto!important;height:auto!important;display:flex;flex-direction:column;gap:clamp(20px,4vw,32px)}
      .arch-main-street .ms-const-card{position:static!important;left:auto!important;top:auto!important;rotate:0!important;margin-top:0!important}
      .arch-main-street .ms-const-card:nth-child(1){width:80%!important;align-self:flex-start}
      .arch-main-street .ms-const-card:nth-child(2){width:64%!important;align-self:flex-end}
      .arch-main-street .ms-const-card:nth-child(3){width:88%!important;align-self:flex-start}
      .arch-main-street .ms-const-card:nth-child(4){width:58%!important;align-self:flex-end}
      .arch-main-street .ms-const-card:nth-child(5){width:74%!important;align-self:flex-start}
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
    .arch-main-street [data-type="sig"]{display:inline-block;max-width:32ch}
    .arch-main-street [data-type="price"]{white-space:nowrap}
    .arch-main-street [data-type="day"]{white-space:nowrap}
    .arch-main-street [data-type="where"]{display:inline-block;max-width:38ch;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;vertical-align:middle}
    .arch-main-street [data-type="legal"]{white-space:nowrap}
    /* ── About-beat treatments (class-only). Placed LAST so a treatment that needs
       to amplify a type role — a bigger statement, a left-aligned headline — wins
       on source order without inline styles or !important. Colors are skin vars or
       contrast-surface color-mix; nothing is a literal. ── */
    /* the shared band + cue every founder treatment sits on. All treatments render
       inside a full-width contrast band; the content column stays inside .ms-wrap.
       The about cue is a common tail rendered by every treatment except the letter
       (which has its own P.S. variant) and the editorial (which owns its own tail). */
    .arch-main-street .ms-founder-band{background:var(--ms-contrast-bg);color:var(--ms-contrast-fg);padding:110px 40px}
    @media(max-width:760px){.arch-main-street .ms-founder-band{padding:76px 20px}}
    .arch-main-street .ms-founder-aboutcue{color:var(--ms-accent);display:inline-block;margin-top:30px}
    /* quote — a two-column pull-quote: portrait left, quote+attribution right. */
    .arch-main-street .ms-founder-quote{display:grid;grid-template-columns:1.05fr .95fr;gap:64px;align-items:center}
    .arch-main-street .ms-founder-quote-photo{position:relative;aspect-ratio:4 / 5;border-radius:3px;overflow:hidden}
    .arch-main-street .ms-founder-quote-body{color:var(--ms-contrast-fg);margin:0}
    .arch-main-street .ms-founder-quote-sig{color:var(--ms-contrast-fg-muted);margin-top:26px}
    /* portrait — a large CONTAINED portrait with the quote anchored to the bottom.
       The scrim sits BEHIND the text container and follows its bounding box, so a
       long quote that pushes upward never sticks out into unscrimmed image area. */
    .arch-main-street .ms-founder-portrait-frame{position:relative;border-radius:4px;overflow:hidden;aspect-ratio:16 / 10}
    .arch-main-street .ms-founder-portrait-anchor{position:absolute;left:0;right:0;bottom:0}
    .arch-main-street .ms-founder-portrait-scrim{position:absolute;inset:0;background:linear-gradient(to top,var(--ms-contrast-bg) 75%,color-mix(in srgb,var(--ms-contrast-bg) 65%,transparent) 92%,transparent 100%);pointer-events:none}
    .arch-main-street .ms-founder-portrait-text{position:relative;padding:48px clamp(28px,5vw,64px)}
    .arch-main-street .ms-founder-portrait-quote{color:var(--ms-contrast-fg);margin:0;max-width:32ch}
    .arch-main-street .ms-founder-portrait-sig{color:var(--ms-contrast-fg-muted);margin-top:20px}
    /* card — the centered "meet the maker" card: eyebrow, heading, round face,
       warm pull-quote, attribution. The italic on the quote is set through the
       existing scoped [data-type="quote"] rule under .ms-founder-card. */
    .arch-main-street .ms-founder-card{max-width:560px;margin:0 auto;text-align:center}
    .arch-main-street .ms-founder-card-eyebrow{color:var(--ms-accent);display:block;margin-bottom:14px}
    .arch-main-street .ms-founder-card-heading{color:var(--ms-contrast-fg);margin:0 0 28px}
    .arch-main-street .ms-founder-card-avatar{width:156px;height:156px;border-radius:50%;overflow:hidden;margin:0 auto 24px;position:relative;border:1px solid color-mix(in srgb,var(--ms-contrast-fg) 18%,transparent)}
    .arch-main-street .ms-founder-card-quote{color:var(--ms-contrast-fg);margin:0;line-height:1.5}
    .arch-main-street .ms-founder-card-sig{color:var(--ms-contrast-fg-muted);margin-top:22px}
    /* the shared FIND-US LIST — used by the founder band AND the standalone find-us
       beat. Reads on the CONTRAST band by default; a data-oncontrast="false"
       variant reads on the BASE surface (its own beat, the Events page). The
       hairline and text colors flip with the surface. */
    .arch-main-street .ms-findus-heading{display:block;margin-bottom:16px;color:var(--ms-accent)}
    .arch-main-street .ms-findus-heading[data-heading="title"]{color:var(--ms-contrast-fg)}
    .arch-main-street .ms-findus-list[data-oncontrast="false"] .ms-findus-heading[data-heading="title"]{color:var(--ms-fg)}
    .arch-main-street .ms-findus-row{display:flex;justify-content:space-between;align-items:baseline;gap:16px;padding:13px 0;border-bottom:1px solid color-mix(in srgb,var(--ms-contrast-fg) 18%,transparent)}
    .arch-main-street .ms-findus-list[data-oncontrast="false"] .ms-findus-row{border-bottom-color:var(--ms-rule)}
    .arch-main-street .ms-findus-day{color:var(--ms-contrast-fg-muted);flex:0 0 95px}
    .arch-main-street .ms-findus-list[data-oncontrast="false"] .ms-findus-day{color:var(--ms-fg-muted)}
    .arch-main-street .ms-findus-where{color:var(--ms-contrast-fg);flex:1}
    .arch-main-street .ms-findus-list[data-oncontrast="false"] .ms-findus-where{color:var(--ms-fg)}
    .arch-main-street .ms-findus-time{color:var(--ms-contrast-fg-muted)}
    .arch-main-street .ms-findus-list[data-oncontrast="false"] .ms-findus-time{color:var(--ms-fg-muted)}
    .arch-main-street .ms-findus-cue{color:var(--ms-accent);display:inline-block;margin-top:18px}
    /* letter — a note on a paper slip laid on the dark band, turned, a snapshot
       clipped to a corner, signed in the skin's display hand. Paper + ink are the
       skin's BASE surface (an inversion against the contrast band). */
    .arch-main-street .ms-letter-stage{display:flex;justify-content:flex-start;padding-left:6%}
    .arch-main-street .ms-letter-paper{position:relative;background:var(--ms-bg);color:var(--ms-fg);max-width:600px;width:100%;padding:52px 56px 44px;border-radius:2px;transform:rotate(-1.3deg);box-shadow:0 34px 64px -26px var(--ms-shadow)}
    .arch-main-street .ms-letter-clip{position:absolute;top:-26px;right:30px;width:104px;display:block;background:var(--ms-bg);padding:7px 7px 20px;border:1px solid var(--ms-rule);transform:rotate(4.5deg);box-shadow:0 18px 32px -14px var(--ms-shadow)}
    .arch-main-street .ms-letter-clip .archetype-photo{height:auto;aspect-ratio:1 / 1.04}
    .arch-main-street .ms-letter-kicker{color:var(--ms-accent);display:block;margin-bottom:18px}
    .arch-main-street .ms-letter-body{color:color-mix(in srgb,var(--ms-fg) 90%,var(--ms-bg));max-width:42ch;margin:0;line-height:1.75}
    .arch-main-street .ms-letter-sign{font-family:var(--ms-disp);font-style:italic;font-size:clamp(34px,4.4vw,50px);line-height:.95;color:var(--ms-fg);margin:18px 0 8px}
    .arch-main-street .ms-letter-name{color:var(--ms-fg-muted);display:block}
    .arch-main-street .ms-letter-ps{color:var(--ms-accent);display:inline-block;margin-top:22px}
    @media(max-width:760px){
      .arch-main-street .ms-letter-stage{padding-left:0}
      .arch-main-street .ms-letter-paper{padding:40px 28px 34px}
      .arch-main-street .ms-letter-clip{right:18px;width:84px}
    }
    /* workbench — a wide documentary shot of the maker at work, then a caption
       (eyebrow + name | intro). The environment is the subject, not a headshot. */
    .arch-main-street .ms-wb-photo{display:block;aspect-ratio:24 / 9;overflow:hidden;border-radius:4px;box-shadow:0 26px 60px var(--ms-shadow)}
    .arch-main-street .ms-wb-cap{display:grid;grid-template-columns:.8fr 1.2fr;gap:48px;margin-top:32px;align-items:start}
    .arch-main-street .ms-wb-eye{color:var(--ms-accent);display:block}
    .arch-main-street .ms-wb-name{color:var(--ms-contrast-fg);margin-top:10px}
    .arch-main-street .ms-wb-intro{color:var(--ms-contrast-fg);margin:0;max-width:62ch}
    @media(max-width:760px){
      .arch-main-street .ms-wb-cap{grid-template-columns:1fr;gap:22px}
      .arch-main-street .ms-wb-photo{aspect-ratio:16 / 10}
    }
    /* editorial — a magazine feature: kicker, headline, byline, then the About
       story in two columns with a drop cap, a pull-quote, the cue. Hairlines derive
       from the contrast surface so they read on the dark band. */
    .arch-main-street .ms-ed-kicker{color:var(--ms-accent);display:block}
    .arch-main-street .ms-ed-head{color:var(--ms-contrast-fg);margin:14px 0 8px}
    .arch-main-street .ms-ed-by{color:var(--ms-contrast-fg-muted);display:block;margin-bottom:36px}
    .arch-main-street .ms-ed-cols{columns:2;column-gap:54px}
    .arch-main-street .ms-ed-para{color:var(--ms-contrast-fg);margin:0 0 18px;break-inside:avoid}
    .arch-main-street .ms-ed-para:first-child::first-letter{font-family:var(--ms-disp);font-size:3.4em;line-height:.66;float:left;padding:8px 12px 0 0;color:var(--ms-accent)}
    .arch-main-street .ms-ed-pull{color:var(--ms-contrast-fg);border-top:1px solid color-mix(in srgb,var(--ms-contrast-fg) 18%,transparent);border-bottom:1px solid color-mix(in srgb,var(--ms-contrast-fg) 18%,transparent);padding:24px 0;margin:32px 0 0;max-width:60ch}
    @media(max-width:760px){.arch-main-street .ms-ed-cols{columns:1}}
    /* signature — a type-led manifesto, no photo. The statement amplifies its
       close-head role (bigger, left-aligned — overriding the role's centered cap)
       and is signed in the skin's display hand. */
    .arch-main-street .ms-founder-signature{max-width:900px}
    .arch-main-street .ms-sig-eye{color:var(--ms-accent);display:block;margin-bottom:26px}
    .arch-main-street .ms-sig-statement{color:var(--ms-contrast-fg);margin:0;max-width:20ch;font-size:clamp(40px,5.4vw,66px)}
    .arch-main-street .ms-sig-sign{font-family:var(--ms-disp);font-style:italic;font-size:clamp(38px,4.6vw,58px);line-height:.9;color:var(--ms-contrast-fg);margin:38px 0 8px}
    .arch-main-street .ms-sig-name{color:var(--ms-contrast-fg-muted);display:block}
    /* ════════════════════════════════════════════════════════════════════
       COLLECTIONS-beat treatments (class-only). Six bands, one unique SHAPE per
       family — a collections band shows GROUPS you enter, never products, so none
       rhyme with the goods treatments. Colors are skin vars / contrast-surface /
       color-mix, never literals; the only literal blacks are scrims painted OVER
       cover photos (skin-agnostic, like MomentHero). Type is named roles; imagery
       is graded by the skin's .archetype-photo filter. (Family fonts + wallpapers
       arrive with the family layer.) ════════════════════════════════════════ */
    .arch-main-street .ms-coll-section{padding:84px 0 96px}
    /* cupboard (Cozy) — wide labeled shelves, a pinned paper slip on each. */
    .arch-main-street .ms-cup-head{display:flex;align-items:baseline;flex-wrap:wrap;gap:18px;margin-bottom:40px}
    .arch-main-street .ms-cup-eyebrow{color:var(--ms-accent)}
    .arch-main-street .ms-cup-title{margin:0;color:var(--ms-fg)}
    .arch-main-street .ms-cup-shelves{display:flex;flex-direction:column;gap:20px}
    .arch-main-street .ms-cup-shelf{position:relative;display:flex;align-items:stretch;height:148px;border-radius:6px;overflow:hidden;color:inherit;text-decoration:none;box-shadow:0 18px 30px -22px var(--ms-shadow);transition:transform .4s ease,box-shadow .4s ease}
    .arch-main-street .ms-cup-shelf:hover{transform:translateY(-3px);box-shadow:0 24px 38px -22px var(--ms-shadow)}
    .arch-main-street .ms-cup-cover{flex:1;position:relative;overflow:hidden}
    .arch-main-street .ms-cup-cover .archetype-photo{position:absolute;inset:0}
    .arch-main-street .ms-cup-slip{position:absolute;left:34px;top:50%;transform:translateY(-50%) rotate(-1.4deg);display:flex;flex-direction:column;background:color-mix(in srgb, var(--ms-bg) 86%, white);border:1px solid var(--ms-rule);border-radius:3px;padding:16px 26px 14px;min-width:300px;max-width:60%;box-shadow:0 12px 24px -12px var(--ms-shadow)}
    .arch-main-street .ms-cup-slip::before{content:"";position:absolute;top:-6px;left:50%;width:10px;height:10px;border-radius:50%;background:var(--ms-accent);box-shadow:0 2px 4px var(--ms-shadow);transform:translateX(-50%)}
    .arch-main-street .ms-cup-num{color:var(--ms-fg-muted)}
    .arch-main-street .ms-cup-name{margin:3px 0 2px;color:var(--ms-fg)}
    .arch-main-street .ms-cup-go{color:var(--ms-accent)}
    @media(max-width:760px){
      .arch-main-street .ms-cup-shelf{height:auto;flex-direction:column}
      .arch-main-street .ms-cup-cover{min-height:140px}
      .arch-main-street .ms-cup-slip{position:static;transform:none;min-width:0;max-width:none;left:auto;top:auto;border-radius:0 0 6px 6px}
      .arch-main-street .ms-cup-slip::before{display:none}
    }
    @media(prefers-reduced-motion:reduce){
      .arch-main-street .ms-cup-shelf{transition:none}
      .arch-main-street .ms-cup-shelf:hover{transform:none}
    }
    /* crates (Rustic) — stacked wood crates, names stenciled on the wood; one tall
       crate beside two. A crate is a dark wood box on any skin (--ms-contrast-bg). */
    .arch-main-street .ms-crate-head{margin-bottom:40px}
    .arch-main-street .ms-crate-eyebrow{color:var(--ms-accent);display:block;margin-bottom:8px}
    .arch-main-street .ms-crate-title{color:var(--ms-fg);margin:0;text-transform:uppercase}
    .arch-main-street .ms-crate-grid{display:grid;grid-template-columns:1.25fr 1fr;gap:22px}
    .arch-main-street .ms-crate-item--tall{grid-row:span 2}
    .arch-main-street .ms-crate-item{position:relative;display:block;border:3px solid var(--ms-fg);border-radius:4px;overflow:hidden;color:inherit;text-decoration:none;background:var(--ms-contrast-bg);box-shadow:inset 0 0 60px var(--ms-shadow),0 16px 26px -16px var(--ms-shadow);transition:transform .35s ease}
    .arch-main-street .ms-crate-item:hover{transform:rotate(-.5deg) translateY(-2px)}
    .arch-main-street .ms-crate-cover{display:block;width:100%;height:100%;min-height:150px}
    .arch-main-street .ms-crate-item--tall .ms-crate-cover{min-height:322px}
    .arch-main-street .ms-crate-cover .archetype-photo{width:100%;height:100%;min-height:inherit;object-fit:cover}
    .arch-main-street .ms-crate-label{position:absolute;left:14px;right:14px;bottom:14px;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 14px;border-radius:2px;background:var(--ms-contrast-bg);border:1px dashed color-mix(in srgb,var(--ms-contrast-fg) 40%,transparent);box-shadow:0 4px 12px -4px var(--ms-shadow)}
    .arch-main-street .ms-crate-name{color:var(--ms-contrast-fg);text-transform:uppercase;letter-spacing:.1em}
    .arch-main-street .ms-crate-count{color:var(--ms-accent);transform:rotate(-4deg)}
    .arch-main-street .ms-crate-viewall{display:inline-block;margin-top:32px;color:var(--ms-accent);border-bottom:1px solid var(--ms-rule);padding-bottom:3px}
    @media(max-width:760px){
      .arch-main-street .ms-crate-grid{grid-template-columns:1fr}
      .arch-main-street .ms-crate-item--tall{grid-row:auto}
      .arch-main-street .ms-crate-item--tall .ms-crate-cover{min-height:150px}
    }
    @media(prefers-reduced-motion:reduce){
      .arch-main-street .ms-crate-item{transition:none}
      .arch-main-street .ms-crate-item:hover{transform:none}
    }
    /* portals (Dark) — tall lit doorways emerging from shadow; the "shadow" is a
       black scrim OVER each cover (skin-agnostic), an ember floor-glow in accent. */
    .arch-main-street .ms-portal{padding:96px 0 110px;background:var(--ms-bg)}
    .arch-main-street .ms-portal-head{text-align:center;margin-bottom:46px}
    .arch-main-street .ms-portal-eyebrow{color:var(--ms-accent);display:block;margin-bottom:12px}
    .arch-main-street .ms-portal-title{color:var(--ms-fg);margin:0;margin-inline:auto}
    .arch-main-street .ms-portal-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:26px}
    .arch-main-street .ms-portal-item{position:relative;display:block;aspect-ratio:3 / 4.4;border-radius:3px 3px 0 0;overflow:hidden;color:inherit;text-decoration:none;transition:transform .5s ${mo.reveal.easing}}
    .arch-main-street .ms-portal-item:hover{transform:translateY(-6px)}
    .arch-main-street .ms-portal-cover{position:absolute;inset:0;z-index:0}
    .arch-main-street .ms-portal-cover .archetype-photo{transition:transform .6s ${mo.reveal.easing}}
    .arch-main-street .ms-portal-item:hover .ms-portal-cover .archetype-photo{transform:scale(1.04)}
    .arch-main-street .ms-portal-scrim{position:absolute;inset:0;z-index:1;background:linear-gradient(180deg,rgba(0,0,0,.92) 3%,rgba(0,0,0,.18) 42%,rgba(0,0,0,.42) 64%,rgba(0,0,0,.95) 100%)}
    .arch-main-street .ms-portal-glow{position:absolute;left:0;right:0;bottom:0;height:46%;z-index:2;background:radial-gradient(120% 80% at 50% 120%,color-mix(in srgb,var(--ms-accent) 55%,transparent),transparent 70%);opacity:.72;transition:opacity .6s ${mo.reveal.easing}}
    .arch-main-street .ms-portal-item:hover .ms-portal-glow{opacity:1}
    .arch-main-street .ms-portal-cap{position:absolute;left:0;right:0;bottom:30px;z-index:3;text-align:center;padding:0 14px}
    .arch-main-street .ms-portal-name{color:var(--ms-on-media);display:block}
    .arch-main-street .ms-portal-rule{width:34px;height:1px;background:var(--ms-accent);margin:10px auto 0;display:block}
    .arch-main-street .ms-portal-count{color:var(--ms-on-media-muted);display:block;margin-top:8px}
    .arch-main-street .ms-portal-viewall{display:flex;justify-content:center;margin-top:46px;color:var(--ms-accent)}
    @media(max-width:760px){
      .arch-main-street .ms-portal-grid{grid-template-columns:1fr}
      .arch-main-street .ms-portal-item{aspect-ratio:3 / 3.4}
    }
    @media(prefers-reduced-motion:reduce){
      .arch-main-street .ms-portal-item{transition:none}
      .arch-main-street .ms-portal-cover .archetype-photo,
      .arch-main-street .ms-portal-glow{transition:none}
    }
    /* chapters (Luxury) — a couture lookbook contents page: gold roman numeral,
       name, a quiet count, one plate, gold hairlines, generous air. */
    .arch-main-street .ms-chapter{padding:96px 0 110px;background:var(--ms-bg);color:var(--ms-fg)}
    .arch-main-street .ms-chapter-head{text-align:center;margin-bottom:64px}
    .arch-main-street .ms-chapter-eyebrow{color:var(--ms-accent);display:block;margin-bottom:16px}
    .arch-main-street .ms-chapter-title{color:var(--ms-fg);margin:0}
    .arch-main-street .ms-chapter-list{display:flex;flex-direction:column}
    .arch-main-street .ms-chapter-row{display:grid;grid-template-columns:140px 1fr 1.1fr;align-items:center;gap:42px;padding:34px 0;border-top:1px solid var(--ms-rule);color:inherit;text-decoration:none}
    .arch-main-street .ms-chapter-row:last-child{border-bottom:1px solid var(--ms-rule)}
    .arch-main-street .ms-chapter-roman{color:var(--ms-accent);text-align:center;line-height:1}
    .arch-main-street .ms-chapter-name{color:var(--ms-fg);margin:0;display:block}
    .arch-main-street .ms-chapter-count{color:var(--ms-fg-muted);display:block;margin-top:14px}
    .arch-main-street .ms-chapter-plate{aspect-ratio:5/3.4;overflow:hidden;box-shadow:0 24px 50px -28px var(--ms-shadow)}
    .arch-main-street .ms-chapter-plate .archetype-photo{transition:transform .8s ease}
    .arch-main-street .ms-chapter-row:hover .ms-chapter-plate .archetype-photo{transform:scale(1.05)}
    @media(max-width:760px){
      .arch-main-street .ms-chapter-row{grid-template-columns:60px 1fr;gap:24px}
      .arch-main-street .ms-chapter-plate{display:none}
    }
    @media(prefers-reduced-motion:reduce){
      .arch-main-street .ms-chapter-plate .archetype-photo{transition:none}
    }
    /* lanes (Cheerful) — full-width candy bands, a punched circular cover. One
       accent → three distinct band colors via nth-child + color-mix. */
    .arch-main-street .ms-lane-band{background:var(--ms-bg);color:var(--ms-fg);padding:84px 0 96px}
    .arch-main-street .ms-lane-head{margin-bottom:36px}
    .arch-main-street .ms-lane-eyebrow{color:var(--ms-accent);display:block;margin-bottom:8px}
    .arch-main-street .ms-lane-title{color:var(--ms-fg);margin:0}
    .arch-main-street .ms-lanes{display:flex;flex-direction:column;gap:20px}
    .arch-main-street .ms-lane{display:flex;align-items:center;gap:30px;border-radius:30px;padding:24px 36px;color:var(--ms-on-accent);position:relative;overflow:hidden;text-decoration:none;background:var(--ms-accent);box-shadow:0 14px 0 -4px color-mix(in srgb,var(--ms-fg) 16%,transparent);transition:transform .3s cubic-bezier(.34,1.56,.64,1)}
    .arch-main-street .ms-lane:nth-child(2){background:color-mix(in srgb,var(--ms-accent) 62%,var(--ms-fg))}
    .arch-main-street .ms-lane:nth-child(3){background:color-mix(in srgb,var(--ms-accent) 55%,white)}
    .arch-main-street .ms-lane:hover{transform:translateX(14px)}
    .arch-main-street .ms-lane-pic{width:104px;height:104px;flex-shrink:0;border-radius:50%;overflow:hidden;display:block;border:6px solid var(--ms-on-accent);box-shadow:0 8px 0 color-mix(in srgb,var(--ms-fg) 14%,transparent);transition:transform .4s ease}
    .arch-main-street .ms-lane-pic .archetype-photo{width:100%;height:100%;object-fit:cover;border-radius:50%}
    .arch-main-street .ms-lane:hover .ms-lane-pic{transform:rotate(8deg) scale(1.05)}
    .arch-main-street .ms-lane-name{color:var(--ms-on-accent);flex:1;line-height:.92}
    .arch-main-street .ms-lane-count{color:var(--ms-on-accent);opacity:.92;white-space:nowrap}
    .arch-main-street .ms-lane-arr{color:var(--ms-on-accent);font-size:38px;line-height:1}
    @media(max-width:760px){
      .arch-main-street .ms-lane{flex-wrap:wrap;gap:16px;padding:20px 22px}
      .arch-main-street .ms-lane-name{flex-basis:100%}
    }
    @media(prefers-reduced-motion:reduce){
      .arch-main-street .ms-lane{transition:none}
      .arch-main-street .ms-lane:hover{transform:none}
      .arch-main-street .ms-lane-pic{transition:none}
      .arch-main-street .ms-lane:hover .ms-lane-pic{transform:none}
    }
    /* cascade (Modern) — a diagonal of overlapping covers stepping across; quiet,
       image-forward. Diagonal placement is nth-child, never inline. */
    .arch-main-street .ms-cascade{background:var(--ms-bg)}
    .arch-main-street .ms-cascade-head{max-width:600px;margin-bottom:24px}
    .arch-main-street .ms-cascade-eyebrow{color:var(--ms-fg-muted);display:block}
    .arch-main-street .ms-cascade-title{color:var(--ms-fg);margin:14px 0 0}
    .arch-main-street .ms-cascade-stage{position:relative;height:660px;max-width:1000px;margin-inline:auto}
    .arch-main-street .ms-cascade-step{position:absolute;width:46%;aspect-ratio:4/3;overflow:hidden;border-radius:2px;box-shadow:0 34px 64px -30px var(--ms-shadow);text-decoration:none;color:inherit;transition:transform .5s cubic-bezier(.4,0,.1,1)}
    .arch-main-street .ms-cascade-step:nth-child(1){left:0;top:0;z-index:3}
    .arch-main-street .ms-cascade-step:nth-child(2){left:27%;top:170px;z-index:2}
    .arch-main-street .ms-cascade-step:nth-child(3){left:54%;top:340px;z-index:1}
    .arch-main-street .ms-cascade-step:hover{transform:translateY(-16px);z-index:4}
    .arch-main-street .ms-cascade-cover{position:absolute;inset:0;display:block}
    .arch-main-street .ms-cascade-step::after{content:"";position:absolute;inset:0;background:linear-gradient(transparent 50%,rgba(0,0,0,.62));pointer-events:none}
    .arch-main-street .ms-cascade-lab{position:absolute;left:0;right:0;bottom:0;z-index:2;padding:16px 20px;color:var(--ms-on-media);display:flex;align-items:baseline;justify-content:space-between;gap:10px}
    .arch-main-street .ms-cascade-name{color:var(--ms-on-media)}
    .arch-main-street .ms-cascade-count{color:var(--ms-on-media);opacity:.85}
    @media(max-width:760px){
      .arch-main-street .ms-cascade-stage{height:auto;display:flex;flex-direction:column;gap:18px}
      .arch-main-street .ms-cascade-step{position:static;width:100%}
    }
    @media(prefers-reduced-motion:reduce){
      .arch-main-street .ms-cascade-step{transition:none}
      .arch-main-street .ms-cascade-step:hover{transform:none}
    }

    /* ════════════════════════════════════════════════════════════════════
       REVIEWS beat — a small SHARED POOL of four treatments (like the nav
       registers), not per-family shapes. Class-only; colors are skin vars; no
       photos, so no scrims — pure --ms-*. Type is named roles. ════════════ */
    .arch-main-street .ms-rev-section{padding:92px 0 104px}
    /* rating — one enormous five-star row IS the hero; score, count, a small
       strip of pulled quotes underneath. Centered, credibility at a glance. */
    .arch-main-street .ms-rev-rating{text-align:center}
    .arch-main-street .ms-rev-rating-eyebrow{color:var(--ms-accent);display:block;margin-bottom:10px}
    .arch-main-street .ms-rev-rating-stars{display:flex;justify-content:center;gap:clamp(8px,1.4vw,18px);margin:8px 0 26px}
    .arch-main-street .ms-rev-rating-star{width:clamp(56px,10vw,132px);height:clamp(56px,10vw,132px);fill:var(--ms-accent);filter:drop-shadow(0 10px 22px var(--ms-shadow))}
    .arch-main-street .ms-rev-rating-score{color:var(--ms-fg);margin:0 auto;line-height:1}
    .arch-main-street .ms-rev-rating-count{color:var(--ms-fg-muted);margin:14px auto 0}
    .arch-main-street .ms-rev-rating-quips{display:flex;justify-content:center;flex-wrap:wrap;gap:18px 40px;margin-top:52px}
    .arch-main-street .ms-rev-rating-quip{display:inline-flex;align-items:baseline;gap:10px;max-width:44ch}
    .arch-main-street .ms-rev-rating-quote{color:color-mix(in srgb,var(--ms-fg) 84%,var(--ms-bg))}
    .arch-main-street .ms-rev-rating-author{color:var(--ms-fg-muted)}
    .arch-main-street .ms-rev-rating-viewall{display:inline-flex;justify-content:center;margin-top:44px;color:var(--ms-accent)}
    /* pull-quote — one voice at a time on the whole stage, cycling. Editorial. */
    .arch-main-street .ms-rev-pq{text-align:center}
    .arch-main-street .ms-rev-pq .ms-wrap{max-width:940px}
    .arch-main-street .ms-rev-pq-mark{display:block;color:var(--ms-accent);opacity:.9;line-height:.6;height:.44em;font-size:clamp(120px,20vw,240px)}
    .arch-main-street .ms-rev-pq-eyebrow{display:block;color:var(--ms-accent);margin-bottom:6px}
    /* Grid-stack the figures so the stage grows to the tallest one — an absolutely
       positioned figure whose authored quote+location exceeds the min-height would
       spill onto the dots and viewall. min-height stays as a floor when quotes are
       short so the beat still reads editorial-quiet. */
    .arch-main-street .ms-rev-pq-stage{display:grid;grid-template-areas:"stack";min-height:clamp(220px,30vh,300px)}
    .arch-main-street .ms-rev-pq-fig{grid-area:stack;opacity:0;transition:opacity .9s ease;pointer-events:none;margin:0}
    .arch-main-street .ms-rev-pq-fig.on{opacity:1;pointer-events:auto}
    .arch-main-street .ms-rev-pq figure [data-type="goodsHead"]{font-style:italic}
    .arch-main-street .ms-rev-pq-quote{display:block;margin:8px auto 34px;max-width:22ch;color:var(--ms-fg)}
    .arch-main-street .ms-rev-pq-rule{display:block;width:56px;height:1px;background:var(--ms-accent);margin:0 auto 22px}
    .arch-main-street .ms-rev-pq-who{display:block;color:var(--ms-fg)}
    .arch-main-street .ms-rev-pq-where{display:block;color:var(--ms-fg-muted);margin-top:7px}
    .arch-main-street .ms-rev-pq-dots{display:flex;gap:9px;justify-content:center;margin-top:28px}
    .arch-main-street .ms-rev-pq-dot{width:8px;height:8px;border-radius:50%;background:var(--ms-rule);border:0;padding:0;cursor:pointer;transition:background .4s ease}
    .arch-main-street .ms-rev-pq-dot.on{background:var(--ms-accent)}
    .arch-main-street .ms-rev-pq-viewall{display:inline-block;margin-top:34px;color:var(--ms-accent)}
    /* guestbook — testimonials as pinned paper slips, hand-placed & rotated. Same
       paper surface as the cupboard slip; pin/stars/name are the skin accent. */
    .arch-main-street .ms-rev-book-head{display:flex;align-items:baseline;flex-wrap:wrap;gap:18px;margin-bottom:30px}
    .arch-main-street .ms-rev-book-eyebrow{color:var(--ms-accent)}
    .arch-main-street .ms-rev-book-title{margin:0;color:var(--ms-fg)}
    .arch-main-street .ms-rev-book-scatter{display:grid;grid-template-columns:repeat(3,1fr);gap:22px 26px;align-items:start}
    .arch-main-street .ms-rev-book-slip{position:relative;background:color-mix(in srgb, var(--ms-bg) 86%, white);border:1px solid var(--ms-rule);border-radius:3px;padding:22px 24px 20px;box-shadow:0 16px 30px -18px var(--ms-shadow);transition:transform .4s ease,box-shadow .4s ease}
    .arch-main-street .ms-rev-book-pin{position:absolute;top:-7px;left:50%;width:12px;height:12px;border-radius:50%;background:var(--ms-accent);box-shadow:0 2px 5px var(--ms-shadow);transform:translateX(-50%)}
    .arch-main-street .ms-rev-book-stars{display:block;color:var(--ms-accent);letter-spacing:2px;margin-bottom:9px}
    .arch-main-street .ms-rev-book-quote{margin:0;color:var(--ms-fg)}
    .arch-main-street .ms-rev-book-who{display:block;color:var(--ms-accent);margin-top:12px}
    .arch-main-street .ms-rev-book-all{display:inline-block;margin-top:34px;color:var(--ms-accent)}
    .arch-main-street .ms-rev-book-slip:nth-child(1){transform:rotate(-2.2deg)}
    .arch-main-street .ms-rev-book-slip:nth-child(2){transform:rotate(1.4deg);margin-top:26px}
    .arch-main-street .ms-rev-book-slip:nth-child(3){transform:rotate(-1deg);margin-top:-8px}
    .arch-main-street .ms-rev-book-slip:nth-child(4){transform:rotate(1.8deg);margin-top:-14px}
    .arch-main-street .ms-rev-book-slip:nth-child(5){transform:rotate(-1.6deg);margin-top:20px}
    .arch-main-street .ms-rev-book-slip:nth-child(6){transform:rotate(.8deg)}
    .arch-main-street .ms-rev-book-slip:hover{transform:translateY(-4px) rotate(0deg);box-shadow:0 24px 40px -18px var(--ms-shadow)}
    /* texts — testimonials as the real messages customers sent: a centered head,
       a grid of threads, each an author name over one accent chat bubble. */
    .arch-main-street .ms-rev-texts{padding:84px 0 96px}
    .arch-main-street .ms-rev-texts-head{text-align:center;margin-bottom:34px}
    .arch-main-street .ms-rev-texts-eyebrow{color:var(--ms-accent);display:block;margin-bottom:8px}
    .arch-main-street .ms-rev-texts-title{color:var(--ms-fg);margin:0;margin-inline:auto}
    .arch-main-street .ms-rev-texts-threads{display:grid;grid-template-columns:repeat(3,1fr);gap:clamp(20px,3vw,40px);align-items:start}
    .arch-main-street .ms-rev-texts-thread{display:flex;flex-direction:column;gap:9px}
    .arch-main-street .ms-rev-texts-name{color:var(--ms-fg-muted);text-align:center;display:block}
    .arch-main-street .ms-rev-texts-where{color:var(--ms-fg-muted);text-align:center;display:block;opacity:.8;margin-top:-4px}
    .arch-main-street .ms-rev-texts-bub{align-self:flex-start;max-width:88%;margin:4px 0 0;padding:13px 18px;border-radius:20px 20px 20px 6px;background:var(--ms-accent);color:var(--ms-on-accent);box-shadow:0 8px 20px -10px var(--ms-shadow)}
    .arch-main-street .ms-rev-texts-foot{color:var(--ms-fg-muted);text-align:center;margin-top:30px}
    .arch-main-street .ms-rev-texts-viewall{display:flex;justify-content:center;margin-top:26px;color:var(--ms-accent)}
    @media(max-width:820px){
      .arch-main-street .ms-rev-section{padding:64px 0 76px}
      .arch-main-street .ms-rev-rating-star{width:clamp(46px,15vw,90px);height:clamp(46px,15vw,90px)}
      .arch-main-street .ms-rev-rating-quips{gap:22px 0;margin-top:40px}
      .arch-main-street .ms-rev-rating-quip{flex-direction:column;gap:4px;max-width:none;flex-basis:100%}
      .arch-main-street .ms-rev-book-scatter{grid-template-columns:1fr}
      .arch-main-street .ms-rev-book-slip{transform:none;margin-top:0}
      .arch-main-street .ms-rev-book-slip:hover{transform:translateY(-4px)}
      .arch-main-street .ms-rev-texts-threads{grid-template-columns:1fr}
    }
    @media(prefers-reduced-motion:reduce){
      .arch-main-street .ms-rev-pq-fig{transition:none}
      .arch-main-street .ms-rev-pq-dot{transition:none}
      .arch-main-street .ms-rev-book-slip{transition:none}
      .arch-main-street .ms-rev-book-slip:hover{transform:none}
    }

    /* ════════════════════════════════════════════════════════════════════
       FIND US beat — a SHARED POOL of six treatments (like the reviews pool +
       the nav registers), not per-family shapes. Class-only; colors are skin
       vars; no photos, so no scrims — pure --ms-*. Type is named roles. ════ */
    .arch-main-street .ms-fu-section{background:var(--ms-bg);color:var(--ms-fg);padding:92px 0 104px}
    /* board — a tour-dates list: a date block, the venue + hours, an optional
       kind pill. The editorial workhorse. */
    .arch-main-street .ms-fu-board-head{color:var(--ms-fg);margin:0 0 30px}
    .arch-main-street .ms-fu-board-row{display:grid;grid-template-columns:88px 1fr auto;align-items:center;gap:clamp(18px,3vw,44px);padding:22px 4px;border-top:1px solid var(--ms-rule)}
    .arch-main-street .ms-fu-board-row:last-child{border-bottom:1px solid var(--ms-rule)}
    .arch-main-street .ms-fu-board-date{text-align:center;display:flex;flex-direction:column;gap:3px}
    .arch-main-street .ms-fu-board-dow{color:var(--ms-accent)}
    .arch-main-street .ms-fu-board-num{color:var(--ms-fg);line-height:.9}
    .arch-main-street .ms-fu-board-mon{color:var(--ms-fg-muted)}
    .arch-main-street .ms-fu-board-day{color:var(--ms-accent)}
    .arch-main-street .ms-fu-board-where{color:var(--ms-fg);margin:0}
    .arch-main-street .ms-fu-board-time{color:var(--ms-fg-muted);margin:5px 0 0}
    .arch-main-street .ms-fu-board-kind{color:var(--ms-accent);border:1px solid var(--ms-rule);border-radius:100px;padding:5px 11px;white-space:nowrap}
    .arch-main-street .ms-fu-board-viewall{display:inline-block;margin-top:26px;color:var(--ms-accent)}
    /* calendar — a real month grid + an agenda column; the recurring-schedule view. */
    .arch-main-street .ms-fu-cal-grid2{display:grid;grid-template-columns:1.55fr 1fr;gap:clamp(28px,5vw,64px);align-items:start}
    .arch-main-street .ms-fu-cal-eyebrow{color:var(--ms-accent);display:block;margin-bottom:6px}
    .arch-main-street .ms-fu-cal-nav{display:flex;align-items:center;gap:14px;margin:0 0 22px}
    .arch-main-street .ms-fu-cal-title{color:var(--ms-fg);margin:0}
    .arch-main-street .ms-fu-cal-arrow{appearance:none;background:transparent;border:1px solid var(--ms-rule);color:var(--ms-fg);border-radius:50%;width:34px;height:34px;line-height:1;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto;transition:background .15s,color .15s,border-color .15s}
    .arch-main-street .ms-fu-cal-arrow:hover{background:var(--ms-accent);color:var(--ms-on-accent);border-color:var(--ms-accent)}
    .arch-main-street .ms-fu-cal-empty{color:var(--ms-fg-muted);padding:14px 0;border-top:1px solid var(--ms-rule)}
    .arch-main-street .ms-fu-cal-dows{display:grid;grid-template-columns:repeat(7,1fr);margin-bottom:8px}
    .arch-main-street .ms-fu-cal-dow{color:var(--ms-fg-muted);text-align:center}
    .arch-main-street .ms-fu-cal-month{display:grid;grid-template-columns:repeat(7,1fr);border-top:1px solid var(--ms-rule);border-left:1px solid var(--ms-rule)}
    .arch-main-street .ms-fu-cal-cell{aspect-ratio:1 / .9;border-right:1px solid var(--ms-rule);border-bottom:1px solid var(--ms-rule);padding:7px 8px;position:relative;overflow:hidden;min-height:52px}
    .arch-main-street .ms-fu-cal-pad{background:color-mix(in srgb, var(--ms-fg-muted) 8%, var(--ms-bg))}
    .arch-main-street .ms-fu-cal-d{color:var(--ms-fg-muted)}
    .arch-main-street .ms-fu-cal-ev .ms-fu-cal-d{color:var(--ms-fg)}
    .arch-main-street .ms-fu-cal-dot{position:absolute;top:9px;right:9px;width:7px;height:7px;border-radius:50%;background:var(--ms-accent)}
    .arch-main-street .ms-fu-cal-ev-l{display:block;margin-top:4px;color:var(--ms-fg);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    /* clickable cell — an anchor overlay covering the whole cell area, sits
       above the day marker and label for the click, invisible itself. Only
       rendered on the /events sub-page where events carry a real href. */
    .arch-main-street .ms-fu-cal-cell-hit{position:absolute;inset:0;z-index:2;text-indent:-9999px;overflow:hidden}
    .arch-main-street .ms-fu-cal-ev:hover{background:color-mix(in srgb, var(--ms-accent) 8%, transparent)}
    /* agenda item as a link — same shape, real hover feedback */
    a.arch-main-street .ms-fu-cal-ag,.arch-main-street a.ms-fu-cal-ag{color:inherit;text-decoration:none;cursor:pointer;transition:background .3s ease}
    .arch-main-street a.ms-fu-cal-ag:hover{background:color-mix(in srgb, var(--ms-accent) 6%, transparent)}
    .arch-main-street .ms-fu-cal-side-head{color:var(--ms-fg-muted);margin:0 0 12px}
    .arch-main-street .ms-fu-cal-ag{display:flex;gap:14px;padding:14px 0;border-top:1px solid var(--ms-rule)}
    .arch-main-street .ms-fu-cal-ag:last-child{border-bottom:1px solid var(--ms-rule)}
    .arch-main-street .ms-fu-cal-ag-day{color:var(--ms-accent);flex:0 0 62px}
    .arch-main-street .ms-fu-cal-ag-where{color:var(--ms-fg);display:block}
    .arch-main-street .ms-fu-cal-ag-time{color:var(--ms-fg-muted);display:block;margin-top:3px}
    .arch-main-street .ms-fu-cal-viewall{display:inline-block;margin-top:20px;color:var(--ms-accent)}
    /* passes — dates as torn admission tickets in a horizontal rail. */
    .arch-main-street .ms-fu-pass-head{color:var(--ms-fg);margin:0 0 28px}
    .arch-main-street .ms-fu-pass-rail{display:flex;gap:22px;overflow-x:auto;padding:8px 2px 20px;scroll-snap-type:x mandatory}
    .arch-main-street .ms-fu-pass-ticket{scroll-snap-align:start;flex:0 0 clamp(228px,26vw,276px);position:relative;display:grid;grid-template-columns:54px 1fr;background:color-mix(in srgb, var(--ms-bg) 88%, white);border:1px solid var(--ms-rule);border-radius:14px;overflow:hidden;box-shadow:0 18px 34px -20px var(--ms-shadow)}
    .arch-main-street .ms-fu-pass-stub{background:var(--ms-accent);color:var(--ms-on-accent);display:flex;align-items:center;justify-content:center;position:relative}
    .arch-main-street .ms-fu-pass-stub-l{writing-mode:vertical-rl;transform:rotate(180deg);color:var(--ms-on-accent)}
    .arch-main-street .ms-fu-pass-stub::after{content:"";position:absolute;top:0;right:-6px;bottom:0;width:12px;background:radial-gradient(circle at 0 6px, transparent 0 5px, var(--ms-bg) 5px) 0 0/12px 18px repeat-y}
    .arch-main-street .ms-fu-pass-body{padding:18px}
    .arch-main-street .ms-fu-pass-num{display:block;color:var(--ms-accent);line-height:.9}
    .arch-main-street .ms-fu-pass-mon{display:block;color:var(--ms-fg-muted);margin-top:4px}
    .arch-main-street .ms-fu-pass-where{color:var(--ms-fg);margin:12px 0 6px}
    .arch-main-street .ms-fu-pass-time{color:var(--ms-fg-muted);margin:0}
    .arch-main-street .ms-fu-pass-viewall{display:inline-block;margin-top:22px;color:var(--ms-accent)}
    /* next-stop — the next appearance spotlighted VENUE-FIRST, the rest trailing small. */
    .arch-main-street .ms-fu-next-eyebrow{color:var(--ms-accent);display:block}
    .arch-main-street .ms-fu-next-date{color:var(--ms-accent);display:block;margin:18px 0 8px;letter-spacing:.02em}
    .arch-main-street .ms-fu-next-where{color:var(--ms-fg);margin:0;line-height:.98;max-width:18ch}
    .arch-main-street .ms-fu-next-cta{display:inline-block;margin-top:26px;background:var(--ms-accent);color:var(--ms-on-accent);border-radius:3px;padding:14px 26px}
    .arch-main-street .ms-fu-next-also{margin-top:50px;border-top:1px solid var(--ms-rule);padding-top:22px}
    .arch-main-street .ms-fu-next-also-lbl{color:var(--ms-fg-muted);display:block;margin-bottom:16px}
    .arch-main-street .ms-fu-next-strip{display:flex;flex-wrap:wrap;gap:16px 40px}
    .arch-main-street .ms-fu-next-s{display:flex;align-items:baseline;gap:12px}
    .arch-main-street .ms-fu-next-sd{color:var(--ms-accent)}
    .arch-main-street .ms-fu-next-sv{color:var(--ms-fg)}
    .arch-main-street .ms-fu-next-st{color:var(--ms-fg-muted)}
    /* itinerary — the season as a stitched route line, stop after stop. */
    .arch-main-street .ms-fu-itin-head{color:var(--ms-fg);margin:0 0 36px}
    .arch-main-street .ms-fu-itin-route{position:relative;padding-left:52px}
    .arch-main-street .ms-fu-itin-route::before{content:"";position:absolute;left:15px;top:10px;bottom:14px;border-left:2px dashed var(--ms-accent);opacity:.55}
    .arch-main-street .ms-fu-itin-stop{position:relative;padding:0 0 30px}
    .arch-main-street .ms-fu-itin-stop:last-child{padding-bottom:4px}
    .arch-main-street .ms-fu-itin-node{position:absolute;left:-44px;top:5px;width:16px;height:16px;border-radius:50%;background:var(--ms-bg);border:3px solid var(--ms-accent)}
    .arch-main-street .ms-fu-itin-wk .ms-fu-itin-node{background:var(--ms-accent)}
    .arch-main-street .ms-fu-itin-dt{color:var(--ms-accent);display:block}
    .arch-main-street .ms-fu-itin-where{color:var(--ms-fg);margin:5px 0 4px;display:flex;align-items:center;flex-wrap:wrap;gap:10px}
    .arch-main-street .ms-fu-itin-kind{color:var(--ms-accent);border:1px solid var(--ms-rule);border-radius:3px;padding:2px 8px}
    .arch-main-street .ms-fu-itin-time{color:var(--ms-fg-muted);margin:0}
    .arch-main-street .ms-fu-itin-viewall{display:inline-block;margin-top:8px;margin-left:52px;color:var(--ms-accent)}
    /* poster — one printed broadside, the run of dates set as a playbill. */
    .arch-main-street .ms-fu-poster .ms-wrap{max-width:660px}
    .arch-main-street .ms-fu-poster-sheet{position:relative;background:color-mix(in srgb, var(--ms-bg) 90%, white);border:1px solid var(--ms-rule);padding:clamp(34px,5vw,58px) clamp(28px,5vw,60px) clamp(30px,4vw,46px);box-shadow:0 30px 60px -34px var(--ms-shadow);text-align:center}
    .arch-main-street .ms-fu-poster-sheet::before{content:"";position:absolute;inset:11px;border:1.5px double var(--ms-accent);opacity:.5;pointer-events:none}
    .arch-main-street .ms-fu-poster-title{color:var(--ms-fg);margin:0 0 4px}
    .arch-main-street .ms-fu-poster-orn{display:flex;align-items:center;justify-content:center;gap:12px;margin:18px 0;color:var(--ms-accent)}
    .arch-main-street .ms-fu-poster-orn::before,.arch-main-street .ms-fu-poster-orn::after{content:"";height:1px;width:64px;background:var(--ms-accent);opacity:.55}
    .arch-main-street .ms-fu-poster-dates{position:relative}
    .arch-main-street .ms-fu-poster-ln{display:grid;grid-template-columns:100px 1fr;align-items:baseline;gap:16px;text-align:left;padding:13px 0;border-top:1px solid var(--ms-rule)}
    .arch-main-street .ms-fu-poster-ln:last-child{border-bottom:1px solid var(--ms-rule)}
    .arch-main-street .ms-fu-poster-dd{color:var(--ms-accent)}
    .arch-main-street .ms-fu-poster-de{color:var(--ms-fg);display:block}
    .arch-main-street .ms-fu-poster-place{display:block;color:var(--ms-fg-muted);margin-top:2px}
    .arch-main-street .ms-fu-poster-foot{display:inline-block;margin-top:24px;color:var(--ms-accent)}
    @media(max-width:820px){
      .arch-main-street .ms-fu-section{padding:64px 0 76px}
      .arch-main-street .ms-fu-cal-grid2{grid-template-columns:1fr}
      .arch-main-street .ms-fu-board-row{grid-template-columns:70px 1fr;column-gap:20px;row-gap:4px}
      .arch-main-street .ms-fu-board-kind{grid-column:2;justify-self:start;margin-top:2px}
      .arch-main-street .ms-fu-poster .ms-wrap{max-width:none}
      .arch-main-street .ms-fu-poster-ln{grid-template-columns:1fr}
    }
    /* ══════════════════════════════════════════════════════════════════════
       HEROES — shared classes + per-hero specifics. Every hero is class-only;
       the media backdrop, nav overlay row, text stack, CTA row, and CTA buttons
       come from these classes. Per-hero geometry (Split, Stacked, Floating,
       Editorial, Collage, Moment, Typographic) has its own classes below.
       Nothing inline — dynamic per-tenant values become CSS custom properties on
       wrapper elements. ══════════════════════════════════════════════════════ */
    .arch-main-street .ms-hero-navbar{position:absolute;top:0;left:0;right:0;z-index:3;display:flex;align-items:center;justify-content:space-between;gap:24px;padding:clamp(20px,3vw,32px) clamp(24px,5vw,60px) 0}
    .arch-main-street .ms-hero-navbar--on-media{color:var(--ms-on-media)}
    .arch-main-street .ms-hero-brand{color:var(--ms-fg);margin:0}
    .arch-main-street .ms-hero-brand--on-media{color:var(--ms-on-media);text-shadow:0 2px 40px rgba(0,0,0,.5)}
    .arch-main-street .ms-hero-eyebrow{color:var(--ms-accent);display:block;margin-bottom:20px}
    .arch-main-street .ms-hero-eyebrow--on-media{color:var(--ms-on-media);margin-bottom:clamp(10px,1.4vh,16px)}
    .arch-main-street .ms-hero-sub{color:var(--ms-fg-muted);margin:20px 0 0}
    .arch-main-street .ms-hero-sub--on-media{color:var(--ms-on-media);margin:20px 0 0}
    .arch-main-street .ms-hero-rule{display:block;width:64px;height:1px;background:var(--ms-accent);opacity:.7;margin:clamp(20px,3vh,32px) 0}
    .arch-main-street .ms-hero-rule--short{width:40px;height:3px;opacity:1;margin-bottom:16px}
    .arch-main-street .ms-hero-rule--mid{width:46px;height:2px;opacity:1;margin-bottom:20px}
    .arch-main-street .ms-hero-actions{display:flex;gap:16px;margin-top:clamp(24px,4vh,40px);flex-wrap:wrap}
    .arch-main-street .ms-hero-actions--center{justify-content:center}
    .arch-main-street .ms-cta-primary{background:var(--ms-accent);color:var(--ms-on-accent);padding:16px 26px;border-radius:2px;display:inline-block}
    .arch-main-street .ms-cta-secondary{border:1px solid var(--ms-rule);color:var(--ms-fg);padding:16px 26px;border-radius:2px;display:inline-block}
    .arch-main-street .ms-cta-secondary--on-media{border-color:var(--ms-on-media-muted);color:var(--ms-on-media)}
    /* Split hero — text left, media right; 50/50 desktop, stacks on phone.
       Text panel has a nav at top + content column below; the nav sits by natural
       flow (nothing centers it), the inner content grows to fill and center-justifies. */
    /* Split hero — nav spans the full page width above the split, so long
       wordmarks + all nav items have the whole viewport to breathe (Session
       66 B4 — the earlier "labels squeezed on Modern" bug was actually the
       nav being trapped inside the .ms-splithero-text half). The nav sits
       absolute at the top; the text panel adds top padding so its content
       clears the nav band. */
    .arch-main-street .ms-splithero{position:relative;display:grid;grid-template-columns:1fr 1fr;min-height:100vh}
    .arch-main-street .ms-splithero[data-media-side="left"] .ms-splithero-media{order:1}
    .arch-main-street .ms-splithero[data-media-side="left"] .ms-splithero-text{order:2}
    .arch-main-street .ms-splithero-text{position:relative;padding:clamp(120px,15vh,180px) clamp(28px,5vw,60px) clamp(28px,5vw,60px);display:flex;flex-direction:column;background:var(--ms-bg);color:var(--ms-fg);min-height:100vh}
    .arch-main-street .ms-splithero-nav{position:absolute;top:0;left:0;right:0;z-index:10;display:flex;align-items:center;justify-content:space-between;gap:24px;padding:clamp(20px,3vh,32px) clamp(28px,5vw,60px)}
    .arch-main-street .ms-splithero-inner{flex:1;display:flex;flex-direction:column;justify-content:center;max-width:540px}
    .arch-main-street .ms-splithero-media{position:relative;overflow:hidden;min-height:100vh;background:var(--ms-contrast-bg)}
    @media(max-width:820px){
      .arch-main-street .ms-splithero{grid-template-columns:1fr;min-height:auto}
      .arch-main-street .ms-splithero-text{min-height:auto;padding:96px 24px 32px}
      .arch-main-street .ms-splithero-nav{padding:20px 24px}
      .arch-main-street .ms-splithero-media{min-height:56vh}
    }
    /* Stacked hero — a nav row, a centered text block, then a media band. */
    .arch-main-street .ms-stackedhero{display:flex;flex-direction:column;min-height:100vh;background:var(--ms-bg);color:var(--ms-fg)}
    .arch-main-street .ms-stackedhero .ms-hero-navbar{position:relative}
    .arch-main-street .ms-stackedhero-stack{display:flex;flex-direction:column;align-items:center;text-align:center;padding:clamp(32px,6vh,72px) clamp(24px,6vw,64px)}
    .arch-main-street .ms-stackedhero-media{position:relative;overflow:hidden;background:var(--ms-contrast-bg);flex:1;min-height:40vh}
    /* Typographic hero — no media backdrop; brand headline IS the picture. */
    .arch-main-street .ms-typohero{display:flex;flex-direction:column;min-height:100vh;background:var(--ms-bg);color:var(--ms-fg)}
    .arch-main-street .ms-typohero .ms-hero-navbar{position:relative}
    .arch-main-street .ms-typohero-stack{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:clamp(40px,8vh,120px) clamp(24px,6vw,72px)}
    .arch-main-street .ms-typohero-stack .ms-hero-brand{max-width:16ch}
    .arch-main-street .ms-typohero-stack .ms-hero-sub{max-width:46ch;margin:0}
    /* Floating card hero — media backdrop, then a solid card floating over it. */
    .arch-main-street .ms-floating-hero{position:relative;min-height:100vh;overflow:hidden;background:var(--ms-contrast-bg);display:flex;flex-direction:column}
    .arch-main-street .ms-floating-hero [data-ms-hero-media]{position:absolute;inset:0;z-index:0}
    .arch-main-street .ms-float-wash{position:absolute;inset:0;z-index:1;background:linear-gradient(90deg,rgba(0,0,0,.18),rgba(0,0,0,.5))}
    .arch-main-street .ms-float-cardwrap{position:relative;z-index:2;flex:1;display:flex;align-items:center;justify-content:flex-end;padding:clamp(24px,5vw,80px)}
    .arch-main-street .ms-float-card{background:var(--ms-bg);color:var(--ms-fg);padding:clamp(32px,4vw,52px);max-width:460px;border:1px solid var(--ms-rule);box-shadow:0 44px 100px -24px rgba(0,0,0,.55)}
    .arch-main-street .ms-float-card-eyebrow{color:var(--ms-accent);display:block;margin-bottom:18px}
    .arch-main-street .ms-float-card-rule{width:46px;height:2px;background:var(--ms-accent);margin-bottom:20px;display:block}
    .arch-main-street .ms-float-card-brand{color:var(--ms-fg);margin:0}
    /* The card is narrow (max 460px). A long single word ("Lenticular",
       "Constellation") at the skin's default brand size overflows the content
       area, and the global [data-type="brand"] overflow-wrap:break-word rule
       breaks it mid-character. Cap the brand size here so common long shop
       names fit at word boundaries, and free the h1 from the 18ch limit so
       the card's own max-width is the constraint. */
    .arch-main-street .ms-float-card [data-type="brand"]{font-size:clamp(36px,4.5vw,64px);line-height:1.02;max-width:none}
    .arch-main-street .ms-float-card-sub{color:var(--ms-fg-muted);margin:20px 0 0}
    .arch-main-street .ms-float-card-actions{display:flex;gap:16px;margin-top:28px;flex-wrap:wrap}
    .arch-main-street .ms-float-card-cta{background:var(--ms-accent);color:var(--ms-on-accent);padding:15px 24px;border-radius:2px;display:inline-block}
    .arch-main-street .ms-float-card-cta2{border:1px solid var(--ms-rule);color:var(--ms-fg);padding:15px 24px;border-radius:2px;display:inline-block}
    @media(max-width:860px){.arch-main-street .ms-float-cardwrap{justify-content:center}}
    /* Editorial cover hero — magazine cover: masthead top, coverlines bottom-left. */
    .arch-main-street .ms-editorial-hero{position:relative;min-height:100vh;overflow:hidden;background:var(--ms-contrast-bg);display:flex;flex-direction:column}
    .arch-main-street .ms-editorial-hero [data-ms-hero-media]{position:absolute;inset:0;z-index:0}
    .arch-main-street .ms-cover-grad{position:absolute;inset:0;z-index:1;background:linear-gradient(180deg,rgba(0,0,0,.62),transparent 32%,transparent 58%,rgba(0,0,0,.7))}
    .arch-main-street .ms-cover-inner{position:relative;z-index:2;flex:1;display:flex;flex-direction:column;color:var(--ms-on-media);padding:clamp(14px,2vw,24px) clamp(20px,4vw,52px) clamp(28px,4vh,52px)}
    .arch-main-street .ms-cover-nav{display:flex;align-items:center;justify-content:space-between;gap:24px;color:var(--ms-on-media)}
    .arch-main-street .ms-cover-masthead{text-align:center;margin-top:clamp(6px,1.5vh,18px)}
    .arch-main-street .ms-cover-eyebrow{color:var(--ms-on-media);display:block;margin-bottom:clamp(10px,1.4vh,16px)}
    .arch-main-street .ms-cover-brand{color:var(--ms-on-media);margin:0;text-shadow:0 2px 50px rgba(0,0,0,.5)}
    .arch-main-street .ms-cover-rule{height:1px;background:var(--ms-on-media);opacity:.75;margin-top:clamp(12px,1.8vh,22px)}
    .arch-main-street .ms-cover-coverlines{margin-top:auto;max-width:34ch;display:flex;flex-direction:column;align-items:flex-start;text-align:left}
    .arch-main-street .ms-cover-tick{width:40px;height:3px;background:var(--ms-accent);margin-bottom:16px;display:block}
    .arch-main-street .ms-cover-sub{color:var(--ms-on-media);margin:0;text-shadow:0 1px 24px rgba(0,0,0,.55)}
    .arch-main-street .ms-cover-actions{display:flex;gap:16px;margin-top:26px;flex-wrap:wrap}
    .arch-main-street .ms-cover-cta{background:var(--ms-accent);color:var(--ms-on-accent);padding:16px 26px;border-radius:2px;display:inline-block}
    .arch-main-street .ms-cover-cta2{border:1px solid var(--ms-on-media-muted);color:var(--ms-on-media);padding:16px 26px;border-radius:2px;display:inline-block}
    .arch-main-street .ms-cover-masthead [data-type="brand"]{font-size:clamp(56px,11vw,168px);line-height:.9;letter-spacing:-.015em}
    .arch-main-street .ms-cover-coverlines [data-type="body"]{font-size:clamp(18px,2vw,26px);line-height:1.35}
    /* Collage hero — a text column beside a cluster of THREE positioned shots.
       Each shot's position + rotation is set via nth-child (not inline) — the three
       positions are fixed structural knobs, not per-tenant values. */
    .arch-main-street .ms-collage-hero{display:flex;flex-direction:column;min-height:100vh;background:var(--ms-bg);color:var(--ms-fg);position:relative}
    /* Nav-zone contrast: the top shot sits at top:0 of the cluster, which lands
       directly under the right-side nav labels. A gentle vertical fade from the
       hero surface color at the top gives every nav label a legible backing
       without imposing a hard plate — the imagery still shows through below. */
    .arch-main-street .ms-collage-hero .ms-hero-navbar{background:linear-gradient(to bottom,var(--ms-bg) 0%,color-mix(in srgb,var(--ms-bg) 80%,transparent) 55%,transparent 100%);padding-bottom:clamp(20px,3vw,32px)}
    .arch-main-street .ms-collage-body{flex:1;display:grid;grid-template-columns:.92fr 1.08fr;align-items:center;gap:clamp(24px,4vw,48px);padding:clamp(16px,3vh,32px) clamp(24px,5vw,60px) clamp(32px,5vh,56px);min-height:0}
    .arch-main-street .ms-collage-text{display:flex;flex-direction:column}
    .arch-main-street .ms-collage-cluster{position:relative;width:100%;height:100%;min-height:360px}
    .arch-main-street .ms-collage-shot{position:absolute;overflow:hidden;border:6px solid var(--ms-bg);box-shadow:0 16px 36px -12px rgba(0,0,0,.26)}
    .arch-main-street .ms-collage-shot img{width:100%;height:100%;object-fit:cover;display:block}
    .arch-main-street .ms-collage-shot:nth-child(1){width:46%;height:64%;left:0;top:6%;transform:rotate(-5deg);z-index:1}
    .arch-main-street .ms-collage-shot:nth-child(2){width:38%;height:44%;right:2%;top:0;transform:rotate(5deg);z-index:2}
    .arch-main-street .ms-collage-shot:nth-child(3){width:42%;height:46%;right:6%;bottom:2%;transform:rotate(-3deg);z-index:3}
    @media(max-width:860px){
      /* Mobile stack: text row above cluster row, both anchored to the top of their
         cells so the desktop align-items:center can't pull the text down into the
         cluster's absolutely-positioned shots. Top padding clears the position:absolute
         navbar; explicit gap keeps a visible break between text and imagery. */
      .arch-main-street .ms-collage-body{grid-template-columns:1fr;grid-template-rows:auto auto;align-items:start;align-content:start;gap:clamp(28px,5vh,48px);padding-top:clamp(80px,12vh,120px)}
      .arch-main-street .ms-collage-cluster{min-height:300px;height:auto}
    }
    /* Moment hero — the video/still that IS the front door. Nav is fixed at the top;
       when the visitor scrolls past the hero, the nav's background flips from the
       over-media wash to a solid surface — driven by CSS variables set inline on the
       nav (--ms-nav-bg / --ms-nav-fg / --ms-nav-shadow), NEVER hardcoded properties. */
    .arch-main-street .ms-momenthero-nav{position:fixed;top:0;left:0;right:0;z-index:50;display:flex;align-items:center;justify-content:space-between;padding:14px 40px;background:var(--ms-nav-bg,transparent);color:var(--ms-nav-fg,var(--ms-on-media));box-shadow:var(--ms-nav-shadow,none);transition:background .5s ease,padding .5s ease,color .5s ease}
    .arch-main-street .ms-momenthero{position:relative;min-height:100vh;overflow:hidden;background:var(--ms-contrast-bg);color:var(--ms-on-media)}
    .arch-main-street .ms-momenthero-mediaframe{position:absolute;inset:0;z-index:0;transform-origin:center}
    .arch-main-street .ms-momenthero-mediaframe--push{animation:ms-hero-push 24s ease-in-out infinite alternate}
    @keyframes ms-hero-push{0%{transform:scale(1)}100%{transform:scale(1.03)}}
    /* z-index:2 is load-bearing: the scrim below is z-index:1, and without an
       explicit z on the frame, every text child was painted UNDER the scrim's
       semi-transparent black — which visually reads as a filter dimming the
       type on any hero. Lifting the frame above the scrim makes the text sit
       cleanly on top of the darkened surface (Session 66 A1 — Alex correctly
       named this "a filter on the text" after several color changes couldn't
       explain the persistent wash-out). */
    .arch-main-street .ms-momenthero-frame{position:absolute;inset:0;z-index:2;display:grid;place-items:center;text-align:center;padding:clamp(28px,6vw,96px);opacity:0;transition:opacity .9s linear;pointer-events:none}
    .arch-main-street .ms-momenthero-frame[data-visible="true"]{opacity:1;pointer-events:auto}
    /* Over-media text — text now sits ABOVE the scrim (z-index:2 on the
       frame) so it isn't tinted by scrim's semi-transparent black. All four
       classes are nudged softer than full --ms-on-media via color-mix so
       they read as refined-editorial rather than shouty-bright — the muted
       eyebrow (was 74% via --ms-on-media-muted) drops a touch further; the
       h1, sub, and storyline drop from 100% cream to a soft 85-88% cream.
       Only the h1 keeps a soft spread shadow (its scale earns the depth);
       storyline keeps its shadow because it plays alone during the intro,
       not next to a shadowed h1. (Session 66 A1 — Alex's call after
       landing the z-index fix.) */
    .arch-main-street .ms-momenthero-storyline{color:color-mix(in srgb, var(--ms-on-media) 85%, transparent);max-width:24ch;margin:0;text-shadow:0 2px 36px rgba(0,0,0,.55)}
    .arch-main-street .ms-momenthero-brand-eyebrow{color:color-mix(in srgb, var(--ms-on-media) 60%, transparent);display:block;margin-bottom:18px}
    .arch-main-street .ms-momenthero-brand-h1{color:color-mix(in srgb, var(--ms-on-media) 88%, transparent);margin:0;text-shadow:0 2px 40px rgba(0,0,0,.5)}
    /* Brand-phase caption — a short supporting tagline under the h1.
       Replaces the CTA row that used to live here (Session 66 A1 — CTAs
       over media of unknown luminance were unwinnable; the nav above
       carries the shop / about clicks). */
    .arch-main-street .ms-momenthero-brand-sub{color:color-mix(in srgb, var(--ms-on-media) 82%, transparent);margin:22px auto 0;max-width:36ch}
    /* Moment hero scrim — the original center-weighted radial vignette
       (dark corners, brighter middle). This looked GOOD across builds and
       still does — several iterations trying to darken the middle for the
       eyebrow's benefit made the whole hero muddy without actually
       solving readability (the eyebrow's real problem was its muted color
       token, fixed above). pointer-events:none stays load-bearing —
       without it, the scrim's z-index:1 catches clicks meant for anything
       inside the frame. aria-hidden already tells AT the scrim is
       decorative. */
    .arch-main-street .ms-momenthero-scrim{position:absolute;inset:0;z-index:1;background:radial-gradient(120% 90% at 50% 45%, rgba(0,0,0,.42), rgba(0,0,0,.82));pointer-events:none}
    /* ══════════════════════════════════════════════════════════════════════
       BEATS.TSX — GoodsHead, the goods marquee card, the "see full catalog" cue,
       and the close section. All class-only. ══════════════════════════════════ */
    .arch-main-street .ms-goodshead{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;flex-wrap:wrap;margin-bottom:48px}
    .arch-main-street .ms-goodshead-eyebrow{color:var(--ms-accent);display:block;margin-bottom:14px}
    .arch-main-street .ms-goodshead-title{color:var(--ms-fg);max-width:16ch;margin:0}
    .arch-main-street .ms-goodshead-cue{color:var(--ms-accent);white-space:nowrap}
    /* the pill-shaped "See the full catalog" button below the goods sampling.
       Symmetric top + bottom margin so it breathes from BOTH the section above
       (goods) and whatever section follows — on Modern that's the marquee,
       which used to land directly on top of the pill (Session 66 A4). */
    .arch-main-street .ms-shopcue-wrap{display:flex;justify-content:center;margin-top:56px;margin-bottom:56px}
    .arch-main-street .ms-shopcue-btn{background:var(--ms-accent);color:var(--ms-on-accent);padding:16px 32px;border-radius:100px;display:inline-block;max-width:36ch;white-space:normal;overflow:visible;text-overflow:clip;text-align:center}
    /* the marquee goods body — one row of product cards scrolling continuously. */
    .arch-main-street .ms-marq-section{padding:96px 0 110px;overflow:hidden}
    .arch-main-street .ms-marq-track{display:flex;gap:18px;width:max-content;padding:0 9px}
    .arch-main-street .ms-marq-card{width:340px;flex:0 0 auto}
    .arch-main-street .ms-marq-link{color:inherit;text-decoration:none;display:block}
    .arch-main-street .ms-marq-media{position:relative;aspect-ratio:4/5;overflow:hidden;border-radius:3px;background:color-mix(in srgb, var(--ms-fg-muted) 40%, var(--ms-bg))}
    .arch-main-street .ms-marq-price{position:absolute;left:12px;bottom:12px;background:var(--ms-bg);color:var(--ms-fg);padding:6px 10px;border-radius:2px}
    .arch-main-street .ms-marq-name{color:var(--ms-fg);margin:16px 0 2px}
    .arch-main-street .ms-marq-desc{color:var(--ms-fg-muted);margin:0}
    /* close — the big-type sign-off at the bottom of the home. */
    .arch-main-street .ms-close-section{padding:130px 40px;text-align:center}
    .arch-main-street .ms-close-eyebrow{color:var(--ms-accent);display:block;margin-bottom:22px}
    .arch-main-street .ms-close-head{color:var(--ms-fg);max-width:16ch;margin:0 auto 36px}
    .arch-main-street .ms-close-cta{background:var(--ms-accent);color:var(--ms-on-accent);padding:18px 34px;border-radius:2px;display:inline-block;max-width:36ch;white-space:normal;overflow:visible;text-overflow:clip;text-align:center}
    /* ══════════════════════════════════════════════════════════════════════
       GOODS TREATMENTS — Procession (Constellation), Switcher, Slideshow. Per-
       instance opacity/transform stays inline as CSS custom props on wrappers. ═ */
    .arch-main-street .ms-const-section{padding:72px 0 84px}
    .arch-main-street .ms-const-stage{position:relative;aspect-ratio:1 / 1.1}
    .arch-main-street .ms-const-frame{position:relative;aspect-ratio:4 / 5;border-radius:3px;overflow:hidden;background:color-mix(in srgb, var(--ms-fg-muted) 40%, var(--ms-bg))}
    .arch-main-street .ms-const-meta{padding:12px 2px 0}
    .arch-main-street .ms-const-name{color:var(--ms-fg);margin:0}
    .arch-main-street .ms-const-price{color:var(--ms-fg-muted);display:inline-block;margin-top:4px}
    .arch-main-street .ms-switch-section{padding:96px 0 110px}
    .arch-main-street .ms-switch-grid{display:grid;grid-template-columns:1.15fr .85fr;gap:56px;align-items:stretch}
    .arch-main-street .ms-switch-stage{position:relative;aspect-ratio:4/5;border-radius:3px;overflow:hidden;background:color-mix(in srgb, var(--ms-fg-muted) 40%, var(--ms-bg))}
    .arch-main-street .ms-switch-layer{position:absolute;inset:0;opacity:0}
    .arch-main-street .ms-switch-layer[data-on="true"]{opacity:1}
    .arch-main-street .ms-switch-price-tag{position:absolute;left:14px;bottom:14px;background:var(--ms-bg);color:var(--ms-fg);padding:7px 11px;border-radius:2px}
    .arch-main-street .ms-switch-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column}
    .arch-main-street .ms-switch-row{border-top:1px solid var(--ms-rule);flex:none}
    .arch-main-street .ms-switch-link{color:inherit;text-decoration:none;display:block;padding:20px 4px;background:transparent;border:0;cursor:pointer;text-align:left;width:100%}
    .arch-main-street .ms-switch-line{display:flex;justify-content:space-between;align-items:baseline;gap:16px}
    .arch-main-street .ms-switch-name{color:var(--ms-fg)}
    .arch-main-street .ms-switch-row[data-on="true"] .ms-switch-name{color:var(--ms-accent)}
    .arch-main-street .ms-switch-price{color:var(--ms-fg-muted)}
    .arch-main-street .ms-switch-desc{color:var(--ms-fg-muted);display:block;margin-top:6px}
    .arch-main-street .ms-slide-section{padding:96px 0 110px}
    .arch-main-street .ms-slide-stage{position:relative;aspect-ratio:3/2;overflow:hidden;border-radius:3px;background:color-mix(in srgb, var(--ms-fg-muted) 40%, var(--ms-bg));display:block;color:inherit;text-decoration:none}
    .arch-main-street .ms-slide-layer{position:absolute;inset:0;opacity:0}
    .arch-main-street .ms-slide-layer[data-on="true"]{opacity:1}
    .arch-main-street .ms-slide-backdrop{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transform:scale(1.18);filter:blur(32px) saturate(1.05) brightness(.82)}
    .arch-main-street .ms-slide-fg-wrap{position:absolute;inset:0}
    .arch-main-street .ms-slide-fg{width:100%;height:100%;object-fit:contain}
    .arch-main-street .ms-slide-caption{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;margin-top:22px;flex-wrap:wrap;color:inherit;text-decoration:none}
    .arch-main-street .ms-slide-name{color:var(--ms-fg);margin:0}
    .arch-main-street .ms-slide-desc{color:var(--ms-fg-muted);margin:4px 0 0}
    .arch-main-street .ms-slide-price{color:var(--ms-fg)}
    .arch-main-street .ms-slide-dots{display:flex;gap:9px;margin-top:20px}
    .arch-main-street .ms-slide-dot{width:9px;height:9px;border-radius:9px;border:0;padding:0;cursor:pointer;background:var(--ms-rule);transition:width .4s ease,background .4s ease}
    .arch-main-street .ms-slide-dot[aria-selected="true"]{width:26px;background:var(--ms-accent)}
    /* ══════════════════════════════════════════════════════════════════════
       PRODUCT DETAIL — MainStreetProduct. ═══════════════════════════════════ */
    .arch-main-street .ms-product-nav{display:flex;align-items:center;justify-content:space-between;padding:14px 40px;background:var(--ms-bg);color:var(--ms-fg);border-bottom:1px solid var(--ms-rule)}
    .arch-main-street .ms-product-section{padding-top:var(--ms-section);padding-bottom:var(--ms-section)}
    .arch-main-street .ms-product-tile{aspect-ratio:var(--ms-tile-aspect,4/5)}
    .arch-main-street .ms-product-tile-empty{background:var(--ms-fg-muted);opacity:.18}
    .arch-main-street .ms-product-thumbs{margin-top:var(--ms-tight);display:grid;grid-template-columns:repeat(3,1fr);gap:var(--ms-tight)}
    .arch-main-street .ms-product-title{color:var(--ms-fg);margin:0}
    .arch-main-street .ms-product-price{color:var(--ms-fg);margin-top:var(--ms-base)}
    .arch-main-street .ms-product-desc{color:var(--ms-fg-muted);margin:var(--ms-base) 0 0;max-width:460px}
    .arch-main-street .ms-product-var{margin-top:var(--ms-loose)}
    .arch-main-street .ms-product-var-lbl{color:var(--ms-fg)}
    .arch-main-street .ms-product-var-opts{margin-top:var(--ms-tight);display:flex;flex-wrap:wrap;gap:var(--ms-tight)}
    .arch-main-street .ms-product-var-chip{color:var(--ms-fg);border:1px solid var(--ms-rule);padding:7px 12px;border-radius:2px}
    .arch-main-street .ms-product-buy{margin-top:var(--ms-loose)}
    .arch-main-street .ms-product-cta{background:var(--ms-accent);color:var(--ms-on-accent);padding:var(--ms-base) var(--ms-loose);border-radius:2px;display:inline-block;border:0;cursor:pointer;font:inherit}
    .arch-main-street .ms-product-cta[data-soldout="true"]{background:var(--ms-fg-muted);cursor:default}
    .arch-main-street .ms-product-story{padding-top:var(--ms-section)}
    .arch-main-street .ms-product-story-eyebrow{color:var(--ms-accent);display:block;margin-bottom:var(--ms-base)}
    .arch-main-street .ms-product-story-body{color:var(--ms-fg);max-width:640px;margin:0}
    /* ══════════════════════════════════════════════════════════════════════
       CONTACT FORM — MainStreetContactForm. ═════════════════════════════════ */
    .arch-main-street .ms-contactform-form{max-width:520px;margin:0 auto;text-align:left}
    .arch-main-street .ms-contactform-field{display:block;margin-top:14px}
    .arch-main-street .ms-contactform-label{color:var(--ms-fg-muted);display:block;margin-bottom:6px}
    .arch-main-street .ms-contactform-input{width:100%;background:var(--ms-bg);color:var(--ms-fg);border:1px solid var(--ms-rule);border-radius:2px;padding:12px 14px;font:inherit}
    .arch-main-street .ms-contactform-textarea{width:100%;background:var(--ms-bg);color:var(--ms-fg);border:1px solid var(--ms-rule);border-radius:2px;padding:12px 14px;font:inherit;min-height:120px;resize:vertical}
    .arch-main-street .ms-contactform-submit{background:var(--ms-accent);color:var(--ms-on-accent);padding:14px 24px;border-radius:2px;border:0;cursor:pointer;font:inherit;margin-top:18px}
    .arch-main-street .ms-contactform-status{color:var(--ms-accent);margin-top:12px}
    .arch-main-street .ms-contactform-body{color:var(--ms-fg)}
    /* ══════════════════════════════════════════════════════════════════════
       CHROME — logo lockup + footer. ════════════════════════════════════════ */
    .arch-main-street .ms-lockup{color:inherit;display:inline-flex;align-items:center;gap:14px}
    .arch-main-street .ms-lockup-logo{display:block}
    .arch-main-street .ms-footer{background:var(--ms-contrast-bg);color:var(--ms-contrast-fg);padding:54px 40px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:20px}
    .arch-main-street .ms-footer-row{display:flex;gap:20px;align-items:baseline;flex-wrap:wrap}
    .arch-main-street .ms-footer-link{color:inherit;opacity:.6}
    .arch-main-street .ms-footer-legal{opacity:.5}
    /* Media placeholder — when no url resolves, a dim scrim over the skin muted color. */
    .arch-main-street .archetype-photo-empty{background:var(--ms-fg-muted);opacity:.18}
    /* ══════════════════════════════════════════════════════════════════════
       STOREFRONT PAGES — cart, subscriptions. Simple prose layouts in Main Street
       chrome; class-only. The commerce build fleshes these out (line items,
       quantities, checkout); for now they render an empty state with a shop cue. */
    .arch-main-street .ms-simple-page{padding:120px 40px;text-align:center}
    .arch-main-street .ms-simple-inner{max-width:620px;margin:0 auto}
    .arch-main-street .ms-simple-eyebrow{color:var(--ms-accent);display:block;margin-bottom:16px}
    .arch-main-street .ms-simple-head{color:var(--ms-fg);margin:0 0 16px}
    .arch-main-street .ms-simple-body{color:var(--ms-fg-muted);margin:0 0 32px}
    .arch-main-street .ms-simple-cta{background:var(--ms-accent);color:var(--ms-on-accent);padding:15px 28px;border-radius:2px;display:inline-block}
    /* Subscriptions list — card grid in Main Street chrome. */
    .arch-main-street .ms-subs-section{padding:88px 40px 110px}
    .arch-main-street .ms-subs-head{text-align:center;margin-bottom:52px}
    .arch-main-street .ms-subs-eyebrow{color:var(--ms-accent);display:block;margin-bottom:14px}
    .arch-main-street .ms-subs-title{color:var(--ms-fg);margin:0}
    .arch-main-street .ms-subs-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:28px;max-width:900px;margin:0 auto}
    @media(max-width:760px){.arch-main-street .ms-subs-grid{grid-template-columns:1fr}}
    .arch-main-street .ms-subs-card{border:1px solid var(--ms-rule);border-radius:3px;overflow:hidden}
    .arch-main-street .ms-subs-media{position:relative;aspect-ratio:4/3;overflow:hidden;background:color-mix(in srgb, var(--ms-fg-muted) 40%, var(--ms-bg))}
    .arch-main-street .ms-subs-body{padding:22px 24px}
    .arch-main-street .ms-subs-name{color:var(--ms-fg);margin:0 0 6px}
    .arch-main-street .ms-subs-price{color:var(--ms-accent);margin:0 0 12px}
    .arch-main-street .ms-subs-interval{color:var(--ms-fg-muted)}

    /* ══════════════════════════════════════════════════════════════════════
       FAMILY SECTION-SURFACE VARIATION (Wave C2)

       Cheerful / Cozy / Rustic / Dark all get visual rhythm down the page because
       at least one home section paints on the CONTRAST surface (the reversed
       dark-on-light or light-on-dark pair). Luxury and Modern had no contrast
       flips beyond the founder-band (which every family already inherits), so
       both moods read uniformly flat — everything on the same base color.

       Fix: family-scoped rules that flip two additional sections per mood to the
       contrast surface, so the scroll hits a distinct surface break instead of
       reading like one long panel. The trick is redefining --ms-bg / --ms-fg /
       --ms-fg-muted AT the section scope — child rules that read those vars
       automatically pick up the contrast pair, so headings, muted lines, and
       hairlines all track without needing per-selector overrides. Accent and
       shadow stay unchanged (they're designed to work on both surfaces). */

    /* Luxury — flip Chapters collections + Pull-Quote reviews to contrast.
       Editorial founder is already contrast via .ms-founder-band. That gives
       Luxury three contrast surfaces (chapters, pull-quote, founder) alternating
       with hero / goods / find-us — a real magazine page-break rhythm. */
    .arch-main-street[data-ms-family="luxury"] .ms-chapter,
    .arch-main-street[data-ms-family="luxury"] .ms-rev-pq{
      --ms-bg:var(--ms-contrast-bg);
      --ms-fg:var(--ms-contrast-fg);
      --ms-fg-muted:var(--ms-contrast-fg-muted);
      background:var(--ms-bg);
      color:var(--ms-fg);
    }

    /* Modern — flip Module goods to contrast (positioned at #2 in the stack,
       right after the hero). Signature founder is already contrast via
       .ms-founder-band (positioned at #5). That gives Modern real alternation
       (b, c, b, b, c, b, b, b) rather than the c-c-c clump the original plan
       hit — Modern's stack puts founder between collections and reviews, so
       flipping either of those creates founder-adjacency. Goods is naturally
       separated from founder by marquee + collections, so its flip breathes.

       KNOWN OPEN — the family contrast pair reads "white and charcoal on every
       family" today because most skins don't declare a p.contrast pair, so the
       default is a full bg/fg inversion. Family-appropriate contrast pairs
       (Rustic → walnut on cream, Cozy → deep ember on linen, Modern → warm
       gray on paper, etc.) is a skin-level design change and lands separately. */
    .arch-main-street[data-ms-family="modern"] .ms-module-section{
      --ms-bg:var(--ms-contrast-bg);
      --ms-fg:var(--ms-contrast-fg);
      --ms-fg-muted:var(--ms-contrast-fg-muted);
      background:var(--ms-bg);
      color:var(--ms-fg);
    }
    .arch-main-street .ms-subs-desc{color:var(--ms-fg-muted);margin:0 0 16px}
    .arch-main-street .ms-subs-cue{color:var(--ms-accent)}
  `;
}

export function MainStreetRoot({ skin, family, children }: { skin: ArchetypeTheme; family?: { key: string; wallpaperUrl: string; textureOpacity: number; textureMode?: 'cover' | 'multiply' | 'screen' } | undefined; children: React.ReactNode }) {
  return (
    <>
      <link rel="stylesheet" href={fontHref(skin)} />
      <style dangerouslySetInnerHTML={{ __html: skinVarsCss(skin) }} />
      {family && (
        <style
          dangerouslySetInnerHTML={{
            __html: `.arch-main-street{--ms-texture-url:url("${family.wallpaperUrl}");--ms-texture-opacity:${family.textureOpacity}}`,
          }}
        />
      )}
      <div className="arch-main-street" data-ms-family={family?.key} data-ms-texture-mode={family?.textureMode ?? 'cover'}>
        <div className="ms-grain" aria-hidden />
        {family && <div className="ms-family-texture" aria-hidden />}
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
  const emptyCls = [cls, 'archetype-photo-empty'].join(' ');
  return <div className={emptyCls} aria-label={media.alt} style={style} />;
}

/** The Main Street nav — every page created at onboarding, in reading order.
 *  Fixed under §1.7: Bohdi does not author nav; the renderer lists the pages
 *  the store actually has. Labels route through DEFAULT_STRINGS so a copy edit
 *  or a locale change touches one file. Maker per-page on/off toggles arrive
 *  with Editor Door 1 (Phase 3); until then every page shows. */
export const MAIN_STREET_NAV: ReadonlyArray<{ href: string; label: string }> = [
  { href: '/shop', label: DEFAULT_STRINGS.navShop },
  { href: '/collections', label: DEFAULT_STRINGS.navCollections },
  { href: '/about', label: DEFAULT_STRINGS.navAbout },
  { href: '/events', label: DEFAULT_STRINGS.navEvents },
  { href: '/contact', label: DEFAULT_STRINGS.navContact },
];

/** Return the store's nav — the fixed page list from `MAIN_STREET_NAV`.
 *  Exists as a function (not the const directly) so the maker's per-page
 *  on/off toggles can layer in later without changing every callsite. */
export function resolveNav(): ReadonlyArray<{ href: string; label: string }> {
  return MAIN_STREET_NAV;
}

/** The brand lockup in a header. When the maker has uploaded a logo (a dashboard
 *  task post-launch), it sits ALONGSIDE the typographic wordmark — a true lockup,
 *  not a replacement. With no logo, the wordmark stands alone. The header surface
 *  guarantees logo contrast (via navContrast in SubHeader / MomentHero); no plate. */
export function WordmarkLink({
  wordmark,
  logoUrl,
}: {
  wordmark: string;
  logoUrl?: string | undefined;
}) {
  return (
    <Type as={Link} role="wordmark" href="/" className="ms-lockup">
      {logoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt="" data-ms-logo className="ms-lockup-logo" />
      )}
      <span>{wordmark}</span>
    </Type>
  );
}

function NavLink({ href, label, active = false }: { href: string; label: string; active?: boolean }) {
  return (
    <Type
      as="a"
      href={href}
      role="navLabel"
      aria-current={active ? 'page' : undefined}
      className={active ? 'ms-nav-link ms-nav-link--active' : 'ms-nav-link'}
    >
      {label}
    </Type>
  );
}

/** The header nav. Two layouts, chosen by `identity.navVariant` (a family-level
 *  look choice): the default wordmark-left / links-right bar, or 'split-center' —
 *  the wordmark centered with the links split to either side. Both collapse to the
 *  same wordmark + burger on phones (the link groups hide under 640px). The shape
 *  is read here so every nav site (each hero, every sub-page header, the product
 *  page) picks the variant up from the identity with no extra wiring. */
export function Nav({
  identity,
  currentHref,
}: {
  identity: MainStreetContent['identity'];
  /** The href of the page being viewed — the matching nav link is marked active.
   *  Absent on the home (the wordmark is "home"), so no link is current there. */
  currentHref?: string | undefined;
}) {
  const items = resolveNav();
  const allItems = [...items, { href: '/cart', label: DEFAULT_STRINGS.navCart }];
  const variant = identity.navVariant ?? 'standard';

  if (variant === 'split-center') {
    const mid = Math.ceil(allItems.length / 2);
    const left = allItems.slice(0, mid);
    const right = allItems.slice(mid);
    return (
      <div className="ms-nav-split">
        <div className="ms-nav-links ms-nav-split-left">
          {left.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} active={item.href === currentHref} />
          ))}
        </div>
        <WordmarkLink wordmark={identity.wordmark} logoUrl={identity.logoUrl} />
        <div className="ms-nav-links ms-nav-split-right">
          {right.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} active={item.href === currentHref} />
          ))}
        </div>
        <MainStreetMobileNav items={allItems} />
      </div>
    );
  }

  if (variant === 'menu-reveal') {
    // The nav recedes: wordmark + a "Menu" trigger at all widths; the links live in
    // the full-screen overlay behind the click. The gallery / luxury-quiet move.
    return (
      <>
        <WordmarkLink wordmark={identity.wordmark} logoUrl={identity.logoUrl} />
        <MainStreetMobileNav items={allItems} label={DEFAULT_STRINGS.ariaMenu} always />
      </>
    );
  }

  if (variant === 'cta-forward') {
    // The standard bar, but one link is elevated to a filled accent button — the
    // shop if present, else the last item. Commerce-loud.
    const ctaIdx = allItems.findIndex((i) => i.href === '/shop');
    const idx = ctaIdx >= 0 ? ctaIdx : allItems.length - 1;
    return (
      <>
        <WordmarkLink wordmark={identity.wordmark} logoUrl={identity.logoUrl} />
        <div className="ms-nav-links">
          {allItems.map((item, i) =>
            i === idx ? (
              <Type
                as="a"
                key={item.href}
                href={item.href}
                role="navLabel"
                className="ms-nav-cta"
                aria-current={item.href === currentHref ? 'page' : undefined}
              >
                {item.label}
              </Type>
            ) : (
              <NavLink key={item.href} href={item.href} label={item.label} active={item.href === currentHref} />
            ),
          )}
        </div>
        <MainStreetMobileNav items={allItems} />
      </>
    );
  }

  return (
    <>
      <WordmarkLink wordmark={identity.wordmark} logoUrl={identity.logoUrl} />
      <div className="ms-nav-links">
        {allItems.map((item) => (
          <NavLink key={item.href} href={item.href} label={item.label} active={item.href === currentHref} />
        ))}
      </div>
      <MainStreetMobileNav items={allItems} />
    </>
  );
}

export function MainStreetFooter({ shopName }: { shopName: string }) {
  return (
    <footer className="ms-footer">
      <Type as="span" role="wordmark">{shopName}</Type>
      <div className="ms-footer-row">
        <Type as={Link} role="legal" href="/" className="ms-footer-link">
          {DEFAULT_STRINGS.footerHome}
        </Type>
        <IntroReplayLink className="ms-footer-link">
          {DEFAULT_STRINGS.footerIntro}
        </IntroReplayLink>
        {/* The standalone testimonials page is disabled for now (reviews live on the
            home sampling); no footer link until the full page returns. */}
        <Type as="a" role="legal" href="/privacy" className="ms-footer-link">
          {DEFAULT_STRINGS.footerPrivacy}
        </Type>
        <Type as="a" role="legal" href="/terms" className="ms-footer-link">
          {DEFAULT_STRINGS.footerTerms}
        </Type>
        <Type as="span" role="legal" className="ms-footer-legal">
          &copy; {shopName}
        </Type>
      </div>
    </footer>
  );
}
