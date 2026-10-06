/**
 * Contractor BLUEPRINT design — the stylesheet. A mostly navy page: the brand's
 * navy, a deeper navy for alternate sections, fine blueprint grid lines, gold
 * crop marks framing the photos and the form, Playfair Display headlines,
 * Plus Jakarta Sans text and IBM Plex Mono for the drafting labels. The brand
 * palette drives navy (bg) and gold (accent).
 */
import type { DerivedPalette } from '@/lib/color/brand-palette';

export const BLUEPRINT_FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,300..500,0..1,0&display=swap';

/** Gold corner crop marks on all four corners of a box, drawn on its ::before. */
const MARKS = `
  linear-gradient(var(--bp-gold),var(--bp-gold)) top left/22px 1.5px no-repeat,
  linear-gradient(var(--bp-gold),var(--bp-gold)) top left/1.5px 22px no-repeat,
  linear-gradient(var(--bp-gold),var(--bp-gold)) top right/22px 1.5px no-repeat,
  linear-gradient(var(--bp-gold),var(--bp-gold)) top right/1.5px 22px no-repeat,
  linear-gradient(var(--bp-gold),var(--bp-gold)) bottom left/22px 1.5px no-repeat,
  linear-gradient(var(--bp-gold),var(--bp-gold)) bottom left/1.5px 22px no-repeat,
  linear-gradient(var(--bp-gold),var(--bp-gold)) bottom right/22px 1.5px no-repeat,
  linear-gradient(var(--bp-gold),var(--bp-gold)) bottom right/1.5px 22px no-repeat`;

