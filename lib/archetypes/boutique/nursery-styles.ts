/**
 * Boutique, nursery design — the stylesheet. The site is a hospital nursery:
 * dotted-muslin paper, a letter-bead bracelet band, every baby behind the
 * nursery window with a pink/sage/lilac/sky bassinet card ("Hello, my name
 * is…"), the artist's letter on lined stationery with her logo as a stamp, a
 * visiting-hours sign for market dates, a gift-tag contact card, and a
 * certificate of birth on each baby's own page. Colours come from the owner's
 * logo (blush flower, teal leaves, lilac, black script). Classes are `nn-`.
 *
 * Nothing waits on script to be visible. Motion is CSS only, off under
 * reduced motion; the scroll reveals use view timelines only where supported.
 */

export const NURSERY_FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Ballet:opsz@16..72&family=Young+Serif&family=Special+Elite&family=Karla:ital,wght@0,400;0,500;0,700;1,400&display=swap';

const svg = (markup: string): string => `url("data:image/svg+xml,${encodeURIComponent(markup)}")`;

/** A soft flower sprig (the logo's teal leaves) for section corners. */
const SPRIG = svg(
  "<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'><g fill='none' stroke='%233F8A7E' stroke-width='3' stroke-linecap='round'><path d='M20 150 C60 110 90 80 140 20'/></g><g fill='%23A9CFC4'><ellipse cx='52' cy='112' rx='16' ry='7' transform='rotate(-40 52 112)'/><ellipse cx='78' cy='86' rx='16' ry='7' transform='rotate(35 78 86)'/><ellipse cx='102' cy='62' rx='16' ry='7' transform='rotate(-40 102 62)'/><ellipse cx='124' cy='38' rx='14' ry='6' transform='rotate(35 124 38)'/></g><circle cx='140' cy='20' r='9' fill='%23F4CBD3'/><circle cx='140' cy='20' r='3.5' fill='%23C9506B'/></svg>",
);

