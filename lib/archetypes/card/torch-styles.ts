/**
 * Business card, torch design — the stylesheet, carried over from the agreed
 * mockup (tmp/mockups/flyer/c-torch.html) with its classes prefixed `tt-`. The
 * page is a pine board; the maker's name burns into it with a glowing edge and
 * sparks, scorched stripes torch across between sections, and every caption
 * burns onto a pine plate. Its own fixed look (show reel and torch spec).
 *
 * Nothing waits on script to become visible: the burned words render whole and
 * dark at rest. TorchFire adds `.tt-armed` (only when motion is allowed), which
 * hides what is about to burn, then `.tt-lit` as each piece scrolls in.
 * Timings come from BURN_TIMING — the classes here and the sparks' data
 * attributes read the same table — never inline.
 */

const svg = (markup: string): string => `url("data:image/svg+xml,${encodeURIComponent(markup)}")`;

const GRAIN = svg(
  "<svg xmlns='http://www.w3.org/2000/svg' width='1800' height='1800'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='0.0035 0.11' numOctaves='4' seed='7' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.42  0 0 0 0 0.2  0 0 0 0 0.05  0 0 0 1.25 -0.38'/></filter><rect width='100%' height='100%' filter='url(#g)'/></svg>",
);
const KNOTS = svg(
  "<svg xmlns='http://www.w3.org/2000/svg' width='1400' height='1100'><filter id='k'><feTurbulence type='fractalNoise' baseFrequency='0.0012 0.02' numOctaves='2' seed='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.35  0 0 0 0 0.16  0 0 0 0 0.04  0 0 0 1.6 -0.75'/></filter><rect width='100%' height='100%' filter='url(#k)'/></svg>",
);

export const TORCH_FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&family=IM+Fell+English+SC&family=Barlow+Condensed:wght@500;600;700&family=Barlow:wght@400;500&family=Caveat+Brush&display=swap';

/** Each kind of burn: [seconds it takes, seconds before it starts]. */
export const BURN_TIMING = {
  kick: [1.2, 0],
  name1: [1.9, 0.9],
  name2: [1.9, 2.5],
  name3: [1.9, 4.1],
  head: [2.0, 0],
  cap: [1.6, 0.5],
} as const;
export type BurnKind = keyof typeof BURN_TIMING;

/** When the opening's headline and buttons arrive, by how many lines the name burns. */
const AFTER_NAME = { 1: [2.9, 3.3], 2: [4.5, 4.9], 3: [6.1, 6.5] } as const;

