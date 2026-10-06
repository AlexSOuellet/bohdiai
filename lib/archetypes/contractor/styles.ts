/**
 * Contractor — the stylesheet. One organizing idea: THE PAGE IS LAID LIKE SOD.
 * Bare-soil ground, sections rolled out in strips (green seamed bands that
 * unroll as you scroll), heavy condensed capitals like truck lettering, and the
 * hand-painted green brush stroke off the business's own flyer.
 *
 * Colors arrive only as the derived brand palette → CSS variables. Motion is
 * CSS-only: load stagger on the hero, scroll-driven unrolls where supported
 * (content is fully visible where it isn't — nothing waits on JS to appear).
 */
import type { DerivedPalette } from '@/lib/color/brand-palette';

export const CONTRACTOR_FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Anton&family=Barlow:ital,wght@0,400;0,500;0,600;1,400&family=Barlow+Condensed:wght@500;600;700&family=Permanent+Marker&display=swap';

const svg = (markup: string): string => `url("data:image/svg+xml,${encodeURIComponent(markup)}")`;

/** A rough dry-brush swipe — the flyer's green stroke. Used as a mask. */
const BRUSH = svg(
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 60' preserveAspectRatio='none'><path d='M7 15C58 6 131 11 204 7c70-4 128 1 189-2l4 14c-31 4-22 10 2 15l-5 17c-70 5-139-2-209 3-72 5-121-3-181 1L3 39c17-6 4-11 9-17z'/></svg>",
);

/** Soil grain — fractal noise, screened lightly over the dark ground. */
const GRAIN = svg(
  "<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>",
);

/** Torn soil edge along the bottom of the hero video slab. */
const SOIL_EDGE = svg(
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'><path d='M0 0h100v93l-4 3-5-2-6 4-7-3-5 3-8-2-6 3-5-4-7 3-6-2-5 3-8-3-6 2-5-3-7 4-5-2-5 1z'/></svg>",
);

