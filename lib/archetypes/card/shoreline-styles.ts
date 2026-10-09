/**
 * Business card, shoreline design — the stylesheet (Saltmarsh & Lace demo spec).
 * A photograph of a Rhode Island bay at dusk stays locked behind the page while
 * everything scrolls in front of it: the name on the open sky, the maker's
 * pieces as matted prints floating over the water, a lace-edged card with the
 * story, a tide table of market days, and a letter for the contact form. Lightly
 * nautical from the name, never costumed. Its own fixed look, not a family's;
 * owners change words and photos only. Classes are prefixed `sl-`.
 *
 * The sea is a fixed layer of its own (not background-attachment, which phones
 * ignore). Motion is CSS only and slow: the name and prints rise in once on
 * load. Under reduced motion everything sits at rest. Per-print tilts and
 * offsets are nth-child rules, never inline.
 */

const svg = (markup: string): string => `url("data:image/svg+xml,${encodeURIComponent(markup)}")`;

/** Paper grain on the card, table and letter. */
const GRAIN = svg(
  "<svg xmlns='http://www.w3.org/2000/svg' width='420' height='420'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .35  0 0 0 0 .25  0 0 0 0 .12  0 0 0 .35 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>",
);

/** The bay at dusk (public/designs/shoreline/). */
const SEA = '/designs/shoreline/sea.webp';

export const SHORELINE_FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,500;1,6..96,400&family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Homemade+Apple&display=swap';

/** Tilt and drop of each print, repeating every six. */
const PRINTS: readonly { r: number; y: number }[] = [
  { r: -1.2, y: 0 },
  { r: 0.8, y: 46 },
  { r: -0.6, y: 18 },
  { r: 1.4, y: 0 },
  { r: -1.6, y: 36 },
  { r: 0.6, y: 10 },
];

