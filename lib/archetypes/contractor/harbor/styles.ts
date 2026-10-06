/**
 * Contractor HARBOR design — the stylesheet, built to Alex's Stitch reference for
 * Joe: navy ink and surfaces, the brand's gold for buttons and icons, cool pale
 * blue backgrounds (#f8f9ff / #eff4ff / #e5eeff), Playfair Display headlines over
 * Plus Jakarta Sans, Material Symbols icons, 4–8px radii and soft navy shadows.
 * The owner stands cut out over the cover photo, breaking past its bottom edge.
 */
import type { DerivedPalette } from '@/lib/color/brand-palette';

export const HARBOR_FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,300..500,0..1,0&display=swap';

export function harborCss(p: DerivedPalette): string {
  return `
.hb{
  --hb-navy:${p.bg};--hb-on-navy:${p.fg};--hb-gold:${p.accent};--hb-on-gold:${p.onAccent};
  --hb-gold-ink:color-mix(in oklab,var(--hb-gold) 62%,#3a1d00);
  --hb-surface:#f8f9ff;--hb-low:#eff4ff;--hb-mid:#e5eeff;--hb-high:#dce9ff;--hb-white:#ffffff;
  --hb-ink:#0b1c30;--hb-soft:#44474e;--hb-faint:#74777f;
  --hb-serif:'Playfair Display',Georgia,serif;--hb-sans:'Plus Jakarta Sans',system-ui,sans-serif;
  --hb-wrap:1200px;--hb-gutter:clamp(20px,4vw,48px);--hb-section:clamp(64px,8vw,112px);
  position:relative;background:var(--hb-surface);color:var(--hb-ink);font-family:var(--hb-sans);
  font-size:16px;line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:clip;
}
.hb *,.hb *::before,.hb *::after{box-sizing:border-box}
.hb a{color:inherit}
.hb img,.hb video{display:block;max-width:100%}
.hb :focus-visible{outline:2px solid var(--hb-navy);outline-offset:3px}
.hb-wrap{width:100%;max-width:var(--hb-wrap);margin-inline:auto;padding-inline:var(--hb-gutter)}
.hb-skip{position:absolute;left:-9999px;top:8px;z-index:60;background:var(--hb-navy);color:var(--hb-on-navy);padding:10px 16px}
.hb-skip:focus{left:8px}
.hb-section{padding-block:var(--hb-section)}
.hb-tint{background:var(--hb-low)}
.hb-icon{font-family:'Material Symbols Outlined';font-weight:400;font-style:normal;font-size:20px;line-height:1;letter-spacing:normal;text-transform:none;display:inline-block;white-space:nowrap;-webkit-font-feature-settings:'liga';font-feature-settings:'liga';vertical-align:-4px}
.hb-icon--fill{font-variation-settings:'FILL' 1}

/* ── type ──────────────────────────────────────────────── */
.hb-eyebrow{margin:0;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--hb-gold-ink)}
.hb-eyebrow--dot{display:flex;align-items:center;gap:8px}
.hb-eyebrow--dot::before{content:"";width:8px;height:8px;border-radius:50%;background:var(--hb-gold)}
.hb-eyebrow--light{color:var(--hb-gold)}
.hb-h1{margin:16px 0 0;font-family:var(--hb-serif);font-weight:700;font-size:clamp(40px,5vw,66px);line-height:1.08;letter-spacing:-.02em;text-wrap:balance}
.hb-h2{margin:8px 0 0;font-family:var(--hb-serif);font-weight:600;font-size:clamp(30px,3.2vw,42px);line-height:1.18;letter-spacing:-.01em;color:var(--hb-navy);text-wrap:balance}
.hb-h2--light{color:#fff}
.hb-h3{margin:0;font-family:var(--hb-serif);font-weight:600;font-size:21px;line-height:1.3;color:var(--hb-navy)}
.hb-h3--sans{font-family:var(--hb-sans);font-weight:700;font-size:18px}
.hb-lede{margin:12px 0 0;max-width:58ch;font-size:16px;color:var(--hb-soft)}
.hb-shead{margin-bottom:clamp(28px,3.4vw,44px)}
.hb-note{margin:24px 0 0;font-size:12px;color:var(--hb-faint)}

/* ── buttons ───────────────────────────────────────────── */
.hb-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:44px;padding:10px 18px;border-radius:6px;font-size:14px;font-weight:600;letter-spacing:.04em;text-decoration:none;transition:transform .15s ease,box-shadow .2s ease}
.hb-btn:active{transform:scale(.98)}
.hb .hb-btn--gold{background:var(--hb-gold);color:var(--hb-on-gold);box-shadow:0 6px 18px -6px color-mix(in srgb,var(--hb-gold) 60%,transparent)}
.hb .hb-btn--gold:hover{box-shadow:0 10px 24px -8px color-mix(in srgb,var(--hb-gold) 80%,transparent)}
.hb .hb-btn--ghost{background:rgba(255,255,255,.12);color:#fff;box-shadow:inset 0 0 0 1px rgba(255,255,255,.35);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.hb-btn--big{min-height:52px;padding:14px 24px;font-size:15px}

/* ── notice + header ───────────────────────────────────── */
.hb .hb-notice{display:flex;align-items:center;justify-content:center;gap:8px;margin:0;padding:9px var(--hb-gutter);background:var(--hb-navy);color:var(--hb-on-navy);font-size:12px;font-weight:600;letter-spacing:.06em;text-align:center}
.hb-head{position:sticky;top:0;z-index:40;background:color-mix(in srgb,var(--hb-surface) 90%,transparent);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);box-shadow:0 1px 8px rgba(0,0,0,.04)}
.hb-head__row{display:flex;align-items:center;justify-content:space-between;gap:16px;min-height:72px}
.hb-mark{display:flex;flex-direction:column;text-decoration:none;line-height:1.15}
.hb-mark__name{font-family:var(--hb-serif);font-weight:700;font-size:24px;color:var(--hb-navy)}
.hb-mark__trade{font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--hb-gold-ink)}
.hb-head__actions{display:flex;align-items:center;gap:18px}
.hb-head__phone{display:inline-flex;align-items:center;gap:6px;text-decoration:none;font-weight:600;color:var(--hb-navy)}
.hb-head__phone .hb-icon{color:var(--hb-gold-ink)}
@media(max-width:640px){.hb-head__phone span{display:none}.hb-head .hb-btn--gold{display:none}}

/* ── the cover ─────────────────────────────────────────── */
.hb-cover{position:relative;isolation:isolate;z-index:2;display:flex;align-items:center;min-height:max(600px,min(calc(100svh - 72px),860px));color:#fff}
.hb-cover__photo{position:absolute;inset:0;z-index:-2;overflow:hidden}
.hb-cover__photo img,.hb-cover__photo video{width:100%;height:100%;object-fit:cover}
.hb-cover__photo::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,color-mix(in srgb,var(--hb-navy) 92%,transparent) 0%,color-mix(in srgb,var(--hb-navy) 72%,transparent) 40%,color-mix(in srgb,var(--hb-navy) 20%,transparent) 70%,transparent),linear-gradient(0deg,color-mix(in srgb,var(--hb-navy) 70%,transparent),transparent 40%)}
.hb .hb-cover__owner{position:absolute;z-index:-1;right:max(var(--hb-gutter),calc((100% - var(--hb-wrap))/2));bottom:-64px;height:calc(100% + 8px);width:auto;max-width:none;pointer-events:none;filter:drop-shadow(0 30px 40px rgba(0,0,0,.45));-webkit-mask:linear-gradient(180deg,#000 82%,transparent);mask:linear-gradient(180deg,#000 82%,transparent)}
.hb-cover__words{position:relative;padding-block:clamp(56px,7vw,96px)}
.hb-cover__words>*{max-width:600px}
.hb-pill{display:inline-flex;align-items:center;gap:6px;margin:0;padding:6px 12px;border-radius:4px;background:var(--hb-gold);color:var(--hb-on-gold);font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase}
.hb-pill .hb-icon{font-size:16px}
.hb-cover__sub{margin:18px 0 0;max-width:48ch;font-size:18px;line-height:1.6;color:rgba(255,255,255,.82)}
.hb-cover__ctas{display:flex;flex-wrap:wrap;gap:10px;margin-top:30px}
@media(max-width:900px){
  .hb-cover{display:block;min-height:0;padding-top:min(78vw,420px);background:var(--hb-navy)}
  .hb-cover__photo{bottom:auto;height:min(92vw,520px)}
  .hb-cover__photo::after{background:linear-gradient(0deg,var(--hb-navy) 0%,color-mix(in srgb,var(--hb-navy) 40%,transparent) 45%,transparent 75%)}
  .hb .hb-cover__owner{right:auto;left:50%;translate:-50% 0;top:24px;bottom:auto;height:min(80vw,440px)}
  .hb-cover__words{padding-block:24px 48px}
}

/* ── trust strip ───────────────────────────────────────── */
.hb-trust{position:relative;z-index:3;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;list-style:none;margin:-44px 0 0;padding:10px;border-radius:10px;background:var(--hb-white);box-shadow:0 18px 40px -20px rgba(27,54,93,.35);max-width:760px}
.hb-trust__item{display:flex;flex-direction:column;align-items:center;gap:2px;padding:12px 8px;border-radius:6px;text-align:center}
.hb-trust__item:nth-child(2){background:var(--hb-mid)}
.hb-trust__item .hb-icon{font-size:24px;color:var(--hb-gold-ink)}
.hb-trust__label{margin-top:4px;font-size:13px;font-weight:700;color:var(--hb-navy)}
.hb-trust__sub{font-size:11px;color:var(--hb-soft)}
@media(max-width:600px){.hb-trust{margin-top:-24px}.hb-trust__label{font-size:12px}}

/* ── the request, right away ───────────────────────────── */
.hb-request__grid{display:grid;grid-template-columns:minmax(0,.85fr) minmax(0,1.15fr);gap:clamp(28px,5vw,72px);align-items:start}
.hb-steps{display:grid;gap:10px;list-style:none;margin:26px 0 0;padding:0}
.hb-steps li{display:flex;align-items:center;gap:10px}
.hb-steps .hb-icon{color:var(--hb-gold-ink)}
.hb-direct{display:inline-flex;flex-direction:column;margin-top:30px;text-decoration:none}
.hb-direct__label{font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--hb-soft)}
.hb-direct__phone{font-family:var(--hb-serif);font-weight:700;font-size:clamp(28px,3vw,38px);color:var(--hb-navy)}
.hb-formcard{padding:clamp(20px,3vw,36px);border-radius:12px;background:var(--hb-white);box-shadow:0 20px 50px -28px rgba(27,54,93,.45)}
@media(max-width:900px){.hb-request__grid{grid-template-columns:1fr}}

/* the shared estimate form, dressed for this design */
.hb .cp-form,.hb .cp-done{display:grid;grid-template-columns:1fr 1fr;gap:16px 12px}
.hb .cp-done{display:block}
.hb .cp-done h3{margin:0 0 8px;font-family:var(--hb-serif);font-size:28px;color:var(--hb-navy)}
.hb .cp-field{display:flex;flex-direction:column;gap:6px;grid-column:span 2}
.hb .cp-field--half{grid-column:span 1}
.hb .cp-field label,.hb .cp-field legend,.hb .cp-chips legend{padding:0;font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--hb-ink)}
.hb .cp-field label small{margin-left:6px;text-transform:none;letter-spacing:0;font-weight:400;color:var(--hb-soft)}
.hb .cp-hint{margin:0;font-size:13px;color:var(--hb-soft)}
.hb .cp-input{width:100%;min-height:48px;font:inherit;font-size:16px;color:var(--hb-ink);background:var(--hb-low);border:0;border-radius:6px;padding:12px 14px;transition:background .2s ease,box-shadow .2s ease}
.hb .cp-input:focus{outline:none;background:var(--hb-white);box-shadow:0 0 0 2px var(--hb-navy)}
.hb select.cp-input{appearance:none}
.hb textarea.cp-input{min-height:110px;resize:vertical}
.hb .cp-chips{grid-column:span 2;border:0;margin:0;padding:0}
.hb .cp-chips__row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:8px}
.hb .cp-chip{position:relative}
.hb .cp-chip input{position:absolute;inset:0;opacity:0;cursor:pointer}
.hb .cp-chip span{display:flex;align-items:center;min-height:44px;padding:8px 12px;border-radius:6px;background:var(--hb-low);font-size:13px;font-weight:600;transition:all .2s ease}
.hb .cp-chip input:checked+span{background:var(--hb-navy);color:var(--hb-on-navy)}
.hb .cp-chip input:focus-visible+span{outline:2px solid var(--hb-navy);outline-offset:2px}
.hb .cp-drop{position:relative;padding:18px;text-align:center;border-radius:6px;background:var(--hb-low);border:1.5px dashed var(--hb-high)}
.hb .cp-drop input{position:absolute;inset:0;opacity:0;cursor:pointer}
.hb .cp-drop__count{margin:6px 0 0;font-weight:600;color:var(--hb-gold-ink)}
.hb .cp-hp{position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden}
.hb .cp-form__foot{grid-column:span 2;display:flex;flex-wrap:wrap;align-items:center;gap:12px}
.hb .cp-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:56px;padding:14px 18px;border:0;border-radius:6px;font:inherit;font-size:15px;font-weight:600;cursor:pointer;text-decoration:none}
.hb .cp-btn svg{width:18px;height:18px}
.hb .cp-btn--solid{background:var(--hb-gold);color:var(--hb-on-gold);box-shadow:0 8px 20px -8px color-mix(in srgb,var(--hb-gold) 70%,transparent)}
.hb .cp-btn--line{background:var(--hb-low);color:var(--hb-ink)}
.hb .cp-btn[disabled]{opacity:.6;cursor:progress}
.hb .cp-alert{grid-column:span 2;margin:0;padding:12px 14px;border-radius:6px;background:#ffdad6;color:#93000a}
@media(max-width:640px){.hb .cp-field--half{grid-column:span 2}}

/* ── cards: services and projects ──────────────────────── */
.hb-services{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px;list-style:none;margin:0;padding:0}
.hb-projects{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:20px;list-style:none;margin:0;padding:0}
.hb-card{display:flex;flex-direction:column;border-radius:10px;overflow:hidden;background:var(--hb-white);box-shadow:0 1px 3px rgba(27,54,93,.08)}
.hb-card--plain{justify-content:center}
.hb-card__photo{position:relative;height:220px;overflow:hidden}
.hb-card__photo--tall{height:250px}
.hb-card__photo img,.hb-card__photo video{width:100%;height:100%;object-fit:cover;transition:transform .6s ease}
.hb-card:hover .hb-card__photo img{transform:scale(1.03)}
.hb .hb-card__flag{position:absolute;top:12px;left:12px;padding:4px 10px;border-radius:4px;background:var(--hb-navy);color:var(--hb-on-navy);font-size:11px;font-weight:600}
.hb-card__body{display:flex;flex-direction:column;gap:8px;padding:20px}
.hb-card__top{display:flex;align-items:center;justify-content:space-between;gap:12px}
.hb-card__top .hb-icon{color:var(--hb-gold-ink)}
.hb-card__text{margin:0;font-size:14px;line-height:1.6;color:var(--hb-soft)}
.hb-tags{display:flex;flex-wrap:wrap;gap:6px;list-style:none;margin:4px 0 0;padding:0}
.hb-tags li{padding:2px 8px;border-radius:4px;background:var(--hb-mid);font-size:11px;font-weight:700;letter-spacing:.04em;color:var(--hb-navy)}
@media(max-width:700px){.hb-services,.hb-projects{grid-template-columns:1fr}}

/* ── reviews ───────────────────────────────────────────── */
.hb-reviews__head{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:16px}
.hb-rating{display:flex;flex-direction:column;align-items:flex-end;margin:0 0 clamp(28px,3.4vw,44px)}
.hb-rating__score{display:flex;align-items:center;gap:6px;font-family:var(--hb-serif);font-size:34px;font-weight:700;color:var(--hb-navy)}
.hb-rating__score .hb-icon{font-size:28px;color:var(--hb-gold)}
.hb-rating__label{font-size:12px;font-weight:600;letter-spacing:.06em;color:var(--hb-soft)}
.hb-reviews{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px;list-style:none;margin:0;padding:0}
.hb-review{padding:24px;gap:12px}
.hb-review__top{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:4px 10px}
.hb-stars{flex:none;white-space:nowrap;font-family:'Material Symbols Outlined';font-variation-settings:'FILL' 1;font-size:18px;letter-spacing:1px;color:var(--hb-gold)}
.hb-review__job{font-size:11px;color:var(--hb-soft)}
.hb-review__quote{margin:0;font-style:italic;font-size:16px;line-height:1.6;color:var(--hb-ink)}
.hb-review__who{display:flex;align-items:center;gap:10px;margin:auto 0 0;padding-top:6px;color:var(--hb-navy)}
.hb .hb-avatar{display:grid;place-items:center;width:36px;height:36px;border-radius:50%;background:var(--hb-navy);color:var(--hb-on-navy);font-size:12px;font-weight:700}

/* ── where ─────────────────────────────────────────────── */
.hb-area{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,.8fr);gap:clamp(28px,4vw,64px);align-items:center}
.hb-area__towns{display:grid;gap:10px;list-style:none;margin:0;padding:0}
.hb-area__towns li{display:flex;align-items:center;gap:10px;padding:16px 18px;border-radius:8px;background:var(--hb-white);box-shadow:0 1px 3px rgba(27,54,93,.08);font-weight:700;color:var(--hb-navy)}
.hb-area__towns .hb-icon{color:var(--hb-gold-ink)}
@media(max-width:900px){.hb-area{grid-template-columns:1fr}}

/* ── the owner's word, on navy ─────────────────────────── */
.hb-promise{position:relative;overflow:hidden;background:var(--hb-navy);color:var(--hb-on-navy);padding-top:var(--hb-section)}
.hb-promise::before{content:"";position:absolute;right:-80px;bottom:-80px;width:360px;height:360px;border-radius:50%;background:color-mix(in srgb,var(--hb-gold) 22%,transparent);filter:blur(60px)}
.hb-promise__grid{position:relative;display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr);gap:clamp(28px,4vw,64px);align-items:end}
.hb-promise__words{padding-bottom:var(--hb-section)}
.hb-promise__who{margin:14px 0 26px;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--hb-gold)}
.hb-promises{display:grid;gap:18px;list-style:none;margin:0 0 32px;padding:0}
.hb-promises li{display:flex;align-items:flex-start;gap:12px}
.hb-promises .hb-icon{flex:none;font-size:24px;color:var(--hb-gold)}
.hb-promises span{display:flex;flex-direction:column;gap:2px;font-size:15px;color:rgba(255,255,255,.75)}
.hb-promises strong{font-size:16px;color:#fff}
.hb-promise__body{margin:0 0 14px;color:rgba(255,255,255,.8)}
.hb-promise__figure{position:relative;align-self:stretch;min-height:380px}
.hb-promise__figure>img,.hb-promise__figure video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:10px 10px 0 0}
.hb .hb-promise__figure--owner>img{inset:auto 0 0 auto;width:auto;height:108%;max-width:none;object-fit:contain;border-radius:0;filter:drop-shadow(0 30px 40px rgba(0,0,0,.4))}
@media(max-width:900px){.hb-promise__grid{grid-template-columns:1fr}.hb-promise__figure{order:-1;min-height:340px}.hb .hb-promise__figure--owner>img{left:50%;right:auto;translate:-50% 0;height:100%}}

/* ── footer + phone thumb bar ──────────────────────────── */
.hb-foot{padding-block:36px 110px;background:var(--hb-low)}
.hb-foot__row{display:flex;flex-wrap:wrap;gap:8px 24px;font-size:12px;color:var(--hb-soft)}
.hb-foot__name{color:var(--hb-navy);font-weight:700}
.hb-foot__row a{text-decoration:none}
.hb-prose{max-width:760px}
.hb-prose h1,.hb-prose h2{font-family:var(--hb-serif);color:var(--hb-navy)}
.hb-thumb{display:none}
@media(max-width:720px){
  .hb-thumb{position:fixed;inset:auto 0 0 0;z-index:50;display:grid;grid-template-columns:1fr 1.4fr;gap:8px;padding:8px 12px calc(8px + env(safe-area-inset-bottom,0px));background:color-mix(in srgb,var(--hb-surface) 95%,transparent);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);box-shadow:0 -4px 20px rgba(27,54,93,.08)}
  .hb-thumb a{display:flex;align-items:center;justify-content:center;gap:6px;min-height:44px;border-radius:6px;background:var(--hb-mid);font-size:14px;font-weight:600;text-decoration:none;color:var(--hb-navy)}
  .hb .hb-thumb a:last-child{background:var(--hb-gold);color:var(--hb-on-gold)}
}

@media(prefers-reduced-motion:no-preference){
  .hb-cover__words>*{animation:hb-rise .8s cubic-bezier(.2,.7,.2,1) both}
  .hb-cover__words>*:nth-child(2){animation-delay:.08s}.hb-cover__words>*:nth-child(3){animation-delay:.16s}.hb-cover__words>*:nth-child(4){animation-delay:.24s}
  .hb .hb-cover__owner{animation:hb-rise 1.1s cubic-bezier(.2,.7,.2,1) .15s both}
}
@keyframes hb-rise{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
`;
}
