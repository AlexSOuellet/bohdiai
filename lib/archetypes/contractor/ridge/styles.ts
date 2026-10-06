/**
 * Contractor RIDGE design — the stylesheet. Cut-Pro's voices (Anton capitals,
 * Barlow and Barlow Condensed, the Permanent Marker brush line, square buttons,
 * a dark ground) for the top, the crew and the footer; the Stitch format's card
 * language (rounded cards, icons, tags, stars, soft shadows) for the middle, on
 * light sections. The brand palette drives the dark ground (bg) and the accent.
 */
import type { DerivedPalette } from '@/lib/color/brand-palette';

export const RIDGE_FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Anton&family=Barlow:ital,wght@0,400;0,500;0,600;1,400&family=Barlow+Condensed:wght@500;600;700&family=Permanent+Marker&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,300..500,0..1,0&display=swap';

const svg = (markup: string): string => `url("data:image/svg+xml,${encodeURIComponent(markup)}")`;

/** A rough dry-brush swipe behind the marker line (as on the yard design). */
const BRUSH = svg(
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 60' preserveAspectRatio='none'><path d='M7 15C58 6 131 11 204 7c70-4 128 1 189-2l4 14c-31 4-22 10 2 15l-5 17c-70 5-139-2-209 3-72 5-121-3-181 1L3 39c17-6 4-11 9-17z'/></svg>",
);

