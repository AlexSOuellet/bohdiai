/**
 * Business site (exposure tier) — the stylesheet. Built from our families: the
 * family supplies the type package (header / body / label / hand) and the
 * wallpaper; the palette is one of the family's skins (or the shop's own brand
 * palette). Played LOUD in the family's own moves, because this page sells:
 *
 *   - the opening: the name in woodtype with a pressed-in accent shadow, a
 *     hand-lettered overline, and the maker's best three pieces pinned up
 *     beside it like prints on the shop wall, stamp pressed over the corner;
 *   - the marquee: the family's loud full-width band of big display type on
 *     the accent, scrolling the owner's own words (with a quieter line under);
 *   - the about note: the bio on a pinned, taped paper note;
 *   - the work: every photo a taped print, each hung at its own slight angle;
 *   - get in touch: the form on a taped paper slip under a woodtype shout.
 *
 * Colors and fonts arrive only as CSS variables. Motion is CSS-only: load-time
 * entrances and the marquee scroll (static under reduced motion). Nothing waits
 * on a scroll observer to become visible.
 */
import type { DerivedPalette } from '@/lib/color/brand-palette';
import type { Family } from '@/lib/archetypes/main-street/families';
import { relativeLuminance } from '@/lib/archetypes/main-street/logo-contrast';
import { MARQUEE_SECONDS } from './marquee';

const svg = (markup: string): string => `url("data:image/svg+xml,${encodeURIComponent(markup)}")`;

/** A hand-drawn swash — used as a mask so it takes the accent. */
const SWASH = svg(
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 24' preserveAspectRatio='none'><path d='M4 15c38-6 79-9 121-8 33 1 61 6 95 5 47-1 92-8 139-6 14 1 26 3 37 5l-1 5c-36-4-73-4-110-1-40 3-78 8-119 7-31-1-60-6-92-6-24 0-47 2-70 6z'/></svg>",
);

/** A torn edge for the bottom of the marquee band. */
const TORN = svg(
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 10' preserveAspectRatio='none'><path d='M0 0h100v6l-3 2-4-2-5 3-4-2-6 2-3-3-5 3-6-1-4 2-5-3-4 2-6-2-3 3-5-2-6 2-4-3-5 2-4-1-5 2-3-2-4 1z'/></svg>",
);

const font = (name: string, fallback: string): string => `'${name}',${fallback}`;