export function contractorCss(p: DerivedPalette): string {
  return `
.cp{
  --cp-bg:${p.bg};--cp-fg:${p.fg};--cp-muted:${p.fgMuted};--cp-accent:${p.accent};--cp-on-accent:${p.onAccent};
  --cp-rule:${p.rule};--cp-bg2:${p.contrast.bg};--cp-fg2:${p.contrast.fg};--cp-muted2:${p.contrast.fgMuted};
  --cp-display:'Anton',Impact,'Arial Narrow',sans-serif;--cp-body:'Barlow',system-ui,sans-serif;
  --cp-label:'Barlow Condensed','Arial Narrow',sans-serif;--cp-marker:'Permanent Marker','Comic Sans MS',cursive;
  --cp-wrap:1240px;--cp-gutter:clamp(20px,4vw,48px);--cp-section:clamp(72px,9vw,128px);
  position:relative;isolation:isolate;background:var(--cp-bg);color:var(--cp-fg);
  font-family:var(--cp-body);font-size:18px;line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:clip;
}
.cp *,.cp *::before,.cp *::after{box-sizing:border-box}
.cp::before{content:"";position:fixed;inset:0;z-index:-1;pointer-events:none;background-image:${GRAIN};opacity:.07;mix-blend-mode:screen}
.cp a{color:inherit}
.cp img,.cp video{display:block;max-width:100%}
.cp :focus-visible{outline:3px solid var(--cp-accent);outline-offset:3px}
.cp-wrap{width:100%;max-width:var(--cp-wrap);margin-inline:auto;padding-inline:var(--cp-gutter)}
.cp-skip{position:absolute;left:-9999px;top:8px;z-index:60;background:var(--cp-accent);color:var(--cp-on-accent);padding:10px 16px;font-family:var(--cp-label);font-weight:700;text-transform:uppercase;letter-spacing:.08em}
.cp-skip:focus{left:8px}

/* ── type voices ─────────────────────────────────────────── */
.cp-eyebrow{font-family:var(--cp-label);font-weight:700;font-size:15px;letter-spacing:.22em;text-transform:uppercase;color:var(--cp-accent);display:flex;align-items:center;gap:14px;margin:0 0 22px}
.cp-eyebrow::before{content:"";width:34px;height:3px;background:currentColor}
.cp-title{font-family:var(--cp-display);font-weight:400;text-transform:uppercase;line-height:.92;letter-spacing:.005em;font-size:clamp(38px,5vw,68px);margin:0;text-wrap:balance}
.cp-lede{font-size:clamp(18px,1.6vw,21px);color:var(--cp-muted);max-width:56ch;margin:22px 0 0}
.cp-brush{display:inline-block;position:relative;font-family:var(--cp-marker);color:var(--cp-on-accent);padding:.18em .7em .12em;transform:rotate(-2.5deg);line-height:1.1}
.cp-brush::before{content:"";position:absolute;inset:0;z-index:-1;background:var(--cp-accent);-webkit-mask:${BRUSH} center/100% 100% no-repeat;mask:${BRUSH} center/100% 100% no-repeat}

/* ── buttons ─────────────────────────────────────────────── */
.cp-btn{display:inline-flex;align-items:center;gap:12px;font-family:var(--cp-label);font-weight:700;font-size:18px;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;padding:18px 28px;border:2px solid var(--cp-accent);transition:transform .25s ease,background .25s ease,color .25s ease;cursor:pointer}
.cp-btn svg{width:20px;height:20px;flex:none}
.cp-btn--solid{background:var(--cp-accent);color:var(--cp-on-accent)}
.cp-btn--solid:hover{transform:translateY(-2px);box-shadow:0 10px 0 -4px color-mix(in srgb,var(--cp-accent) 35%,transparent)}
.cp-btn--line{background:transparent;color:var(--cp-fg);border-color:var(--cp-rule)}
.cp-btn--line:hover{border-color:var(--cp-accent);color:var(--cp-accent)}

/* ── header ──────────────────────────────────────────────── */
.cp-head{position:sticky;top:0;z-index:40;background:color-mix(in srgb,var(--cp-bg) 86%,transparent);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-bottom:1px solid var(--cp-rule)}
.cp-head__row{display:flex;align-items:center;justify-content:space-between;gap:20px;min-height:76px}
.cp-mark{text-decoration:none;display:flex;flex-direction:column;line-height:1}
.cp-mark__name{font-family:var(--cp-display);font-size:26px;letter-spacing:.02em;text-transform:uppercase}
.cp-mark__trade{font-family:var(--cp-label);font-weight:600;font-size:12.5px;letter-spacing:.26em;text-transform:uppercase;color:var(--cp-accent);margin-top:5px}
.cp-head__actions{display:flex;align-items:center;gap:12px}
.cp-head .cp-btn{padding:12px 18px;font-size:16px}
@media(max-width:720px){.cp-head .cp-btn--line{display:none}.cp-head .cp-btn__text{display:none}.cp-head .cp-btn--solid{padding:12px 14px}}

/* ── hero ────────────────────────────────────────────────── */
.cp-hero{position:relative;padding-block:clamp(40px,6vw,88px) clamp(56px,8vw,112px)}
.cp-hero__grid{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr);gap:clamp(32px,5vw,80px);align-items:center}
.cp-hero__kicker{font-family:var(--cp-label);font-weight:600;font-size:15px;letter-spacing:.24em;text-transform:uppercase;color:var(--cp-muted);margin:0 0 30px}
.cp-hero__marker{font-size:clamp(19px,1.9vw,25px);margin:0 0 20px}
.cp-hero__headline{font-family:var(--cp-display);font-weight:400;text-transform:uppercase;line-height:.95;font-size:clamp(44px,5.8vw,84px);margin:0;text-wrap:balance}
.cp-hero__headline em{font-style:normal;color:var(--cp-accent)}
.cp-hero__sub{font-size:clamp(18px,1.55vw,21px);color:var(--cp-muted);max-width:44ch;margin:28px 0 0}
.cp-hero__ctas{display:flex;flex-wrap:wrap;gap:14px;margin-top:38px}
.cp-hero__area{margin:34px 0 0;font-family:var(--cp-label);font-weight:600;font-size:15px;letter-spacing:.18em;text-transform:uppercase;color:var(--cp-muted);display:flex;flex-wrap:wrap;gap:8px 16px;align-items:center}
.cp-hero__area span+span::before{content:"";display:inline-block;width:6px;height:6px;background:var(--cp-accent);margin-right:16px;vertical-align:middle;transform:rotate(45deg)}
.cp-slab{position:relative;justify-self:end;width:min(100%,460px);aspect-ratio:9/16;max-height:82svh}
.cp-slab__media{position:absolute;inset:0;overflow:hidden;-webkit-mask:${SOIL_EDGE} center/100% 100% no-repeat;mask:${SOIL_EDGE} center/100% 100% no-repeat;background:var(--cp-bg2)}
.cp-slab__media video,.cp-slab__media img{width:100%;height:100%;object-fit:cover}
.cp-slab::before{content:"";position:absolute;inset:18px -18px -18px 18px;border:2px solid var(--cp-accent);z-index:-1}
.cp-slab__since{position:absolute;left:-58px;bottom:12%;writing-mode:vertical-rl;transform:rotate(180deg);font-family:var(--cp-display);font-size:30px;letter-spacing:.14em;text-transform:uppercase;color:var(--cp-fg)}
@media(max-width:900px){
  .cp-hero__grid{grid-template-columns:1fr}
  /* phones: the words first, then the video beneath them, edge to edge */
  .cp-slab{justify-self:stretch;width:calc(100% + 2*var(--cp-gutter));margin-inline:calc(-1*var(--cp-gutter));aspect-ratio:auto;height:62svh;max-height:none}
  .cp-slab::before,.cp-slab__since{display:none}
}
@media(prefers-reduced-motion:no-preference){
  .cp-rise{animation:cp-rise .9s cubic-bezier(.2,.7,.2,1) both}
  .cp-rise:nth-child(2){animation-delay:.08s}.cp-rise:nth-child(3){animation-delay:.18s}.cp-rise:nth-child(4){animation-delay:.28s}
  .cp-rise:nth-child(5){animation-delay:.38s}.cp-rise:nth-child(6){animation-delay:.48s}
  .cp-slab{animation:cp-lay 1.3s cubic-bezier(.7,0,.2,1) .15s both}
}
@keyframes cp-rise{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:none}}
@keyframes cp-lay{from{clip-path:inset(0 0 100% 0)}to{clip-path:inset(0 0 -40px -80px)}}

/* ── statement design: a full-width photo, the owner oversized in front ── */
.cp-stmt{--cp-stmt-pad:clamp(56px,7vw,104px);position:relative;z-index:2;display:flex;align-items:center;min-height:min(86svh,880px);padding-block:var(--cp-stmt-pad)}
.cp-stmt__stage{position:absolute;inset:0;z-index:-1}
.cp-stmt__bg{position:absolute;inset:0;overflow:hidden}
.cp-stmt__bg img,.cp-stmt__bg video{width:100%;height:100%;object-fit:cover}
.cp-stmt__bg::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,color-mix(in srgb,var(--cp-bg) 96%,transparent) 0%,color-mix(in srgb,var(--cp-bg) 84%,transparent) 38%,color-mix(in srgb,var(--cp-bg) 30%,transparent) 66%,color-mix(in srgb,var(--cp-bg) 10%,transparent) 100%),linear-gradient(0deg,var(--cp-bg) 0%,transparent 26%)}
.cp .cp-stmt__cutout{position:absolute;right:max(var(--cp-gutter),calc((100% - var(--cp-wrap))/2));bottom:-96px;height:calc(100% + 40px);width:auto;max-width:none;filter:drop-shadow(0 34px 44px rgba(0,0,0,.5));pointer-events:none;-webkit-mask:linear-gradient(180deg,#000 82%,transparent);mask:linear-gradient(180deg,#000 82%,transparent)}
.cp-stmt__words{position:relative}
.cp-stmt__words>*{max-width:600px}
.cp-stmt__headline{font-family:var(--cp-display);font-weight:400;text-transform:uppercase;line-height:.96;font-size:clamp(40px,4.4vw,64px);margin:0;text-wrap:balance}
.cp-stmt__headline em{font-style:normal;color:var(--cp-accent)}
.cp--statement .cp-strip{height:1px;background:var(--cp-rule);animation:none}
@media(max-width:900px){
  .cp-stmt{display:block;min-height:0;padding-block:0 clamp(48px,10vw,72px)}
  .cp-stmt__stage{position:relative;height:64svh;min-height:380px;overflow:hidden;margin-bottom:32px}
  .cp .cp-stmt__cutout{right:auto;left:50%;translate:-50% 0;bottom:0;height:94%}
  .cp-stmt__bg::after{background:linear-gradient(0deg,var(--cp-bg) 0%,transparent 40%)}
}
@media(prefers-reduced-motion:no-preference){
  .cp-stmt__cutout{animation:cp-rise 1.1s cubic-bezier(.2,.7,.2,1) .2s both}
}

/* ── the sod strip — a seamed green band that unrolls between sections ── */
.cp-strip{height:18px;background:repeating-linear-gradient(90deg,var(--cp-accent) 0 150px,color-mix(in srgb,var(--cp-accent) 70%,var(--cp-bg)) 150px 153px);transform-origin:left center}
@supports (animation-timeline:view()){
  @media(prefers-reduced-motion:no-preference){
    .cp-strip{animation:cp-unroll linear both;animation-timeline:view();animation-range:entry 10% cover 40%}
    .cp-unroll{animation:cp-reveal linear both;animation-timeline:view();animation-range:entry 0% cover 30%}
  }
}
@keyframes cp-unroll{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes cp-reveal{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0 0 0)}}

/* ── proof ───────────────────────────────────────────────── */
.cp-proof{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border-block:1px solid var(--cp-rule)}
.cp-proof__cell{padding:36px 28px;border-left:1px solid var(--cp-rule);display:flex;flex-direction:column-reverse;justify-content:flex-end}
.cp-proof__cell:first-child{border-left:0;padding-left:0}
.cp-proof__fig{margin:0;font-family:var(--cp-display);font-size:clamp(34px,3.6vw,52px);line-height:1;color:var(--cp-accent);display:block}
.cp-proof__label{display:block;margin-top:12px;font-family:var(--cp-label);font-weight:600;font-size:15.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--cp-muted);line-height:1.35}
@media(max-width:820px){.cp-proof{grid-template-columns:repeat(2,minmax(0,1fr))}.cp-proof__cell{padding:26px 18px}.cp-proof__cell:nth-child(odd){border-left:0;padding-left:0}.cp-proof__cell:nth-child(n+3){border-top:1px solid var(--cp-rule)}}

/* ── sections ────────────────────────────────────────────── */
.cp-section{padding-block:var(--cp-section)}
.cp-section__head{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,.7fr);gap:40px;align-items:end;margin-bottom:clamp(40px,6vw,72px)}
@media(max-width:900px){.cp-section__head{grid-template-columns:1fr}}

/* the work — a staggered wall of their own jobs */
.cp-work{columns:3 300px;column-gap:18px}
.cp-work__item{break-inside:avoid;margin:0 0 18px;position:relative;overflow:hidden;background:var(--cp-bg2)}
.cp-work__item img,.cp-work__item video{width:100%;height:auto;transition:transform 1.2s cubic-bezier(.2,.7,.2,1)}
.cp-work__item:hover img,.cp-work__item:hover video{transform:scale(1.04)}
.cp-work__cap{position:absolute;left:0;right:0;bottom:0;padding:48px 18px 16px;background:linear-gradient(to top,color-mix(in srgb,var(--cp-bg) 88%,transparent),transparent);display:flex;justify-content:space-between;align-items:end;gap:12px}
.cp-work__caption{font-family:var(--cp-label);font-weight:600;font-size:17px;letter-spacing:.06em;text-transform:uppercase;line-height:1.2}
.cp-work__tag{flex:none;font-family:var(--cp-label);font-weight:700;font-size:12.5px;letter-spacing:.16em;text-transform:uppercase;background:var(--cp-accent);color:var(--cp-on-accent);padding:5px 9px}
/* phones: a two-across wall, not one giant picture per screen */
@media(max-width:760px){
  .cp-work{columns:2;column-gap:10px}
  .cp-work__item{margin-bottom:10px}
  .cp-work__cap{padding:32px 10px 9px}
  .cp-work__caption{font-size:13.5px;letter-spacing:.04em}
  .cp-work__tag{display:none}
  .cp-vtile__mark{top:8px;right:8px;width:32px;height:32px}
  .cp-vtile__mark svg{width:14px;height:14px}
}

/* work-wall clips: still until hovered/tapped */
.cp-vtile{display:block;position:relative;width:100%;padding:0;border:0;background:none;cursor:pointer;color:inherit}
/* clips are encoded tall (9:16); an unloaded video doesn't know its shape, so give it one */
.cp-vtile video{width:100%;height:auto;aspect-ratio:9/16;object-fit:cover}
.cp-vtile__mark{position:absolute;top:14px;right:14px;width:44px;height:44px;display:grid;place-items:center;border-radius:50%;background:color-mix(in srgb,var(--cp-bg) 70%,transparent);border:1.5px solid var(--cp-accent);color:var(--cp-accent);transition:opacity .3s ease}
.cp-vtile__mark svg{width:18px;height:18px;margin-left:2px}
.cp-vtile[data-playing="true"] .cp-vtile__mark{opacity:0}

/* services — numbered rows like a work order */
.cp-services{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,.62fr);gap:clamp(40px,6vw,96px);align-items:start}
.cp-services__list{list-style:none;margin:0;padding:0;counter-reset:svc;border-top:1px solid var(--cp-rule)}
.cp-services__row{counter-increment:svc;display:grid;grid-template-columns:64px minmax(0,1fr);gap:8px 20px;padding:28px 0;border-bottom:1px solid var(--cp-rule);transition:padding .35s ease}
.cp-services__row::before{content:counter(svc,decimal-leading-zero);font-family:var(--cp-label);font-weight:700;font-size:16px;letter-spacing:.1em;color:var(--cp-accent);padding-top:10px}
.cp-services__name{font-family:var(--cp-display);font-size:clamp(24px,2.4vw,32px);text-transform:uppercase;line-height:1.05;margin:0;transition:color .3s ease}
.cp-services__detail{grid-column:2;margin:0;color:var(--cp-muted);max-width:52ch}
.cp-services__row:hover{padding-left:12px}
.cp-services__row:hover .cp-services__name{color:var(--cp-accent)}
.cp-services__note{position:sticky;top:120px;font-style:italic;font-size:clamp(19px,1.6vw,22px);line-height:1.5;margin:0;padding:30px;border-left:4px solid var(--cp-accent);background:var(--cp-bg2);color:var(--cp-fg2)}
@media(max-width:900px){.cp-services{grid-template-columns:1fr}.cp-services__note{position:static;transform:none}}

/* reviews — one loud, the rest in a grid */
.cp-reviews{background:var(--cp-bg2);color:var(--cp-fg2)}
.cp-reviews .cp-lede{color:var(--cp-muted2)}
.cp-stars{display:flex;gap:4px;color:var(--cp-accent)}
.cp-stars svg{width:20px;height:20px}
.cp-feature{margin:0 0 clamp(48px,6vw,80px);padding-left:clamp(22px,3vw,40px);border-left:6px solid var(--cp-accent)}
.cp-feature blockquote{margin:18px 0 0;font-weight:500;font-size:clamp(24px,2.4vw,34px);line-height:1.3;max-width:36ch}
.cp-quotes{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:18px}
.cp-quote{margin:0;padding:30px;border:1px solid color-mix(in srgb,var(--cp-fg2) 16%,transparent);display:flex;flex-direction:column;gap:20px;transition:border-color .3s ease,transform .3s ease}
.cp-quote:hover{border-color:var(--cp-accent);transform:translateY(-3px)}
.cp-quote blockquote{margin:0;font-size:19px;line-height:1.55}
.cp-cite{margin-top:auto;font-family:var(--cp-label);font-weight:700;font-size:15px;letter-spacing:.14em;text-transform:uppercase;font-style:normal}
.cp-cite small{display:block;margin-top:4px;font-weight:500;letter-spacing:.08em;color:var(--cp-muted2);font-size:14px}
.cp-reviews__note{margin:36px 0 0;font-family:var(--cp-label);letter-spacing:.12em;text-transform:uppercase;font-size:14px;color:var(--cp-muted2)}

/* crew */
.cp-crew{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:clamp(40px,7vw,110px);align-items:center}
.cp-crew__photo{position:relative}
.cp-crew__photo>img{width:100%;aspect-ratio:4/5;object-fit:cover;filter:grayscale(.15) contrast(1.05)}
.cp-crew__photo::after{content:"";position:absolute;inset:auto -22px -22px auto;width:62%;height:44%;background:var(--cp-accent);z-index:-1}
.cp-inset{position:absolute;right:-28px;bottom:-40px;width:42%;margin:0;border:6px solid var(--cp-bg);background:var(--cp-bg);transform:rotate(3deg)}
.cp-inset img{width:100%;aspect-ratio:1;object-fit:cover}
.cp-inset figcaption{font-family:var(--cp-label);font-weight:700;letter-spacing:.14em;text-transform:uppercase;font-size:13px;padding:8px 6px 4px;text-align:center}
.cp-crew__quote{font-family:var(--cp-display);font-size:clamp(34px,3.8vw,56px);line-height:1;text-transform:uppercase;margin:0}
.cp-crew__quote::before{content:"“";display:block;font-size:1.4em;line-height:.6;color:var(--cp-accent)}
.cp-crew__who{margin:22px 0 0;font-family:var(--cp-label);font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--cp-accent)}
.cp-crew__body p{color:var(--cp-muted);margin:18px 0 0;max-width:54ch}
@media(max-width:900px){.cp-crew{grid-template-columns:1fr}.cp-inset{right:-8px;width:40%}}

/* area — the three states, stacked like signage */
.cp-area__states{margin:0;padding:0;list-style:none}
.cp-area__state{font-family:var(--cp-display);text-transform:uppercase;line-height:1;font-size:clamp(36px,5.6vw,80px);color:transparent;-webkit-text-stroke:1.5px var(--cp-fg);transition:color .35s ease,-webkit-text-stroke-color .35s ease;border-bottom:1px solid var(--cp-rule);padding:6px 0 14px}
.cp-area__state:hover{color:var(--cp-accent);-webkit-text-stroke-color:var(--cp-accent)}
.cp-area__state:first-child{border-top:1px solid var(--cp-rule)}

/* estimate */
.cp-estimate{background:var(--cp-bg2);color:var(--cp-fg2);position:relative}
.cp-estimate__grid{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:clamp(40px,6vw,96px);align-items:start}
.cp-estimate .cp-lede{color:var(--cp-muted2)}
.cp-steps{list-style:none;margin:36px 0 0;padding:0;counter-reset:st}
.cp-steps li{counter-increment:st;display:flex;gap:18px;align-items:baseline;padding:16px 0;border-top:1px solid color-mix(in srgb,var(--cp-fg2) 16%,transparent);font-size:18px}
.cp-steps li::before{content:counter(st);font-family:var(--cp-display);font-size:24px;color:var(--cp-accent);min-width:28px}
.cp-direct{margin-top:40px}
.cp-direct__label{font-family:var(--cp-label);font-weight:700;letter-spacing:.2em;text-transform:uppercase;font-size:14px;color:var(--cp-muted2);margin:0 0 6px}
.cp-direct__phone{font-family:var(--cp-display);font-size:clamp(30px,3vw,42px);line-height:1;text-decoration:none;color:var(--cp-fg2)}
.cp-direct__phone:hover{color:var(--cp-accent)}
.cp-direct__email{display:block;margin-top:10px;color:var(--cp-muted2)}
@media(max-width:900px){.cp-estimate__grid{grid-template-columns:1fr}}

.cp-form{display:grid;grid-template-columns:1fr 1fr;gap:22px 18px;padding:clamp(24px,3vw,40px);background:var(--cp-bg);color:var(--cp-fg);border-top:6px solid var(--cp-accent)}
.cp-field{display:flex;flex-direction:column;gap:8px;grid-column:span 2}
.cp-field--half{grid-column:span 1}
.cp-field label,.cp-field legend{font-family:var(--cp-label);font-weight:700;font-size:15px;letter-spacing:.14em;text-transform:uppercase;padding:0}
.cp-field label small,.cp-field legend small{font-weight:500;letter-spacing:.06em;text-transform:none;color:var(--cp-muted);margin-left:6px;font-size:14px}
.cp-hint{font-size:15px;color:var(--cp-muted);margin:0}
.cp-input{width:100%;font:inherit;font-size:18px;color:var(--cp-fg);background:transparent;border:0;border-bottom:2px solid var(--cp-rule);padding:10px 2px;border-radius:0;transition:border-color .25s ease}
.cp-input:focus{outline:none;border-bottom-color:var(--cp-accent)}
.cp-input::placeholder{color:var(--cp-muted)}
select.cp-input{appearance:none;background-image:linear-gradient(45deg,transparent 50%,var(--cp-accent) 50%),linear-gradient(135deg,var(--cp-accent) 50%,transparent 50%);background-position:calc(100% - 14px) 55%,calc(100% - 8px) 55%;background-size:6px 6px;background-repeat:no-repeat}
select.cp-input option{background:var(--cp-bg);color:var(--cp-fg)}
textarea.cp-input{min-height:120px;resize:vertical}
.cp-chips{border:0;margin:0;padding:0;grid-column:span 2}
.cp-chips__row{display:flex;flex-wrap:wrap;gap:10px;margin-top:12px}
.cp-chip{position:relative}
.cp-chip input{position:absolute;opacity:0;inset:0;cursor:pointer}
.cp-chip span{display:inline-block;padding:10px 16px;border:1.5px solid var(--cp-rule);font-family:var(--cp-label);font-weight:600;font-size:16px;letter-spacing:.06em;text-transform:uppercase;transition:all .2s ease}
.cp-chip input:checked+span{background:var(--cp-accent);border-color:var(--cp-accent);color:var(--cp-on-accent)}
.cp-chip input:focus-visible+span{outline:3px solid var(--cp-accent);outline-offset:2px}
.cp-drop{position:relative;border:2px dashed var(--cp-rule);padding:22px;text-align:center;transition:border-color .2s ease}
.cp-drop:hover,.cp-drop:focus-within{border-color:var(--cp-accent)}
.cp-drop input{position:absolute;inset:0;opacity:0;cursor:pointer}
.cp-drop__count{font-family:var(--cp-label);font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--cp-accent);margin:8px 0 0}
.cp-hp{position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden}
.cp-form__foot{grid-column:span 2;display:flex;flex-wrap:wrap;align-items:center;gap:18px}
.cp-form__foot .cp-btn{border:0}
.cp-form__foot .cp-btn[disabled]{opacity:.6;cursor:progress}
.cp-alert{grid-column:span 2;margin:0;padding:14px 16px;border-left:4px solid var(--cp-accent);background:color-mix(in srgb,var(--cp-accent) 12%,transparent)}
.cp-done{padding:clamp(28px,4vw,48px);background:var(--cp-bg);color:var(--cp-fg);border-top:6px solid var(--cp-accent)}
.cp-done h3{font-family:var(--cp-display);font-weight:400;text-transform:uppercase;font-size:clamp(28px,3vw,40px);line-height:1;margin:0 0 14px}
@media(max-width:640px){.cp-field--half{grid-column:span 2}}

/* prose (privacy / terms) */
.cp-prose{max-width:760px}
.cp-prose h1,.cp-prose h2,.cp-prose h3{font-family:var(--cp-display);font-weight:400;text-transform:uppercase;line-height:1;margin:1.6em 0 .5em}
.cp-prose h1{font-size:clamp(44px,6vw,80px);margin-top:0}
.cp-prose h2{font-size:32px}.cp-prose h3{font-size:24px}
.cp-prose p,.cp-prose li{color:var(--cp-muted)}
.cp-prose a{color:var(--cp-accent)}

/* footer */
.cp-foot{position:relative;padding-block:72px 120px;border-top:1px solid var(--cp-rule);overflow:hidden}
.cp-foot__big{font-family:var(--cp-display);text-transform:uppercase;font-size:clamp(56px,9vw,140px);line-height:.9;margin:0;color:transparent;-webkit-text-stroke:1.5px color-mix(in srgb,var(--cp-fg) 22%,transparent);white-space:nowrap;user-select:none}
.cp-foot__row{display:flex;flex-wrap:wrap;justify-content:space-between;gap:24px;margin-top:40px;font-family:var(--cp-label);font-weight:600;letter-spacing:.12em;text-transform:uppercase;font-size:15px;color:var(--cp-muted)}
.cp-foot__row a{text-decoration:none}
.cp-foot__row a:hover{color:var(--cp-accent)}

/* thumb bar — call + estimate always in reach on a phone */
.cp-thumb{display:none}
@media(max-width:720px){
  .cp-thumb{display:grid;grid-template-columns:1fr 1fr;position:fixed;left:0;right:0;bottom:0;z-index:50;border-top:1px solid var(--cp-rule)}
  .cp-thumb a{display:flex;align-items:center;justify-content:center;gap:10px;padding:18px 10px calc(18px + env(safe-area-inset-bottom));font-family:var(--cp-label);font-weight:700;font-size:17px;letter-spacing:.12em;text-transform:uppercase;text-decoration:none}
  .cp-thumb svg{width:18px;height:18px}
  .cp-thumb a:first-child{background:var(--cp-bg);color:var(--cp-fg)}
  .cp-thumb a:last-child{background:var(--cp-accent);color:var(--cp-on-accent)}
}
`;
}