export function ridgeCss(p: DerivedPalette): string {
  return `
.rg{
  --rg-bg:${p.bg};--rg-fg:${p.fg};--rg-muted:${p.fgMuted};--rg-accent:${p.accent};--rg-on-accent:${p.onAccent};--rg-rule:${p.rule};
  --rg-bg2:color-mix(in oklab,var(--rg-bg) 86%,#fff);
  --rg-light:#f3f2ef;--rg-card:#ffffff;--rg-ink:#17191d;--rg-soft:#55585f;--rg-line:rgba(23,25,29,.1);
  --rg-display:'Anton',Impact,'Arial Narrow',sans-serif;--rg-body:'Barlow',system-ui,sans-serif;
  --rg-label:'Barlow Condensed','Arial Narrow',sans-serif;--rg-marker:'Permanent Marker','Comic Sans MS',cursive;
  --rg-wrap:1240px;--rg-gutter:clamp(20px,4vw,48px);--rg-section:clamp(72px,9vw,120px);
  position:relative;isolation:isolate;background:var(--rg-bg);color:var(--rg-fg);font-family:var(--rg-body);
  font-size:18px;line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:clip;
}
.rg *,.rg *::before,.rg *::after{box-sizing:border-box}
.rg a{color:inherit}
.rg img,.rg video{display:block;max-width:100%}
.rg :focus-visible{outline:3px solid var(--rg-accent);outline-offset:3px}
.rg-wrap{width:100%;max-width:var(--rg-wrap);margin-inline:auto;padding-inline:var(--rg-gutter)}
.rg-skip{position:absolute;left:-9999px;top:8px;z-index:60;background:var(--rg-accent);color:var(--rg-on-accent);padding:10px 16px}
.rg-skip:focus{left:8px}
.rg-section{padding-block:var(--rg-section)}
.rg-light{background:var(--rg-light);color:var(--rg-ink)}
.rg-icon{font-family:'Material Symbols Outlined';font-weight:400;font-style:normal;font-size:22px;line-height:1;letter-spacing:normal;text-transform:none;display:inline-block;white-space:nowrap;-webkit-font-feature-settings:'liga';font-feature-settings:'liga';vertical-align:-5px}
.rg-icon--fill{font-variation-settings:'FILL' 1}

/* ── Cut-Pro voices ────────────────────────────────────── */
.rg-eyebrow{display:flex;align-items:center;gap:14px;margin:0 0 18px;font-family:var(--rg-label);font-weight:700;font-size:15px;letter-spacing:.22em;text-transform:uppercase;color:var(--rg-accent)}
.rg-eyebrow::before{content:"";width:34px;height:3px;background:currentColor}
.rg-light .rg-eyebrow{color:color-mix(in oklab,var(--rg-accent) 75%,#000)}
.rg-title{margin:0;font-family:var(--rg-display);font-weight:400;text-transform:uppercase;font-size:clamp(38px,4.8vw,64px);line-height:.95;text-wrap:balance}
.rg-lede{margin:18px 0 0;max-width:56ch;font-size:18px;color:var(--rg-muted)}
.rg-light .rg-lede{color:var(--rg-soft)}
.rg-shead{margin-bottom:clamp(32px,4vw,52px)}
.rg-brush{display:inline-block;position:relative;font-family:var(--rg-marker);color:var(--rg-on-accent);padding:.18em .7em .12em;transform:rotate(-2.5deg);line-height:1.1}
.rg-brush::before{content:"";position:absolute;inset:0;z-index:-1;background:var(--rg-accent);-webkit-mask:${BRUSH} center/100% 100% no-repeat;mask:${BRUSH} center/100% 100% no-repeat}
.rg-note{margin:28px 0 0;font-size:14px;color:var(--rg-soft)}

/* ── buttons (square, Cut-Pro) ─────────────────────────── */
.rg-btn{display:inline-flex;align-items:center;gap:10px;padding:14px 22px;border:2px solid var(--rg-accent);font-family:var(--rg-label);font-weight:700;font-size:17px;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;transition:transform .2s ease}
.rg-btn svg{width:19px;height:19px;flex:none}
.rg .rg-btn--solid{background:var(--rg-accent);color:var(--rg-on-accent)}
.rg-btn--solid:hover{transform:translateY(-2px)}
.rg .rg-btn--line{background:transparent;color:var(--rg-fg);border-color:var(--rg-rule)}
.rg .rg-btn--line:hover{border-color:var(--rg-accent);color:var(--rg-accent)}
.rg-btn--big{padding:18px 28px;font-size:18px}

/* ── notice + header ───────────────────────────────────── */
.rg .rg-notice{display:flex;align-items:center;justify-content:center;gap:8px;margin:0;padding:9px var(--rg-gutter);background:var(--rg-accent);color:var(--rg-on-accent);font-family:var(--rg-label);font-weight:700;letter-spacing:.08em;text-transform:uppercase;font-size:15px}
.rg-head{position:sticky;top:0;z-index:40;background:color-mix(in srgb,var(--rg-bg) 88%,transparent);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-bottom:1px solid var(--rg-rule)}
.rg-head__row{display:flex;align-items:center;justify-content:space-between;gap:20px;min-height:76px}
.rg-mark{display:flex;flex-direction:column;line-height:1;text-decoration:none}
.rg-mark__name{font-family:var(--rg-display);font-size:26px;text-transform:uppercase;letter-spacing:.02em}
.rg-mark__trade{margin-top:5px;font-family:var(--rg-label);font-weight:600;font-size:12.5px;letter-spacing:.26em;text-transform:uppercase;color:var(--rg-accent)}
.rg-head__actions{display:flex;align-items:center;gap:12px}
.rg-head .rg-btn{padding:11px 16px;font-size:15px}
@media(max-width:720px){.rg-head .rg-btn--line{display:none}.rg-head .rg-btn__text{display:none}}

/* ── the top ───────────────────────────────────────────── */
.rg-hero{padding-block:clamp(40px,6vw,88px) clamp(56px,8vw,104px)}
.rg-hero__grid{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr);gap:clamp(32px,5vw,80px);align-items:center}
.rg-hero__kicker{margin:0 0 26px;font-family:var(--rg-label);font-weight:600;font-size:15px;letter-spacing:.24em;text-transform:uppercase;color:var(--rg-muted)}
.rg-hero__marker{margin:0 0 20px;font-size:clamp(19px,1.9vw,25px)}
.rg-hero__headline{margin:0;font-family:var(--rg-display);font-weight:400;text-transform:uppercase;line-height:.95;font-size:clamp(46px,6vw,88px);text-wrap:balance}
.rg-hero__headline em{font-style:normal;color:var(--rg-accent)}
.rg-hero__sub{margin:26px 0 0;max-width:44ch;font-size:clamp(18px,1.5vw,21px);color:var(--rg-muted)}
.rg-hero__ctas{display:flex;flex-wrap:wrap;gap:14px;margin-top:34px}
.rg-gable{position:relative;justify-self:end;width:min(100%,470px);aspect-ratio:4/5}
.rg-gable::before{content:"";position:absolute;inset:16px -16px -16px 16px;background:var(--rg-accent);clip-path:polygon(0 18%,50% 0,100% 18%,100% 100%,0 100%);z-index:-1;opacity:.9}
.rg-gable__media{position:absolute;inset:0;overflow:hidden;clip-path:polygon(0 18%,50% 0,100% 18%,100% 100%,0 100%);background:var(--rg-bg2)}
.rg-gable__media img,.rg-gable__media video{width:100%;height:100%;object-fit:cover}
@media(max-width:900px){.rg-hero__grid{grid-template-columns:1fr}.rg-gable{justify-self:center;width:min(100%,520px)}}
@media(prefers-reduced-motion:no-preference){
  .rg-rise{animation:rg-rise .9s cubic-bezier(.2,.7,.2,1) both}
  .rg-rise:nth-child(2){animation-delay:.08s}.rg-rise:nth-child(3){animation-delay:.16s}.rg-rise:nth-child(4){animation-delay:.24s}.rg-rise:nth-child(5){animation-delay:.32s}
}
@keyframes rg-rise{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}

/* ── trust strip ───────────────────────────────────────── */
.rg-trustband{background:var(--rg-accent);color:var(--rg-on-accent)}
.rg-trust{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));list-style:none;margin-block:0}
.rg-trust__item{display:flex;align-items:center;gap:14px;padding:20px 0 20px 22px;border-left:2px solid color-mix(in srgb,var(--rg-on-accent) 18%,transparent)}
.rg-trust__item:first-child{border-left:0;padding-left:0}
.rg-trust__item .rg-icon{font-size:30px}
.rg-trust__item>span{display:flex;flex-direction:column;line-height:1.2}
.rg-trust__label{font-family:var(--rg-label);font-weight:700;font-size:19px;letter-spacing:.06em;text-transform:uppercase}
.rg-trust__sub{font-size:14px;opacity:.8}
@media(max-width:760px){.rg-trust{grid-template-columns:1fr}.rg-trust__item{padding:14px 0;border-left:0;border-top:2px solid color-mix(in srgb,var(--rg-on-accent) 18%,transparent)}.rg-trust__item:first-child{border-top:0}}

/* ── cards (Stitch format) ─────────────────────────────── */
.rg-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:20px;list-style:none;margin:0;padding:0}
.rg-card{display:flex;flex-direction:column;overflow:hidden;border-radius:10px;background:var(--rg-card);color:var(--rg-ink);box-shadow:0 1px 3px rgba(0,0,0,.08),0 14px 30px -24px rgba(0,0,0,.45)}
.rg-card--plain{border-top:4px solid var(--rg-accent)}
.rg-card__photo{position:relative;height:200px;overflow:hidden}
.rg-card__photo img,.rg-card__photo video{width:100%;height:100%;object-fit:cover;transition:transform .6s ease}
.rg-card:hover .rg-card__photo img{transform:scale(1.04)}
.rg-card__label{position:absolute;top:12px;left:12px;padding:4px 10px;border-radius:4px;background:rgba(255,255,255,.92);color:var(--rg-ink);font-family:var(--rg-label);font-weight:700;font-size:13px;letter-spacing:.12em;text-transform:uppercase}
.rg .rg-card__label--accent{background:var(--rg-accent);color:var(--rg-on-accent)}
.rg-card__body{display:flex;flex-direction:column;gap:8px;padding:20px}
.rg-card__top{display:flex;align-items:center;justify-content:space-between;gap:12px}
.rg-card__top .rg-icon{color:color-mix(in oklab,var(--rg-accent) 80%,#000)}
.rg-card__name{margin:0;font-family:var(--rg-label);font-weight:700;font-size:22px;letter-spacing:.04em;text-transform:uppercase}
.rg-card__text{margin:0;font-size:16px;line-height:1.55;color:var(--rg-soft)}
.rg-tags{display:flex;flex-wrap:wrap;gap:6px;list-style:none;margin:4px 0 0;padding:0}
.rg-tags li{padding:3px 10px;border-radius:999px;background:color-mix(in oklab,var(--rg-accent) 14%,#fff);font-size:13px;font-weight:600;color:color-mix(in oklab,var(--rg-accent) 55%,#000)}

/* ── projects on dark ──────────────────────────────────── */
.rg-projects{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px;list-style:none;margin:0;padding:0}
.rg-project__photo{position:relative;aspect-ratio:4/3;overflow:hidden;border-radius:10px}
.rg-project__photo img,.rg-project__photo video{width:100%;height:100%;object-fit:cover;transition:transform .6s ease}
.rg-project:hover .rg-project__photo img{transform:scale(1.04)}
.rg-project__cap{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin:14px 2px 0}
.rg-project__title{font-family:var(--rg-label);font-weight:700;font-size:19px;letter-spacing:.04em;text-transform:uppercase}
.rg-project__place{flex:none;font-size:14px;color:var(--rg-muted)}
.rg-project__place .rg-icon{font-size:17px;color:var(--rg-accent)}

/* ── reviews ───────────────────────────────────────────── */
.rg-reviews{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;list-style:none;margin:0;padding:0}
.rg-review{padding:24px;gap:14px}
.rg-stars{font-family:'Material Symbols Outlined';font-variation-settings:'FILL' 1;font-size:20px;letter-spacing:1px;color:var(--rg-accent)}
.rg-review__quote{margin:0;font-size:18px;line-height:1.5;color:var(--rg-ink)}
.rg-review__who{display:flex;flex-direction:column;gap:2px;margin:auto 0 0;font-size:14px;color:var(--rg-soft)}
.rg-review__who strong{font-family:var(--rg-label);font-size:16px;letter-spacing:.06em;text-transform:uppercase;color:var(--rg-ink)}

/* ── crew (Cut-Pro) ────────────────────────────────────── */
.rg-crew__grid{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:clamp(32px,5vw,80px);align-items:center}
.rg-crew__photo{aspect-ratio:4/5;overflow:hidden;clip-path:polygon(0 12%,50% 0,100% 12%,100% 100%,0 100%)}
.rg-crew__photo img,.rg-crew__photo video{width:100%;height:100%;object-fit:cover}
.rg-crew__quote{margin:0;font-family:var(--rg-display);font-weight:400;text-transform:uppercase;font-size:clamp(34px,4vw,56px);line-height:1;text-wrap:balance}
.rg-crew__who{margin:16px 0 26px;font-family:var(--rg-label);font-weight:700;font-size:16px;letter-spacing:.18em;text-transform:uppercase;color:var(--rg-accent)}
.rg-crew__body{margin:0 0 14px;max-width:52ch;color:var(--rg-muted)}
@media(max-width:900px){.rg-crew__grid{grid-template-columns:1fr}}

/* ── where + form ──────────────────────────────────────── */
.rg-close{display:grid;grid-template-columns:minmax(0,.85fr) minmax(0,1.15fr);gap:clamp(32px,5vw,72px);align-items:start}
.rg-steps{display:grid;gap:10px;list-style:none;margin:0 0 28px;padding:0}
.rg-steps li{display:flex;align-items:center;gap:10px;font-size:17px}
.rg-steps .rg-icon{color:color-mix(in oklab,var(--rg-accent) 80%,#000)}
.rg-areacard{display:grid;gap:8px;padding:22px;border-radius:10px;background:var(--rg-card);box-shadow:0 1px 3px rgba(0,0,0,.08)}
.rg-areacard__title{display:flex;align-items:center;gap:8px;margin:0;font-family:var(--rg-label);font-weight:700;font-size:19px;letter-spacing:.06em;text-transform:uppercase}
.rg-areacard__title .rg-icon{color:var(--rg-accent)}
.rg-formcard{padding:clamp(22px,3vw,40px);border-radius:12px;background:var(--rg-card);box-shadow:0 1px 3px rgba(0,0,0,.08),0 30px 60px -36px rgba(0,0,0,.5);border-top:6px solid var(--rg-accent)}
@media(max-width:900px){.rg-close{grid-template-columns:1fr}}

/* the shared estimate form, dressed for this design */
.rg .cp-form,.rg .cp-done{display:grid;grid-template-columns:1fr 1fr;gap:18px 14px;color:var(--rg-ink)}
.rg .cp-done{display:block}
.rg .cp-done h3{margin:0 0 10px;font-family:var(--rg-display);font-weight:400;text-transform:uppercase;font-size:34px}
.rg .cp-field{display:flex;flex-direction:column;gap:6px;grid-column:span 2}
.rg .cp-field--half{grid-column:span 1}
.rg .cp-field label,.rg .cp-field legend,.rg .cp-chips legend{padding:0;font-family:var(--rg-label);font-weight:700;font-size:15px;letter-spacing:.12em;text-transform:uppercase}
.rg .cp-field label small{margin-left:6px;text-transform:none;letter-spacing:0;font-weight:500;color:var(--rg-soft)}
.rg .cp-hint{margin:0;font-size:14px;color:var(--rg-soft)}
.rg .cp-input{width:100%;min-height:48px;font:inherit;font-size:17px;color:var(--rg-ink);background:var(--rg-light);border:0;border-radius:6px;padding:12px 14px;transition:box-shadow .2s ease}
.rg .cp-input:focus{outline:none;box-shadow:0 0 0 2px var(--rg-accent)}
.rg select.cp-input{appearance:none}
.rg textarea.cp-input{min-height:110px;resize:vertical}
.rg .cp-chips{grid-column:span 2;border:0;margin:0;padding:0}
.rg .cp-chips__row{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
.rg .cp-chip{position:relative}
.rg .cp-chip input{position:absolute;inset:0;opacity:0;cursor:pointer}
.rg .cp-chip span{display:inline-block;padding:9px 16px;border-radius:999px;background:var(--rg-light);font-family:var(--rg-label);font-weight:700;font-size:15px;letter-spacing:.06em;text-transform:uppercase;transition:all .2s ease}
.rg .cp-chip input:checked+span{background:var(--rg-accent);color:var(--rg-on-accent)}
.rg .cp-chip input:focus-visible+span{outline:2px solid var(--rg-accent);outline-offset:2px}
.rg .cp-drop{position:relative;padding:18px;text-align:center;border-radius:6px;background:var(--rg-light);border:2px dashed var(--rg-line)}
.rg .cp-drop input{position:absolute;inset:0;opacity:0;cursor:pointer}
.rg .cp-drop__count{margin:6px 0 0;font-weight:700;color:color-mix(in oklab,var(--rg-accent) 75%,#000)}
.rg .cp-hp{position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden}
.rg .cp-form__foot{grid-column:span 2;display:flex;flex-wrap:wrap;align-items:center;gap:12px}
.rg .cp-btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;width:100%;min-height:58px;padding:14px 18px;border:0;font-family:var(--rg-label);font-weight:700;font-size:18px;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;text-decoration:none}
.rg .cp-btn svg{width:19px;height:19px}
.rg .cp-btn--solid{background:var(--rg-accent);color:var(--rg-on-accent)}
.rg .cp-btn--line{background:var(--rg-light);color:var(--rg-ink)}
.rg .cp-btn[disabled]{opacity:.6;cursor:progress}
.rg .cp-alert{grid-column:span 2;margin:0;padding:12px 14px;border-left:4px solid var(--rg-accent);background:color-mix(in oklab,var(--rg-accent) 12%,#fff)}
@media(max-width:640px){.rg .cp-field--half{grid-column:span 2}}

/* ── footer + phone thumb bar ──────────────────────────── */
.rg-foot{padding-block:clamp(56px,7vw,96px) 110px;border-top:1px solid var(--rg-rule)}
.rg-foot__big{margin:0;font-family:var(--rg-display);font-size:clamp(72px,16vw,240px);line-height:.85;text-transform:uppercase;color:transparent;-webkit-text-stroke:2px color-mix(in srgb,var(--rg-accent) 60%,transparent)}
.rg-foot__row{display:flex;flex-wrap:wrap;gap:10px 28px;margin-top:32px;font-size:14px;color:var(--rg-muted)}
.rg-foot__row a{text-decoration:none}
.rg-foot__row a:hover{color:var(--rg-accent)}
.rg-prose{max-width:760px}
.rg-prose h1,.rg-prose h2{font-family:var(--rg-display);font-weight:400;text-transform:uppercase}
.rg-thumb{display:none}
@media(max-width:720px){
  .rg-thumb{position:fixed;inset:auto 0 0 0;z-index:50;display:grid;grid-template-columns:1fr 1fr;background:var(--rg-bg);border-top:1px solid var(--rg-rule)}
  .rg-thumb a{display:flex;align-items:center;justify-content:center;gap:8px;padding:16px;font-family:var(--rg-label);font-weight:700;font-size:16px;letter-spacing:.1em;text-transform:uppercase;text-decoration:none}
  .rg-thumb svg{width:18px;height:18px}
  .rg .rg-thumb a:last-child{background:var(--rg-accent);color:var(--rg-on-accent)}
}
`;
}
