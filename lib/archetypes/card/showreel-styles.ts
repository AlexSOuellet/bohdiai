/**
 * Business card, show reel design — the stylesheet, carried over from the agreed
 * mockup (tmp/mockups/flyer/b-showreel.html) with its classes prefixed `sr-`.
 * The work full screen, one piece at a time, like a moving ad for the shop. Its
 * own fixed look (show reel and torch spec), not a family's.
 *
 * Nothing waits on script to become visible: the hidden starting states of the
 * entrances live under `.sr-armed`, which ShowreelMotion adds only when it is
 * running and motion is allowed; it then adds `.sr-on` to each screen as it
 * scrolls in. Per-letter timing is nth-child rules, never inline.
 */

export const SHOWREEL_FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT@0,9..144,300..900,100;1,9..144,300..900,100&family=Karla:wght@400;500;600;700&display=swap';

/** Letter delays for the slam (letters past the last share its delay), and word delays for the rising captions. */
export const SLAM_LETTERS = 24;
const LETTERS = SLAM_LETTERS;
const WORDS = 10;

export function showreelCss(): string {
  const letters = Array.from({ length: LETTERS }, (_, i) => `.sr-armed .sr-slam .sr-l${i}{animation-delay:${(0.2 + i * 0.07).toFixed(2)}s}`).join('\n');
  const words = Array.from({ length: WORDS }, (_, i) => `.sr-name span:nth-child(${i + 1}){transition-delay:${(0.15 + i * 0.07).toFixed(2)}s}`).join('\n');
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

.sr-slide{position:relative;min-height:100svh;overflow:hidden;scroll-snap-align:start;display:grid}
.sr-slide .sr-bg{position:absolute;top:-30px;left:-30px;width:calc(100% + 60px);height:calc(100% + 60px);object-fit:cover;filter:blur(26px) brightness(.45) saturate(1.2)}
.sr-slide .sr-main{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}
.sr-armed .sr-slide .sr-main{transform:scale(1.08);transition:transform 6s ease-out}
.sr-armed .sr-slide.sr-on .sr-main{transform:scale(1)}
.sr-shade::after{content:"";position:absolute;inset:0;background:linear-gradient(0deg,rgba(14,11,9,.92),transparent 45%),linear-gradient(90deg,rgba(14,11,9,.55),transparent 50%)}
.sr-txt{position:relative;z-index:3;align-self:end;padding:0 clamp(16px,5vw,64px) clamp(70px,10vh,110px)}
.sr-name{font-family:var(--serif);font-weight:800;font-variation-settings:"SOFT" 100,"opsz" 144;line-height:.92;font-size:clamp(54px,10vw,160px);max-width:11ch;margin-top:12px;overflow-wrap:anywhere}
.sr-name span{display:inline-block}
.sr-armed .sr-name span{transform:translateY(110%);opacity:0;transition:transform .8s cubic-bezier(.2,.9,.2,1),opacity .4s}
.sr-armed .sr-on .sr-name span{transform:none;opacity:1}
${words}

/* opening */
.sr-open .sr-main{object-fit:cover;filter:brightness(.6)}
.sr-open .sr-txt{align-self:center;text-align:center;padding:calc(90px + var(--sample-bar-h,0px)) 16px 90px}
.sr-kick{font-weight:600;letter-spacing:.38em;text-transform:uppercase;font-size:clamp(13px,1.5vw,17px);color:var(--dim)}
.sr-slam{font-family:var(--serif);font-weight:900;font-variation-settings:"SOFT" 100,"opsz" 144;font-size:clamp(76px,12vw,190px);line-height:.86;margin:14px 0 22px;overflow-wrap:anywhere}
.sr-slam--m{font-size:clamp(62px,10vw,160px)}.sr-slam--s{font-size:clamp(46px,8vw,124px)}
.sr-slam .sr-word--soft{font-weight:400;font-size:.62em;color:var(--rose)}
.sr-slam .sr-word--soft i{font-style:italic}
.sr-name .sr-soft{font-style:italic;font-weight:400}
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

/* the red panel */
.sr-say{background:var(--red);place-items:center;text-align:center;padding:90px 16px}
.sr-say h2{font-family:var(--serif);font-weight:900;font-variation-settings:"SOFT" 100,"opsz" 144;font-size:clamp(46px,9vw,150px);line-height:.95;max-width:14ch;margin:0 auto}
.sr-say h2 span{display:block}
.sr-say h2 span:nth-child(2){font-style:italic;font-weight:400}
.sr-armed .sr-say h2 span{transform:translateX(-120%);transition:transform .9s cubic-bezier(.2,.9,.2,1)}
.sr-armed .sr-say h2 span:nth-child(2){transform:translateX(120%);transition-delay:.12s}
.sr-armed .sr-say.sr-on h2 span{transform:none}
.sr-say p{margin:24px auto 0;font-size:20px;font-weight:500;letter-spacing:.01em;line-height:1.45;max-width:40ch}
.sr-say .sr-sig{display:block;margin-top:20px;font-family:var(--serif);font-weight:800;font-variation-settings:"SOFT" 100;font-size:28px}

/* end panel */
.sr-end{background:var(--bone);color:var(--bg);place-items:center;padding:80px 16px calc(80px + 44px)}
.sr-end .sr-wrap{width:min(1100px,100%);display:grid;grid-template-columns:1.1fr .9fr;gap:50px;align-items:center}
.sr-end h2{font-family:var(--serif);font-weight:900;font-variation-settings:"SOFT" 100,"opsz" 144;font-size:clamp(56px,8vw,120px);line-height:.92}
.sr-end p{font-size:22px;font-weight:500;margin:18px 0 22px;max-width:28ch}
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

@media (max-width:760px){.sr-end .sr-wrap{grid-template-columns:1fr}}
@media (prefers-reduced-motion:reduce){
  .sr-ticker div{animation:none;padding-left:16px}
  html:has(.sr){scroll-snap-type:none}
}
`;
}
