/**
 * Main Street — the Spotlight family's stylesheet (Session 107; from Paper &
 * Patina's Show reel design). Flat color, big photos, bold panels: the opening
 * is the moment's photo with the name slammed over it, the work two to a row,
 * the about and the reviews on strong color panels, collections as billboards,
 * the dates on a ticker band. Colors are the skin's vars only. The slam's
 * letter timing is nth-child-style attribute rules, never inline; it plays once
 * on load and never hides anything from a reader with motion turned off.
 * Joined into chrome's stylesheet.
 */

/** The slam's per-letter delays (letters past the last share its delay). */
const LETTERS = 24;
const slamDelays = Array.from(
  { length: LETTERS },
  (_, i) => `.arch-main-street .ms-sp-l[data-n="${i}"]{animation-delay:${(0.2 + i * 0.06).toFixed(2)}s}`,
).join('\n    ');

const F = '.arch-main-street[data-ms-family="spotlight"]';

export const SPOTLIGHT_CSS = `

    /* ── THE PAGE — flat and dark; shared sections pick up the reel's register. */
    ${F} .ms-mq-band{background:var(--ms-accent);color:var(--ms-on-accent)}
    ${F} .ms-close-section{background:var(--ms-contrast-bg);color:var(--ms-contrast-fg);padding:clamp(80px,12vw,150px) 24px}
    ${F} .ms-close-section .ms-close-head{color:var(--ms-contrast-fg)}
    ${F} .ms-close-section .ms-close-head{max-width:16ch;margin-inline:auto}
    ${F} .ms-close-section .ms-close-cta{border-radius:0}
    ${F} .ms-shopcue-btn{border-radius:0;background:transparent;color:var(--ms-fg);border:2px solid currentColor}
    ${F} .ms-shopcue-btn:hover{background:var(--ms-fg);color:var(--ms-bg)}

    /* ── SLAM — the opening photo full bleed, the name slammed over it ───── */
    .arch-main-street .ms-sp-hero{position:relative;min-height:100svh;display:grid;place-items:center;overflow:hidden;color:var(--ms-on-media);background:var(--ms-bg)}
    .arch-main-street .ms-sp-hero--bare{color:var(--ms-fg)}
    .arch-main-street .ms-sp-hero-media{position:absolute;inset:0}
    .arch-main-street .ms-sp-hero-media .archetype-photo{width:100%;height:100%;object-fit:cover;filter:brightness(.58);animation:ms-sp-settle 6s ease-out both}
    .arch-main-street .ms-sp-nav{position:absolute;top:0;left:0;right:0;z-index:3;display:flex;align-items:center;justify-content:space-between;padding:16px clamp(16px,4vw,44px);background:linear-gradient(180deg,rgba(0,0,0,.55),transparent);color:var(--ms-on-media)}
    .arch-main-street .ms-sp-hero--bare .ms-sp-nav{background:none;color:var(--ms-fg)}
    .arch-main-street .ms-sp-hero-txt{position:relative;z-index:2;text-align:center;padding:110px 16px 90px;max-width:1200px}
    .arch-main-street .ms-sp-kick{margin:0;letter-spacing:.32em;color:inherit;opacity:.8}
    .arch-main-street .ms-sp-slam{margin:14px 0 22px;font-size:clamp(76px,12vw,190px);line-height:.86;color:inherit;overflow-wrap:anywhere}
    .arch-main-street .ms-sp-slam[data-size="m"]{font-size:clamp(60px,10vw,160px)}
    .arch-main-street .ms-sp-slam[data-size="s"]{font-size:clamp(44px,7.4vw,120px)}
    .arch-main-street .ms-sp-word{display:block}
    .arch-main-street .ms-sp-l{display:inline-block;font-style:normal;animation:ms-sp-slam .5s cubic-bezier(.2,1.6,.4,1) both}
    ${slamDelays}
    .arch-main-street .ms-sp-sub{margin:0 auto;max-width:28ch;color:inherit;animation:ms-sp-up .8s 1.4s both}
    .arch-main-street .ms-sp-actions{display:flex;flex-wrap:wrap;justify-content:center;gap:12px;margin-top:28px;animation:ms-sp-up .8s 1.7s both}
    .arch-main-street .ms-sp-go{display:inline-block;padding:14px 26px;border:2px solid currentColor;color:inherit;transition:background .25s,color .25s}
    .arch-main-street .ms-sp-hero .ms-sp-go:hover{background:var(--ms-on-media);color:#000}
    .arch-main-street .ms-sp-hero--bare .ms-sp-go:hover{background:var(--ms-fg);color:var(--ms-bg)}
    .arch-main-street .ms-sp-go--quiet{border-color:transparent;text-decoration:underline;text-underline-offset:6px}
    @keyframes ms-sp-slam{0%{transform:scale(3.2);opacity:0}100%{transform:none;opacity:1}}
    @keyframes ms-sp-up{from{opacity:0;transform:translateY(20px)}}
    @keyframes ms-sp-settle{from{transform:scale(1.08)}to{transform:none}}

    /* ── a section heading, big and left, in the reel's voice ──────────── */
    .arch-main-street .ms-sp-head{padding:clamp(56px,8vw,110px) clamp(16px,4vw,44px) clamp(22px,3vw,36px)}
    .arch-main-street .ms-sp-eyebrow{display:block;margin-bottom:10px;color:var(--ms-accent)}
    .arch-main-street .ms-sp-head-title{margin:0;max-width:18ch}
    .arch-main-street .ms-sp-more{text-align:center;padding:clamp(20px,3vw,32px) 16px clamp(56px,8vw,96px)}
    .arch-main-street .ms-sp-more .ms-sp-go{color:var(--ms-fg)}
    .arch-main-street .ms-sp-more .ms-sp-go:hover{background:var(--ms-fg);color:var(--ms-bg)}

    /* ── REEL — the work big, two to a row, quiet captions ──────────────── */
    .arch-main-street .ms-sp-reel{list-style:none;margin:0;padding:0 clamp(10px,2.4vw,28px);display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:clamp(10px,2vw,24px)}
    .arch-main-street .ms-sp-reel > .ms-sp-tile:last-child:nth-child(odd){grid-column:1/-1}
    .arch-main-street .ms-sp-reel > .ms-sp-tile:last-child:nth-child(odd) .archetype-photo{aspect-ratio:16/9}
    .arch-main-street .ms-sp-tile a{display:block;color:var(--ms-fg)}
    .arch-main-street .ms-sp-tile-img{display:block;overflow:hidden;background:color-mix(in srgb,var(--ms-fg) 8%,var(--ms-bg))}
    .arch-main-street .ms-sp-tile-img .archetype-photo{display:block;width:100%;aspect-ratio:4/5;object-fit:cover;transition:transform .9s cubic-bezier(.2,.9,.2,1)}
    .arch-main-street .ms-sp-tile a:hover .archetype-photo{transform:scale(1.035)}
    .arch-main-street .ms-sp-tile a:focus-visible{outline:3px solid var(--ms-accent);outline-offset:6px}
    .arch-main-street .ms-sp-cap{display:flex;justify-content:space-between;align-items:baseline;gap:14px;padding:14px 2px 6px}
    .arch-main-street .ms-sp-cap-price{color:var(--ms-fg-muted);white-space:nowrap}

    /* ── PANEL — the about on a bold color panel ────────────────────────── */
    .arch-main-street .ms-sp-panel{background:var(--ms-accent);color:var(--ms-on-accent);padding:clamp(70px,10vw,130px) clamp(16px,5vw,64px)}
    .arch-main-street .ms-sp-panel-in{max-width:1180px;margin:0 auto;display:grid;grid-template-columns:minmax(0,.85fr) minmax(0,1.15fr);gap:clamp(28px,5vw,72px);align-items:center}
    .arch-main-street .ms-sp-panel--words .ms-sp-panel-in{grid-template-columns:minmax(0,1fr);max-width:900px;text-align:center}
    .arch-main-street .ms-sp-panel-photo{margin:0}
    .arch-main-street .ms-sp-panel-photo .archetype-photo{display:block;width:100%;aspect-ratio:4/5;object-fit:cover;object-position:center 30%}
    .arch-main-street .ms-sp-panel .ms-sp-eyebrow{color:inherit;opacity:.8}
    .arch-main-street .ms-sp-panel-title{margin:0 0 22px;color:inherit;max-width:14ch}
    .arch-main-street .ms-sp-panel--words .ms-sp-panel-title{margin-inline:auto}
    .arch-main-street .ms-sp-panel-quote{margin:0;color:inherit;max-width:40ch}
    .arch-main-street .ms-sp-panel--words .ms-sp-panel-quote{margin-inline:auto}
    .arch-main-street .ms-sp-panel-sig{margin-top:20px;color:inherit}
    .arch-main-street .ms-sp-go--on-panel{margin-top:28px}
    .arch-main-street .ms-sp-go--on-panel:hover{background:var(--ms-on-accent);color:var(--ms-accent)}

    /* ── BILLBOARDS — each collection edge to edge, its name huge ───────── */
    .arch-main-street .ms-sp-board{position:relative;display:block;height:min(70vh,620px);overflow:hidden;color:var(--ms-on-media);margin-bottom:clamp(6px,1vw,12px)}
    .arch-main-street .ms-sp-board-img{position:absolute;inset:0}
    .arch-main-street .ms-sp-board-img .archetype-photo{width:100%;height:100%;object-fit:cover;filter:brightness(.55);transition:transform 1.2s cubic-bezier(.2,.9,.2,1),filter .6s}
    .arch-main-street .ms-sp-board:hover .archetype-photo{transform:scale(1.03);filter:brightness(.68)}
    .arch-main-street .ms-sp-board:focus-visible{outline:3px solid var(--ms-accent);outline-offset:-6px}
    .arch-main-street .ms-sp-board-txt{text-align:left;align-items:flex-start;position:absolute;left:clamp(16px,4vw,48px);right:clamp(16px,4vw,48px);bottom:clamp(22px,4vw,48px);display:flex;flex-direction:column;gap:8px}
    .arch-main-street .ms-sp-board-name{text-align:left;color:inherit;font-size:clamp(48px,8vw,120px);line-height:.9;overflow-wrap:anywhere}
    .arch-main-street .ms-sp-board-count{color:inherit;opacity:.85}

    /* ── SAYS — the customers' words huge on the contrast panel ─────────── */
    .arch-main-street .ms-sp-says{background:var(--ms-contrast-bg);color:var(--ms-contrast-fg)}
    .arch-main-street .ms-sp-says .ms-sp-head-title{color:var(--ms-contrast-fg)}
    .arch-main-street .ms-sp-says-list{padding:0 clamp(16px,4vw,44px) clamp(40px,6vw,80px)}
    .arch-main-street .ms-sp-say{margin:0;padding:clamp(28px,4vw,48px) 0;border-top:3px solid currentColor}
    .arch-main-street .ms-sp-say blockquote{margin:0}
    .arch-main-street .ms-sp-say-quote{margin:0;max-width:28ch;font-weight:700;font-size:clamp(28px,4vw,56px);line-height:1.12;color:inherit}
    .arch-main-street .ms-sp-say figcaption{display:flex;gap:14px;align-items:baseline;flex-wrap:wrap;margin-top:18px}
    .arch-main-street .ms-sp-say-who{color:var(--ms-accent)}
    .arch-main-street .ms-sp-say-from{color:var(--ms-contrast-fg-muted)}
    .arch-main-street .ms-sp-says .ms-sp-more .ms-sp-go{color:var(--ms-contrast-fg)}

    /* ── TICKER — the dates scrolling past on a bold band ────────────────── */
    .arch-main-street .ms-sp-ticker{overflow:hidden;background:var(--ms-accent);color:var(--ms-on-accent);padding:14px 0}
    .arch-main-street .ms-sp-tick-track{display:flex;width:max-content;animation:ms-sp-tick 40s linear infinite}
    .arch-main-street .ms-sp-ticker:hover .ms-sp-tick-track{animation-play-state:paused}
    .arch-main-street .ms-sp-tick-run{display:flex;align-items:baseline;gap:56px;list-style:none;margin:0;padding:0 28px;white-space:nowrap}
    .arch-main-street .ms-sp-tick-title{margin:0;color:inherit}
    .arch-main-street .ms-sp-tick-item{display:flex;align-items:baseline;gap:12px}
    .arch-main-street .ms-sp-tick-day{color:inherit}
    .arch-main-street .ms-sp-tick-where{color:inherit}
    .arch-main-street .ms-sp-tick-time{color:inherit;opacity:.8}
    @keyframes ms-sp-tick{to{transform:translateX(-50%)}}

    @media (max-width:760px){
      .arch-main-street .ms-sp-panel-in{grid-template-columns:minmax(0,1fr)}
      .arch-main-street .ms-sp-panel-photo{max-width:360px}
      .arch-main-street .ms-sp-cap{flex-direction:column;gap:4px}
      .arch-main-street .ms-sp-nav{padding:12px 16px}
    }
    @media (max-width:420px){
      .arch-main-street .ms-sp-reel{gap:8px}
    }
    @media (prefers-reduced-motion:reduce){
      .arch-main-street .ms-sp-l,.arch-main-street .ms-sp-sub,.arch-main-street .ms-sp-actions,.arch-main-street .ms-sp-hero-media .archetype-photo{animation:none}
      .arch-main-street .ms-sp-tick-track{animation:none;width:auto}
      .arch-main-street .ms-sp-tick-run{flex-wrap:wrap;white-space:normal;gap:14px 40px;padding:0 20px}
      .arch-main-street .ms-sp-tick-run[aria-hidden="true"]{display:none}
      .arch-main-street .ms-sp-tile-img .archetype-photo,.arch-main-street .ms-sp-board-img .archetype-photo{transition:none}
    }
`;
