/**
 * Generates a visual contact sheet of the Main Street skin shelf — every skin
 * painted in its own palette, with its real fonts rendered (same sample text
 * across all, so differences are obvious) and its colors shown as hex swatches.
 *
 * Run:  npx tsx scripts/gen-skin-shelf.ts   →  writes skin-shelf.html (open in a browser)
 */
import { writeFileSync } from 'node:fs';
import {
  MAIN_STREET_SKINS,
  MAIN_STREET_FONT_HREFS,
  MAIN_STREET_SKIN_TAGS,
  type MainStreetRoles,
} from '../lib/archetypes/main-street/skins';

const DISPLAY_SAMPLE = 'Quietly Made';
const BODY_SAMPLE =
  'Every piece here was chosen by hand and kept for a reason. We sell things that last, and we tell you where they came from.';
const LABEL_SAMPLE = 'Est · MMXXVI · The Shop';

function swatch(hex: string, name: string): string {
  return `<div class="sw"><span class="chip" style="background:${hex}"></span><code>${name}</code><code class="hex">${hex}</code></div>`;
}

function card(key: string): string {
  const skin = MAIN_STREET_SKINS[key]!;
  const tag = MAIN_STREET_SKIN_TAGS[key]!;
  const p = skin.palette;
  const c = p.contrast ?? { bg: p.fg, fg: p.bg, fgMuted: p.fgMuted };
  const t = skin.type as unknown as MainStreetRoles;
  const disp = t.brand;
  const body = t.body;
  const label = t.eyebrow;

  const dispStyle = `font-family:${disp.family};font-weight:${disp.weight};letter-spacing:${disp.letterSpacing ?? '0'};${disp.uppercase ? 'text-transform:uppercase;' : ''}line-height:1.0`;
  const bodyStyle = `font-family:${body.family};font-weight:${body.weight};line-height:1.55`;
  const labelStyle = `font-family:${label.family};font-weight:${label.weight};letter-spacing:${label.letterSpacing ?? '0.18em'};text-transform:uppercase`;

  return `
  <article class="card" style="background:${p.bg};color:${p.fg}">
    <header class="card-head">
      <div class="meta">
        <span class="world" style="color:${p.accent}">${tag.world}</span>
        <span class="kkey" style="color:${p.fgMuted}">${key.replace('main-street-', '')}</span>
      </div>
      <h2 style="${dispStyle};color:${p.fg}">${skin.label}</h2>
    </header>

    <div class="specimen">
      <p class="disp" style="${dispStyle};color:${p.fg}">${DISPLAY_SAMPLE}</p>
      <p class="body" style="${bodyStyle};color:${p.fg}">${BODY_SAMPLE}</p>
      <p class="label" style="${labelStyle};color:${p.accent}">${LABEL_SAMPLE}</p>
    </div>

    <div class="contrast" style="background:${c.bg};color:${c.fg}">
      <p class="disp-sm" style="${dispStyle};color:${c.fg}">${DISPLAY_SAMPLE}</p>
      <p class="label" style="${labelStyle};color:${c.fg};opacity:.85">Contrast surface</p>
    </div>

    <div class="swatches" style="border-top:1px solid ${p.rule}">
      ${swatch(p.bg, 'bg')}
      ${swatch(p.fg, 'ink')}
      ${swatch(p.accent, 'accent')}
      ${swatch(c.bg, 'panel')}
    </div>

    <div class="fonts" style="color:${p.fgMuted}">
      <span>${disp.family.split(',')[0]!.replace(/'/g, '')}</span> ·
      <span>${body.family.split(',')[0]!.replace(/'/g, '')}</span> ·
      <span>${label.family.split(',')[0]!.replace(/'/g, '')}</span>
    </div>
  </article>`;
}

const WORLD_ORDER = ['Hearth', 'Workshop', 'Fine', 'Garden', 'Studio', 'Mystic', 'Playroom', 'Press', 'Relic'];
const keys = Object.keys(MAIN_STREET_SKINS);
const byWorld = WORLD_ORDER.map((w) => ({
  world: w,
  keys: keys.filter((k) => MAIN_STREET_SKIN_TAGS[k]!.world === w),
}));

const fontLinks = Object.values(MAIN_STREET_FONT_HREFS)
  .map((href) => `<link rel="stylesheet" href="${href}">`)
  .join('\n');

const sections = byWorld
  .map(
    (g) => `
  <section>
    <h1 class="world-head">${g.world}<span>${g.keys.length} skins</span></h1>
    <div class="grid">${g.keys.map(card).join('')}</div>
  </section>`,
  )
  .join('\n');

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Main Street — skin shelf</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
${fontLinks}
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #0c0c0d; color: #e8e8e6; font-family: ui-sans-serif, system-ui, sans-serif; padding: 40px clamp(16px,4vw,56px) 120px; }
  .page-title { font-size: 13px; letter-spacing: .28em; text-transform: uppercase; color: #8a8a86; margin: 0 0 6px; }
  .page-sub { font-size: 14px; color: #6f6f6b; margin: 0 0 48px; max-width: 60ch; line-height: 1.5; }
  section { margin-bottom: 64px; }
  .world-head { font-size: 12px; letter-spacing: .3em; text-transform: uppercase; color: #b9b9b4; border-bottom: 1px solid #232325; padding-bottom: 10px; margin: 0 0 24px; display: flex; justify-content: space-between; align-items: baseline; }
  .world-head span { color: #5a5a57; letter-spacing: .1em; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 22px; }
  .card { border-radius: 10px; overflow: hidden; box-shadow: 0 1px 0 rgba(255,255,255,.04), 0 18px 40px rgba(0,0,0,.45); display: flex; flex-direction: column; }
  .card-head { display: flex; flex-direction: column; gap: 14px; padding: 22px 24px 0; }
  .meta { display: flex; justify-content: space-between; align-items: center; font-size: 11px; letter-spacing: .18em; text-transform: uppercase; }
  .world { font-weight: 600; }
  .card-head h2 { margin: 0; font-size: 30px; }
  .specimen { padding: 8px 24px 22px; }
  .disp { margin: 6px 0 16px; font-size: 46px; }
  .disp-sm { margin: 0 0 8px; font-size: 26px; }
  .body { margin: 0 0 16px; font-size: 16px; max-width: 42ch; }
  .label { margin: 0; font-size: 12px; }
  .contrast { padding: 20px 24px; }
  .swatches { display: flex; gap: 18px; padding: 16px 24px; flex-wrap: wrap; }
  .sw { display: flex; align-items: center; gap: 7px; font-size: 11px; }
  .chip { width: 16px; height: 16px; border-radius: 3px; box-shadow: inset 0 0 0 1px rgba(128,128,128,.3); }
  .sw code { font-family: ui-monospace, monospace; opacity: .8; }
  .sw .hex { opacity: .5; }
  .fonts { padding: 0 24px 20px; font-size: 11px; letter-spacing: .04em; font-family: ui-monospace, monospace; }
</style>
</head>
<body>
  <p class="page-title">Main Street · Skin Shelf</p>
  <p class="page-sub">${keys.length} skins across ${WORLD_ORDER.length} maker-worlds. Same sample text in every card so the typeface differences show. Each card is painted in the skin's real palette; the dark/strip below the body is the skin's second (contrast) surface.</p>
  ${sections}
</body>
</html>`;

writeFileSync('skin-shelf.html', html, 'utf8');
console.log(`Wrote skin-shelf.html — ${keys.length} skins across ${WORLD_ORDER.length} worlds.`);
