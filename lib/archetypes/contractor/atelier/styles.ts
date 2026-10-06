/**
 * Contractor ATELIER design — the stylesheet, built to Alex's Stitch reference:
 * stone surfaces (#fbf9f6 / #f5f3f0 / #efeeeb), near-black ink, Newsreader for
 * headlines, Plus Jakarta Sans for everything else, small spaced capitals for
 * labels, Material Symbols icons, 4–8px radii, soft shadows, sage tags and a
 * terracotta label accent. The brand palette drives the dark buttons (bg) and
 * the sage (accent); the stone surfaces are the design's own.
 */
import type { DerivedPalette } from '@/lib/color/brand-palette';

export const ATELIER_FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300..700;1,6..72,300..700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,300..500,0..1,0&display=swap';

export function atelierCss(p: DerivedPalette): string {
  return `
.at{
  --at-surface:#fbf9f6;--at-low:#f5f3f0;--at-mid:#efeeeb;--at-high:#eae8e5;--at-white:#ffffff;
  --at-ink:#1b1c1a;--at-soft:#45474b;--at-faint:#75777b;
  --at-dark:${p.bg};--at-on-dark:${p.fg};--at-sage:${p.accent};
  --at-sage-pale:color-mix(in oklab,var(--at-sage) 26%,#ffffff);--at-sage-ink:color-mix(in oklab,var(--at-sage) 80%,#1b1c1a);
  --at-terra:#b85f43;
  --at-serif:'Newsreader',Georgia,serif;--at-sans:'Plus Jakarta Sans',system-ui,sans-serif;
  --at-wrap:1200px;--at-gutter:clamp(20px,4vw,64px);--at-section:clamp(64px,8vw,112px);
  position:relative;background:var(--at-surface);color:var(--at-ink);font-family:var(--at-sans);
  font-size:16px;line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:clip;
}
.at *,.at *::before,.at *::after{box-sizing:border-box}
.at a{color:inherit}
.at img,.at video{display:block;max-width:100%}
.at :focus-visible{outline:2px solid var(--at-dark);outline-offset:3px}
.at-wrap{width:100%;max-width:var(--at-wrap);margin-inline:auto;padding-inline:var(--at-gutter)}
.at-skip{position:absolute;left:-9999px;top:8px;z-index:60;background:var(--at-dark);color:var(--at-on-dark);padding:10px 16px}
.at-skip:focus{left:8px}
.at-section{padding-block:var(--at-section)}
.at-tint{background:var(--at-low)}
.at-icon{font-family:'Material Symbols Outlined';font-weight:400;font-style:normal;font-size:18px;line-height:1;letter-spacing:normal;text-transform:none;display:inline-block;white-space:nowrap;direction:ltr;-webkit-font-feature-settings:'liga';font-feature-settings:'liga';-webkit-font-smoothing:antialiased;vertical-align:-3px}

/* ── type ──────────────────────────────────────────────── */
.at-label{margin:0;font-size:11px;line-height:14px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--at-soft)}
.at-label--accent{color:var(--at-terra)}
.at-label--light{color:rgba(255,255,255,.85)}
.at-h1{margin:22px 0 0;font-family:var(--at-serif);font-weight:400;font-size:clamp(44px,5.4vw,76px);line-height:1.04;letter-spacing:-.025em;text-wrap:balance}
.at-h2{margin:10px 0 0;font-family:var(--at-serif);font-weight:400;font-size:clamp(28px,3vw,40px);line-height:1.2;letter-spacing:-.015em;text-wrap:balance}
.at-h3{margin:0;font-family:var(--at-serif);font-weight:500;font-size:22px;line-height:1.27}
.at-lede{margin:12px 0 0;max-width:56ch;font-size:16px;color:var(--at-soft)}
.at-shead{margin-bottom:clamp(32px,4vw,48px)}
.at-shead--center{text-align:center}
.at-shead--center .at-lede{margin-inline:auto}
.at-pill{display:inline-flex;align-items:center;gap:6px;margin:0;padding:5px 12px;border-radius:999px;background:var(--at-sage-pale);color:var(--at-sage-ink);font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase}
.at-pill .at-icon{font-size:15px;font-variation-settings:'FILL' 1}
.at-pill--plain{border-radius:4px;background:var(--at-mid);color:var(--at-soft)}
.at-note{margin:28px 0 0;text-align:center;font-size:12px;color:var(--at-faint)}

/* ── buttons ───────────────────────────────────────────── */
.at-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:44px;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;text-decoration:none;transition:background .2s ease,transform .15s ease}
.at-btn:active{transform:scale(.99)}
.at .at-btn--dark{background:var(--at-dark);color:var(--at-on-dark);box-shadow:0 1px 2px rgba(0,0,0,.08)}
.at .at-btn--dark:hover{background:#1f0300}
.at-btn--soft{background:var(--at-mid);color:var(--at-ink)}
.at-btn--soft .at-icon{color:var(--at-sage)}
.at-btn--soft:hover{background:var(--at-high)}
.at-btn--big{padding:14px 22px}
.at-btn--wide{width:100%}

/* ── header ────────────────────────────────────────────── */
.at-head{position:sticky;top:0;z-index:40;background:color-mix(in srgb,var(--at-surface) 85%,transparent);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);box-shadow:0 1px 8px rgba(0,0,0,.04)}
.at-head__row{display:flex;align-items:center;justify-content:space-between;gap:16px;min-height:72px}
.at-mark{display:flex;flex-direction:column;text-decoration:none;line-height:1.15}
.at-mark__trade{font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--at-soft)}
.at-mark__name{font-family:var(--at-serif);font-size:24px;font-weight:500}
.at-head__actions{display:flex;align-items:center;gap:8px}
@media(max-width:640px){.at-head__phone{display:none}.at-head .at-btn--dark{display:none}}

/* ── hero ──────────────────────────────────────────────── */
/* ── the cover: one photo edge to edge, the headline on it, a cream card in the corner ── */
.at-cover{position:relative;isolation:isolate;min-height:max(640px,min(calc(100svh - 72px),940px));display:flex;color:#fff}
.at-cover__photo{position:absolute;inset:0;z-index:-1;overflow:hidden}
.at-cover__photo img,.at-cover__photo video{width:100%;height:100%;object-fit:cover}
.at-cover__photo::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(8,13,19,.55) 0%,rgba(8,13,19,.12) 45%,rgba(8,13,19,.05) 60%,rgba(8,13,19,.55) 100%)}
.at-cover__inner{position:relative;display:grid;grid-template-columns:minmax(0,1fr) minmax(320px,440px);grid-template-rows:1fr auto;gap:28px;padding-block:clamp(40px,6vw,88px) clamp(28px,4vw,56px)}
.at-cover__words{grid-column:1 / -1;align-self:start}
.at-cover__headline{max-width:9.5em;margin:22px 0 0;font-family:var(--at-serif);font-weight:400;font-size:clamp(52px,7.6vw,112px);line-height:.98;letter-spacing:-.03em;text-wrap:balance;text-shadow:0 2px 30px rgba(8,13,19,.35)}
.at-pill--glass{background:rgba(251,249,246,.18);color:#fff;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
.at-cover__feature{grid-column:1;align-self:end;display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 14px;margin:0}
.at-cover__feature .at-label{flex-basis:100%}
.at-cover__featuretitle{font-family:var(--at-serif);font-size:clamp(22px,2vw,28px);line-height:1.2}
.at-cover__card{grid-column:2;align-self:end;padding:clamp(22px,2.4vw,30px);border-radius:12px;background:var(--at-surface);color:var(--at-ink);box-shadow:0 30px 60px -30px rgba(0,0,0,.6)}
.at-cover__sub{margin:0;font-size:16px;line-height:1.55;color:var(--at-soft)}
.at-cover__card .at-badges{margin-top:18px}
.at-cover__card .at-hero__ctas{margin-top:20px}
.at-hero__ctas{display:flex;flex-wrap:wrap;gap:10px;margin-top:32px}
.at-badges{display:flex;flex-wrap:wrap;gap:8px;list-style:none;margin:28px 0 0;padding:0}
.at-badge{display:inline-flex;align-items:center;gap:6px;padding:8px 12px;border-radius:8px;background:var(--at-mid);font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase}
.at-badge .at-icon{color:var(--at-sage);font-size:18px}
.at-glass{flex:none;padding:5px 10px;border-radius:4px;background:rgba(255,255,255,.2);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase}
@media(max-width:900px){
  .at-cover{display:block;min-height:0;color:var(--at-ink)}
  .at-cover__photo{position:relative;height:64svh;min-height:420px}
  .at-cover__photo::after{background:linear-gradient(180deg,rgba(8,13,19,.55) 0%,rgba(8,13,19,.05) 55%,rgba(8,13,19,.45) 100%)}
  .at-cover__inner{display:block;padding-block:0 40px}
  .at-cover__words{position:absolute;top:clamp(28px,6vw,48px);left:var(--at-gutter);right:var(--at-gutter);color:#fff}
  .at-cover__feature{position:absolute;top:calc(64svh - 88px);left:var(--at-gutter);color:#fff}
  .at-cover__card{margin-top:-28px;position:relative}
}

/* ── estimator ─────────────────────────────────────────── */
.at-est{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:24px;padding:clamp(18px,2.4vw,32px);border-radius:12px;background:var(--at-white);box-shadow:0 1px 3px rgba(0,0,0,.06)}
.at-est__choices{display:grid;gap:26px}
.at-est__step{margin:0;padding:0;border:0;display:grid;gap:10px}
.at-est__scopes{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.at-scope{display:flex;flex-direction:column;gap:3px;padding:12px 14px;border:0;border-radius:8px;background:var(--at-surface);box-shadow:inset 0 0 0 1px transparent;text-align:left;font:inherit;color:inherit;cursor:pointer;transition:background .2s ease,box-shadow .2s ease}
.at-scope:hover{box-shadow:inset 0 0 0 1px rgba(8,13,19,.1)}
.at-scope[aria-pressed="true"]{background:var(--at-high);box-shadow:inset 0 0 0 1px rgba(8,13,19,.18)}
.at-scope .at-icon{font-size:20px}
.at-scope__name{font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase}
.at-scope__detail{font-size:12px;line-height:1.35;color:var(--at-soft)}
.at-est__sizes{display:flex;flex-wrap:wrap;gap:8px}
.at-size{padding:9px 16px;border:0;border-radius:999px;background:var(--at-surface);font:inherit;font-size:11px;font-weight:500;letter-spacing:.08em;text-transform:uppercase;color:var(--at-ink);cursor:pointer;transition:background .2s ease}
.at .at-size[aria-pressed="true"]{background:var(--at-dark);color:var(--at-on-dark)}
.at-est__grades{display:grid;gap:8px}
.at-grade{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:8px;background:var(--at-surface);cursor:pointer;transition:background .2s ease}
.at-grade[data-on="true"]{background:color-mix(in oklab,var(--at-sage-pale) 70%,var(--at-white))}
.at-grade input{accent-color:var(--at-dark);width:16px;height:16px;margin:0}
.at-grade__text{flex:1;display:flex;flex-direction:column}
.at-grade__name{font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase}
.at-grade__detail{font-size:12px;color:var(--at-soft)}
.at-grade__note{font-size:11px;font-weight:600;color:var(--at-sage-ink)}
.at-est__result{align-self:start;position:sticky;top:96px;display:flex;flex-direction:column;gap:6px;padding:24px;border-radius:12px;background:var(--at-mid)}
.at-est__scope{margin:6px 0 0;font-size:14px;color:var(--at-soft)}
.at-est__range{margin:0;font-family:var(--at-serif);font-size:clamp(30px,3vw,40px);line-height:1.15}
.at-est__note{margin:0 0 14px;display:inline-block;align-self:flex-start;padding:3px 8px;border-radius:4px;background:var(--at-sage);color:#fff;font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase}
@media(max-width:900px){.at-est{grid-template-columns:1fr}.at-est__result{position:static}}

/* ── cards: services and case studies ──────────────────── */
.at-services{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px;list-style:none;margin:0;padding:0}
.at-cases{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;list-style:none;margin:0;padding:0}
.at-card{display:flex;flex-direction:column;border-radius:10px;overflow:hidden;background:var(--at-low);box-shadow:0 1px 3px rgba(0,0,0,.06)}
.at-card--white{background:var(--at-white)}
.at-card__photo{position:relative;height:220px;overflow:hidden}
.at-card__photo--tall{height:260px}
.at-card__photo img,.at-card__photo video{width:100%;height:100%;object-fit:cover;transition:transform .6s ease}
.at-card:hover .at-card__photo img{transform:scale(1.03)}
.at-card__label{position:absolute;top:12px;left:12px;padding:5px 10px;border-radius:4px;background:rgba(251,249,246,.9);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase}
.at .at-card__flag{position:absolute;top:12px;right:12px;padding:4px 10px;border-radius:4px;background:var(--at-dark);color:var(--at-on-dark);font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase}
.at-card__body{display:flex;flex-direction:column;gap:8px;padding:20px}
.at-card__text{margin:0;font-size:14px;line-height:1.55;color:var(--at-soft)}
.at-tags{display:flex;flex-wrap:wrap;gap:6px;list-style:none;margin:6px 0 0;padding:0}
.at-tags li{padding:2px 8px;border-radius:4px;background:var(--at-surface);font-size:11px;font-weight:500}
.at-case__top{display:flex;align-items:baseline;justify-content:space-between;gap:12px}
.at-case__place{flex:none;font-size:11px;font-weight:600;letter-spacing:.06em;color:var(--at-soft)}
.at-case__color{display:flex;align-items:center;gap:8px;margin:4px 0 0;font-size:12px;font-weight:500;color:var(--at-sage-ink)}
@media(max-width:1000px){.at-cases{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:700px){.at-services,.at-cases{grid-template-columns:1fr}}

/* ── why us + owner ────────────────────────────────────── */
.at-why{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,1fr);gap:clamp(28px,4vw,56px);align-items:start}
.at-compare{display:grid;gap:8px;list-style:none;margin:28px 0 0;padding:0}
.at-compare__row{display:grid;gap:10px;padding:18px;border-radius:10px;background:var(--at-low)}
.at-compare__row>.at-label{color:var(--at-faint)}
.at-compare__cols{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.at-compare__them,.at-compare__us{display:flex;align-items:center;gap:4px;margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase}
.at-compare__them{color:#ba1a1a}
.at-compare__us{color:var(--at-sage-ink)}
.at-compare__them .at-icon,.at-compare__us .at-icon{font-size:15px}
.at-compare__text{margin:0;font-size:13px;line-height:1.45;color:var(--at-soft)}
.at-compare__text--us{color:var(--at-ink);font-weight:500}
.at-owner{position:sticky;top:96px;margin:0;display:flex;flex-direction:column;gap:12px;padding:28px;border-radius:12px;background:var(--at-mid);box-shadow:0 1px 3px rgba(0,0,0,.06)}
.at-owner__photo{width:88px;height:88px;border-radius:50%;overflow:hidden}
.at-owner__photo img,.at-owner__photo video{width:100%;height:100%;object-fit:cover}
.at-owner__quote{margin:6px 0 0;font-family:var(--at-serif);font-size:24px;line-height:1.3}
@media(max-width:900px){.at-why{grid-template-columns:1fr}.at-owner{position:static}}

/* ── rating + reviews ──────────────────────────────────── */
.at-rating{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:6px 10px;margin:0 0 6px}
.at-stars{font-family:'Material Symbols Outlined';font-variation-settings:'FILL' 1;font-size:20px;letter-spacing:2px;color:var(--at-terra)}
.at-rating__score{font-family:var(--at-serif);font-size:24px;font-weight:600}
.at-rating .at-label{flex-basis:100%}
.at-reviews{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;list-style:none;margin:0;padding:0}
.at-review{padding:24px;gap:14px}
.at-review__quote{margin:0;font-family:var(--at-serif);font-style:italic;font-size:19px;line-height:1.45}
.at-review__top{display:flex;flex-direction:column;gap:2px;margin:auto 0 0}
.at-review__who{font-size:14px;font-weight:700}
@media(max-width:1000px){.at-reviews{grid-template-columns:1fr}}

/* ── notice strip ──────────────────────────────────────── */
.at .at-notice{display:flex;align-items:center;justify-content:center;gap:8px;margin:0;padding:9px var(--at-gutter);background:var(--at-dark);color:var(--at-on-dark);font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;text-align:center}
.at-notice .at-icon{font-size:17px}

/* ── booked-days calendar ──────────────────────────────── */
.at-booked{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:clamp(28px,4vw,64px);align-items:start}
.at-booked__months{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px}
.at-cal{margin:0;padding:20px;border-radius:12px;background:var(--at-white);box-shadow:0 1px 3px rgba(0,0,0,.06)}
.at-cal__name{margin:0 0 14px;font-family:var(--at-serif);font-size:22px}
.at-cal__grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center}
.at-cal__head{font-size:10px;font-weight:600;letter-spacing:.1em;color:var(--at-faint);padding-bottom:4px}
.at-cal__day{display:grid;place-items:center;aspect-ratio:1;border-radius:6px;background:var(--at-surface);font-size:13px}
.at .at-cal__day--booked{background:var(--at-dark);color:var(--at-on-dark);text-decoration:line-through;text-decoration-color:rgba(255,255,255,.35)}
.at-cal__legend{display:flex;align-items:center;gap:8px;margin:0;font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--at-soft)}
.at-cal__key{display:inline-block;width:14px;height:14px;margin-left:10px;border-radius:4px;background:var(--at-surface);box-shadow:inset 0 0 0 1px var(--at-high)}
.at-cal__key:first-child{margin-left:0}
.at-cal__key--booked{background:var(--at-dark);box-shadow:none}
@media(max-width:900px){.at-booked{grid-template-columns:1fr}}

/* ── FAQ ───────────────────────────────────────────────── */
.at-faq{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:clamp(28px,4vw,64px);align-items:start}
.at-faq__list{display:grid;gap:8px}
.at-faq__item{border-radius:10px;background:var(--at-white);box-shadow:0 1px 3px rgba(0,0,0,.05)}
.at-faq__item summary{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px 20px;cursor:pointer;list-style:none;font-family:var(--at-serif);font-size:19px}
.at-faq__item summary::-webkit-details-marker{display:none}
.at-faq__item summary .at-icon{flex:none;transition:transform .25s ease}
.at-faq__item[open] summary .at-icon{transform:rotate(45deg)}
.at-faq__item .at-card__text{padding:0 20px 20px}
@media(max-width:900px){.at-faq{grid-template-columns:1fr}}

/* ── closing call ──────────────────────────────────────── */
.at-banner{display:flex;align-items:center;gap:14px;margin-bottom:clamp(32px,4vw,48px);padding:18px 22px;border-radius:12px;background:#1f0300;color:#fff}
.at-banner__dot{position:relative;flex:none;width:12px;height:12px;border-radius:50%;background:#ffdbd0}
.at-banner__dot::after{content:"";position:absolute;inset:0;border-radius:50%;background:#ffdbd0;animation:at-ping 1.6s cubic-bezier(0,0,.2,1) infinite}
.at-banner__text{flex:1;display:flex;flex-direction:column;gap:2px;font-size:14px}
.at-banner__tag{flex:none;padding:4px 8px;border-radius:4px;background:#460e00;color:#cc7054;font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase}
@keyframes at-ping{75%,100%{transform:scale(2.2);opacity:0}}
@media(prefers-reduced-motion:reduce){.at-banner__dot::after{animation:none}}
.at-close{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:clamp(28px,4vw,64px);align-items:start}
.at-steps{display:grid;gap:10px;list-style:none;margin:0 0 28px;padding:0}
.at-steps li{display:flex;align-items:center;gap:10px;font-size:15px}
.at-steps .at-icon{color:var(--at-sage)}
.at-callcard{display:grid;gap:8px;padding:22px;border-radius:12px;background:var(--at-low)}
.at-callcard__phone{display:inline-flex;align-items:center;gap:8px;margin-top:6px;font-size:13px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;text-decoration:none}
.at-callcard__phone .at-icon{color:var(--at-sage)}
.at-formcard{padding:clamp(20px,3vw,36px);border-radius:12px;background:var(--at-mid);box-shadow:0 1px 3px rgba(0,0,0,.06)}
@media(max-width:900px){.at-close{grid-template-columns:1fr}}

/* the shared estimate form, dressed for this design */
.at .cp-form,.at .cp-done{display:grid;grid-template-columns:1fr 1fr;gap:16px 12px}
.at .cp-done{display:block}
.at .cp-done h3{margin:0 0 8px;font-family:var(--at-serif);font-weight:400;font-size:28px}
.at .cp-field{display:flex;flex-direction:column;gap:6px;grid-column:span 2}
.at .cp-field--half{grid-column:span 1}
.at .cp-field label,.at .cp-field legend,.at .cp-chips legend{padding:0;font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase}
.at .cp-field label small{margin-left:6px;text-transform:none;letter-spacing:0;font-weight:400;color:var(--at-soft)}
.at .cp-hint{margin:0;font-size:13px;color:var(--at-soft)}
.at .cp-input{width:100%;font:inherit;font-size:15px;color:var(--at-ink);background:var(--at-surface);border:0;border-radius:8px;padding:12px 14px;transition:background .2s ease}
.at .cp-input:focus{outline:none;background:var(--at-white);box-shadow:inset 0 0 0 1px rgba(8,13,19,.2)}
.at select.cp-input{appearance:none}
.at textarea.cp-input{min-height:110px;resize:vertical}
.at .cp-chips{grid-column:span 2;border:0;margin:0;padding:0}
.at .cp-chips__row{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.at .cp-chip{position:relative}
.at .cp-chip input{position:absolute;inset:0;opacity:0;cursor:pointer}
.at .cp-chip span{display:inline-block;padding:8px 14px;border-radius:999px;background:var(--at-surface);font-size:11px;font-weight:500;letter-spacing:.08em;text-transform:uppercase;transition:all .2s ease}
.at .cp-chip input:checked+span{background:var(--at-dark);color:var(--at-on-dark)}
.at .cp-chip input:focus-visible+span{outline:2px solid var(--at-dark);outline-offset:2px}
.at .cp-drop{position:relative;padding:18px;text-align:center;border-radius:8px;background:var(--at-surface);border:1.5px dashed var(--at-high)}
.at .cp-drop input{position:absolute;inset:0;opacity:0;cursor:pointer}
.at .cp-drop__count{margin:6px 0 0;font-weight:600;color:var(--at-sage-ink)}
.at .cp-hp{position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden}
.at .cp-form__foot{grid-column:span 2;display:flex;flex-wrap:wrap;align-items:center;gap:12px}
.at .cp-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:14px 18px;border:0;border-radius:8px;font:inherit;font-size:13px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;text-decoration:none}
.at .cp-btn svg{width:16px;height:16px}
.at .cp-btn--solid{background:var(--at-dark);color:var(--at-on-dark)}
.at .cp-btn--line{background:var(--at-surface);color:var(--at-ink)}
.at .cp-btn[disabled]{opacity:.6;cursor:progress}
.at .cp-alert{grid-column:span 2;margin:0;padding:12px 14px;border-radius:8px;background:#ffdad6;color:#93000a}
@media(max-width:640px){.at .cp-field--half{grid-column:span 2}}

/* ── footer + phone thumb bar ──────────────────────────── */
.at-foot{padding-block:40px 110px;background:var(--at-low)}
.at-foot__row{display:flex;flex-wrap:wrap;gap:8px 24px;font-size:12px;color:var(--at-soft)}
.at-foot__name{color:var(--at-ink);font-weight:600}
.at-foot__row a{text-decoration:none}
.at-foot__row a:hover{color:var(--at-ink)}
.at-prose{max-width:760px}
.at-prose h1,.at-prose h2{font-family:var(--at-serif);font-weight:400}
.at-thumb{display:none}
@media(max-width:720px){
  .at-thumb{position:fixed;inset:auto 0 0 0;z-index:50;display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:10px 12px calc(10px + env(safe-area-inset-bottom,0px));background:color-mix(in srgb,var(--at-surface) 92%,transparent);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);box-shadow:0 -2px 12px rgba(0,0,0,.06)}
  .at-thumb a{display:flex;align-items:center;justify-content:center;gap:6px;min-height:44px;border-radius:8px;background:var(--at-mid);font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;text-decoration:none}
  .at .at-thumb a:last-child{background:var(--at-dark);color:var(--at-on-dark)}
}
`;
}