export function torchCss(): string {
  const timing = (Object.keys(BURN_TIMING) as BurnKind[])
    .map((k) => {
      const [d, delay] = BURN_TIMING[k];
      return `.tt-burn--${k}{--d:${d}s;--delay:${delay}s}`;
    })
    .join('\n');
  const after = (Object.keys(AFTER_NAME) as unknown as (keyof typeof AFTER_NAME)[])
    .map((n) => `.tt-armed .tt-open--${n} .tt-head{animation-delay:${AFTER_NAME[n][0]}s}.tt-armed .tt-open--${n} .tt-btns{animation-delay:${AFTER_NAME[n][1]}s}`)
    .join('\n');
  return `
.tt{
  --pine:#e8c58c;--pine-hi:#f3d9a8;--char:#1d0d04;--scorch:#6b3410;--ember:#ff7a1a;--ember-hot:#ffd27a;--flag-red:#a3241c;--ink:#2b1608;
  --grain:${GRAIN};
  --stencil:'IM Fell English SC',Georgia,serif;--fell:'IM Fell English',Georgia,serif;--cond:'Barlow Condensed','Arial Narrow',sans-serif;--body:'Barlow',Arial,sans-serif;--brush:'Caveat Brush',cursive;
  position:relative;isolation:isolate;overflow-x:clip;font-family:var(--body);color:var(--ink);-webkit-font-smoothing:antialiased;
  background-color:var(--pine);
  background-image:
    repeating-linear-gradient(180deg, transparent 0 236px, rgba(70,32,8,.55) 236px 238px, rgba(255,240,210,.35) 238px 239px, transparent 239px 240px),
    ${KNOTS}, var(--grain),
    linear-gradient(90deg, rgba(255,235,200,.25), transparent 30%, rgba(120,60,20,.12) 70%, rgba(255,235,200,.18));
  background-size:auto, 1400px 1100px, 1800px 1800px, auto;
}
.tt::after{content:"";position:fixed;inset:0;pointer-events:none;z-index:50;box-shadow:inset 0 0 120px 30px rgba(40,16,3,.55), inset 0 0 40px 6px rgba(20,8,1,.6)}
.tt *,.tt *::before,.tt *::after{box-sizing:border-box}
.tt :where(h1,h2,p,ul,figure){margin:0;padding:0}
.tt :where(a){color:inherit}
.tt img{display:block;max-width:100%}
.tt :focus-visible{outline:3px solid var(--ember);outline-offset:3px}
.tt-defs{position:absolute;width:0;height:0}
.tt-skip{position:absolute;left:-9999px;top:8px;z-index:60;background:var(--char);color:var(--pine-hi);padding:10px 16px}
.tt-skip:focus{left:8px}

/* burned words */
.tt-burn{position:relative;display:inline-block;line-height:.9}
.tt-burn > span{display:block}
.tt-burn .tt-line{display:block}
.tt-burn .tt-ghost{visibility:hidden}
.tt-burn .tt-char,.tt-burn .tt-ember{position:absolute;inset:-.4em;padding:.4em}
.tt-burn .tt-char{color:#2e1305;mix-blend-mode:multiply;filter:url(#tt-burnedge);
  text-shadow:0 0 2px rgba(40,14,2,.9), 0 0 9px rgba(90,36,6,.6), 0 0 24px rgba(140,62,14,.45), 0 0 44px rgba(160,80,20,.25)}
.tt-burn .tt-ember{display:none}
${timing}
.tt-armed .tt-burn .tt-char{-webkit-mask-image:linear-gradient(90deg,#000 46%,transparent 54%);mask-image:linear-gradient(90deg,#000 46%,transparent 54%);
  -webkit-mask-size:240% 100%;mask-size:240% 100%;-webkit-mask-position:100% 0;mask-position:100% 0}
.tt-armed .tt-burn .tt-ember{display:block;color:var(--ember-hot);text-shadow:0 0 6px var(--ember),0 0 18px var(--ember),0 0 40px rgba(255,90,10,.8);opacity:0;
  -webkit-mask-image:linear-gradient(90deg,transparent 38%,#000 47%,#000 51%,transparent 58%);mask-image:linear-gradient(90deg,transparent 38%,#000 47%,#000 51%,transparent 58%);
  -webkit-mask-size:240% 100%;mask-size:240% 100%;-webkit-mask-position:100% 0;mask-position:100% 0}
.tt-armed .tt-burn.tt-lit .tt-char{animation:tt-burnmask var(--d,2.4s) cubic-bezier(.45,.05,.35,1) forwards;animation-delay:calc(var(--delay,0s) + .12s)}
.tt-armed .tt-burn.tt-lit .tt-ember{animation:tt-burnmask var(--d,2.4s) cubic-bezier(.45,.05,.35,1) forwards, tt-emberfade var(--d,2.4s) linear forwards;animation-delay:var(--delay,0s)}
@keyframes tt-burnmask{to{-webkit-mask-position:0 0;mask-position:0 0}}
@keyframes tt-emberfade{0%{opacity:0}6%{opacity:1}88%{opacity:1}100%{opacity:0}}
.tt-spark{position:absolute;width:3px;height:3px;border-radius:50%;background:var(--ember-hot);box-shadow:0 0 6px 2px var(--ember);pointer-events:none;z-index:5}

/* top bar */
.tt-bar{position:fixed;top:var(--sample-bar-h,0px);left:0;right:0;z-index:40;display:flex;justify-content:space-between;align-items:center;gap:16px;
  padding:14px clamp(16px,4vw,48px);font-family:var(--cond);font-weight:700;letter-spacing:.14em;text-transform:uppercase;font-size:14px;
  background:linear-gradient(180deg,rgba(29,13,4,.92),rgba(29,13,4,.75));color:var(--pine-hi);backdrop-filter:blur(3px)}
.tt-bar > a{font-family:var(--stencil);font-weight:400;letter-spacing:.06em;font-size:20px;text-decoration:none}
.tt-bar nav{display:flex;gap:clamp(12px,3vw,28px)}
.tt-bar nav a{text-decoration:none}
.tt-bar a:hover{color:var(--ember)}

/* opening */
.tt-open{min-height:100svh;display:grid;place-items:center;text-align:center;padding:calc(110px + var(--sample-bar-h,0px)) 16px 60px;position:relative}
.tt-kick{font-family:var(--cond);font-weight:700;letter-spacing:.32em;text-transform:uppercase;font-size:clamp(13px,1.4vw,17px)}
.tt-name{font-family:var(--stencil);font-weight:400;font-size:clamp(76px,12vw,184px);line-height:.9;letter-spacing:.01em;margin:.18em 0 .22em;white-space:nowrap}
.tt-name--long{font-size:clamp(52px,9vw,140px)}
.tt-name .tt-row{display:block}
.tt-name .tt-row--soft{font-family:var(--fell);font-style:italic;font-size:.62em;line-height:1}
.tt-burn .tt-soft{font-family:var(--fell);font-style:italic}
.tt-head{max-width:30ch;margin:0 auto;font-family:var(--cond);font-weight:600;font-size:clamp(20px,2.4vw,32px);line-height:1.15}
.tt-btns{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;margin-top:34px}
.tt-armed .tt-head,.tt-armed .tt-btns{animation:tt-up 1s ease both}
${after}
@keyframes tt-up{from{opacity:0;transform:translateY(10px)}}
.tt-tag{display:inline-block;font-family:var(--cond);font-weight:700;letter-spacing:.16em;text-transform:uppercase;font-size:16px;text-decoration:none;
  padding:15px 26px 14px;color:var(--pine-hi);background:var(--char);
  clip-path:polygon(0 8%,4% 0,96% 2%,100% 12%,99% 90%,95% 100%,5% 97%,1% 88%);transition:.25s}
.tt-tag:hover{background:var(--flag-red);transform:translateY(-2px)}
.tt-tag--ghost{background:transparent;color:var(--char);box-shadow:inset 0 0 0 3px var(--char);clip-path:none}
.tt-tag--ghost:hover{background:var(--char);color:var(--pine-hi)}
.tt-cue{position:absolute;bottom:22px;left:50%;transform:translateX(-50%);font-family:var(--cond);letter-spacing:.3em;text-transform:uppercase;font-size:12px;font-weight:700;opacity:.6;animation:tt-bob 2.4s ease-in-out infinite}
@keyframes tt-bob{50%{transform:translate(-50%,6px)}}

/* scorched stripe */
.tt-stripe{height:46px;position:relative;overflow:hidden}
.tt-stripe::before{content:"";position:absolute;inset:6px 0;background:linear-gradient(180deg,rgba(29,13,4,0),rgba(29,13,4,.9) 22%,var(--char) 50%,rgba(29,13,4,.9) 78%,rgba(29,13,4,0)),var(--grain)}
.tt-stripe--red::before{background:linear-gradient(180deg,transparent,rgba(163,36,28,.85) 25%,var(--flag-red) 50%,rgba(163,36,28,.85) 75%,transparent),var(--grain)}
.tt-stripe::after{content:"";position:absolute;top:0;bottom:0;width:120px;left:-120px;background:radial-gradient(closest-side,rgba(255,170,60,.95),rgba(255,90,10,.55) 45%,transparent);filter:blur(4px);opacity:0}
.tt-armed .tt-stripe::before{transform-origin:left;transform:scaleX(0);transition:transform 1.8s cubic-bezier(.6,.05,.3,1)}
.tt-armed .tt-stripe.tt-lit::before{transform:scaleX(1)}
.tt-armed .tt-stripe.tt-lit::after{animation:tt-torch 1.8s cubic-bezier(.6,.05,.3,1) forwards}
@keyframes tt-torch{0%{left:-120px;opacity:1}92%{opacity:1}100%{left:100%;opacity:0}}

/* sections */
.tt-wrap{width:min(1180px,100% - 32px);margin:0 auto}
.tt-label{font-family:var(--cond);font-weight:700;letter-spacing:.3em;text-transform:uppercase;font-size:14px;color:var(--scorch)}
.tt-h2{font-family:var(--stencil);font-weight:400;font-size:clamp(40px,7vw,104px);margin:.15em 0 .35em}

.tt-about{padding:clamp(70px,10vw,140px) 0}
.tt-about .tt-wrap{display:grid;grid-template-columns:1.1fr .9fr;gap:clamp(28px,5vw,80px);align-items:center}
.tt-about p{font-size:clamp(18px,1.6vw,22px);line-height:1.6;margin-bottom:1em;max-width:36em}
.tt-sig{font-family:var(--brush);font-size:clamp(46px,5vw,68px);color:var(--char);transform:rotate(-4deg);display:inline-block;margin-top:.1em}
.tt-brand{position:relative;aspect-ratio:1;border-radius:50%}
.tt-brand svg{width:100%;height:100%;overflow:visible}
.tt-brand .tt-ring{fill:none;stroke:var(--char);stroke-width:7;filter:url(#tt-scorchy)}
.tt-brand .tt-ring--in{stroke-width:3}
.tt-brand text{font-family:var(--cond);font-weight:700;letter-spacing:.36em;font-size:15px;fill:var(--char)}
.tt-brand .tt-initials{font-family:var(--stencil);font-weight:400;font-size:94px;letter-spacing:0}
.tt-armed .tt-brand{opacity:0;transform:scale(1.25) rotate(-8deg);transition:opacity .25s, transform .5s cubic-bezier(.2,1.6,.4,1)}
.tt-armed .tt-brand.tt-lit{opacity:1;transform:none}
.tt-armed .tt-brand.tt-lit::after{content:"";position:absolute;inset:-6%;border-radius:50%;animation:tt-pressglow 1.4s ease-out forwards}
@keyframes tt-pressglow{0%{box-shadow:0 0 60px 20px rgba(255,120,30,.75)}100%{box-shadow:0 0 0 0 rgba(255,120,30,0)}}

/* the work: big panels */
.tt-work{padding:clamp(40px,6vw,80px) 0 40px}
.tt-reel{display:flex;flex-direction:column;gap:clamp(60px,9vw,130px);margin-top:30px;list-style:none}
.tt-piece{display:grid;grid-template-columns:repeat(12,1fr);align-items:end;position:relative}
.tt-piece figure{grid-column:1 / span 9;grid-row:1;position:relative}
.tt-piece:nth-child(even) figure{grid-column:4 / span 9}
.tt-armed .tt-piece figure{opacity:0;transform:translateY(60px) rotate(-1.2deg);transition:opacity 1s ease, transform 1.2s cubic-bezier(.2,.8,.2,1)}
.tt-armed .tt-piece:nth-child(even) figure{transform:translateY(60px) rotate(1.2deg)}
.tt-armed .tt-piece.tt-lit figure{opacity:1;transform:none}
.tt-shot{display:block;width:100%;padding:0;border:0;background:none;cursor:zoom-in}
.tt-shot img{width:100%;height:min(76vh,720px);object-fit:cover;box-shadow:0 0 0 10px var(--char),0 0 0 14px rgba(29,13,4,.35),0 30px 60px -20px rgba(29,13,4,.7)}
.tt-cap{position:relative;grid-column:6 / -1;grid-row:1;align-self:end;justify-self:end;text-align:right;z-index:4;margin-bottom:-.5em;
  font-family:var(--stencil);font-weight:400;font-size:clamp(40px,6.8vw,104px);line-height:.92;max-width:9ch}
.tt-piece:nth-child(even) .tt-cap{grid-column:1 / span 7;justify-self:start;text-align:left}
.tt-plate{position:absolute;inset:-.12em -.3em -.18em;z-index:-1;background:var(--grain),var(--pine);opacity:.94;
  box-shadow:0 18px 30px -14px rgba(29,13,4,.75), inset 0 2px 0 rgba(255,240,210,.5), inset 0 -3px 0 rgba(90,40,8,.35)}

/* dates: stained planks */
.tt-dates{padding:clamp(70px,10vw,130px) 0}
.tt-planks{display:flex;flex-direction:column;gap:14px;margin-top:10px;list-style:none}
.tt-plank{display:grid;grid-template-columns:auto 1fr auto;gap:clamp(14px,3vw,40px);align-items:center;padding:clamp(18px,2.4vw,28px) clamp(18px,3vw,40px);
  background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(0,0,0,.1)),var(--grain),#c9934f;color:var(--char);
  box-shadow:inset 0 2px 0 rgba(255,240,210,.4), inset 0 -3px 0 rgba(60,25,5,.45), 0 8px 18px -10px rgba(40,16,3,.8)}
.tt-plank:nth-child(3n+2){background-color:#b9803f}
.tt-plank:nth-child(3n){background-color:#d4a463}
.tt-armed .tt-plank{transform:translateX(-30px);opacity:0;transition:.9s cubic-bezier(.2,.8,.2,1)}
.tt-armed .tt-plank:nth-child(2){transition-delay:.15s}
.tt-armed .tt-plank:nth-child(n+3){transition-delay:.3s}
.tt-armed .tt-dates.tt-lit .tt-plank{transform:none;opacity:1}
.tt-plank b{font-family:var(--stencil);font-weight:400;font-size:clamp(28px,4vw,52px);line-height:1;text-shadow:0 0 12px rgba(70,28,4,.4)}
.tt-plank span{font-family:var(--cond);font-weight:700;font-size:clamp(20px,2.4vw,32px);text-transform:uppercase;letter-spacing:.04em}
.tt-plank small{font-family:var(--cond);font-weight:600;letter-spacing:.2em;text-transform:uppercase;font-size:15px;opacity:.75}

/* contact */
.tt-touch{padding:clamp(70px,10vw,140px) 0 clamp(70px,8vw,110px);background:linear-gradient(180deg,transparent,rgba(29,13,4,.08))}
.tt-touch .tt-wrap{display:grid;grid-template-columns:1fr 1fr;gap:clamp(30px,5vw,80px)}
.tt-lede{font-size:clamp(19px,1.7vw,23px);line-height:1.55;max-width:28em}
.tt-links{display:flex;gap:12px;flex-wrap:wrap;margin-top:26px}
.tt-form{padding:clamp(22px,3vw,36px);background:var(--char);color:var(--pine-hi);box-shadow:0 30px 60px -24px rgba(29,13,4,.8);
  clip-path:polygon(0 1%,3% 0,97% 1.5%,100% 0,99% 98%,96% 100%,4% 99%,0 100%)}
.tt-form .bc-form{display:flex;flex-direction:column;gap:14px}
.tt-form .bc-form label{display:block;font-family:var(--cond);font-weight:700;letter-spacing:.2em;text-transform:uppercase;font-size:13px;opacity:.85}
.tt-form .bc-form input,.tt-form .bc-form textarea{display:block;width:100%;margin-top:6px;background:transparent;border:0;border-bottom:2px solid rgba(243,217,168,.4);
  color:var(--pine-hi);font:inherit;font-family:var(--body);font-size:18px;letter-spacing:0;text-transform:none;padding:8px 2px;outline:none}
.tt-form .bc-form input:focus,.tt-form .bc-form textarea:focus{border-color:var(--ember)}
.tt-form .bc-form textarea{min-height:110px;resize:vertical}
.tt-form .bc-form__trap{position:absolute;left:-9999px}
.tt-form .bc-btn{align-self:flex-start;margin-top:6px;font-family:var(--cond);font-weight:700;letter-spacing:.18em;text-transform:uppercase;font-size:16px;padding:15px 28px;border:0;background:var(--ember);color:var(--char);cursor:pointer}
.tt-form .bc-btn:hover{background:var(--ember-hot)}
.tt-form .bc-btn:disabled{opacity:.6;cursor:progress}
.tt-form .bc-form__status{color:var(--ember-hot)}
.tt-form .bc-form__done p{font-size:20px}

.tt-foot{background:var(--char);color:var(--pine-hi);padding:40px 16px 34px;text-align:center}
.tt-foot__big{display:block;font-family:var(--stencil);font-size:clamp(46px,12vw,170px);line-height:.9;color:rgba(243,217,168,.12)}
.tt-foot__row{display:flex;justify-content:center;gap:24px;flex-wrap:wrap;margin-top:14px;font-family:var(--cond);letter-spacing:.16em;text-transform:uppercase;font-size:13px}
.tt-foot a{color:var(--ember);text-decoration:none}

/* the shared photo viewer */
.tt .bc-lb{position:fixed;inset:0;z-index:70;display:grid;place-items:center;background:rgba(20,8,1,.92);padding:clamp(16px,4vw,60px)}
.tt .bc-lb figure{display:grid;gap:14px;justify-items:center;max-height:100%}
.tt .bc-lb img{max-height:80vh;max-width:min(1200px,92vw);object-fit:contain;box-shadow:0 0 0 8px var(--char)}
.tt .bc-lb figcaption{font-family:var(--cond);font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--pine-hi);font-size:18px}
.tt .bc-lb button{position:absolute;display:grid;place-items:center;background:var(--ember);border:0;color:var(--char);width:54px;height:54px;border-radius:50%;font-size:24px;line-height:1;cursor:pointer}
.tt .bc-lb__close{top:18px;right:18px}
.tt .bc-lb__prev{left:18px;top:50%;margin-top:-27px}
.tt .bc-lb__next{right:18px;top:50%;margin-top:-27px}

/* privacy / terms */
.tt-prose{padding:calc(110px + var(--sample-bar-h,0px)) 16px 80px}
.tt-prose > div{width:min(820px,100%);margin:0 auto}
.tt-prose h1{font-family:var(--stencil);font-weight:400;font-size:clamp(40px,6vw,72px);line-height:.95;margin-bottom:20px}
.tt-prose h2{font-family:var(--cond);font-weight:700;text-transform:uppercase;letter-spacing:.08em;font-size:20px;margin:26px 0 8px}
.tt-prose p,.tt-prose li{font-size:18px;line-height:1.6;margin-bottom:12px}
.tt-prose ul{padding-left:22px}

@media (max-width:760px){
  .tt-bar nav{display:none}
  .tt-about .tt-wrap,.tt-touch .tt-wrap{grid-template-columns:1fr}
  .tt-brand{max-width:280px;margin:0 auto;width:100%}
  .tt-piece figure,.tt-piece:nth-child(even) figure{grid-column:1 / -1}
  .tt-cap,.tt-piece:nth-child(even) .tt-cap{grid-column:1 / -1;grid-row:2;justify-self:start;text-align:left;margin:16px 0 0}
  .tt-plate{inset:-.1em -.2em}
  .tt-shot img{height:auto;aspect-ratio:4/5}
  .tt-plank{grid-template-columns:1fr}
}
`;
}
