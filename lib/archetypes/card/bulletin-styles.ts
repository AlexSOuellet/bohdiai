/**
 * Business card, bulletin board design — the stylesheet, carried over from the
 * agreed mockup (tmp/mockups/flyer/a-bulletin.html) with its classes prefixed
 * `bb-`. A kraft flyer tacked to a barn-board wall: stamped woodtype, pinned
 * snapshots that swing, marker-circled dates, tear-off tabs. Its own fixed look
 * (bulletin board spec), not a family's; owners change words and photos only.
 *
 * Motion is CSS only: the flyer drops in and swings, the stamp and name stamp
 * in, snapshots drop and swing on hover, a tab tears away. Under reduced motion
 * everything sits at rest. Per-photo angles are nth-child rules, never inline.
 */

const svg = (markup: string): string => `url("data:image/svg+xml,${encodeURIComponent(markup)}")`;

const NOISE = svg(
  "<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .3  0 0 0 0 .2  0 0 0 0 .1  0 0 0 .55 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>",
);
const FIBER = svg(
  "<svg xmlns='http://www.w3.org/2000/svg' width='800' height='800'><filter id='f'><feTurbulence type='fractalNoise' baseFrequency='.012 .3' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .1  0 0 0 0 .05  0 0 0 0 .02  0 0 0 1.4 -.55'/></filter><rect width='100%' height='100%' filter='url(#f)'/></svg>",
);

export const BULLETIN_FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Alfa+Slab+One&family=Special+Elite&family=Permanent+Marker&family=Oswald:wght@500;700&display=swap';

/** The snapshot angles on the wall, repeating every nine. */
const WALL_ANGLES = [-4, 3, -2, 5, -3, 2, -5, 4, -1];