export function cardCss(p: DerivedPalette, family: Family): string {
  const t = family.typePackage;
  // The wallpaper deepens a light ground and lightens a dark one.
  const blend = relativeLuminance(p.bg) > 0.4 ? 'multiply' : 'screen';
  return `
.bc{
  --bc-bg:${p.bg};--bc-fg:${p.fg};--bc-muted:${p.fgMuted};--bc-accent:${p.accent};--bc-on-accent:${p.onAccent};--bc-rule:${p.rule};
  --bc-paper:color-mix(in oklab,var(--bc-bg) 86%,var(--bc-fg));--bc-note:color-mix(in oklab,var(--bc-bg) 30%,#fff);
  --bc-tape:color-mix(in oklab,var(--bc-bg) 60%,transparent);
  --bc-head:${font(t.header, 'Georgia,serif')};--bc-body:${font(t.body, 'Georgia,serif')};
  --bc-label:${font(t.label, "'Courier New',monospace")};--bc-hand:${font(t.accent, 'cursive')};
  --bc-wrap:1200px;--bc-gutter:clamp(20px,5vw,56px);--bc-band:clamp(84px,11vw,150px);
  --bc-print-shadow:0 2px 0 color-mix(in oklab,var(--bc-fg) 12%,transparent),0 22px 40px -22px rgb(0 0 0 / .55);
  position:relative;isolation:isolate;background:var(--bc-bg);color:var(--bc-fg);
  font-family:var(--bc-body);font-size:18px;line-height:1.7;-webkit-font-smoothing:antialiased;overflow-x:clip;
}
.bc *,.bc *::before,.bc *::after{box-sizing:border-box}
.bc::before{content:"";position:fixed;inset:0;z-index:-1;pointer-events:none;background:url('${family.wallpaperUrl}') center/480px repeat;opacity:${family.textureOpacity};mix-blend-mode:${blend}}
.bc :where(a){color:inherit}
.bc img{display:block;max-width:100%}
.bc h1,.bc h2,.bc p,.bc figure,.bc ul{margin:0}
.bc :focus-visible{outline:3px solid var(--bc-accent);outline-offset:3px}
.bc-skip{position:absolute;left:-9999px;top:8px;z-index:60;background:var(--bc-accent);color:var(--bc-on-accent);padding:10px 16px;font-family:var(--bc-label)}
.bc-skip:focus{left:8px}
.bc-wrap{width:100%;max-width:var(--bc-wrap);margin-inline:auto;padding-inline:var(--bc-gutter)}
.bc-hand{font-family:var(--bc-hand);color:var(--bc-accent);font-weight:400;line-height:1.1}
.bc-shout{font-family:var(--bc-head);font-weight:400;line-height:.95;letter-spacing:.005em;text-wrap:balance;
  text-shadow:3px 3px 0 color-mix(in oklab,var(--bc-accent) 85%,transparent)}
.bc-label{font-family:var(--bc-label);font-size:14px;letter-spacing:.16em;text-transform:uppercase}

/* a print: the photo on white-ish stock, taped up at its own angle */
.bc-print{position:relative;display:block;background:var(--bc-note);padding:10px 10px 12px;box-shadow:var(--bc-print-shadow)}
.bc-print::before{content:"";position:absolute;top:-12px;left:50%;width:84px;height:26px;margin-left:-42px;background:var(--bc-tape);
  box-shadow:0 1px 2px rgb(0 0 0 / .12);transform:rotate(-3deg);backdrop-filter:blur(1px);z-index:2}
.bc-print img{width:100%;aspect-ratio:4/3;object-fit:cover}

/* ── Top bar ─────────────────────────────── */
.bc-bar{display:flex;justify-content:space-between;align-items:center;gap:20px;padding:20px var(--bc-gutter);border-bottom:2px solid var(--bc-fg)}
.bc-brand{font-family:var(--bc-head);font-size:24px;line-height:1;text-decoration:none}
.bc-bar nav{display:flex;gap:28px}
.bc-bar nav a{font-family:var(--bc-label);font-size:14px;letter-spacing:.16em;text-transform:uppercase;text-decoration:none;padding:4px 0;border-bottom:2px solid transparent;transition:border-color .2s,color .2s}
.bc-bar nav a:hover{color:var(--bc-accent);border-color:var(--bc-accent)}

/* ── Opening ─────────────────────────────── */
.bc-open{display:grid;grid-template-columns:minmax(0,11fr) minmax(0,9fr);gap:clamp(32px,5vw,72px);align-items:center;
  max-width:var(--bc-wrap);margin:0 auto;padding:clamp(44px,7vw,96px) var(--bc-gutter) clamp(60px,8vw,110px)}
.bc-over{display:inline-block;font-size:clamp(22px,2.4vw,30px);transform:rotate(-3deg);transform-origin:left bottom;animation:bc-rise .8s .1s both}
.bc-name{font-family:var(--bc-head);font-weight:400;line-height:.9;letter-spacing:.005em;font-size:clamp(64px,10.5vw,150px);margin:10px 0 0;overflow-wrap:anywhere;
  text-shadow:4px 4px 0 var(--bc-accent),8px 8px 0 color-mix(in oklab,var(--bc-fg) 18%,transparent);animation:bc-press .9s .15s cubic-bezier(.2,.8,.2,1) both}
.bc-swash{display:block;width:min(420px,80%);height:16px;margin:18px 0 0;background:var(--bc-accent);-webkit-mask:${SWASH} center/100% 100% no-repeat;mask:${SWASH} center/100% 100% no-repeat;animation:bc-draw 1s .55s both}
.bc-headline{font-size:clamp(19px,1.9vw,23px);line-height:1.55;max-width:34ch;margin:22px 0 0;animation:bc-rise .9s .4s both}
.bc-actions{display:flex;flex-wrap:wrap;gap:14px;margin-top:32px;animation:bc-rise .9s .5s both}
.bc-btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;padding:16px 26px;font-family:var(--bc-label);font-size:15px;letter-spacing:.14em;text-transform:uppercase;text-decoration:none;
  border:2px solid var(--bc-fg);background:transparent;color:var(--bc-fg);cursor:pointer;box-shadow:4px 4px 0 var(--bc-fg);transition:transform .15s,box-shadow .15s,background .2s,color .2s}
.bc-btn:hover{transform:translate(-2px,-2px);box-shadow:6px 6px 0 var(--bc-fg)}
.bc-btn:active{transform:translate(2px,2px);box-shadow:1px 1px 0 var(--bc-fg)}
.bc-btn--solid{background:var(--bc-accent);border-color:var(--bc-fg);color:var(--bc-on-accent)}

/* the wall of three prints, stamp pressed over the corner */
.bc-wall{position:relative;min-height:clamp(320px,36vw,480px)}
.bc-wall .bc-print{position:absolute;width:62%}
.bc-wall .bc-print:nth-child(1){left:2%;top:4%;transform:rotate(-5deg);z-index:1;animation:bc-pin .8s .35s both}
.bc-wall .bc-print:nth-child(2){right:0;top:18%;transform:rotate(4deg);z-index:2;animation:bc-pin .8s .5s both}
.bc-wall .bc-print:nth-child(3){left:18%;bottom:0;transform:rotate(-1.5deg);z-index:3;animation:bc-pin .8s .65s both}
.bc-wall .bc-print:only-child{position:relative;width:100%;transform:rotate(-2deg)}
.bc-mark{position:absolute;right:-6px;bottom:-14px;z-index:5;width:118px;height:118px;border-radius:50%;display:grid;place-items:center;color:var(--bc-accent);background:var(--bc-bg);
  border:2px solid currentColor;box-shadow:inset 0 0 0 5px var(--bc-bg),inset 0 0 0 6.5px currentColor,0 10px 24px -14px rgb(0 0 0 / .5);
  transform:rotate(-12deg);animation:bc-stamp .7s 1s cubic-bezier(.3,1.6,.5,1) both}
.bc-mark svg{position:absolute;inset:0;width:100%;height:100%}
.bc-mark text{font-family:var(--bc-label);font-size:9px;letter-spacing:.2em;fill:currentColor;text-transform:uppercase}
.bc-mark b{font-family:var(--bc-head);font-weight:400;font-size:30px;line-height:1}

/* ── Marquee: the family's loud band ─────── */
.bc-marquee{position:relative;background:var(--bc-accent);color:var(--bc-on-accent);overflow:hidden;padding:20px 0 26px;transform:rotate(-1.2deg);margin:0 -12px;
  border-block:3px solid var(--bc-fg)}
.bc-marquee::after{content:"";position:absolute;left:0;right:0;bottom:-1px;height:10px;background:var(--bc-bg);-webkit-mask:${TORN} center/100% 100% no-repeat;mask:${TORN} center/100% 100% no-repeat}
.bc-marquee__row{display:flex;width:max-content;animation:bc-scroll ${MARQUEE_SECONDS}s linear infinite}
.bc-marquee__row span{font-family:var(--bc-head);font-size:clamp(34px,5vw,64px);line-height:1;white-space:nowrap;padding-right:.6em}
.bc-marquee__row span::after{content:"★";padding-left:.6em;font-size:.6em;vertical-align:middle;opacity:.8}
.bc-marquee__row--quiet{animation-direction:reverse;animation-duration:88s;margin-top:10px;opacity:.75}
.bc-marquee__row--quiet span{font-family:var(--bc-label);font-size:15px;letter-spacing:.2em;text-transform:uppercase;padding-right:2.4em}
.bc-marquee__row--quiet span::after{content:none}
/* Market dates: in the dark ink so they stand apart from the big words. The row's loop time is
   worked out per site (marqueeDatesSeconds) so the dates travel at the same speed as the words above. */
.bc-marquee__row--dates{color:var(--bc-fg);opacity:1}
/* Paused while the pointer is over the band, and held by a click or tap until the next one. */
.bc-marquee{cursor:pointer}
.bc-marquee.is-held .bc-marquee__row{animation-play-state:paused}
@media (hover:hover){.bc-marquee:hover .bc-marquee__row{animation-play-state:paused}}
.bc-marquee__row--dates span{font-family:var(--bc-body);font-weight:700;font-size:clamp(18px,1.8vw,22px);letter-spacing:.04em;text-transform:none}
.bc-sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}

/* ── About: the pinned note ──────────────── */
.bc-about{padding-block:var(--bc-band)}
.bc-about__in{display:grid;grid-template-columns:minmax(0,4fr) minmax(0,6fr);gap:clamp(36px,6vw,96px);align-items:start}
.bc-about__head .bc-hand{display:block;font-size:clamp(24px,2.4vw,30px);transform:rotate(-3deg);margin-bottom:8px}
.bc-about__head h2{font-size:clamp(40px,5vw,68px)}
.bc-note{position:relative;background:var(--bc-note);padding:clamp(28px,4vw,48px);transform:rotate(1deg);box-shadow:var(--bc-print-shadow);
  background-image:repeating-linear-gradient(180deg,transparent 0 33px,color-mix(in oklab,var(--bc-accent) 16%,transparent) 33px 34px)}
.bc-note::before,.bc-note::after{content:"";position:absolute;top:-13px;width:96px;height:28px;background:var(--bc-tape);box-shadow:0 1px 2px rgb(0 0 0 / .12)}
.bc-note::before{left:-18px;transform:rotate(-28deg)}
.bc-note::after{right:-18px;transform:rotate(24deg)}
.bc-note p{margin-bottom:1.1em;line-height:1.75}
.bc-note p:first-child{font-size:clamp(20px,1.9vw,23px)}
.bc-sig{display:block;font-family:var(--bc-hand);font-size:42px;line-height:1;color:var(--bc-accent);transform:rotate(-4deg);transform-origin:left center;margin-top:6px}

/* ── The work: a wall of prints ──────────── */
.bc-work{padding-bottom:var(--bc-band)}
.bc-work__head{display:flex;justify-content:space-between;align-items:end;gap:24px;margin-bottom:56px}
.bc-work__head .bc-hand{display:block;font-size:clamp(24px,2.4vw,30px);transform:rotate(-3deg);margin-bottom:8px}
.bc-work__head h2{font-size:clamp(44px,6vw,84px)}
.bc-work__head p{max-width:30ch;font-size:16px;color:var(--bc-muted)}
.bc-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:clamp(36px,4vw,56px) clamp(24px,3vw,40px);list-style:none;padding:0}
.bc-grid > li:nth-child(4n+1) .bc-print{transform:rotate(-2.2deg)}
.bc-grid > li:nth-child(4n+2) .bc-print{transform:rotate(1.6deg)}
.bc-grid > li:nth-child(4n+3) .bc-print{transform:rotate(-.8deg)}
.bc-grid > li:nth-child(4n) .bc-print{transform:rotate(2.4deg)}
.bc-tile{display:block;width:100%;cursor:zoom-in;background:none;border:0;padding:0;color:inherit;font:inherit;text-align:left}
.bc-tile .bc-print{transition:transform .35s cubic-bezier(.2,.7,.1,1),box-shadow .35s}
.bc-tile:hover .bc-print,.bc-tile:focus-visible .bc-print{transform:rotate(0) scale(1.03);box-shadow:0 30px 50px -24px rgb(0 0 0 / .6)}
.bc-tile__cap{display:block;margin-top:14px;font-family:var(--bc-hand);font-size:19px;line-height:1.2;color:var(--bc-fg);text-align:center}

.bc-lb{position:fixed;inset:0;z-index:70;display:grid;place-items:center;background:color-mix(in oklab,var(--bc-fg) 90%,transparent);padding:clamp(16px,4vw,60px);animation:bc-fade .25s both}
.bc-lb figure{display:grid;gap:14px;justify-items:center;max-height:100%}
.bc-lb img{max-height:78vh;max-width:min(1200px,92vw);object-fit:contain;background:var(--bc-note);padding:12px}
.bc-lb figcaption{font-family:var(--bc-hand);color:var(--bc-bg);font-size:22px;text-align:center}
.bc-lb button{position:absolute;display:grid;place-items:center;background:var(--bc-accent);border:0;color:var(--bc-on-accent);width:54px;height:54px;border-radius:50%;font-size:24px;line-height:1;cursor:pointer;transition:transform .2s}
.bc-lb button:hover{transform:scale(1.08)}
.bc-lb__close{top:18px;right:18px}
.bc-lb__prev{left:18px;top:calc(50% - 27px)}
.bc-lb__next{right:18px;top:calc(50% - 27px)}

/* ── Get in touch ────────────────────────── */
.bc-touch{background:var(--bc-paper);padding-block:var(--bc-band);border-top:3px solid var(--bc-fg)}
.bc-touch__in{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,6fr);gap:clamp(36px,6vw,96px);align-items:start}
.bc-touch__head .bc-hand{display:block;font-size:clamp(24px,2.4vw,30px);transform:rotate(-3deg);margin-bottom:8px}
.bc-touch__head h2{font-size:clamp(56px,8vw,112px)}
.bc-touch__lede{margin:22px 0 30px;font-size:19px;max-width:32ch}
.bc-ways{display:grid;gap:14px}
.bc-way{display:flex;align-items:center;gap:16px;padding:14px 18px;border:2px solid var(--bc-fg);background:var(--bc-bg);text-decoration:none;box-shadow:4px 4px 0 var(--bc-fg);transition:transform .15s,box-shadow .15s}
.bc-way:hover{transform:translate(-2px,-2px);box-shadow:6px 6px 0 var(--bc-accent)}
.bc-way small{display:block;font-family:var(--bc-label);font-size:13px;letter-spacing:.16em;text-transform:uppercase;color:var(--bc-accent)}
.bc-way svg{width:26px;height:26px;flex:none}
.bc-slip{position:relative;background:var(--bc-note);padding:clamp(26px,3.5vw,42px);transform:rotate(-.8deg);box-shadow:var(--bc-print-shadow)}
.bc-slip::before{content:"";position:absolute;top:-13px;left:50%;width:110px;height:28px;margin-left:-55px;background:var(--bc-tape);transform:rotate(2deg);box-shadow:0 1px 2px rgb(0 0 0 / .12)}
.bc-form{display:grid;gap:18px;align-content:start}
.bc-form label{display:grid;gap:6px;font-family:var(--bc-label);font-size:14px;letter-spacing:.12em;text-transform:uppercase}
.bc-form input,.bc-form textarea{font:400 17px/1.5 var(--bc-body);letter-spacing:normal;text-transform:none;padding:12px 2px;border:0;border-bottom:2px solid var(--bc-fg);border-radius:0;background:transparent;color:var(--bc-fg)}
.bc-form textarea{min-height:130px;resize:vertical;border:2px solid var(--bc-fg);padding:12px 14px;margin-top:4px}
.bc-form input:focus,.bc-form textarea:focus{outline:none;border-color:var(--bc-accent)}
.bc-form__row{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.bc-form .bc-btn{justify-self:start}
.bc-form .bc-btn:disabled{opacity:.6;cursor:progress;transform:none}
.bc-form__trap{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}
.bc-form__status{font-weight:600;color:var(--bc-accent)}
.bc-form__done{display:grid;gap:16px;align-content:start;font-family:var(--bc-hand);font-size:26px;line-height:1.3;color:var(--bc-accent)}
.bc-form__done .bc-btn{justify-self:start;font-size:14px}

/* ── Footer + plain pages ────────────────── */
.bc-foot{background:var(--bc-fg);color:var(--bc-bg);padding:clamp(36px,5vw,56px) var(--bc-gutter) 26px}
.bc-foot__name{display:block;font-family:var(--bc-head);font-size:clamp(44px,8vw,110px);line-height:.9;color:color-mix(in oklab,var(--bc-bg) 22%,transparent);margin-bottom:22px;overflow-wrap:anywhere}
.bc-foot__row{display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px 24px;font-family:var(--bc-label);font-size:14px;letter-spacing:.06em}
.bc-foot nav{display:flex;flex-wrap:wrap;gap:12px 22px}
.bc-foot a{text-decoration:none}
.bc-foot a:hover{color:var(--bc-accent)}
.bc-prose{max-width:760px;margin:0 auto;padding:clamp(40px,7vw,88px) var(--bc-gutter)}
.bc-prose h1,.bc-prose h2,.bc-prose h3{font-family:var(--bc-head);font-weight:400;line-height:1.1;margin:1.4em 0 .5em}
.bc-prose h1{font-size:clamp(36px,5vw,52px);margin-top:0}
.bc-prose p,.bc-prose li{color:var(--bc-muted);margin:0 0 1em}

@keyframes bc-rise{from{opacity:0;transform:translateY(18px)}}
@keyframes bc-press{from{opacity:0;transform:translate(-6px,-10px);text-shadow:0 0 0 var(--bc-accent)}}
@keyframes bc-draw{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0 0 0)}}
@keyframes bc-pin{from{opacity:0;translate:0 -28px;scale:1.06}}
@keyframes bc-stamp{from{opacity:0;transform:scale(1.7) rotate(-34deg)}}
@keyframes bc-scroll{to{transform:translateX(-50%)}}
@keyframes bc-fade{from{opacity:0}}
@media (prefers-reduced-motion:reduce){.bc *,.bc *::before{animation:none!important;transition:none!important}}

@media (max-width:860px){
  .bc-bar nav{display:none}
  .bc-open{grid-template-columns:1fr;text-align:left}
  .bc-wall{min-height:auto;display:grid;grid-template-columns:1fr 1fr;gap:18px;padding:10px 4px 30px}
  .bc-wall .bc-print{position:relative;width:auto;inset:auto}
  .bc-wall .bc-print:nth-child(1){grid-column:1/3}
  .bc-mark{width:92px;height:92px;right:0;bottom:-6px}
  .bc-mark b{font-size:24px}
  .bc-about__in,.bc-touch__in{grid-template-columns:1fr}
  .bc-work__head{flex-direction:column;align-items:start}
  .bc-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:30px 18px}
  .bc-tile__cap{font-size:16px}
  .bc-form__row{grid-template-columns:1fr}
  .bc-lb__prev,.bc-lb__next{top:auto;bottom:18px}
}
`;
}
