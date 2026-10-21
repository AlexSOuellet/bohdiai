/**
 * Main Street — the Scenic family's stylesheet (Session 107; from Saltmarsh's
 * Shoreline design). The site's scene is the family texture layer, fixed behind
 * the page and painted cover; everything else floats over it: words on frosted
 * panes, pieces as matted prints. Colors are the skin's vars only, so any skin
 * prints it; the tilts are nth-child rules, never inline. Joined into chrome's
 * stylesheet.
 */

/** Tilt and drop of each print, repeating every six (Shoreline's rhythm). */
const PRINTS: readonly { r: number; y: number }[] = [
  { r: -1.2, y: 0 },
  { r: 0.8, y: 40 },
  { r: -0.6, y: 16 },
  { r: 1.4, y: 0 },
  { r: -1.6, y: 32 },
  { r: 0.6, y: 10 },
];

const prints = PRINTS.map(
  (p, i) => `.arch-main-street .ms-sc-prints > li:nth-child(6n+${i + 1}),.arch-main-street .ms-sc-frames-row > a:nth-child(6n+${i + 1}){--sc-r:${p.r}deg;--sc-y:${p.y}px}`,
).join('\n    ');

const F = '.arch-main-street[data-ms-family="scenic"]';

export const SCENIC_CSS = `

    /* ── THE PAGE — the scene behind everything, a soft dusk at the foot so words
       low on the screen stay readable, and every shared section made see-through. */
    ${F}{--sc-glass:color-mix(in srgb,var(--ms-bg) 82%,transparent);--sc-glass-strong:color-mix(in srgb,var(--ms-bg) 92%,transparent);--sc-lift:0 22px 40px -18px rgba(8,18,24,.55);background:var(--ms-contrast-bg)}
    ${F}::after{content:"";position:fixed;inset:0;z-index:-1;pointer-events:none;background:linear-gradient(180deg,transparent 45%,color-mix(in srgb,var(--ms-contrast-bg) 22%,transparent) 100%)}
    ${F} section,${F} .ms-fu-section,${F} .ms-coll-section,${F} .ms-rev-section{background:transparent}
    ${F} .ms-goodshead{display:block;margin-bottom:clamp(28px,4vw,48px)}
    ${F} .ms-goodshead > div{display:inline-block;padding:14px 22px;background:var(--sc-glass);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
    ${F} .ms-goodshead-cue{display:inline-block;margin-left:14px;padding:10px 16px;background:var(--sc-glass);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
    ${F} .ms-shopcue-btn{border-radius:2px}
    ${F} .ms-mq-band{background:color-mix(in srgb,var(--ms-contrast-bg) 78%,transparent);color:var(--ms-contrast-fg);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
    ${F} .ms-close-section{width:min(820px,calc(100% - 32px));margin:clamp(48px,8vw,110px) auto;padding:clamp(40px,6vw,72px) clamp(22px,5vw,56px);background:var(--sc-glass-strong);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);box-shadow:var(--sc-lift)}
    ${F} .ms-footer{background:color-mix(in srgb,var(--ms-contrast-bg) 86%,transparent);color:var(--ms-contrast-fg);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
    ${F} .ms-footer a{color:var(--ms-contrast-fg)}
    /* Every other page: the header and the page itself on frosted sheets over the scene. */
    ${F} .ms-subheader{background:var(--sc-glass-strong);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
    ${F} .ms-subpage-main > *{position:relative}
    ${F} .ms-subpage-main{width:min(1240px,calc(100% - 24px));margin:clamp(96px,10vw,120px) auto clamp(40px,6vw,80px);padding-top:0;padding-bottom:clamp(28px,4vw,56px);background:var(--sc-glass-strong);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);box-shadow:var(--sc-lift)}

    /* ── HORIZON — the name on the open sky ─────────────────────────────── */
    .arch-main-street .ms-sc-hero{color:var(--ms-fg)}
    .arch-main-street .ms-sc-nav{display:flex;align-items:center;justify-content:space-between;padding:14px 40px;background:var(--sc-glass);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
    .arch-main-street .ms-sc-sky{padding-top:clamp(56px,11vh,130px);padding-bottom:clamp(48px,9vw,110px)}
    .arch-main-street .ms-sc-brand{margin:0;max-width:14ch;text-wrap:balance;font-size:clamp(48px,10vw,132px);line-height:.95;color:var(--ms-contrast-bg);text-shadow:0 0 30px color-mix(in srgb,var(--ms-bg) 60%,transparent);animation:ms-sc-rise 1.8s cubic-bezier(.2,.7,.2,1) .2s both}
    /* A longer headline steps down: a name fills the sky, a sentence reads as one. */
    .arch-main-street .ms-sc-brand[data-length="m"]{max-width:18ch;font-size:clamp(40px,7vw,96px);line-height:1}
    .arch-main-street .ms-sc-brand[data-length="l"]{max-width:22ch;font-size:clamp(34px,4.8vw,68px);line-height:1.05}
    .arch-main-street .ms-sc-brand[data-length="xl"]{max-width:26ch;font-size:clamp(30px,3.8vw,54px);line-height:1.1}
    .arch-main-street .ms-sc-line{margin:clamp(14px,2vw,22px) 0 0;max-width:30ch;font-style:italic;color:var(--ms-fg);text-shadow:0 0 6px color-mix(in srgb,var(--ms-bg) 95%,transparent),0 0 18px color-mix(in srgb,var(--ms-bg) 85%,transparent);animation:ms-sc-rise 1.8s cubic-bezier(.2,.7,.2,1) .55s both}
    .arch-main-street .ms-sc-sub{display:inline-block;margin:clamp(18px,2.6vw,28px) 0 0;max-width:46ch;padding:12px 18px;background:var(--sc-glass);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);color:var(--ms-fg);animation:ms-sc-rise 1.8s cubic-bezier(.2,.7,.2,1) .8s both}
    .arch-main-street .ms-sc-actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:clamp(22px,3vw,32px);animation:ms-sc-rise 1.8s cubic-bezier(.2,.7,.2,1) 1s both}
    .arch-main-street .ms-sc-cta,.arch-main-street .ms-sc-cta2{display:inline-block;padding:14px 26px;border-radius:2px;transition:background .3s,color .3s}
    .arch-main-street .ms-sc-cta{background:var(--ms-contrast-bg);color:var(--ms-contrast-fg)}
    .arch-main-street .ms-sc-cta:hover{background:var(--ms-accent);color:var(--ms-on-accent)}
    .arch-main-street .ms-sc-cta2{background:var(--sc-glass);color:var(--ms-fg);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
    .arch-main-street .ms-sc-cta2:hover{background:var(--ms-bg)}
    /* A dark photo behind: the opening's words turn light, glowing dark so they hold. */
    ${F}[data-ms-texture-tone="dark"] .ms-sc-brand{color:var(--ms-contrast-fg);text-shadow:0 2px 30px rgba(0,0,0,.45)}
    ${F}[data-ms-texture-tone="dark"] .ms-sc-line{color:var(--ms-contrast-fg);text-shadow:0 1px 12px rgba(0,0,0,.6)}
    ${F}[data-ms-texture-tone="dark"] .ms-sc-cta{background:var(--ms-bg);color:var(--ms-contrast-bg)}
    ${F}[data-ms-texture-tone="dark"]::after{background:none}
    /* A clip behind the page loops over its still, softened (and dimmed on a dark photo, like the still); motion off shows the still. */
    .arch-main-street .ms-family-video{position:fixed;inset:0;z-index:-1;width:100%;height:100%;object-fit:cover;pointer-events:none;filter:blur(5px);transform:scale(1.04)}
    ${F}[data-ms-texture-tone="dark"] .ms-family-video{filter:brightness(.42) blur(5px) saturate(.9)}
    @media (prefers-reduced-motion:reduce){.arch-main-street .ms-family-video{display:none}}
    @keyframes ms-sc-rise{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}

    /* ── PRINTS — the pieces hung in the air, a plain mat and a paper label ── */
    .arch-main-street .ms-sc-prints-section{padding:clamp(24px,4vw,48px) 0 clamp(40px,6vw,80px)}
    .arch-main-street .ms-sc-prints{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:clamp(30px,4vw,56px) clamp(22px,3.4vw,46px);align-items:start}
    ${prints}
    .arch-main-street .ms-sc-prints > li{transform:translateY(var(--sc-y,0px))}
    .arch-main-street .ms-sc-print,.arch-main-street .ms-sc-frame{display:block;color:var(--ms-fg);text-align:center;transform:rotate(var(--sc-r,0deg));transition:transform .8s cubic-bezier(.2,.7,.2,1),filter .8s;filter:drop-shadow(0 2px 2px rgba(0,0,0,.25)) drop-shadow(0 22px 26px rgba(8,18,24,.45))}
    .arch-main-street .ms-sc-print:hover,.arch-main-street .ms-sc-print:focus-visible,.arch-main-street .ms-sc-frame:hover,.arch-main-street .ms-sc-frame:focus-visible{transform:rotate(0deg) translateY(-6px);filter:drop-shadow(0 2px 2px rgba(0,0,0,.25)) drop-shadow(0 32px 34px rgba(8,18,24,.55))}
    .arch-main-street .ms-sc-print:focus-visible,.arch-main-street .ms-sc-frame:focus-visible{outline:3px solid var(--ms-contrast-bg);outline-offset:4px}
    .arch-main-street .ms-sc-mat{display:block;padding:clamp(12px,1.6vw,22px);background:var(--ms-bg)}
    .arch-main-street .ms-sc-mat .archetype-photo{display:block;width:100%;aspect-ratio:3/4;object-fit:cover;box-shadow:inset 0 0 0 1px var(--ms-rule)}
    .arch-main-street .ms-sc-label{display:flex;flex-direction:column;gap:4px;width:84%;margin:10px auto 0;padding:10px 10px 12px;background:var(--ms-bg);box-shadow:0 1px 2px rgba(0,0,0,.2)}
    .arch-main-street .ms-sc-label-name{font-size:clamp(17px,1.6vw,21px)}
    .arch-main-street .ms-sc-label-price{color:var(--ms-accent)}

    /* ── PANE — the about on frosted glass, the portrait as a matted print ── */
    .arch-main-street .ms-sc-pane-section{padding:clamp(40px,7vw,100px) 0}
    .arch-main-street .ms-sc-pane{position:relative;display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:clamp(24px,4vw,56px);align-items:center;max-width:1040px;margin:0 auto;padding:clamp(28px,5vw,56px);background:var(--sc-glass-strong);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);box-shadow:var(--sc-lift)}
    .arch-main-street .ms-sc-pane--words{grid-template-columns:minmax(0,1fr);max-width:760px}
    .arch-main-street .ms-sc-pane-photo{margin:0;transform:rotate(-1.4deg);filter:drop-shadow(0 16px 20px rgba(8,18,24,.4))}
    .arch-main-street .ms-sc-pane-photo .archetype-photo{aspect-ratio:4/5;object-position:center 30%}
    .arch-main-street .ms-sc-eyebrow{display:block;margin-bottom:10px;color:var(--ms-accent)}
    .arch-main-street .ms-sc-pane-title{margin:0 0 18px;color:var(--ms-contrast-bg)}
    .arch-main-street .ms-sc-pane-quote{margin:0;font-style:italic;color:var(--ms-fg)}
    .arch-main-street .ms-sc-pane-sig{margin-top:18px;color:var(--ms-accent)}
    .arch-main-street .ms-sc-cue{display:inline-block;margin-top:22px;padding:12px 20px;background:var(--ms-contrast-bg);color:var(--ms-contrast-fg);border-radius:2px}
    .arch-main-street .ms-sc-cue:hover{background:var(--ms-accent);color:var(--ms-on-accent)}

    /* ── FRAMES — collections as framed prints floating in a row ─────────── */
    .arch-main-street .ms-sc-frames{padding:clamp(40px,6vw,90px) 0}
    .arch-main-street .ms-sc-head{display:inline-block;margin-bottom:clamp(28px,4vw,48px);padding:14px 22px;background:var(--sc-glass);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
    .arch-main-street .ms-sc-head .ms-sc-eyebrow{margin-bottom:6px}
    .arch-main-street .ms-sc-head-title{margin:0;color:var(--ms-contrast-bg)}
    .arch-main-street .ms-sc-frames-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(240px,100%),1fr));gap:clamp(26px,4vw,48px);align-items:start}
    .arch-main-street .ms-sc-frames-row > a{transform:translateY(var(--sc-y,0px)) rotate(var(--sc-r,0deg))}
    .arch-main-street .ms-sc-frame .archetype-photo{aspect-ratio:1/1}

    /* ── TIDE — the markets on a frosted card, quiet rows ────────────────── */
    .arch-main-street .ms-sc-tide-section{padding:clamp(32px,6vw,90px) 0}
    .arch-main-street .ms-sc-tide{max-width:760px;margin:0 auto;padding:clamp(24px,4vw,40px);background:var(--sc-glass-strong);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);box-shadow:var(--sc-lift);transform:rotate(.6deg)}
    .arch-main-street .ms-sc-tide-title{margin:0 0 18px;text-align:center;color:var(--ms-contrast-bg)}
    .arch-main-street .ms-sc-tide-rows{list-style:none;margin:0;padding:0}
    .arch-main-street .ms-sc-tide-row{display:grid;grid-template-columns:minmax(0,11ch) minmax(0,1fr) auto;gap:6px 18px;align-items:baseline;padding:12px 4px;border-bottom:1px solid var(--ms-rule)}
    .arch-main-street .ms-sc-tide-row:last-child{border-bottom:0}
    .arch-main-street .ms-sc-tide-day{color:var(--ms-accent);white-space:nowrap}
    .arch-main-street .ms-sc-tide-time{color:var(--ms-fg-muted);white-space:nowrap}
    .arch-main-street .ms-sc-tide .ms-sc-cue{display:table;margin:22px auto 0}

    /* ── NOTES — reviews as paper notes, each a little turned ────────────── */
    .arch-main-street .ms-sc-notes{padding:clamp(40px,6vw,90px) 0}
    .arch-main-street .ms-sc-notes-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(260px,100%),1fr));gap:clamp(22px,3vw,36px);align-items:start}
    .arch-main-street .ms-sc-note{margin:0;padding:clamp(22px,3vw,30px);background:var(--ms-bg);box-shadow:var(--sc-lift);transform:rotate(var(--sc-r,-1deg))}
    .arch-main-street .ms-sc-note:nth-child(3n+2){--sc-r:1.2deg;margin-top:22px}
    .arch-main-street .ms-sc-note:nth-child(3n){--sc-r:-.4deg}
    .arch-main-street .ms-sc-note blockquote{margin:0}
    .arch-main-street .ms-sc-note-quote{margin:0;font-style:italic}
    .arch-main-street .ms-sc-note figcaption{display:flex;flex-direction:column;gap:2px;margin-top:16px}
    .arch-main-street .ms-sc-note-who{color:var(--ms-accent)}
    .arch-main-street .ms-sc-note-from{color:var(--ms-fg-muted)}

    @media (max-width:900px){
      .arch-main-street .ms-sc-prints{grid-template-columns:repeat(2,minmax(0,1fr))}
      .arch-main-street .ms-sc-pane{grid-template-columns:minmax(0,1fr)}
      .arch-main-street .ms-sc-pane-photo{max-width:320px}
    }
    @media (max-width:560px){
      .arch-main-street .ms-sc-nav{padding:12px 20px}
      .arch-main-street .ms-sc-prints{gap:26px 14px}
      .arch-main-street .ms-sc-prints > li{transform:none}
      .arch-main-street .ms-sc-label{width:100%}
      .arch-main-street .ms-sc-tide-row{grid-template-columns:minmax(0,1fr)}
    }
    @media (prefers-reduced-motion:reduce){
      .arch-main-street .ms-sc-brand,.arch-main-street .ms-sc-line,.arch-main-street .ms-sc-sub,.arch-main-street .ms-sc-actions{animation:none}
      .arch-main-street .ms-sc-print,.arch-main-street .ms-sc-frame{transition:none}
    }
`;