export function shorelineCss(): string {
  const prints = PRINTS.map((p, i) => `.sl-prints li:nth-child(6n+${i + 1}){--r:${p.r}deg;--y:${p.y}px}`).join('\n');
  return `
.sl{
  --ink:#14232b;--ink-soft:#4c5a5f;--navy:#0e2633;--rust:#8c3b2a;--lace:#fbf6ea;--paper:#fdf9f0;--sea:#5d7f86;
  --grain:${GRAIN};
  --display:'Bodoni Moda',Didot,Georgia,serif;--body:'Cormorant Garamond',Georgia,serif;--hand:'Homemade Apple',cursive;
  position:relative;isolation:isolate;min-height:100vh;overflow-x:clip;color:var(--ink);font-family:var(--body);font-size:20px;line-height:1.55;-webkit-font-smoothing:antialiased;background:#c9c3c4;
}
.sl *,.sl *::before,.sl *::after{box-sizing:border-box}
.sl a{color:var(--rust)}
.sl-sea{position:fixed;inset:0;z-index:-1;background:url('${SEA}') center 62%/cover no-repeat,#c9c3c4}
.sl-sea::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,255,255,0) 40%,rgba(18,30,38,.18) 100%)}
.sl-skip{position:absolute;left:-9999px;top:8px;z-index:60;background:var(--navy);color:#fff!important;padding:10px 16px}
.sl-skip:focus{left:8px}
@keyframes sl-rise{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}

/* ── the name on the open sky ─────────────────────────────── */
.sl-sky{min-height:min(86vh,820px);display:flex;flex-direction:column;justify-content:flex-start;padding:clamp(48px,9vh,110px) clamp(16px,6vw,90px) clamp(40px,8vw,90px)}
.sl-name{margin:0;font-family:var(--display);font-weight:500;font-size:clamp(46px,10vw,132px);line-height:.95;letter-spacing:-.01em;color:var(--navy);text-shadow:0 0 30px rgba(245,240,240,.55);animation:sl-rise 1.8s cubic-bezier(.2,.7,.2,1) .2s both}
.sl-name em{font-style:italic;font-weight:400;color:var(--rust)}
.sl-kicker{margin:clamp(14px,2vw,22px) 0 0;max-width:34ch;font-style:italic;font-size:clamp(19px,2.4vw,26px);line-height:1.35;color:var(--ink);font-weight:600;text-shadow:0 0 6px rgba(245,240,240,.95),0 0 18px rgba(245,240,240,.85);animation:sl-rise 1.8s cubic-bezier(.2,.7,.2,1) .6s both}
.sl-makes{display:flex;flex-wrap:wrap;gap:4px 0;margin:clamp(20px,3vw,30px) 0 0;padding:0;list-style:none;font-family:var(--body);font-weight:600;font-size:clamp(13px,1.5vw,15px);letter-spacing:.22em;text-transform:uppercase;color:var(--navy);font-weight:700;text-shadow:0 0 6px rgba(245,240,240,.95),0 0 18px rgba(245,240,240,.85);animation:sl-rise 1.8s cubic-bezier(.2,.7,.2,1) .9s both}
.sl-makes li+li::before{content:'';display:inline-block;width:22px;height:1px;margin:0 14px;vertical-align:middle;background:currentColor;opacity:.5}

/* ── prints floating over the water ───────────────────────── */
.sl-water{padding:0 clamp(16px,5vw,70px)}
.sl-water-h{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.sl-prints{list-style:none;margin:0 auto;padding:0;width:min(1180px,100%);display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:clamp(30px,4vw,56px) clamp(22px,3.4vw,46px);align-items:start}
${prints}
.sl-prints li{transform:translateY(var(--y,0px));animation:sl-rise 1.6s cubic-bezier(.2,.7,.2,1) both}
.sl-prints li:nth-child(-n+3){animation-delay:1.1s}
.sl-print{display:block;width:100%;padding:12px 12px 0;border:0;background:var(--paper);cursor:zoom-in;text-align:center;transform:rotate(var(--r,0deg));box-shadow:0 2px 3px rgba(0,0,0,.18),0 24px 40px -18px rgba(10,24,32,.6);transition:transform .8s cubic-bezier(.2,.7,.2,1),box-shadow .8s}
.sl-print img{display:block;width:100%;aspect-ratio:3/4;object-fit:cover;background:#ddd}
.sl-print span{display:block;padding:12px 6px 16px;font-family:var(--hand);font-size:clamp(12px,1.25vw,15px);line-height:1.7;color:var(--ink)}
.sl-print:hover,.sl-print:focus-visible{transform:rotate(0deg) translateY(-6px);box-shadow:0 2px 3px rgba(0,0,0,.18),0 34px 50px -18px rgba(10,24,32,.7)}
.sl-print:focus-visible{outline:3px solid var(--navy);outline-offset:4px}

/* ── the card and the tide table ─────────────────────────── */
.sl-below{position:relative;width:min(1100px,100%);margin:clamp(70px,10vw,130px) auto 0;padding:0 clamp(16px,4vw,40px);display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:clamp(28px,5vw,64px);align-items:start}
.sl-below--one{grid-template-columns:minmax(0,1fr);justify-items:center}
.sl-card{position:relative;padding:18px;background:radial-gradient(circle at center,transparent 3px,var(--lace) 3.6px) 0 0/14px 14px;transform:rotate(-1.2deg);
  -webkit-mask:radial-gradient(circle 9px at 9px 9px,#000 96%,#0000) 0 0/18px 18px round,linear-gradient(#000 0 0) 9px 9px/calc(100% - 18px) calc(100% - 18px) no-repeat;
  mask:radial-gradient(circle 9px at 9px 9px,#000 96%,#0000) 0 0/18px 18px round,linear-gradient(#000 0 0) 9px 9px/calc(100% - 18px) calc(100% - 18px) no-repeat;
  filter:drop-shadow(0 18px 24px rgba(10,24,32,.4))}
.sl-below--one .sl-card{width:min(640px,100%)}
.sl-card__in{background:var(--grain),linear-gradient(180deg,#fdf8ec,#f1e6cc);padding:clamp(24px,4vw,40px) clamp(22px,4vw,38px)}
.sl-card h2{margin:0 0 14px;font-family:var(--hand);font-weight:400;font-size:clamp(22px,3vw,30px);line-height:1.5;color:var(--navy)}
.sl-card p{margin:0 0 14px}
.sl-lead{font-style:italic;font-size:1.08em;color:var(--ink-soft)}
.sl-card .sl-first::first-letter{font-family:var(--display);float:left;font-size:3.2em;line-height:.85;padding:6px 8px 0 0;color:var(--rust)}
.sl-sig{display:block;margin-top:6px;font-family:var(--hand);font-size:22px;color:var(--rust);text-align:right}
.sl-ways{display:flex;gap:12px;flex-wrap:wrap;margin-top:18px;padding-top:16px;border-top:1px dashed rgba(76,90,95,.4)}
.sl-ways a{font-weight:600;font-size:14px;letter-spacing:.18em;text-transform:uppercase;text-decoration:none;color:var(--lace)!important;background:var(--navy);padding:10px 16px;border-radius:2px}
.sl-ways a:hover{background:var(--rust)}

.sl-tide{position:relative;margin-top:clamp(40px,8vw,110px);padding:clamp(20px,3vw,30px);background:var(--grain),#f3ecdb;border:1px solid #7f8a86;box-shadow:inset 0 0 0 5px #f3ecdb,inset 0 0 0 6px #7f8a86,0 18px 30px -12px rgba(10,24,32,.45);transform:rotate(.8deg)}
.sl-tide table{width:100%;border-collapse:collapse;font-variant-numeric:oldstyle-nums}
.sl-tide caption{caption-side:top;padding:0 0 12px;font-family:var(--display);font-style:italic;font-weight:400;font-size:clamp(26px,3.2vw,34px);color:var(--navy);text-align:center}
.sl-tide caption::after{content:'';display:block;height:10px;margin:8px auto 0;width:60%;background:radial-gradient(circle at 10px -4px,transparent 8px,var(--sea) 8.5px 10px,transparent 10.5px) 0 0/20px 10px repeat-x;opacity:.7}
.sl-tide th{font-weight:600;font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:var(--ink-soft);text-align:left;padding:8px 10px;border-bottom:2px solid var(--ink)}
.sl-tide td{padding:10px;border-bottom:1px solid rgba(76,90,95,.3);vertical-align:top;font-size:18px;line-height:1.35}
.sl-tide td:first-child{font-weight:600;font-size:15px;letter-spacing:.04em;white-space:nowrap;color:var(--rust)}
.sl-tide tr:last-child td{border-bottom:0}
.sl-tide .sl-gone td{text-decoration:line-through;opacity:.6}

/* ── the letter ───────────────────────────────────────────── */
.sl-letter{position:relative;width:min(760px,calc(100% - 32px));margin:clamp(70px,10vw,120px) auto 0;padding:clamp(30px,5vw,56px) clamp(22px,5vw,58px) clamp(34px,5vw,56px);
  background:var(--grain),repeating-linear-gradient(180deg,transparent 0 35px,rgba(93,127,134,.28) 35px 36px),linear-gradient(180deg,#fffaf0,#f4ead3);
  box-shadow:0 1px 0 #e6d7b6,0 26px 44px -16px rgba(10,24,32,.55);transform:rotate(-.6deg)}
.sl-letter::before{content:'';position:absolute;top:0;bottom:0;left:clamp(14px,3vw,34px);width:2px;background:rgba(140,59,42,.35)}
.sl-seal{position:absolute;right:clamp(16px,4vw,44px);top:-26px;width:74px;height:74px;display:grid;place-items:center;border-radius:47% 53% 50% 50%/52% 48% 52% 48%;background:radial-gradient(circle at 35% 30%,#2f5a6b,#173544 55%,#0e2430);color:#d9e6e4;font-family:var(--display);font-size:22px;box-shadow:0 4px 8px rgba(10,20,30,.5),inset 0 0 0 6px rgba(0,0,0,.12),inset 0 0 0 8px rgba(200,230,230,.12);transform:rotate(-12deg)}
.sl-letter h2{margin:0 0 6px;font-family:var(--hand);font-weight:400;font-size:clamp(24px,3.6vw,34px);line-height:1.6;color:var(--navy)}
.sl-letter > p{margin:0 0 22px;font-style:italic;color:var(--ink-soft)}
.sl-letter .bc-form{display:flex;flex-direction:column}
.sl-letter .bc-form__row{display:grid;grid-template-columns:1fr 1fr;gap:0 26px}
.sl-letter .bc-form label{display:block;font-weight:600;font-size:13px;letter-spacing:.18em;text-transform:uppercase;color:var(--ink-soft)}
.sl-letter .bc-form input,.sl-letter .bc-form textarea{display:block;width:100%;background:transparent;border:0;border-bottom:1.5px solid var(--ink);font:inherit;font-family:var(--body);font-size:20px;text-transform:none;letter-spacing:0;padding:6px 0;margin:2px 0 20px;outline:none;color:var(--ink);border-radius:0}
.sl-letter .bc-form input:focus,.sl-letter .bc-form textarea:focus{border-color:var(--rust);box-shadow:0 1.5px 0 var(--rust)}
.sl-letter .bc-form textarea{min-height:140px;resize:vertical;line-height:36px;padding-top:0}
.sl-letter .bc-form__trap{position:absolute;left:-9999px}
.sl-letter .bc-btn{align-self:flex-start;font-family:var(--body);font-weight:600;font-size:15px;letter-spacing:.2em;text-transform:uppercase;background:var(--navy);color:#f3efe6;border:0;padding:15px 28px;cursor:pointer;transition:background .3s}
.sl-letter .bc-btn:hover{background:var(--rust)}
.sl-letter .bc-btn:disabled{opacity:.6;cursor:progress}
.sl-letter .bc-form__status{margin-top:12px;color:var(--rust)}
.sl-letter .bc-form__done p{font-family:var(--hand);font-size:20px;line-height:1.7;color:var(--navy)}

/* ── footer ──────────────────────────────────────────────── */
.sl-foot{margin-top:clamp(70px,10vw,110px);padding:24px 16px 32px;background:rgba(14,32,42,.82);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);display:flex;justify-content:center;flex-wrap:wrap;gap:8px 26px;font-size:14px;letter-spacing:.16em;text-transform:uppercase;color:#cfdcdc}
.sl-foot a{color:#f3efe6!important;text-decoration:none}
.sl-foot a:hover{text-decoration:underline}

/* ── photo viewer ────────────────────────────────────────── */
.sl .bc-lb{position:fixed;inset:0;z-index:70;display:grid;place-items:center;background:rgba(12,24,32,.93);padding:clamp(16px,4vw,60px)}
.sl .bc-lb figure{display:grid;gap:16px;justify-items:center;max-height:100%;margin:0}
.sl .bc-lb img{max-height:78vh;max-width:min(1100px,92vw);object-fit:contain;padding:10px;background:var(--paper)}
.sl .bc-lb figcaption{font-family:var(--hand);color:#f3efe6;font-size:20px;text-align:center}
.sl .bc-lb button{position:absolute;display:grid;place-items:center;background:var(--navy);border:0;color:#f3efe6;width:54px;height:54px;border-radius:50%;font-size:24px;line-height:1;cursor:pointer}
.sl .bc-lb__close{top:18px;right:18px}
.sl .bc-lb__prev{left:18px;top:50%;margin-top:-27px}
.sl .bc-lb__next{right:18px;top:50%;margin-top:-27px}

/* ── privacy / terms ─────────────────────────────────────── */
.sl-page{padding:clamp(40px,8vw,90px) 16px 0}
.sl-sheet{width:min(860px,100%);margin:0 auto;padding:clamp(28px,5vw,60px) clamp(22px,5vw,60px);background:var(--grain),linear-gradient(180deg,#fdf8ec,#f1e6cc);box-shadow:0 26px 44px -16px rgba(10,24,32,.55)}
.sl-home{display:inline-block;margin-bottom:22px;font-family:var(--display);font-size:clamp(24px,3vw,32px);text-decoration:none;color:var(--navy)!important}
.sl-prose h1{font-family:var(--display);font-weight:500;font-size:clamp(30px,4vw,44px);line-height:1.1;margin:0 0 18px;color:var(--navy)}
.sl-prose h2{font-weight:600;font-size:18px;letter-spacing:.12em;text-transform:uppercase;margin:28px 0 8px}
.sl-prose p,.sl-prose li{font-size:19px;line-height:1.6;margin:0 0 12px}
.sl-prose ul{padding-left:22px;margin:0 0 12px}

/* ── Lite and Full: pages ────────────────────────────────── */
.sl-bar{position:sticky;top:0;z-index:30;display:flex;align-items:center;justify-content:space-between;gap:12px 28px;flex-wrap:wrap;padding:14px clamp(16px,5vw,60px);background:rgba(250,246,240,.72);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);border-bottom:1px solid rgba(14,38,51,.12)}
.sl-bar-name{font-family:var(--display);font-size:clamp(20px,2.4vw,26px);color:var(--navy)!important;text-decoration:none;white-space:nowrap}
.sl-bar-name em{font-style:italic;color:var(--rust)}
.sl-nav{display:flex;flex-wrap:wrap;gap:4px clamp(14px,2.4vw,30px);margin:0;padding:0;list-style:none}
.sl-nav a{font-weight:600;font-size:14px;letter-spacing:.16em;text-transform:uppercase;color:var(--navy)!important;text-decoration:none;padding:4px 0;border-bottom:1.5px solid transparent}
.sl-nav a:hover,.sl-nav a[aria-current="page"]{border-bottom-color:var(--rust)}
.sl-head{padding:clamp(40px,8vh,90px) clamp(16px,6vw,90px) clamp(22px,4vh,40px)}
.sl-head h1{margin:0;font-family:var(--display);font-weight:500;font-size:clamp(40px,7vw,84px);line-height:1;color:var(--navy);text-shadow:0 0 30px rgba(245,240,240,.55);animation:sl-rise 1.4s cubic-bezier(.2,.7,.2,1) .1s both}
.sl-back{display:inline-block;margin-bottom:14px;font-weight:600;font-size:14px;letter-spacing:.14em;text-transform:uppercase;color:var(--navy)!important;text-decoration:none;text-shadow:0 0 8px rgba(245,240,240,.9)}
.sl-section-h{margin:0 auto 26px;width:min(1180px,100%);font-family:var(--display);font-style:italic;font-weight:400;font-size:clamp(28px,3.6vw,40px);color:var(--lace);text-shadow:0 2px 14px rgba(10,24,32,.6)}
a.sl-print{text-decoration:none;cursor:pointer}
.sl-price{display:block;padding:0 6px 16px;margin-top:-8px;font-weight:600;font-size:15px;letter-spacing:.06em;color:var(--rust)}
.sl-price--ask{font-style:italic;font-weight:500;letter-spacing:0;color:var(--ink-soft)}
.sl-more{display:flex;justify-content:center;margin:clamp(40px,6vw,64px) 0 0}
.sl-more a,.sl-btn{display:inline-block;padding:14px 26px;background:var(--navy);color:#f3efe6!important;font-weight:600;font-size:14px;letter-spacing:.18em;text-transform:uppercase;text-decoration:none;box-shadow:0 10px 24px -10px rgba(10,24,32,.7);transition:background .3s}
.sl-more a:hover,.sl-btn:hover{background:var(--rust)}
.sl-card .sl-more{justify-content:flex-start;margin-top:18px}
.sl-tide .sl-more{margin-top:18px}
.sl-empty{width:min(640px,100%);margin:0 auto;padding:28px;background:var(--paper);text-align:center;font-style:italic;box-shadow:0 18px 30px -12px rgba(10,24,32,.45)}
.sl-product{width:min(1100px,calc(100% - 32px));margin:0 auto;display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);gap:clamp(24px,4vw,48px);align-items:start}
.sl-product-photos{display:grid;gap:14px}
.sl-product-photos .sl-print{transform:none}
.sl-product-photos .sl-print img{aspect-ratio:auto;max-height:76vh;object-fit:contain;background:#f1ece4}
.sl-product-sheet{padding:clamp(24px,4vw,42px);background:var(--grain),linear-gradient(180deg,#fdf8ec,#f1e6cc);box-shadow:0 26px 44px -16px rgba(10,24,32,.55)}
.sl-product-sheet h2{margin:0 0 8px;font-family:var(--display);font-weight:500;font-size:clamp(30px,3.6vw,44px);line-height:1.05;color:var(--navy)}
.sl-product-price{margin:0 0 18px;font-weight:600;font-size:22px;color:var(--rust)}
.sl-product-price--ask{font-style:italic;font-weight:500;color:var(--ink-soft)}
.sl-product-sheet p{margin:0 0 14px}
.sl-product-short{font-style:italic;color:var(--ink-soft)}
.sl-product .sl-letter{width:auto;margin:28px 0 0;transform:none}
.sl-markets{width:min(980px,calc(100% - 32px));margin:0 auto;padding:0;list-style:none;display:grid;gap:18px}
.sl-market{display:grid;grid-template-columns:9.5em minmax(0,1fr);gap:4px 22px;padding:20px 24px;background:var(--grain),#f3ecdb;border:1px solid #7f8a86;box-shadow:inset 0 0 0 4px #f3ecdb,inset 0 0 0 5px #7f8a86,0 14px 24px -12px rgba(10,24,32,.45)}
.sl-market--gone{opacity:.6}
.sl-market--gone h2{text-decoration:line-through}
.sl-market-day{grid-row:span 3;font-weight:600;font-size:17px;letter-spacing:.04em;color:var(--rust)}
.sl-market h2{margin:0;font-family:var(--display);font-weight:500;font-size:clamp(22px,2.6vw,28px);line-height:1.15;color:var(--navy)}
.sl-market-facts{margin:0;display:flex;flex-wrap:wrap;gap:4px 18px;font-size:17px;color:var(--ink-soft)}
.sl-market-links{display:flex;flex-wrap:wrap;gap:6px 18px}
.sl-market-links a{font-weight:600;font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:var(--rust)!important}
.sl-contact .sl-letter{margin-top:0}
.sl-about .sl-card{width:min(760px,calc(100% - 32px));margin:0 auto}
@media (max-width:860px){
  .sl-product{grid-template-columns:minmax(0,1fr)}
  .sl-market{grid-template-columns:minmax(0,1fr)}
  .sl-market-day{grid-row:auto}
}
@media (max-width:860px){
  .sl-prints{grid-template-columns:repeat(2,minmax(0,1fr))}
  .sl-below{grid-template-columns:minmax(0,1fr)}
  .sl-tide{margin-top:10px}
  .sl-tide td:first-child{white-space:normal}
  .sl-tide td,.sl-tide th{padding:8px 6px}
  .sl-letter .bc-form__row{grid-template-columns:1fr}
}
@media (max-width:520px){
  .sl{font-size:18px}
  .sl-prints{gap:26px 16px}
  .sl-prints li{--y:0px!important}
  .sl-print{padding:8px 8px 0}
  .sl-makes{flex-direction:column;gap:6px}
  .sl-makes li+li::before{content:none}
}
@media (prefers-reduced-motion:reduce){
  .sl *{animation:none!important;transition:none!important}
}
`;
}
