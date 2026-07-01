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
import { Type } from './Type';
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
    /* split nav — the wordmark centered with links flanking it. A 1fr/auto/1fr grid
       keeps the wordmark dead-center regardless of how the links balance. On a phone
       the link groups hide and the burger appears, so the grid collapses to the same
       wordmark-left / burger-right shape as the standard bar. */
    .arch-main-street .ms-nav-split{width:100%;min-width:0;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:24px}
    .arch-main-street .ms-nav-split-left{justify-content:flex-start;min-width:0}
    .arch-main-street .ms-nav-split-right{justify-content:flex-end;min-width:0}
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
       (random order, staggered via an inline transition-delay) and then rest. */
    .arch-main-street .ms-const-card{opacity:0;transform:translateY(34px) scale(.965);transition:opacity 1.5s ${mo.reveal.easing},transform 1.6s ${mo.reveal.easing}}
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
    /* ── About-beat treatments (class-only). Placed LAST so a treatment that needs
       to amplify a type role — a bigger statement, a left-aligned headline — wins
       on source order without inline styles or !important. Colors are skin vars or
       contrast-surface color-mix; nothing is a literal. ── */
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
    .arch-main-street .ms-crate-label{position:absolute;left:14px;right:14px;bottom:14px;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 14px;border-radius:2px;background:rgba(0,0,0,.7);border:1px dashed color-mix(in srgb,var(--ms-contrast-fg) 40%,transparent)}
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
    .arch-main-street .ms-rev-pq-stage{position:relative;min-height:clamp(220px,30vh,300px)}
    .arch-main-street .ms-rev-pq-fig{position:absolute;inset:0;opacity:0;transition:opacity .9s ease;pointer-events:none;margin:0}
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
}: {
  wordmark: string;
  logoUrl?: string | undefined;
}) {
  return (
    <Type as={Link} role="wordmark" href="/" style={{ color: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 14 }}>
      {logoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt="" data-ms-logo style={{ display: 'block' }} />
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
  const items = resolveNav(identity.nav);
  const allItems = [...items, { href: '/cart', label: 'Cart' }];
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
        <MainStreetMobileNav items={allItems} label="Menu" always />
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
      <Type as="span" role="wordmark">{shopName}</Type>
      <div style={{ display: 'flex', gap: 20, alignItems: 'baseline' }}>
        <Type as={Link} role="legal" href="/" style={{ color: 'inherit', opacity: 0.6 }}>
          Home
        </Type>
        <IntroReplayLink style={{ color: 'inherit', opacity: 0.6 }}>
          Intro
        </IntroReplayLink>
        <Type as="a" role="legal" href="/privacy" style={{ color: 'inherit', opacity: 0.6 }}>
          Privacy
        </Type>
        <Type as="a" role="legal" href="/terms" style={{ color: 'inherit', opacity: 0.6 }}>
          Terms
        </Type>
        <Type as="span" role="legal" style={{ opacity: 0.5 }}>
          &copy; {shopName}
        </Type>
      </div>
    </footer>
  );
}
