/**
 * Business card, show reel design — the stylesheet, carried over from the agreed
 * mockup (tmp/mockups/flyer/b-showreel.html) with its classes prefixed `sr-`.
 * A moving ad for the shop: the name slammed over the opening photo, then the
 * work big, two to a row, with quiet captions (Spotlight trial, Alex 2026-10-15).
 * Its own fixed look (show reel and torch spec), not a family's yet.
 *
 * Nothing waits on script to become visible: the hidden starting states of the
 * entrances live under `.sr-armed`, which ShowreelMotion adds only when it is
 * running and motion is allowed; it then adds `.sr-on` to each screen as it
 * scrolls in. Per-letter timing is nth-child rules, never inline.
 */

export const SHOWREEL_FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT@0,9..144,300..900,100;1,9..144,300..900,100&family=Karla:wght@400;500;600;700&display=swap';

/** Letter delays for the slam (letters past the last share its delay). */
export const SLAM_LETTERS = 24;
const LETTERS = SLAM_LETTERS;

export function showreelCss(): string {
  const letters = Array.from({ length: LETTERS }, (_, i) => `.sr-armed .sr-slam .sr-l${i}{animation-delay:${(0.2 + i * 0.07).toFixed(2)}s}`).join('\n');
  return `
html:has(.sr){scroll-snap-type:y proximity}
.sr{
  --bg:#0e0b09;--bone:#f1e6d2;--red:#b5543f;--navy:#1b2c4c;--dim:rgba(241,230,210,.6);
  --rose:#f2b8a6;
  --serif:'Fraunces',Georgia,serif;--cond:'Karla',Arial,sans-serif;
  position:relative;isolation:isolate;background:var(--bg);color:var(--bone);font-family:var(--cond);overflow-x:clip;-webkit-font-smoothing:antialiased;
}
.sr *,.sr *::before,.sr *::after{box-sizing:border-box}
.sr :where(h1,h2,p,ul,figure){margin:0;padding:0}
.sr :where(a){color:inherit}
.sr img{display:block}
.sr :focus-visible{outline:3px solid var(--red);outline-offset:3px}
.sr-sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
.sr-skip{position:absolute;left:-9999px;top:8px;z-index:60;background:var(--red);color:#fff;padding:10px 16px}
.sr-skip:focus{left:8px}

.sr-bar{position:fixed;top:var(--sample-bar-h,0px);left:0;right:0;z-index:30;display:flex;justify-content:space-between;align-items:center;padding:16px clamp(16px,4vw,44px);
  background:linear-gradient(180deg,rgba(14,11,9,.6),rgba(14,11,9,0));color:var(--bone);text-shadow:0 1px 8px rgba(0,0,0,.45);
  font-weight:800;letter-spacing:.2em;text-transform:uppercase;font-size:14px;pointer-events:none}
.sr-bar a{pointer-events:auto;font-family:var(--serif);font-weight:900;font-variation-settings:"SOFT" 100,"opsz" 144;letter-spacing:.06em;font-size:20px;text-decoration:none}
.sr-bar nav a{font-family:var(--cond);font-weight:800;letter-spacing:.2em;font-size:13px;border-bottom:2px solid currentColor;padding-bottom:2px}

.sr-slide{position:relative;min-height:100svh;overflow:hidden;scroll-snap-align:start;display:grid}
.sr-slide .sr-main{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}
.sr-armed .sr-slide .sr-main{transform:scale(1.08);transition:transform 6s ease-out}
.sr-armed .sr-slide.sr-on .sr-main{transform:scale(1)}
.sr-txt{position:relative;z-index:3;align-self:end;padding:0 clamp(16px,5vw,64px) clamp(70px,10vh,110px)}

/* opening */
.sr-open .sr-main{object-fit:cover;filter:brightness(.6)}
.sr-open .sr-txt{align-self:center;text-align:center;padding:calc(90px + var(--sample-bar-h,0px)) 16px 90px}
.sr-kick{font-weight:600;letter-spacing:.38em;text-transform:uppercase;font-size:clamp(13px,1.5vw,17px);color:var(--dim)}
.sr-slam{font-family:var(--serif);font-weight:900;font-variation-settings:"SOFT" 100,"opsz" 144;font-size:clamp(76px,12vw,190px);line-height:.86;margin:14px 0 22px;overflow-wrap:anywhere}
.sr-slam--m{font-size:clamp(62px,10vw,160px)}.sr-slam--s{font-size:clamp(46px,8vw,124px)}
.sr-slam .sr-word--soft{font-weight:400;font-size:.62em;color:var(--rose)}
.sr-slam .sr-word--soft i{font-style:italic}
.sr-slam .sr-word{display:block}
.sr-slam i{font-style:normal;display:inline-block}
.sr-armed .sr-slam i{animation:sr-slam .5s cubic-bezier(.2,1.6,.4,1) both}
.sr-armed .sr-slam.sr-landed i{animation:none}
${letters}
@keyframes sr-slam{0%{transform:scale(3.2);opacity:0}100%{transform:none;opacity:1}}
.sr-head{font-weight:500;font-size:clamp(20px,2.6vw,34px);line-height:1.2;max-width:28ch;margin:0 auto}
.sr-go{display:inline-block;margin-top:28px;font-weight:800;letter-spacing:.24em;text-transform:uppercase;font-size:14px;color:var(--bone);border:2px solid var(--bone);padding:14px 26px;text-decoration:none}
.sr-go:hover{background:var(--bone);color:var(--bg)}
.sr-armed .sr-head{animation:sr-up .8s 1.5s both}
.sr-armed .sr-go{animation:sr-up .8s 1.8s both}
@keyframes sr-up{from{opacity:0;transform:translateY(20px)}}

/* the work: big, two to a row, quiet captions */
.sr-work{padding:clamp(48px,7vw,96px) clamp(10px,2.4vw,28px) clamp(20px,3vw,36px)}
.sr-grid{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:clamp(10px,2vw,24px)}
.sr-tile figure{margin:0}
.sr-grid > .sr-tile:last-child:nth-child(odd){grid-column:1/-1}
.sr-grid > .sr-tile:last-child:nth-child(odd) .sr-tile-img{aspect-ratio:16/9}
.sr-tile a{display:block;text-decoration:none}
.sr-tile-img{aspect-ratio:4/5;overflow:hidden;background:#1d1713}
.sr-tile-img img{width:100%;height:100%;object-fit:cover;transition:transform .9s cubic-bezier(.2,.9,.2,1)}
.sr-tile a:hover .sr-tile-img img{transform:scale(1.035)}
.sr-tile a:focus-visible{outline-offset:6px}
.sr-cap{display:flex;justify-content:space-between;align-items:baseline;gap:14px;padding:14px 2px 6px}
.sr-cap-name{font-family:var(--serif);font-weight:700;font-variation-settings:"SOFT" 100,"opsz" 72;font-size:clamp(19px,2vw,28px);line-height:1.1}
.sr-soft{font-style:italic;font-weight:400}
.sr-price{font-weight:600;font-size:clamp(15px,1.3vw,18px);color:var(--dim);white-space:nowrap}
.sr-price s{opacity:.7;margin-right:4px}
.sr-price--ask{font-style:italic}
.sr-more{text-align:center;padding:8px 16px clamp(56px,8vw,96px)}
.sr-more a,.sr-go--dark{display:inline-block;font-weight:800;letter-spacing:.2em;text-transform:uppercase;font-size:14px;text-decoration:none;border:2px solid currentColor;padding:14px 26px}
.sr-more a:hover{background:var(--bone);color:var(--bg)}

/* the shop and a piece */
.sr-page{min-height:100svh;padding:calc(96px + var(--sample-bar-h,0px)) clamp(10px,2.4vw,28px) 90px}
.sr-page .sr-grid{margin-top:clamp(24px,4vw,44px)}
.sr-page-title{font-family:var(--serif);font-weight:900;font-variation-settings:"SOFT" 100,"opsz" 144;font-size:clamp(44px,7vw,104px);line-height:.92;padding:0 2px}
.sr-empty{font-size:19px;color:var(--dim);margin-top:24px}
.sr-back a{font-weight:800;letter-spacing:.18em;text-transform:uppercase;font-size:13px;text-decoration:none;border-bottom:2px solid currentColor}
.sr-piece{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr);gap:clamp(24px,4vw,56px);margin-top:28px;align-items:start}
.sr-piece-photos{display:grid;gap:12px}
.sr-piece-photos img{width:100%;height:auto;background:#1d1713}
.sr-piece-sheet{position:sticky;top:calc(84px + var(--sample-bar-h,0px))}
.sr-piece-sheet h1{font-family:var(--serif);font-weight:800;font-variation-settings:"SOFT" 100,"opsz" 144;font-size:clamp(36px,4.6vw,64px);line-height:.98}
.sr-piece-price{margin:14px 0 22px}
.sr-piece-price .sr-price{font-size:22px;color:var(--bone)}
.sr-piece-short{font-weight:600}
.sr-piece-sheet p{font-size:18px;line-height:1.55;max-width:44ch;margin-bottom:14px}
.sr-go--dark{margin-top:14px;color:var(--bone)}
.sr-go--dark:hover{background:var(--red);border-color:var(--red)}
.sr-ask{background:var(--bone);color:var(--bg);padding:clamp(28px,4vw,48px);margin:clamp(48px,7vw,96px) auto 0;max-width:760px}
.sr-ask .bc-form{display:flex;flex-direction:column;gap:12px}
.sr-ask .bc-form label{display:block;font-weight:800;letter-spacing:.16em;text-transform:uppercase;font-size:12px}
.sr-ask .bc-form input,.sr-ask .bc-form textarea{display:block;width:100%;margin-top:6px;font:inherit;font-size:18px;padding:12px;border:3px solid var(--bg);background:transparent;outline:none;color:var(--bg)}
.sr-ask .bc-form input:focus,.sr-ask .bc-form textarea:focus{border-color:var(--red)}
.sr-ask .bc-form textarea{min-height:120px;resize:vertical}
.sr-ask .bc-form__trap{position:absolute;left:-9999px}
.sr-ask .bc-btn{font-family:var(--serif);font-weight:800;font-variation-settings:"SOFT" 100;font-size:22px;background:var(--red);color:#fff;border:0;padding:14px;cursor:pointer}
.sr-ask .bc-btn:disabled{opacity:.6;cursor:progress}
.sr-ask .bc-form__status{color:var(--red);font-weight:700}
.sr-page-foot{display:flex;flex-wrap:wrap;gap:8px 22px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;font-size:13px;opacity:.75;margin-top:64px}
.sr-page-foot a{text-decoration:none}

/* the red panel */
.sr-say{background:var(--red);place-items:center;text-align:center;padding:90px 16px}
.sr-say h2{font-family:var(--serif);font-weight:900;font-variation-settings:"SOFT" 100,"opsz" 144;font-size:clamp(40px,6vw,92px);line-height:.95;max-width:14ch;margin:0 auto}
.sr-say h2 span{display:block}
.sr-say h2 span:nth-child(2){font-style:italic;font-weight:400}
.sr-armed .sr-say h2 span{transform:translateX(-120%);transition:transform .9s cubic-bezier(.2,.9,.2,1)}
.sr-armed .sr-say h2 span:nth-child(2){transform:translateX(120%);transition-delay:.12s}
.sr-armed .sr-say.sr-on h2 span{transform:none}
.sr-say p{margin:24px auto 0;font-size:18px;font-weight:500;letter-spacing:.01em;line-height:1.45;max-width:40ch}
.sr-say .sr-sig{display:block;margin-top:20px;font-family:var(--serif);font-weight:800;font-variation-settings:"SOFT" 100;font-size:28px}

/* end panel */
.sr-end{background:var(--bone);color:var(--bg);place-items:center;padding:80px 16px calc(80px + 44px)}
.sr-end .sr-wrap{width:min(1100px,100%);display:grid;grid-template-columns:1.1fr .9fr;gap:50px;align-items:center}
.sr-end h2{font-family:var(--serif);font-weight:900;font-variation-settings:"SOFT" 100,"opsz" 144;font-size:clamp(44px,6vw,84px);line-height:.92}
.sr-end p{font-size:19px;font-weight:500;margin:18px 0 22px;max-width:28ch}
.sr-ways{display:flex;flex-wrap:wrap;gap:10px}
.sr-ways a{display:inline-block;background:var(--navy);color:#fff;text-decoration:none;font-weight:800;letter-spacing:.2em;text-transform:uppercase;padding:14px 22px;font-size:14px}
.sr-ways a:hover{background:var(--red)}
.sr-end .bc-form{display:flex;flex-direction:column;gap:12px}
.sr-end .bc-form label{display:block;font-weight:800;letter-spacing:.16em;text-transform:uppercase;font-size:12px}
.sr-end .bc-form input,.sr-end .bc-form textarea{display:block;width:100%;margin-top:6px;font:inherit;font-size:20px;letter-spacing:0;text-transform:none;padding:14px;border:3px solid var(--bg);background:transparent;outline:none;color:var(--bg)}
.sr-end .bc-form input:focus,.sr-end .bc-form textarea:focus{border-color:var(--red)}
.sr-end .bc-form textarea{min-height:110px;resize:vertical}
.sr-end .bc-form__trap{position:absolute;left:-9999px}
.sr-end .bc-btn{font-family:var(--serif);font-weight:800;font-variation-settings:"SOFT" 100;font-size:24px;background:var(--red);color:#fff;border:0;padding:16px;cursor:pointer}
.sr-end .bc-btn:disabled{opacity:.6;cursor:progress}
.sr-end .bc-form__status{color:var(--red);font-weight:700}
.sr-end .bc-form__done p{font-size:24px;font-weight:700}
.sr-foot{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:8px 22px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;font-size:13px;opacity:.75;margin-top:30px}
.sr-foot a{text-decoration:none}
.sr-foot a:hover{text-decoration:underline}

/* ticker */
.sr-ticker{position:fixed;left:0;right:0;bottom:0;z-index:30;background:var(--red);color:#fff;overflow:hidden;white-space:nowrap;
  font-weight:800;letter-spacing:.14em;text-transform:uppercase;font-size:15px;padding:10px 0}
.sr-ticker div{display:inline-block;padding-left:100%;animation:sr-tick 40s linear infinite}
.sr-ticker:hover div{animation-play-state:paused}
.sr-ticker span{margin-right:60px}
.sr-ticker b{font-family:var(--serif);font-weight:900;font-variation-settings:"SOFT" 100,"opsz" 144;letter-spacing:.04em;margin-right:12px}
@keyframes sr-tick{to{transform:translateX(-100%)}}

/* privacy / terms */
.sr-prose{min-height:100svh;padding:calc(110px + var(--sample-bar-h,0px)) 16px 80px;background:var(--bone);color:var(--bg)}
.sr-prose > div{width:min(820px,100%);margin:0 auto}
.sr-prose h1{font-family:var(--serif);font-weight:900;font-variation-settings:"SOFT" 100,"opsz" 144;font-size:clamp(40px,6vw,72px);line-height:.95;margin-bottom:20px}
.sr-prose h2{font-weight:800;text-transform:uppercase;letter-spacing:.08em;font-size:20px;margin:26px 0 8px}
.sr-prose p,.sr-prose li{font-size:19px;line-height:1.55;margin-bottom:12px}
.sr-prose ul{padding-left:22px}
.sr-prose .sr-bar{background:var(--bg)}
.sr-prose-foot{width:min(820px,100%);margin:40px auto 0;display:flex;flex-wrap:wrap;gap:8px 22px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;font-size:13px;opacity:.75}
.sr-prose-foot a{text-decoration:none}

@media (max-width:760px){.sr-end .sr-wrap{grid-template-columns:1fr}.sr-piece{grid-template-columns:1fr}.sr-piece-sheet{position:static}.sr-cap{flex-direction:column;gap:4px}}
@media (max-width:420px){.sr-grid{gap:8px}.sr-cap-name{font-size:17px}}
@media (prefers-reduced-motion:reduce){
  .sr-ticker div{animation:none;padding-left:16px}
  .sr-tile-img img{transition:none}
  html:has(.sr){scroll-snap-type:none}
}
`;
}