export function blueprintCss(p: DerivedPalette): string {
  return `
.bp{
  --bp-navy:${p.bg};--bp-fg:${p.fg};--bp-gold:${p.accent};--bp-on-gold:${p.onAccent};
  --bp-deep:color-mix(in oklab,var(--bp-navy) 72%,#000);--bp-raise:color-mix(in oklab,var(--bp-navy) 88%,#fff);
  --bp-soft:color-mix(in srgb,var(--bp-fg) 68%,transparent);--bp-faint:color-mix(in srgb,var(--bp-fg) 45%,transparent);
  --bp-line:color-mix(in srgb,var(--bp-fg) 10%,transparent);
  --bp-serif:'Playfair Display',Georgia,serif;--bp-sans:'Plus Jakarta Sans',system-ui,sans-serif;--bp-mono:'IBM Plex Mono',ui-monospace,monospace;
  --bp-wrap:1200px;--bp-gutter:clamp(20px,4vw,48px);--bp-section:clamp(72px,9vw,128px);
  position:relative;background:var(--bp-navy);color:var(--bp-fg);font-family:var(--bp-sans);
  font-size:16px;line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:clip;
}
.bp *,.bp *::before,.bp *::after{box-sizing:border-box}
.bp a{color:inherit}
.bp img,.bp video{display:block;max-width:100%}
.bp :focus-visible{outline:2px solid var(--bp-gold);outline-offset:3px}
.bp-wrap{width:100%;max-width:var(--bp-wrap);margin-inline:auto;padding-inline:var(--bp-gutter)}
.bp-skip{position:absolute;left:-9999px;top:8px;z-index:60;background:var(--bp-gold);color:var(--bp-on-gold);padding:10px 16px}
.bp-skip:focus{left:8px}
.bp-section{position:relative;padding-block:var(--bp-section)}
.bp-deep{background:var(--bp-deep)}
.bp-grid{background-image:
  linear-gradient(var(--bp-line) 1px,transparent 1px),linear-gradient(90deg,var(--bp-line) 1px,transparent 1px),
  linear-gradient(color-mix(in srgb,var(--bp-fg) 4%,transparent) 1px,transparent 1px),linear-gradient(90deg,color-mix(in srgb,var(--bp-fg) 4%,transparent) 1px,transparent 1px);
  background-size:160px 160px,160px 160px,32px 32px,32px 32px;background-position:center top}
.bp-icon{font-family:'Material Symbols Outlined';font-weight:400;font-style:normal;font-size:20px;line-height:1;letter-spacing:normal;text-transform:none;display:inline-block;white-space:nowrap;-webkit-font-feature-settings:'liga';font-feature-settings:'liga';vertical-align:-4px}
.bp-icon--fill{font-variation-settings:'FILL' 1}

/* ── type ──────────────────────────────────────────────── */
.bp-eyebrow{display:flex;align-items:center;gap:12px;margin:0;font-family:var(--bp-mono);font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--bp-gold)}
.bp-rule{position:relative;width:46px;height:1px;background:var(--bp-gold)}
.bp-rule::before,.bp-rule::after{content:"";position:absolute;top:-4px;width:1px;height:9px;background:var(--bp-gold)}
.bp-rule::before{left:0}.bp-rule::after{right:0}
.bp-h1{margin:16px 0 0;font-family:var(--bp-serif);font-weight:700;font-size:clamp(40px,5vw,68px);line-height:1.06;letter-spacing:-.02em;text-wrap:balance}
.bp-h2{margin:12px 0 0;font-family:var(--bp-serif);font-weight:600;font-size:clamp(32px,3.6vw,48px);line-height:1.12;letter-spacing:-.01em;text-wrap:balance}
.bp-lede{margin:14px 0 0;max-width:58ch;color:var(--bp-soft)}
.bp-shead{margin-bottom:clamp(32px,4vw,52px)}
.bp-kicker{margin:0;font-family:var(--bp-mono);font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--bp-gold)}
.bp-note{margin:28px 0 0;font-family:var(--bp-mono);font-size:12px;color:var(--bp-faint)}

/* ── buttons ───────────────────────────────────────────── */
.bp-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:44px;padding:10px 18px;border-radius:2px;font-size:14px;font-weight:600;letter-spacing:.04em;text-decoration:none;transition:transform .15s ease,background .2s ease,border-color .2s ease}
.bp-btn:active{transform:scale(.98)}
.bp .bp-btn--gold{background:var(--bp-gold);color:var(--bp-on-gold)}
.bp .bp-btn--line{background:transparent;color:var(--bp-fg);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--bp-fg) 40%,transparent)}
.bp .bp-btn--line:hover{box-shadow:inset 0 0 0 1px var(--bp-gold)}
.bp-btn--big{min-height:52px;padding:14px 24px;font-size:15px}

/* ── notice + header ───────────────────────────────────── */
.bp .bp-notice{display:flex;align-items:center;justify-content:center;gap:8px;margin:0;padding:9px var(--bp-gutter);background:var(--bp-gold);color:var(--bp-on-gold);font-family:var(--bp-mono);font-size:12px;letter-spacing:.06em;text-align:center}
.bp-head{position:sticky;top:0;z-index:40;background:color-mix(in srgb,var(--bp-deep) 88%,transparent);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-bottom:1px solid var(--bp-line)}
.bp-head__row{display:flex;align-items:center;justify-content:space-between;gap:16px;min-height:72px}
.bp-mark{display:flex;flex-direction:column;text-decoration:none;line-height:1.15}
.bp-mark__name{font-family:var(--bp-serif);font-weight:700;font-size:24px}
.bp-mark__trade{font-family:var(--bp-mono);font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--bp-gold)}
.bp-head__actions{display:flex;align-items:center;gap:18px}
.bp-head__phone{display:inline-flex;align-items:center;gap:6px;text-decoration:none;font-weight:600}
.bp-head__phone .bp-icon{color:var(--bp-gold)}
@media(max-width:640px){.bp-head__phone span{display:none}.bp-head .bp-btn--gold{display:none}}

/* ── the cover ─────────────────────────────────────────── */
.bp-cover{position:relative;isolation:isolate;z-index:2;display:flex;align-items:center;min-height:max(600px,min(calc(100svh - 72px),860px))}
.bp-cover__photo{position:absolute;inset:0;z-index:-2;overflow:hidden}
.bp-cover__photo img,.bp-cover__photo video{width:100%;height:100%;object-fit:cover;filter:saturate(.7)}
.bp-cover__photo::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,var(--bp-navy) 0%,color-mix(in srgb,var(--bp-navy) 80%,transparent) 42%,color-mix(in srgb,var(--bp-navy) 25%,transparent) 72%,color-mix(in srgb,var(--bp-navy) 10%,transparent)),linear-gradient(0deg,var(--bp-navy),transparent 35%)}
.bp .bp-cover__owner{position:absolute;z-index:-1;right:max(var(--bp-gutter),calc((100% - var(--bp-wrap))/2));bottom:0;height:calc(100% - 20px);width:auto;max-width:none;pointer-events:none;filter:drop-shadow(0 30px 40px rgba(0,0,0,.5));-webkit-mask:linear-gradient(180deg,#000 80%,transparent);mask:linear-gradient(180deg,#000 80%,transparent)}
.bp-cover__words{position:relative;padding-block:clamp(56px,7vw,96px)}
.bp-cover__words>*{max-width:600px}
.bp-cover__sub{margin:18px 0 0;max-width:48ch;font-size:18px;color:var(--bp-soft)}
.bp-cover__ctas{display:flex;flex-wrap:wrap;gap:10px;margin-top:30px}
@media(max-width:900px){
  .bp-cover{display:block;min-height:0;padding-top:min(78vw,420px)}
  .bp-cover__photo{bottom:auto;height:min(92vw,520px)}
  .bp-cover__photo::after{background:linear-gradient(0deg,var(--bp-navy) 0%,color-mix(in srgb,var(--bp-navy) 40%,transparent) 45%,transparent 75%)}
  .bp .bp-cover__owner{right:auto;left:50%;translate:-50% 0;top:24px;bottom:auto;height:min(80vw,440px)}
  .bp-cover__words{padding-block:24px 48px}
}

/* ── trust band ────────────────────────────────────────── */
.bp-trustband{border-block:1px solid var(--bp-line);background:var(--bp-deep)}
.bp-trust{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));list-style:none;margin-block:0}
.bp-trust__item{display:grid;grid-template-columns:auto 1fr;grid-template-rows:auto auto;column-gap:14px;align-items:center;padding:22px 0 22px 22px;border-left:1px solid var(--bp-line)}
.bp-trust__item:first-child{border-left:0;padding-left:0}
.bp-trust__item .bp-icon{grid-row:span 2;font-size:26px;color:var(--bp-gold)}
.bp-trust__label{font-weight:700}
.bp-trust__sub{font-family:var(--bp-mono);font-size:11px;letter-spacing:.06em;color:var(--bp-faint)}
@media(max-width:700px){.bp-trust{grid-template-columns:1fr}.bp-trust__item{padding:14px 0;border-left:0;border-top:1px solid var(--bp-line)}.bp-trust__item:first-child{border-top:0}}

/* ── crop-marked frames ────────────────────────────────── */
.bp-marks,.bp-frame{position:relative}
.bp-marks::before,.bp-frame::before{content:"";position:absolute;inset:-10px;background:${MARKS};pointer-events:none;z-index:1}

/* ── the request, right away ───────────────────────────── */
.bp-request{display:grid;grid-template-columns:minmax(0,.85fr) minmax(0,1.15fr);gap:clamp(32px,5vw,80px);align-items:start}
.bp-steps{display:grid;gap:12px;list-style:none;margin:0;padding:0}
.bp-steps li{display:flex;align-items:center;gap:10px;color:var(--bp-soft)}
.bp-steps .bp-icon{color:var(--bp-gold)}
.bp-direct{display:inline-flex;flex-direction:column;margin-top:34px;text-decoration:none}
.bp-direct__label{font-family:var(--bp-mono);font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--bp-faint)}
.bp-direct__phone{font-family:var(--bp-serif);font-weight:700;font-size:clamp(30px,3.2vw,42px)}
.bp-formcard{padding:clamp(22px,3vw,40px);background:var(--bp-raise)}
@media(max-width:900px){.bp-request{grid-template-columns:1fr}}

/* the shared estimate form, dressed for this design */
.bp .cp-form,.bp .cp-done{display:grid;grid-template-columns:1fr 1fr;gap:16px 12px}
.bp .cp-done{display:block}
.bp .cp-done h3{margin:0 0 8px;font-family:var(--bp-serif);font-size:28px}
.bp .cp-field{display:flex;flex-direction:column;gap:6px;grid-column:span 2}
.bp .cp-field--half{grid-column:span 1}
.bp .cp-field label,.bp .cp-field legend,.bp .cp-chips legend{padding:0;font-family:var(--bp-mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--bp-soft)}
.bp .cp-field label small{margin-left:6px;text-transform:none;letter-spacing:0;color:var(--bp-faint)}
.bp .cp-hint{margin:0;font-size:13px;color:var(--bp-faint)}
.bp .cp-input{width:100%;min-height:48px;font:inherit;font-size:16px;color:var(--bp-fg);background:transparent;border:0;border-bottom:1.5px solid color-mix(in srgb,var(--bp-fg) 25%,transparent);border-radius:0;padding:10px 2px;transition:border-color .2s ease}
.bp .cp-input:focus{outline:none;border-bottom-color:var(--bp-gold)}
.bp .cp-input::placeholder{color:var(--bp-faint)}
.bp select.cp-input{appearance:none}
.bp select.cp-input option{background:var(--bp-navy);color:var(--bp-fg)}
.bp textarea.cp-input{min-height:100px;resize:vertical}
.bp .cp-chips{grid-column:span 2;border:0;margin:0;padding:0}
.bp .cp-chips__row{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
.bp .cp-chip{position:relative}
.bp .cp-chip input{position:absolute;inset:0;opacity:0;cursor:pointer}
.bp .cp-chip span{display:inline-block;padding:8px 14px;border:1px solid color-mix(in srgb,var(--bp-fg) 25%,transparent);font-size:13px;font-weight:600;transition:all .2s ease}
.bp .cp-chip input:checked+span{background:var(--bp-gold);border-color:var(--bp-gold);color:var(--bp-on-gold)}
.bp .cp-chip input:focus-visible+span{outline:2px solid var(--bp-gold);outline-offset:2px}
.bp .cp-drop{position:relative;padding:18px;text-align:center;border:1px dashed color-mix(in srgb,var(--bp-fg) 30%,transparent)}
.bp .cp-drop input{position:absolute;inset:0;opacity:0;cursor:pointer}
.bp .cp-drop__count{margin:6px 0 0;font-weight:600;color:var(--bp-gold)}
.bp .cp-hp{position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden}
.bp .cp-form__foot{grid-column:span 2;display:flex;flex-wrap:wrap;align-items:center;gap:12px}
.bp .cp-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:56px;padding:14px 18px;border:0;border-radius:2px;font:inherit;font-size:15px;font-weight:600;cursor:pointer;text-decoration:none}
.bp .cp-btn svg{width:18px;height:18px}
.bp .cp-btn--solid{background:var(--bp-gold);color:var(--bp-on-gold)}
.bp .cp-btn--line{background:transparent;color:var(--bp-fg);box-shadow:inset 0 0 0 1px var(--bp-line)}
.bp .cp-btn[disabled]{opacity:.6;cursor:progress}
.bp .cp-alert{grid-column:span 2;margin:0;padding:12px 14px;background:color-mix(in srgb,#ff6b5a 18%,transparent)}
@media(max-width:640px){.bp .cp-field--half{grid-column:span 2}}

/* ── services: one big list, the photo beside it ───────── */
.bp-services{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:clamp(32px,5vw,80px);align-items:start}
.bp-services__list{list-style:none;margin:0;padding:0;border-top:1px solid var(--bp-line)}
.bp-services__list li{border-bottom:1px solid var(--bp-line)}
.bp-services__name{display:block;width:100%;padding:16px 0;border:0;background:none;color:var(--bp-faint);text-align:left;font-family:var(--bp-serif);font-weight:600;font-size:clamp(24px,2.8vw,38px);line-height:1.15;cursor:pointer;transition:color .2s ease,padding-left .3s ease}
.bp .bp-services__name[aria-pressed="true"],.bp-services__name:hover{color:var(--bp-fg);padding-left:14px}
.bp .bp-services__name[aria-pressed="true"]{box-shadow:inset 3px 0 0 var(--bp-gold)}
.bp-services__frame{position:sticky;top:110px;display:grid;gap:22px}
.bp-services__frame .bp-frame{aspect-ratio:4/3;margin:10px}
.bp-services__photo{width:100%;height:100%;object-fit:cover;animation:bp-fade .5s ease both}
.bp-services__current{margin:0 10px;font-family:var(--bp-mono);font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--bp-gold)}
.bp-services__text{margin:6px 10px 0;font-size:17px;color:var(--bp-soft)}
.bp-tags{display:flex;flex-wrap:wrap;gap:6px;list-style:none;margin:12px 10px 0;padding:0}
.bp-tags li{padding:3px 10px;border:1px solid var(--bp-line);font-family:var(--bp-mono);font-size:11px;letter-spacing:.06em;color:var(--bp-soft)}
@keyframes bp-fade{from{opacity:0}to{opacity:1}}
@media(max-width:900px){.bp-services{grid-template-columns:1fr}.bp-services__frame{position:static;order:-1}}

/* ── the work, framed like drawings ────────────────────── */
.bp-work{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:clamp(28px,3vw,40px);list-style:none;margin:0;padding:10px}
.bp-work__item .bp-frame{aspect-ratio:3/4}
.bp-work__item .bp-frame img,.bp-work__item .bp-frame video{width:100%;height:100%;object-fit:cover}
.bp-work__cap{display:flex;flex-direction:column;gap:2px;margin:18px 0 0;font-weight:600}
.bp-work__tag{font-family:var(--bp-mono);font-size:11px;font-weight:400;letter-spacing:.14em;text-transform:uppercase;color:var(--bp-gold)}

/* ── reviews: one big quote ────────────────────────────── */
.bp-reviews__head{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:16px}
.bp-rating{display:flex;flex-direction:column;align-items:flex-end;margin:0 0 clamp(32px,4vw,52px)}
.bp-rating__score{display:flex;align-items:center;gap:6px;font-family:var(--bp-serif);font-weight:700;font-size:38px}
.bp-rating__score .bp-icon{font-size:30px;color:var(--bp-gold)}
.bp-rating__label{font-family:var(--bp-mono);font-size:12px;letter-spacing:.08em;color:var(--bp-faint)}
.bp-quotes{display:grid;gap:36px}
.bp-quote{margin:0;max-width:980px;animation:bp-fade .5s ease both}
.bp-quote__text{margin:0;font-family:var(--bp-serif);font-style:italic;font-weight:600;font-size:clamp(26px,3.2vw,44px);line-height:1.25;text-wrap:pretty}
.bp-quote__who{display:flex;flex-wrap:wrap;gap:4px 14px;margin-top:26px;font-family:var(--bp-mono);font-size:13px;letter-spacing:.06em;color:var(--bp-soft)}
.bp-quote__who strong{color:var(--bp-gold);font-weight:500}
.bp-quotes__nav{display:flex;align-items:center;gap:18px}
.bp-arrow{display:grid;place-items:center;width:48px;height:48px;border:1px solid color-mix(in srgb,var(--bp-fg) 30%,transparent);background:transparent;color:var(--bp-fg);cursor:pointer;transition:border-color .2s ease,color .2s ease}
.bp-arrow:hover{border-color:var(--bp-gold);color:var(--bp-gold)}
.bp-quotes__ticks{display:flex;gap:6px}
.bp-tick{width:22px;height:2px;background:var(--bp-line)}
.bp .bp-tick--on{background:var(--bp-gold)}

/* ── where ─────────────────────────────────────────────── */
.bp-area{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,.8fr);gap:clamp(28px,4vw,64px);align-items:center}
.bp-area__towns{display:grid;gap:0;list-style:none;margin:0;padding:0;border-top:1px solid var(--bp-line)}
.bp-area__towns li{display:flex;align-items:center;gap:10px;padding:16px 4px;border-bottom:1px solid var(--bp-line);font-weight:600}
.bp-area__towns .bp-icon{color:var(--bp-gold)}
@media(max-width:900px){.bp-area{grid-template-columns:1fr}}

/* ── the owner's word ──────────────────────────────────── */
.bp-promise{position:relative;overflow:hidden;background:var(--bp-deep);padding-top:var(--bp-section);border-top:1px solid var(--bp-line)}
.bp-promise__grid{position:relative;display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr);gap:clamp(28px,4vw,64px);align-items:end}
.bp-promise__words{padding-bottom:var(--bp-section)}
.bp-promise__who{margin:14px 0 28px;font-family:var(--bp-mono);font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--bp-gold)}
.bp-promises{display:grid;gap:20px;list-style:none;margin:0 0 34px;padding:0}
.bp-promises li{display:flex;align-items:flex-start;gap:14px}
.bp-promises .bp-icon{flex:none;font-size:24px;color:var(--bp-gold)}
.bp-promises span{display:flex;flex-direction:column;gap:2px;font-size:15px;color:var(--bp-soft)}
.bp-promises strong{font-size:17px;color:var(--bp-fg)}
.bp-promise__body{margin:0 0 14px;color:var(--bp-soft)}
.bp-promise__figure{position:relative;align-self:stretch;min-height:380px}
.bp-promise__figure>img,.bp-promise__figure video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.bp .bp-promise__figure--owner>img{inset:auto 0 0 auto;width:auto;height:108%;max-width:none;object-fit:contain;filter:drop-shadow(0 30px 40px rgba(0,0,0,.5))}
@media(max-width:900px){.bp-promise__grid{grid-template-columns:1fr}.bp-promise__figure{order:-1;min-height:340px}.bp .bp-promise__figure--owner>img{left:50%;right:auto;translate:-50% 0;height:100%}}

/* ── footer + phone thumb bar ──────────────────────────── */
.bp-foot{padding-block:clamp(56px,7vw,96px) 110px;background:var(--bp-deep);border-top:1px solid var(--bp-line)}
.bp-foot__big{margin:0;font-family:var(--bp-serif);font-weight:700;font-size:clamp(64px,14vw,200px);line-height:.9;letter-spacing:-.02em;color:transparent;-webkit-text-stroke:1px color-mix(in srgb,var(--bp-gold) 55%,transparent)}
.bp-foot__row{display:flex;flex-wrap:wrap;gap:8px 24px;margin-top:32px;font-family:var(--bp-mono);font-size:12px;color:var(--bp-faint)}
.bp-foot__row a{text-decoration:none}
.bp-foot__row a:hover{color:var(--bp-gold)}
.bp-prose{max-width:760px}
.bp-prose h1,.bp-prose h2{font-family:var(--bp-serif)}
.bp-thumb{display:none}
@media(max-width:720px){
  .bp-thumb{position:fixed;inset:auto 0 0 0;z-index:50;display:grid;grid-template-columns:1fr 1.4fr;gap:8px;padding:8px 12px calc(8px + env(safe-area-inset-bottom,0px));background:color-mix(in srgb,var(--bp-deep) 95%,transparent);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-top:1px solid var(--bp-line)}
  .bp-thumb a{display:flex;align-items:center;justify-content:center;gap:6px;min-height:44px;font-size:14px;font-weight:600;text-decoration:none;box-shadow:inset 0 0 0 1px var(--bp-line)}
  .bp .bp-thumb a:last-child{background:var(--bp-gold);color:var(--bp-on-gold);box-shadow:none}
}

@media(prefers-reduced-motion:no-preference){
  .bp-cover__words>*{animation:bp-rise .8s cubic-bezier(.2,.7,.2,1) both}
  .bp-cover__words>*:nth-child(2){animation-delay:.08s}.bp-cover__words>*:nth-child(3){animation-delay:.16s}.bp-cover__words>*:nth-child(4){animation-delay:.24s}
  .bp .bp-cover__owner{animation:bp-rise 1.1s cubic-bezier(.2,.7,.2,1) .15s both}
}
@media(prefers-reduced-motion:reduce){.bp-services__photo,.bp-quote{animation:none}}
@keyframes bp-rise{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
`;
}
