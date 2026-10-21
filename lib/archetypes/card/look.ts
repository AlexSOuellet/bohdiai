/**
 * The Scenic mood is drawn by the shoreline design (Alex, 2026-10-21: "the point
 * was to put it in a family and keep it looking exactly the same"). A Scenic site
 * paints it in its own skin and over its own photo: the skin's colours and fonts
 * become the design's colour settings, and the site's scene (a library photo, the
 * maker's own, or a clip) goes behind every page. Saltmarsh's own skin holds the
 * design's original colours, so Saltmarsh looks exactly as it did.
 *
 * Pure: the CSS is a stylesheet rule keyed by `data-look`, never inline styles.
 */
import type { ArchetypeTheme } from '../types';
import type { ScenePhoto } from '../main-street/scenes';
import { fontHref, roles } from '../main-street/chrome';

export type ShorelineLook = {
  /** The skin's key, the `data-look` the rule targets. */
  key: string;
  css: string;
  /** The skin's fonts. */
  fontHref: string;
  /** A short clip behind the page, when the scene has one. */
  seaVideo: string | null;
};

/** A CSS value from data: never lets a quote or a brace close the rule. */
function safe(v: string): string {
  return v.replace(/[;{}<>"\\]/g, '');
}

export function shorelineLook(skin: ArchetypeTheme, scene: ScenePhoto | null): ShorelineLook {
  const p = skin.palette;
  const c = p.contrast ?? { bg: p.fg, fg: p.bg, fgMuted: p.fgMuted };
  const r = roles(skin);
  const sel = `.sl[data-look="${safe(skin.key)}"]`;
  const vars = [
    `--ink:${safe(p.fg)}`,
    `--ink-soft:${safe(p.fgMuted)}`,
    `--navy:${safe(c.bg)}`,
    `--rust:${safe(p.accent)}`,
    `--lace:${safe(p.onAccent ?? p.bg)}`,
    `--paper:${safe(p.bg)}`,
    `--display:${safe(r.brand.family)}`,
    `--body:${safe(r.body.family)}`,
    `--btn-bg:${safe(c.bg)}`,
    `--btn-fg:${safe(c.fg)}`,
  ].join(';');
  const sea =
    scene === null
      ? ''
      : `${sel} .sl-sea{background-image:url('${safe(scene.url).replace(/'/g, '')}');background-position:${safe(scene.focus)}}`;
  // A dark photo takes light lettering in the opening, as the Scenic mood always did.
  const dark =
    scene?.tone === 'dark'
      ? // A soft shade behind the opening's words, deepest where they sit, so a bright spot in the photo never washes them out.
        `${sel} .sl-sky--home{position:relative;isolation:isolate}` +
        `${sel} .sl-sky--home::before{content:'';position:absolute;inset:0 0 -80px 0;z-index:-1;pointer-events:none;background:linear-gradient(90deg,rgba(0,0,0,.55) 0%,rgba(0,0,0,.32) 38%,rgba(0,0,0,0) 72%);-webkit-mask-image:linear-gradient(180deg,#000 50%,transparent);mask-image:linear-gradient(180deg,#000 50%,transparent)}` +
        `${sel} .sl-name{color:${safe(c.fg)};text-shadow:0 2px 6px rgba(0,0,0,.55),0 4px 40px rgba(0,0,0,.6)}` +
        `${sel} .sl-kicker{color:${safe(c.fg)};text-shadow:0 1px 12px rgba(0,0,0,.6)}` +
        `${sel} .sl-sky .sl-btn{background:${safe(c.fg)};color:${safe(c.bg)}!important}`
      : '';
  return { key: skin.key, css: `${sel}{${vars}}${sea}${dark}`, fontHref: fontHref(skin), seaVideo: scene?.video ?? null };
}