export function bulletinCss(): string {
  const wallAngles = WALL_ANGLES.map((r, i) => `.bb-scatter li:nth-child(9n+${i + 1}) .bb-photo{--r:${r}deg}`).join('\n');
  return `
.bb{
  --kraft:#d9b98a;--ink:#1f1610;--red:#b3261e;--navy:#1d2f4f;--tack:#c8261e;--paper:#f6f1e6;--card:#f4ecd8;--chalk:#f1dcb4;
  --noise:${NOISE};
  --type:'Special Elite','Courier New',monospace;--slab:'Alfa Slab One',Georgia,serif;--marker:'Permanent Marker',cursive;--label:'Oswald','Arial Narrow',sans-serif;
  position:relative;isolation:isolate;min-height:100vh;overflow-x:clip;color:var(--ink);font-family:var(--type);font-size:18px;line-height:1.5;-webkit-font-smoothing:antialiased;
  background:
    repeating-linear-gradient(90deg, rgba(0,0,0,.45) 0 3px, transparent 3px 160px),
    ${FIBER},
    linear-gradient(90deg,#3d2717,#4a301c 20%,#352214 40%,#4b311d 60%,#3a2516 80%,#452c1a);
  background-size:auto,800px 800px,auto;
}
.bb *,.bb *::before,.bb *::after{box-sizing:border-box}
.bb :where(h1,h2,p,ul,figure){margin:0;padding:0}
.bb img{display:block;max-width:100%}
.bb :where(a){color:inherit}
.bb :focus-visible{outline:3px solid var(--red);outline-offset:3px}
.bb-sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
.bb-skip{position:absolute;left:-9999px;top:8px;z-index:60;background:var(--red);color:#fff;padding:10px 16px;font-family:var(--label)}
.bb-skip:focus{left:8px}

.bb-wall{padding:calc(clamp(70px,8vw,110px) + var(--sample-bar-h,0px)) 16px 80px;display:flex;flex-direction:column;align-items:center;gap:70px}
.bb-wall--inner{padding:0;width:100%}
.bb-more{display:flex;flex-direction:column;align-items:center;gap:40px;width:100%}

/* the flyer */
.bb-flyer{position:relative;width:min(940px,100%);padding:clamp(28px,5vw,64px) clamp(20px,5vw,64px) 0;
  background:var(--noise),linear-gradient(170deg,#e4c899,var(--kraft) 40%,#cfae7c);
  box-shadow:0 2px 0 rgba(255,255,255,.2) inset, 0 40px 70px -25px rgba(0,0,0,.85), 0 8px 18px rgba(0,0,0,.4);
  transform:rotate(-1deg);transform-origin:50% 0;animation:bb-hang 1.4s cubic-bezier(.3,1.5,.5,1) both}
@keyframes bb-hang{0%{transform:translateY(-60px) rotate(-7deg);opacity:0}40%{opacity:1}100%{transform:rotate(-1deg)}}
.bb-tack{position:absolute;width:26px;height:26px;border-radius:50%;z-index:6;
  background:radial-gradient(circle at 35% 30%,#ff8a80,var(--tack) 45%,#6e0f0b);box-shadow:3px 5px 6px rgba(0,0,0,.5)}
.bb-tack--l{top:14px;left:18px}.bb-tack--r{top:12px;right:22px}
.bb-stamp{display:inline-block;font-family:var(--label);font-weight:700;letter-spacing:.24em;text-transform:uppercase;font-size:clamp(12px,1.5vw,16px);
  color:var(--red);border:3px solid var(--red);padding:6px 12px 5px;transform:rotate(-4deg);mix-blend-mode:multiply;opacity:.85;
  -webkit-mask:var(--noise);mask:var(--noise);animation:bb-stampin .5s cubic-bezier(.2,1.8,.5,1) .9s both}
@keyframes bb-stampin{0%{transform:scale(2.2) rotate(-14deg);opacity:0}100%{transform:scale(1) rotate(-4deg);opacity:.85}}
.bb-big{font-family:var(--slab);font-weight:400;text-transform:uppercase;line-height:.82;margin:.18em 0 .1em;mix-blend-mode:multiply;overflow-wrap:anywhere}
.bb-big span{display:block;color:var(--red);margin-left:.35em;font-size:var(--bb-name);animation:bb-stampin2 .55s cubic-bezier(.2,1.6,.5,1) both}
.bb-big span:first-child{color:var(--ink);margin-left:0}
.bb-big span:nth-child(1){animation-delay:1.2s}.bb-big span:nth-child(2){animation-delay:1.5s}
.bb-big span:nth-child(3){animation-delay:1.8s}.bb-big span:nth-child(n+4){animation-delay:2.1s}
.bb-big--xl{--bb-name:clamp(70px,16vw,176px)}.bb-big--l{--bb-name:clamp(56px,12.5vw,140px)}
.bb-big--m{--bb-name:clamp(42px,9.5vw,112px)}.bb-big--s{--bb-name:clamp(34px,7.5vw,88px)}
@keyframes bb-stampin2{0%{transform:scale(1.7);opacity:0;filter:blur(3px)}100%{transform:none;opacity:1;filter:none}}
.bb-strip{display:flex;flex-wrap:wrap;gap:10px 18px;list-style:none;font-family:var(--label);font-weight:700;letter-spacing:.14em;text-transform:uppercase;font-size:clamp(14px,1.8vw,20px);
  border-top:4px solid var(--ink);border-bottom:4px solid var(--ink);padding:10px 0;margin:10px 0 26px;animation:bb-fade .6s 1.9s both}
.bb-strip li{display:flex;gap:18px;align-items:center}
.bb-strip li+li::before{content:"\\2605";color:var(--red)}
@keyframes bb-fade{from{opacity:0}}
.bb-lede{font-size:clamp(17px,1.8vw,21px);line-height:1.5;max-width:30em;animation:bb-fade .6s 2.1s both}

/* pinned snapshots */
.bb-photo{position:relative;display:block;width:100%;height:100%;border:0;cursor:pointer;font:inherit;color:#333;text-align:center;
  background:var(--paper);padding:10px 10px 40px;box-shadow:0 18px 26px -12px rgba(0,0,0,.6);transform-origin:50% 8px;transform:rotate(var(--r,0deg))}
.bb-photo img{width:100%;height:100%;object-fit:cover}
.bb-photo__cap{position:absolute;left:6px;right:6px;bottom:8px;font-family:var(--marker);font-size:16px;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bb-photo::before{content:"";position:absolute;top:-8px;left:50%;margin-left:-11px;width:22px;height:22px;border-radius:50%;z-index:2;
  background:radial-gradient(circle at 35% 30%,#9fb8ff,#2a4fb3 45%,#0e1f4f);box-shadow:2px 4px 5px rgba(0,0,0,.5)}
.bb-photo:hover{animation:bb-swing 1.6s ease-in-out}
@keyframes bb-swing{0%{transform:rotate(var(--r))}20%{transform:rotate(calc(var(--r) + 6deg))}45%{transform:rotate(calc(var(--r) - 4deg))}70%{transform:rotate(calc(var(--r) + 2deg))}100%{transform:rotate(var(--r))}}
/* The drop-in lives on the frame (li), the swing on the photo, so hovering never restarts the drop. */
@keyframes bb-drop{0%{transform:translateY(-40px) rotate(-6deg);opacity:0}100%{transform:none;opacity:1}}
.bb-pins{position:relative;height:clamp(300px,42vw,440px);margin:34px 0 20px;list-style:none}
.bb-pins li{position:absolute}
.bb-pins li:nth-child(1){left:0;top:10px;width:46%;height:82%}
.bb-pins li:nth-child(2){left:38%;top:0;width:34%;height:90%;z-index:2}
.bb-pins li:nth-child(3){right:0;top:30px;width:30%;height:78%}
.bb-pins li{transform-origin:50% 0;animation:bb-drop .7s cubic-bezier(.3,1.5,.5,1) both}
.bb-pins li:nth-child(1){animation-delay:2.3s}.bb-pins li:nth-child(2){animation-delay:2.5s}.bb-pins li:nth-child(3){animation-delay:2.7s}
.bb-pins li:nth-child(1) .bb-photo{--r:-5deg}
.bb-pins li:nth-child(2) .bb-photo{--r:4deg}
.bb-pins li:nth-child(3) .bb-photo{--r:-2deg}

/* find me — marker list */
.bb-find{display:grid;grid-template-columns:auto 1fr;gap:24px;align-items:start;margin:20px 0 30px}
.bb-find h2{font-family:var(--marker);font-weight:400;font-size:clamp(28px,3.4vw,40px);color:var(--red);transform:rotate(-6deg);white-space:nowrap}
.bb-find ul{list-style:none;font-family:var(--marker);font-size:clamp(19px,2.2vw,26px);line-height:1.5}
.bb-find li b{position:relative;display:inline-block;padding:0 6px;font-weight:400}
.bb-find li b::after{content:"";position:absolute;inset:-6px -8px;border:3px solid var(--red);border-radius:50% 45% 55% 50%;transform:rotate(-3deg);opacity:.8}
.bb-find li span{opacity:.7}

/* tear-off tabs */
.bb-tabs{display:flex;margin:30px calc(-1 * clamp(20px,5vw,64px)) 0;border-top:2px dashed rgba(31,22,16,.5)}
.bb-tab{flex:1;min-width:0;height:150px;border-right:2px dashed rgba(31,22,16,.45);display:flex;align-items:center;justify-content:center;
  writing-mode:vertical-rl;transform:rotate(180deg);font-family:var(--label);font-weight:700;font-size:16px;letter-spacing:.12em;white-space:nowrap;text-transform:uppercase;
  text-decoration:none;color:var(--red);background:var(--noise),linear-gradient(180deg,#cfae7c,var(--kraft));cursor:pointer;transition:transform .2s}
.bb-tab:last-child{border-right:0}
.bb-tab b{font-weight:700}
.bb-tab:hover{transform:rotate(180deg) translateY(-6px)}
.bb-tab--gone{visibility:hidden}
.bb-tab--tear{animation:bb-tear .65s ease-in forwards;pointer-events:none}
@keyframes bb-tear{0%{transform:rotate(180deg)}30%{transform:rotate(170deg) translateY(10px)}100%{transform:rotate(150deg) translateY(-700px) translateX(80px);opacity:0}}

/* the rest of the board */
.bb-board-h{font-family:var(--slab);font-weight:400;color:var(--chalk);font-size:clamp(36px,6vw,70px);text-transform:uppercase;text-align:center;text-shadow:0 4px 0 rgba(0,0,0,.4);line-height:1}
.bb-scatter{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:40px 30px;width:min(1180px,100%);list-style:none}
.bb-scatter li{height:300px}
${wallAngles}
.bb-cards{display:grid;grid-template-columns:1fr 1fr;gap:40px;width:min(1000px,100%);align-items:start}
.bb-card{position:relative;padding:40px 30px 30px;box-shadow:0 30px 40px -20px rgba(0,0,0,.8);
  background:var(--noise),repeating-linear-gradient(180deg,transparent 0 31px,rgba(80,120,190,.35) 31px 32px),var(--card);transform:rotate(var(--r))}
.bb-card--about{--r:-1.5deg}.bb-card--touch{--r:1.2deg}
.bb-card::before{content:"";position:absolute;top:-10px;left:50%;margin-left:-55px;width:110px;height:30px;background:rgba(240,230,200,.7);transform:rotate(-3deg);box-shadow:0 2px 4px rgba(0,0,0,.2)}
.bb-card h2{font-family:var(--marker);font-weight:400;font-size:32px;line-height:1.15;color:var(--red);margin-bottom:10px}
.bb-card p{font-size:17px;line-height:1.6;margin-bottom:12px}
.bb-sig{font-family:var(--marker);font-size:30px}
.bb-ways{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}
.bb-ways a{font-family:var(--label);font-weight:700;letter-spacing:.14em;text-transform:uppercase;font-size:14px;text-decoration:none;color:#fff;background:var(--navy);padding:10px 16px}
.bb-ways a:hover{background:var(--red)}
.bb-card .bc-form{display:flex;flex-direction:column}
.bb-card .bc-form label{display:block;font-family:var(--label);font-weight:700;letter-spacing:.14em;text-transform:uppercase;font-size:12px}
.bb-card .bc-form input,.bb-card .bc-form textarea{display:block;width:100%;background:transparent;border:0;border-bottom:2px solid var(--ink);font:inherit;font-family:var(--type);font-size:17px;text-transform:none;letter-spacing:0;padding:6px 0;margin:2px 0 16px;outline:none;color:var(--ink)}
.bb-card .bc-form input:focus,.bb-card .bc-form textarea:focus{border-color:var(--red)}
.bb-card .bc-form textarea{min-height:90px;resize:vertical}
.bb-card .bc-form__trap{position:absolute;left:-9999px}
.bb-card .bc-btn{align-self:flex-start;font-family:var(--label);font-weight:700;letter-spacing:.16em;text-transform:uppercase;background:var(--red);color:#fff;border:0;padding:14px 24px;font-size:15px;cursor:pointer}
.bb-card .bc-btn:disabled{opacity:.6;cursor:progress}
.bb-card .bc-form__status{margin-top:12px;color:var(--red)}
.bb-card .bc-form__done p{font-family:var(--marker);font-size:22px}

/* footer */
.bb-foot{text-align:center;color:#d9c29a;font-family:var(--label);letter-spacing:.14em;text-transform:uppercase;font-size:13px;padding:30px 16px 40px;display:flex;justify-content:center;flex-wrap:wrap;gap:8px 22px}
.bb-foot a{color:#ffb37a;text-decoration:none}
.bb-foot a:hover{text-decoration:underline}

/* the shared photo viewer */
.bb .bc-lb{position:fixed;inset:0;z-index:70;display:grid;place-items:center;background:rgba(20,12,6,.92);padding:clamp(16px,4vw,60px)}
.bb .bc-lb figure{display:grid;gap:14px;justify-items:center;max-height:100%}
.bb .bc-lb img{max-height:78vh;max-width:min(1200px,92vw);object-fit:contain;background:var(--paper);padding:12px}
.bb .bc-lb figcaption{font-family:var(--marker);color:var(--chalk);font-size:22px;text-align:center}
.bb .bc-lb button{position:absolute;display:grid;place-items:center;background:var(--red);border:0;color:#fff;width:54px;height:54px;border-radius:50%;font-size:24px;line-height:1;cursor:pointer}
.bb .bc-lb__close{top:18px;right:18px}
.bb .bc-lb__prev{left:18px;top:50%;margin-top:-27px}
.bb .bc-lb__next{right:18px;top:50%;margin-top:-27px}

/* privacy / terms on the wall */
.bb-prose{width:min(820px,100%)}
.bb-prose h1{font-family:var(--slab);font-weight:400;text-transform:uppercase;font-size:clamp(34px,5vw,56px);line-height:1;margin-bottom:18px}
.bb-prose h2{font-family:var(--label);font-weight:700;text-transform:uppercase;letter-spacing:.08em;font-size:20px;margin:26px 0 8px}
.bb-prose p,.bb-prose li{font-size:17px;line-height:1.6;margin-bottom:12px}
.bb-prose ul{padding-left:22px;margin-bottom:12px}
.bb-flyer--prose{padding-bottom:clamp(28px,5vw,56px)}
.bb-home{display:inline-block;font-family:var(--slab);text-transform:uppercase;font-size:28px;text-decoration:none;margin-bottom:20px;color:var(--red)}

@media (max-width:700px){
  .bb-pins{height:auto;display:flex;flex-direction:column;gap:30px}
  .bb-pins li:nth-child(n){position:relative;left:auto;right:auto;top:auto;width:88%;height:280px;margin:0 auto}
  .bb-find{grid-template-columns:1fr}
  .bb-cards{grid-template-columns:1fr}
  .bb-tab{font-size:11px;height:130px}
}
@media (prefers-reduced-motion:reduce){
  .bb *,.bb-flyer{animation:none!important;transition:none!important}
}
`;
}