export function nurseryCss(): string {
  return `
.nn{--paper:#FBF5EF;--paper-2:#F5E9DE;--card:#FFFDFB;--ink:#2B2227;--ink-soft:#6E5F66;--rose:#C9506B;--rose-deep:#A63A55;--blush:#F4CBD3;--sage:#A9CFC4;--sage-deep:#3F8A7E;--lilac:#CDBDE6;--sky:#BFD8EE;--line:rgba(43,34,39,.14);
  --script:'Ballet',cursive;--display:'Young Serif',Georgia,serif;--type:'Special Elite',ui-monospace,monospace;--body:'Karla',system-ui,sans-serif;
  background-color:var(--paper);
  background-image:radial-gradient(circle at 1px 1px,rgba(201,80,107,.16) 1.2px,transparent 1.6px);
  background-size:22px 22px;color:var(--ink);font-family:var(--body);font-size:17px;line-height:1.6;min-height:100vh;overflow-x:clip}
.nn *,.nn *::before,.nn *::after{box-sizing:border-box}
.nn img{display:block;max-width:100%}
.nn a{color:inherit}
.nn-wrap{width:min(1180px,100% - 32px);margin-inline:auto}
.nn-skip{position:absolute;left:-9999px}
.nn-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
.nn-skip:focus{left:16px;top:16px;z-index:50;background:var(--ink);color:var(--paper);padding:8px 14px;border-radius:99px}

/* Top bar */
/* Pinned, not sticky: the storefront's html/body hide sideways overflow, which stops sticky from sticking. */
.nn{--nn-top-h:79px;padding-top:var(--nn-top-h)}
.nn [id]{scroll-margin-top:calc(var(--nn-top-h) + var(--sample-bar-h,0px) + 12px)}
.nn-top{position:fixed;left:0;right:0;top:var(--sample-bar-h,0px);z-index:40;background:rgba(251,245,239,.92);backdrop-filter:blur(8px);border-bottom:1px dashed var(--line)}
.nn-top__in{height:calc(var(--nn-top-h) - 1px);display:flex;align-items:center;justify-content:space-between;gap:16px;padding:10px 0}
.nn-brand{display:flex;align-items:center;text-decoration:none;min-width:0}
.nn-brand__logo{height:58px;width:auto;mix-blend-mode:multiply}
.nn-brand__name{font-family:var(--script);font-size:30px;line-height:1;color:var(--rose-deep)}
.nn-nav{position:relative}
.nn-nav__links{display:flex;flex-wrap:wrap;gap:4px 22px;font-size:13px;font-weight:700;letter-spacing:.14em;text-transform:uppercase}
.nn-nav__links a{text-decoration:none;padding:6px 0;border-bottom:2px solid transparent}
.nn-nav__links a:hover,.nn-nav__links a:focus-visible{border-bottom-color:var(--rose)}
.nn-nav__cta{color:var(--rose-deep)}
.nn-menu-btn{display:none}
@media (max-width:760px){
  .nn{--nn-top-h:65px}.nn-brand__logo{height:44px}
  .nn-menu-btn{display:inline-flex;align-items:center;gap:10px;font:700 13px/1 var(--body);letter-spacing:.14em;text-transform:uppercase;color:var(--ink);background:var(--card);border:1.5px solid var(--blush);border-radius:99px;padding:10px 16px;cursor:pointer}
  .nn-menu-btn__icon{width:16px;height:2px;background:var(--rose);box-shadow:0 -5px 0 var(--rose),0 5px 0 var(--rose)}
  .nn-nav[data-open=true] .nn-menu-btn__icon{box-shadow:none;background:var(--rose-deep)}
  .nn-nav__links{display:none;position:fixed;left:0;right:0;top:calc(var(--nn-top-h) + var(--sample-bar-h,0px));flex-direction:column;gap:0;background:var(--paper);border-bottom:3px solid var(--blush);box-shadow:0 24px 40px -24px rgba(43,34,39,.5);padding:8px 16px 16px}
  .nn-nav[data-open=true] .nn-nav__links{display:flex}
  .nn-nav__links a{font-size:15px;padding:16px 4px;border-bottom:1px dashed var(--line)}
  .nn-nav__links a:last-child{border-bottom:0}
}

/* Hero */
.nn-hero{padding:56px 0 40px;position:relative}
.nn-hero__grid{display:grid;grid-template-columns:1.05fr .95fr;gap:56px;align-items:center}
.nn-band{display:inline-flex;align-items:center;gap:12px;background:var(--card);border:1.5px solid var(--blush);border-radius:99px;padding:7px 18px 7px 8px;font-family:var(--type);font-size:14px;color:var(--ink-soft);box-shadow:0 2px 0 var(--blush)}
.nn-band::before{content:'';width:16px;height:16px;border-radius:50%;background:radial-gradient(circle,var(--card) 3px,var(--rose) 3.5px)}
.nn-hero__name{font-family:var(--script);font-weight:400;font-size:clamp(64px,9vw,128px);line-height:.95;color:var(--rose-deep);margin:22px 0 6px;letter-spacing:-.01em}
.nn-hero__head{font-family:var(--display);font-weight:400;font-size:clamp(26px,3vw,38px);line-height:1.18;margin:0 0 28px;max-width:20ch;text-wrap:balance}
.nn-hero__ctas{display:flex;flex-wrap:wrap;gap:14px;align-items:center}
.nn-btn{display:inline-flex;align-items:center;gap:10px;background:var(--rose);color:#fff;font-weight:700;font-size:15px;letter-spacing:.06em;text-transform:uppercase;text-decoration:none;border:0;border-radius:99px;padding:15px 26px;cursor:pointer;box-shadow:0 5px 0 var(--rose-deep);transition:transform .15s,box-shadow .15s}
.nn-btn:hover,.nn-btn:focus-visible{transform:translateY(2px);box-shadow:0 3px 0 var(--rose-deep)}
.nn-tag{font-family:var(--type);font-size:15px;background:var(--sage);color:var(--ink);padding:10px 18px 10px 26px;border-radius:4px 99px 99px 4px;position:relative}
.nn-tag::before{content:'';position:absolute;left:9px;top:50%;width:8px;height:8px;margin-top:-4px;border-radius:50%;background:var(--paper)}
.nn-window{position:relative;justify-self:center;width:min(460px,100%)}
.nn-window__arch{aspect-ratio:4/5;border-radius:999px 999px 28px 28px;overflow:hidden;border:12px solid var(--card);box-shadow:0 0 0 2px var(--blush),0 30px 60px -30px rgba(166,58,85,.45)}
.nn-window__arch img{width:100%;height:100%;object-fit:cover}
.nn-window::after{content:'';position:absolute;right:-34px;top:-30px;width:150px;height:150px;background:${SPRIG} no-repeat center/contain;transform:rotate(12deg);pointer-events:none}
.nn-hang{position:absolute;left:-36px;bottom:42px;transform-origin:50% -60px;animation:nn-swing 5s ease-in-out infinite}
.nn-hang::before{content:'';position:absolute;left:50%;top:-60px;width:2px;height:60px;background:repeating-linear-gradient(var(--rose) 0 6px,transparent 6px 10px)}
@keyframes nn-swing{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(3deg)}}
@media (max-width:860px){.nn-hero__grid{grid-template-columns:1fr;gap:40px}.nn-hang{left:-8px;bottom:20px}.nn-window::after{right:-8px;width:110px;height:110px}}

/* Bassinet card */
.nn-card{background:var(--card);border-radius:12px;padding:0 0 14px;width:220px;box-shadow:0 12px 26px -16px rgba(43,34,39,.5);overflow:hidden;text-align:center;border:1px solid var(--line)}
.nn-card__top{height:30px;display:flex;align-items:center;justify-content:center;gap:6px;font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;background:var(--tint)}
.nn-card__top::before,.nn-card__top::after{content:'♥';font-size:10px;color:var(--rose)}
.nn-card__hello{font-family:var(--type);font-size:12.5px;color:var(--ink-soft);margin:10px 0 0}
.nn-card__name{font-family:var(--script);font-size:46px;line-height:1.05;color:var(--ink);margin:2px 12px 0;overflow-wrap:anywhere}
.nn-card__desc{font-size:14px;color:var(--ink-soft);margin:4px 14px 0;line-height:1.35}
.nn-card__fee{display:inline-block;margin-top:10px;font-family:var(--type);font-size:14px;border-top:1px dashed var(--line);padding:8px 10px 0}
.nn-card__fee b{font-family:var(--display);font-weight:400;font-size:20px;color:var(--rose-deep);margin-left:6px}
.nn-card--blush{--tint:var(--blush)}.nn-card--sage{--tint:var(--sage)}.nn-card--lilac{--tint:var(--lilac)}.nn-card--sky{--tint:var(--sky)}

/* Bead bracelet */
.nn-beads{overflow:hidden;padding:22px 0;border-block:1px dashed var(--line);background:var(--paper-2)}
.nn-beads__track{display:flex;gap:6px;width:max-content;animation:nn-slide 70s linear infinite}
.nn-bead{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;font-family:var(--display);font-size:20px;color:var(--ink);background:radial-gradient(circle at 34% 30%,rgba(255,255,255,.95) 0 18%,transparent 40%),var(--tint);box-shadow:inset 0 -4px 0 rgba(43,34,39,.08),0 2px 0 rgba(43,34,39,.08);flex:none}
.nn-bead[data-tint=blush]{--tint:var(--blush)}.nn-bead[data-tint=sage]{--tint:var(--sage)}.nn-bead[data-tint=lilac]{--tint:var(--lilac)}.nn-bead[data-tint=sky]{--tint:var(--sky)}
.nn-bead--gap{width:22px;height:22px;align-self:center;background:var(--rose);box-shadow:none}
.nn-bead--heart{background:var(--card);color:var(--rose);font-size:18px}
@keyframes nn-slide{to{transform:translateX(-50%)}}

/* Section headings — each opens differently */
.nn-sec{padding:84px 0;position:relative}
.nn-script-tag{font-family:var(--script);font-size:40px;line-height:1;color:var(--sage-deep);display:block}
.nn-h2{font-family:var(--display);font-weight:400;font-size:clamp(34px,4.4vw,58px);line-height:1.05;margin:4px 0 0;text-wrap:balance}

/* The nursery window */
.nn-nursery__head{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;flex-wrap:wrap;margin-bottom:42px}
.nn-count{font-family:var(--type);font-size:15px;background:var(--card);border:1.5px dashed var(--sage-deep);padding:8px 16px;border-radius:6px;transform:rotate(-2deg)}
.nn-glass{position:relative;background:linear-gradient(115deg,rgba(255,255,255,.55),rgba(255,255,255,0) 32%,rgba(255,255,255,0) 60%,rgba(255,255,255,.35) 72%,rgba(255,255,255,0) 82%),var(--paper-2);border:14px solid var(--card);border-radius:22px;box-shadow:0 0 0 2px var(--line),inset 0 0 0 1px var(--line);padding:46px 36px 70px}
.nn-glass::before{content:'';position:absolute;left:50%;top:0;bottom:0;width:10px;margin-left:-5px;background:var(--card);opacity:.0}
.nn-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:56px 36px}
.nn-baby{text-decoration:none;display:flex;flex-direction:column;align-items:center;position:relative}
.nn-grid{list-style:none;margin:0;padding:0}
.nn-grid__item:nth-child(3n+2){transform:translateY(46px)}
.nn-baby__crib{width:100%;aspect-ratio:4/5;border-radius:26px 26px 90px 90px;overflow:hidden;background:var(--card);border:8px solid var(--card);box-shadow:0 22px 40px -28px rgba(43,34,39,.6)}
.nn-baby__crib img{width:100%;height:100%;object-fit:cover;transition:transform .6s ease}
.nn-baby:hover .nn-baby__crib img,.nn-baby:focus-visible .nn-baby__crib img{transform:scale(1.05)}
.nn-baby .nn-card{margin-top:-46px;position:relative;transform:rotate(var(--tilt,0deg));transition:transform .3s}
.nn-grid__item:nth-child(odd) .nn-card{--tilt:-2deg}.nn-grid__item:nth-child(even) .nn-card{--tilt:2deg}
.nn-baby:hover .nn-card,.nn-baby:focus-visible .nn-card{--tilt:0deg}
.nn-baby--adopted .nn-baby__crib img{filter:grayscale(.6) opacity(.75)}
.nn-stamp{position:absolute;top:22px;right:-6px;font-family:var(--type);font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:var(--rose-deep);border:2px solid var(--rose-deep);padding:4px 10px;transform:rotate(8deg);background:rgba(255,253,251,.85)}
.nn-more{display:flex;justify-content:center;margin-top:84px}
.nn-empty{font-family:var(--type);text-align:center;color:var(--ink-soft)}
@media (max-width:900px){.nn-grid{grid-template-columns:repeat(2,1fr);gap:48px 18px}.nn-grid__item:nth-child(3n+2){transform:none}.nn-grid__item:nth-child(even){transform:translateY(36px)}.nn-glass{padding:30px 14px 60px;border-width:10px}.nn-card{width:min(200px,100%)}.nn-card__name{font-size:36px}}
@media (max-width:420px){.nn-card__desc{display:none}}

/* Gone home: past babies pegged on a clothesline */
.nn-gone .nn-h2{margin-bottom:28px}
.nn-line{list-style:none;margin:0 0 34px;padding:0;display:grid;grid-template-columns:repeat(4,1fr);gap:26px;position:relative}
.nn-line::before{content:'';position:absolute;left:0;right:0;top:0;height:44px;border-bottom:2.5px solid var(--sage-deep);border-radius:0 0 50% 50%/0 0 100% 100%;pointer-events:none}
.nn-peg{position:relative;display:flex;justify-content:center}
.nn-peg:nth-child(1),.nn-peg:nth-child(4){margin-top:27px}
.nn-peg:nth-child(2),.nn-peg:nth-child(3){margin-top:41px}
.nn-peg::before{content:'';position:absolute;top:-12px;left:50%;width:12px;height:30px;margin-left:-6px;z-index:2;border-radius:3px;background:linear-gradient(90deg,#d9b88f,#c79f72 50%,#d9b88f);box-shadow:0 2px 0 rgba(43,34,39,.18)}
.nn-print{display:block;width:100%;background:var(--card);border:0;padding:10px 10px 12px;cursor:zoom-in;box-shadow:0 18px 30px -20px rgba(43,34,39,.55);transform:rotate(var(--sway,1.5deg));transform-origin:50% 0;transition:transform .35s}
.nn-peg:nth-child(even) .nn-print{--sway:-1.8deg}
.nn-print:hover,.nn-print:focus-visible{--sway:0deg}
.nn-print img{width:100%;aspect-ratio:4/5;object-fit:cover}
.nn-print__cap{display:block;margin-top:8px;font-family:var(--type);font-size:14px;line-height:1.3;color:var(--ink-soft)}
.nn .bc-lb{position:fixed;inset:0;z-index:70;display:grid;place-items:center;background:rgba(43,34,39,.9);padding:clamp(16px,4vw,60px)}
.nn .bc-lb figure{display:grid;gap:14px;justify-items:center;max-height:100%;margin:0}
.nn .bc-lb img{max-height:80vh;max-width:min(1100px,92vw);object-fit:contain;background:var(--card);padding:12px}
.nn .bc-lb figcaption{font-family:var(--type);color:var(--paper);font-size:17px}
.nn .bc-lb button{position:absolute;display:grid;place-items:center;background:var(--blush);border:0;color:var(--ink);width:52px;height:52px;border-radius:50%;font-size:24px;line-height:1;cursor:pointer}
.nn .bc-lb__close{top:18px;right:18px}
.nn .bc-lb__prev{left:18px;top:50%;margin-top:-26px}
.nn .bc-lb__next{right:18px;top:50%;margin-top:-26px}
@media (max-width:760px){.nn-line{grid-template-columns:repeat(2,1fr);gap:30px 14px}.nn-line::before{display:none}.nn-peg,.nn-peg:nth-child(n){margin-top:14px}.nn-peg::after{content:'';position:absolute;top:0;left:-8px;right:-8px;border-top:2.5px solid var(--sage-deep);z-index:1}.nn-print{padding:7px 7px 9px}.nn-print__cap{font-size:12.5px}}

/* The artist's letter */
.nn-letter{position:relative;max-width:820px;margin-inline:auto;background:var(--card);padding:64px 64px 56px 92px;border-radius:4px;box-shadow:0 30px 60px -40px rgba(43,34,39,.55);transform:rotate(-.6deg);
  background-image:linear-gradient(90deg,transparent 64px,rgba(201,80,107,.35) 64px,rgba(201,80,107,.35) 66px,transparent 66px),repeating-linear-gradient(transparent 0 33px,rgba(63,138,126,.18) 33px 34px);background-position:0 0,0 22px}
.nn-letter .nn-h2{font-size:clamp(30px,3.6vw,46px);margin-bottom:22px;max-width:16ch}
.nn-letter p{margin:0 0 17px;line-height:34px;font-size:18px}
.nn-sign{font-family:var(--script);font-size:68px;line-height:1;color:var(--rose-deep);margin-top:6px}
.nn-postmark{position:absolute;top:-34px;right:-18px;width:150px;height:150px;border-radius:50%;background:var(--card);display:grid;place-items:center;transform:rotate(10deg);box-shadow:0 0 0 3px var(--paper),0 0 0 5px var(--blush),0 14px 24px -14px rgba(43,34,39,.5);overflow:hidden}
.nn-postmark img{width:132px;mix-blend-mode:multiply}
.nn-makes{display:flex;flex-wrap:wrap;gap:8px;margin-top:26px}
.nn-makes span{font-family:var(--type);font-size:14px;border:1.5px solid var(--sage-deep);color:var(--sage-deep);border-radius:99px;padding:4px 14px}
@media (max-width:700px){.nn-letter{padding:72px 22px 40px 40px;background-image:linear-gradient(90deg,transparent 24px,rgba(201,80,107,.35) 24px,rgba(201,80,107,.35) 26px,transparent 26px),repeating-linear-gradient(transparent 0 33px,rgba(63,138,126,.18) 33px 34px)}.nn-postmark{width:110px;height:110px;right:-4px}.nn-postmark img{width:96px}.nn-sign{font-size:54px}}

/* Visiting hours */
.nn-sign-board{max-width:860px;margin-inline:auto;background:var(--card);border:3px solid var(--ink);border-radius:20px;padding:10px;box-shadow:0 14px 0 -6px var(--sage)}
.nn-sign-board__in{border:1.5px solid var(--ink);border-radius:13px;padding:36px clamp(18px,4vw,44px)}
.nn-sign-board__title{display:flex;align-items:center;gap:14px;font-family:var(--display);font-size:clamp(28px,3.4vw,42px);line-height:1.1;margin:0 0 6px}
.nn-sign-board__title::before{content:'';width:28px;height:28px;flex:none;border-radius:50%;background:var(--rose);box-shadow:inset 0 0 0 7px var(--blush)}
.nn-visits{list-style:none;margin:22px 0 0;padding:0}
.nn-visits li{display:grid;grid-template-columns:150px 1fr auto;gap:18px;align-items:baseline;padding:14px 0;border-top:1px dashed var(--line)}
.nn-visits__when{font-family:var(--type);font-size:15px;color:var(--rose-deep)}
.nn-visits__when b{display:block;font-family:var(--display);font-weight:400;font-size:24px;color:var(--ink)}
.nn-visits__what{font-family:var(--display);font-size:22px}
.nn-visits__where{font-family:var(--type);font-size:14px;color:var(--ink-soft)}
@media (max-width:620px){.nn-visits li{grid-template-columns:1fr;gap:2px}}

/* Gift-tag contact */
.nn-gift{display:grid;grid-template-columns:.9fr 1.1fr;gap:0;max-width:1000px;margin-inline:auto;background:var(--card);border-radius:28px 140px 140px 28px;box-shadow:0 30px 60px -40px rgba(43,34,39,.6);position:relative;overflow:hidden}
.nn-gift__side{background:var(--blush);padding:48px 40px;position:relative;background-image:repeating-linear-gradient(45deg,rgba(255,255,255,.35) 0 10px,transparent 10px 20px)}
.nn-gift__side .nn-h2{font-size:clamp(30px,3.4vw,44px)}
.nn-gift__side p{margin:14px 0 0}
.nn-gift__hole{position:absolute;right:46px;top:50%;width:30px;height:30px;margin-top:-15px;border-radius:50%;background:var(--paper);box-shadow:inset 0 0 0 4px var(--blush)}
.nn-reach{list-style:none;padding:0;margin:26px 0 0;display:grid;gap:10px}
.nn-reach a{font-family:var(--type);font-size:16px;text-decoration:none;border-bottom:1.5px dashed var(--ink)}
.nn-reach small{display:block;font-size:12px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--ink-soft)}
.nn-gift__form{padding:44px 110px 44px 44px}
.nn-gift .bc-form{display:grid;gap:16px}
.nn-gift .bc-form__row{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.nn-gift .bc-form label{display:grid;gap:6px;font-size:13px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-soft)}
.nn-gift .bc-form input,.nn-gift .bc-form textarea{font:inherit;font-size:17px;letter-spacing:0;text-transform:none;font-weight:400;color:var(--ink);background:var(--paper);border:0;border-bottom:2px solid var(--sage-deep);border-radius:8px 8px 0 0;padding:12px 14px}
.nn-gift .bc-form textarea{min-height:130px;resize:vertical}
.nn-gift .bc-form input:focus,.nn-gift .bc-form textarea:focus{outline:2px solid var(--rose);outline-offset:2px}
.nn-gift .bc-form__trap{position:absolute;left:-9999px}
.nn-gift .bc-btn{justify-self:start;background:var(--rose);color:#fff;font:700 15px/1 var(--body);letter-spacing:.06em;text-transform:uppercase;border:0;border-radius:99px;padding:15px 26px;cursor:pointer;box-shadow:0 5px 0 var(--rose-deep)}
.nn-gift .bc-btn:disabled{opacity:.6;cursor:wait}
.nn-gift .bc-form__status{color:var(--rose-deep);font-weight:700;margin:0}
.nn-gift .bc-form__done{display:grid;gap:14px;justify-items:start;font-family:var(--type);font-size:18px}
@media (max-width:820px){.nn-gift{grid-template-columns:1fr;border-radius:28px}.nn-gift__hole{display:none}.nn-gift__form{padding:32px 22px 40px}.nn-gift .bc-form__row{grid-template-columns:1fr}.nn-gift__side{padding:40px 22px}}

/* Footer */
.nn-foot{margin-top:40px;padding:40px 0 48px;background-color:var(--card);background-image:repeating-linear-gradient(0deg,transparent 0 10px,rgba(244,203,211,.45) 10px 20px),repeating-linear-gradient(90deg,transparent 0 10px,rgba(244,203,211,.45) 10px 20px);border-top:3px solid var(--blush)}
.nn-foot__in{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;font-family:var(--type);font-size:14px;background:var(--card);padding:14px 20px;border-radius:99px;box-shadow:0 0 0 2px var(--blush)}
.nn-foot a{text-decoration:none;border-bottom:1px dashed}

/* Certificate (a baby's own page) */
.nn-cert-page{padding:48px 0 30px}
.nn-back{font-family:var(--type);font-size:15px;text-decoration:none;display:inline-block;margin-bottom:26px;border-bottom:1.5px dashed}
.nn-cert-grid{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:start}
.nn-photos__main{aspect-ratio:4/5;border-radius:999px 999px 26px 26px;overflow:hidden;border:12px solid var(--card);box-shadow:0 0 0 2px var(--blush),0 30px 60px -36px rgba(43,34,39,.6)}
.nn-photos__main img{width:100%;height:100%;object-fit:cover}
.nn-thumbs{display:flex;flex-wrap:wrap;gap:12px;margin-top:18px;justify-content:center}
.nn-thumb{width:74px;height:74px;border-radius:50%;overflow:hidden;border:4px solid var(--card);padding:0;cursor:pointer;background:var(--card);box-shadow:0 0 0 2px var(--line)}
.nn-thumb[aria-current='true']{box-shadow:0 0 0 3px var(--rose)}
.nn-thumb img{width:100%;height:100%;object-fit:cover}
.nn-cert{background:var(--card);padding:14px;border-radius:6px;box-shadow:0 30px 60px -40px rgba(43,34,39,.6);position:relative}
.nn-cert__in{border:3px double var(--sage-deep);outline:1.5px solid var(--blush);outline-offset:-12px;padding:44px clamp(20px,4vw,44px) 40px;text-align:center;position:relative}
.nn-cert__in::before,.nn-cert__in::after{content:'';position:absolute;width:86px;height:86px;background:${SPRIG} no-repeat center/contain;pointer-events:none}
.nn-cert__in::before{left:6px;bottom:6px}
.nn-cert__in::after{right:6px;top:6px;transform:rotate(180deg)}
.nn-cert__title{font-family:var(--display);font-size:15px;letter-spacing:.32em;text-transform:uppercase;color:var(--sage-deep);margin:0}
.nn-cert__hello{font-family:var(--type);font-size:14px;color:var(--ink-soft);margin:22px 0 0}
.nn-cert__name{font-family:var(--script);font-weight:400;font-size:clamp(64px,8vw,104px);line-height:1;color:var(--rose-deep);margin:4px 0 4px}
.nn-cert__short{font-family:var(--display);font-size:20px;margin:0 0 24px}
.nn-fields{display:grid;gap:0;text-align:left;margin:0 0 26px}
.nn-fields div{display:flex;gap:12px;align-items:baseline;padding:11px 0;border-bottom:1px dotted var(--ink-soft)}
.nn-fields dt{font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--ink-soft);min-width:118px}
.nn-fields dd{margin:0;font-family:var(--type);font-size:17px}
.nn-fields dd.nn-fee{font-family:var(--display);font-size:26px;color:var(--rose-deep)}
.nn-cert__desc{text-align:left;margin:0 0 28px}
.nn-cert__desc p{margin:0 0 12px}
@media (max-width:860px){.nn-cert-grid{grid-template-columns:1fr;gap:34px}}

/* Plain page (privacy, terms) */
.nn-plain{max-width:760px;margin:56px auto;background:var(--card);padding:44px clamp(20px,5vw,56px);border-radius:10px;box-shadow:0 30px 60px -40px rgba(43,34,39,.5)}
.nn-plain h1{font-family:var(--display);font-weight:400;font-size:40px;margin:0 0 18px}
.nn-plain h2{font-family:var(--display);font-weight:400}

/* Motion: the opening settles in; babies drift up as the nursery scrolls by */
@keyframes nn-rise{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
.nn-rise{animation:nn-rise .9s cubic-bezier(.2,.7,.2,1) both}
.nn-rise--1{animation-delay:.1s}.nn-rise--2{animation-delay:.25s}.nn-rise--3{animation-delay:.4s}.nn-rise--4{animation-delay:.55s}
@keyframes nn-up{from{opacity:0;translate:0 26px}to{opacity:1;translate:0 0}}
@supports (animation-timeline:view()){
  .nn-baby__crib,.nn-baby .nn-card{animation:nn-up linear both;animation-timeline:view();animation-range:entry 0% entry 55%}
}
@media (prefers-reduced-motion:reduce){
  .nn-rise,.nn-hang,.nn-beads__track,.nn-print,.nn-baby__crib,.nn-baby .nn-card{animation:none !important}
}
`;
}
