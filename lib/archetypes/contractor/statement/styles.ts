/**
 * Contractor STATEMENT design — the stylesheet. A home-magazine feature: wide,
 * solid Archivo lettering (nothing squeezed, nothing hand-painted), navy pages
 * alternating with warm paper pages, gold as the one accent, round pills for
 * buttons, magazine pull-quotes in Fraunces italic, and the owner cut out on
 * the cover. Colors arrive only as the derived brand palette → CSS variables;
 * the paper is the brand accent folded into a warm off-white.
 */
import type { DerivedPalette } from '@/lib/color/brand-palette';

export const STATEMENT_FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Archivo:ital,wdth,wght@0,62..125,100..900;1,62..125,100..900&family=Fraunces:ital,opsz,wght@1,9..144,300..600&display=swap';

export function statementCss(p: DerivedPalette): string {
  return `
.st{
  --st-bg:${p.bg};--st-fg:${p.fg};--st-muted:${p.fgMuted};--st-accent:${p.accent};--st-on-accent:${p.onAccent};--st-rule:${p.rule};
  --st-paper:color-mix(in oklab,var(--st-accent) 9%,#f8f4ec);--st-ink:var(--st-bg);--st-ink-muted:color-mix(in oklab,var(--st-bg) 70%,#f8f4ec);
  --st-sans:'Archivo',system-ui,sans-serif;--st-quote:'Fraunces',Georgia,serif;
  --st-wrap:1280px;--st-gutter:clamp(20px,4vw,56px);--st-section:clamp(80px,10vw,144px);
  position:relative;background:var(--st-bg);color:var(--st-fg);font-family:var(--st-sans);font-stretch:100%;
  font-size:18px;line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:clip;
}
.st *,.st *::before,.st *::after{box-sizing:border-box}
.st a{color:inherit}
.st img,.st video{display:block;max-width:100%}
.st :focus-visible{outline:3px solid var(--st-accent);outline-offset:3px}
.st-wrap{width:100%;max-width:var(--st-wrap);margin-inline:auto;padding-inline:var(--st-gutter)}
.st-skip{position:absolute;left:-9999px;top:8px;z-index:60;background:var(--st-accent);color:var(--st-on-accent);padding:10px 16px;font-weight:700}
.st-skip:focus{left:8px}
.st-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
.st-section{padding-block:var(--st-section)}
.st-paper{background:var(--st-paper);color:var(--st-ink)}

/* ── type ──────────────────────────────────────────────── */
.st-eyebrow{display:flex;align-items:center;gap:14px;margin:0 0 22px;font-weight:700;font-stretch:125%;font-size:13px;letter-spacing:.24em;text-transform:uppercase;color:var(--st-accent)}
.st-paper .st-eyebrow{color:color-mix(in oklab,var(--st-accent) 70%,var(--st-ink))}
.st-eyebrow::before{content:"";width:40px;height:2px;background:currentColor}
.st-eyebrow--ink{color:var(--st-on-accent)}
.st-title{margin:0;font-weight:800;font-stretch:125%;font-size:clamp(32px,3.6vw,54px);line-height:1.04;letter-spacing:-.01em;text-wrap:balance}
.st-title--wide{max-width:22ch}
.st-lede{margin:22px 0 0;max-width:52ch;font-size:clamp(17px,1.4vw,20px);color:var(--st-muted)}
.st-paper .st-lede{color:var(--st-ink-muted)}
.st-kicker{display:flex;align-items:center;gap:14px;margin:0 0 26px;font-weight:600;font-stretch:115%;font-size:13px;letter-spacing:.2em;text-transform:uppercase;color:var(--st-fg)}
.st-kicker::before{content:"";width:40px;height:2px;background:var(--st-accent)}

/* ── pills ─────────────────────────────────────────────── */
.st-pill{display:inline-flex;align-items:center;gap:10px;padding:12px 22px;border-radius:999px;font-weight:700;font-stretch:112%;font-size:15px;letter-spacing:.02em;text-decoration:none;border:1.5px solid transparent;transition:transform .25s ease,background .25s ease,border-color .25s ease}
.st-pill svg{width:18px;height:18px;flex:none}
.st-pill--gold{background:var(--st-accent);color:var(--st-on-accent)}
.st-pill--gold:hover{transform:translateY(-2px)}
.st-pill--line{border-color:color-mix(in srgb,var(--st-fg) 45%,transparent);color:var(--st-fg)}
.st-pill--line:hover{border-color:var(--st-accent)}
.st-pill--big{padding:18px 30px;font-size:17px}

/* ── header ────────────────────────────────────────────── */
.st-head{position:sticky;top:0;z-index:40;background:color-mix(in srgb,var(--st-bg) 90%,transparent);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
.st-head__row{display:flex;align-items:center;justify-content:space-between;gap:20px;min-height:80px}
.st-mark{display:flex;align-items:baseline;gap:12px;text-decoration:none}
.st-mark__name{font-weight:900;font-stretch:125%;font-size:24px;letter-spacing:.04em;text-transform:uppercase}
.st-mark__trade{font-weight:500;font-stretch:110%;font-size:13px;letter-spacing:.18em;text-transform:uppercase;color:var(--st-accent)}
.st-head__actions{display:flex;align-items:center;gap:22px}
.st-head__phone{display:inline-flex;align-items:center;gap:8px;text-decoration:none;font-weight:600;font-stretch:110%}
.st-head__phone svg{width:17px;height:17px;color:var(--st-accent)}
@media(max-width:720px){.st-mark__trade,.st-head__phone span{display:none}.st-head__actions{gap:14px}}

/* ── the cover ─────────────────────────────────────────── */
.st-cover{--st-cover-pad:clamp(64px,8vw,120px);position:relative;z-index:2;display:flex;align-items:center;min-height:min(88svh,900px);padding-block:var(--st-cover-pad)}
.st-cover__stage{position:absolute;inset:0;z-index:-1}
.st-cover__bg{position:absolute;inset:0;overflow:hidden}
.st-cover__bg img,.st-cover__bg video{width:100%;height:100%;object-fit:cover}
.st-cover__bg::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,color-mix(in srgb,var(--st-bg) 95%,transparent) 0%,color-mix(in srgb,var(--st-bg) 82%,transparent) 36%,color-mix(in srgb,var(--st-bg) 25%,transparent) 64%,transparent 100%),linear-gradient(0deg,var(--st-bg) 0%,transparent 24%)}
.st .st-cover__owner{position:absolute;right:max(var(--st-gutter),calc((100% - var(--st-wrap))/2));bottom:0;height:calc(100% - 24px);width:auto;max-width:none;pointer-events:none;filter:drop-shadow(0 40px 50px rgba(0,0,0,.5));-webkit-mask:linear-gradient(180deg,#000 80%,transparent);mask:linear-gradient(180deg,#000 74%,transparent 98%)}
.st-cover__words{position:relative}
.st-cover__words>*{max-width:600px}
.st-cover__headline{margin:0;font-weight:800;font-stretch:125%;font-size:clamp(36px,4vw,60px);line-height:1.02;letter-spacing:-.015em;text-wrap:balance}
.st-cover__headline em{font-style:normal;color:var(--st-accent)}
.st-cover__sub{margin:26px 0 0;font-size:clamp(17px,1.4vw,20px);color:color-mix(in srgb,var(--st-fg) 78%,transparent);max-width:46ch}
.st-cover__ctas{display:flex;flex-wrap:wrap;gap:14px;margin-top:36px}
@media(max-width:900px){
  .st-cover{display:block;min-height:0;padding-block:0 clamp(48px,10vw,72px)}
  .st-cover__stage{position:relative;height:62svh;min-height:380px;overflow:hidden;margin-bottom:34px}
  .st .st-cover__owner{right:auto;left:50%;translate:-50% 0;bottom:0;height:94%}
  .st-cover__bg::after{background:linear-gradient(0deg,var(--st-bg) 0%,transparent 42%)}
}

/* ── proof row (when the site has figures) ─────────────── */
.st-proof{border-block:1px solid var(--st-rule)}
.st-proof__row{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:24px;list-style:none;margin:0 auto;padding-block:36px}
.st-proof__fig{display:block;font-weight:800;font-stretch:125%;font-size:clamp(30px,3vw,44px);color:var(--st-accent);line-height:1}
.st-proof__label{display:block;margin-top:8px;font-size:15px;color:var(--st-muted)}

/* ── services: a numbered contents page on paper ───────── */
.st-split{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:clamp(40px,6vw,96px);align-items:start}
.st-split__head{position:sticky;top:120px}
.st-contents{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:0 40px}
.st-contents__item{display:flex;gap:20px;padding:26px 0;border-top:1px solid color-mix(in srgb,var(--st-ink) 16%,transparent)}
.st-contents__num{flex:none;width:2.2em;font-weight:900;font-stretch:125%;font-size:26px;line-height:1;color:transparent;-webkit-text-stroke:1.5px color-mix(in oklab,var(--st-accent) 80%,var(--st-ink))}
.st-contents__name{margin:0;font-weight:700;font-stretch:118%;font-size:19px;line-height:1.2}
.st-contents__detail{margin:8px 0 0;font-size:16px;line-height:1.5;color:var(--st-ink-muted)}
@media(max-width:900px){.st-split{grid-template-columns:1fr}.st-split__head{position:static}}
@media(max-width:600px){.st-contents{grid-template-columns:1fr}}

/* ── the work: big photos, sideways, room by room ──────── */
.st-work__head{display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:end;margin-bottom:clamp(36px,4vw,56px)}
.st-work__head .st-lede{margin:0}
.st-reel{--st-reel-inset:max(var(--st-gutter),calc((100% - var(--st-wrap))/2 + var(--st-gutter)));display:flex;gap:clamp(16px,2vw,28px);overflow-x:auto;scroll-snap-type:x mandatory;padding-inline:var(--st-reel-inset);scroll-padding-inline:var(--st-reel-inset);padding-bottom:18px;scrollbar-width:thin;scrollbar-color:var(--st-accent) transparent}
.st-reel__item{flex:0 0 min(78vw,760px);margin:0;scroll-snap-align:start}
.st-reel__media{aspect-ratio:4/3;overflow:hidden;border-radius:6px;background:color-mix(in srgb,var(--st-fg) 8%,transparent)}
.st-reel__media img,.st-reel__media video{width:100%;height:100%;object-fit:cover;transition:transform .8s cubic-bezier(.2,.7,.2,1)}
.st-reel__item:hover .st-reel__media img{transform:scale(1.03)}
.st-reel__cap{display:flex;align-items:baseline;gap:14px;margin-top:16px}
.st-reel__room{font-weight:800;font-stretch:125%;font-size:13px;letter-spacing:.2em;text-transform:uppercase;color:var(--st-accent)}
.st-reel__caption{font-size:17px;color:var(--st-muted)}
.st-reel__hint{display:flex;align-items:center;gap:10px;margin-top:22px;font-size:14px;letter-spacing:.06em;color:var(--st-muted)}
.st-reel__hint svg{width:16px;height:16px;color:var(--st-accent)}
@media(max-width:900px){.st-work__head{grid-template-columns:1fr;gap:18px}.st-reel__item{flex-basis:86vw}}

/* ── reviews: magazine pull-quotes ─────────────────────── */
.st-pull{margin:clamp(56px,6vw,88px) 0 0;max-width:1040px}
.st-pull__quote{position:relative;margin:0;font-family:var(--st-quote);font-style:italic;font-weight:400;font-size:clamp(28px,3.4vw,50px);line-height:1.18;letter-spacing:-.01em;text-wrap:pretty}
.st-pull__quote::before{content:"\\201C";position:absolute;left:-.08em;top:-.62em;font-size:3.2em;line-height:1;color:var(--st-accent);opacity:.9}
.st-pull__who,.st-quote figcaption{display:flex;flex-wrap:wrap;gap:6px 14px;margin-top:26px;font-size:15px;color:var(--st-ink-muted)}
.st-pull__who strong,.st-quote figcaption strong{color:var(--st-ink);font-weight:700;font-stretch:115%;letter-spacing:.04em}
.st-quotes{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:clamp(28px,3vw,48px);margin-top:clamp(56px,6vw,88px);padding-top:clamp(36px,4vw,56px);border-top:1px solid color-mix(in srgb,var(--st-ink) 16%,transparent)}
.st-quote{margin:0}
.st-quote blockquote{margin:0;font-family:var(--st-quote);font-style:italic;font-size:21px;line-height:1.4}
.st-note{margin:40px 0 0;font-size:14px;color:var(--st-ink-muted)}

/* ── who shows up: the owner again, on gold ───────────── */
.st-crew{background:var(--st-accent);color:var(--st-on-accent);padding-block:var(--st-section) 0;overflow:hidden}
.st-crew__grid{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:clamp(32px,5vw,80px);align-items:end}
.st-crew__figure{align-self:stretch;position:relative;min-height:420px}
.st-crew__figure>img,.st-crew__figure video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:6px 6px 0 0}
.st .st-crew__figure--owner>img{inset:auto 0 0 auto;width:auto;height:112%;max-width:none;object-fit:contain;border-radius:0;filter:drop-shadow(0 30px 40px rgba(0,0,0,.28))}
.st-crew__words{padding-bottom:var(--st-section)}
.st-crew__quote{margin:0;font-weight:800;font-stretch:125%;font-size:clamp(28px,3vw,44px);line-height:1.1;letter-spacing:-.01em;text-wrap:balance}
.st-crew__who{margin:18px 0 28px;font-weight:600;font-stretch:112%;font-size:15px;letter-spacing:.08em;text-transform:uppercase;opacity:.75}
.st-crew__body{margin:0 0 16px;max-width:52ch;font-size:18px}
@media(max-width:900px){.st-crew__grid{grid-template-columns:1fr}.st-crew__figure{order:2;min-height:360px}.st-crew__words{padding-bottom:0}.st .st-crew__figure--owner>img{left:50%;right:auto;translate:-50% 0;height:100%}}

/* ── where ─────────────────────────────────────────────── */
.st-area .st-title{font-size:clamp(34px,4.4vw,66px)}

/* ── the estimate ──────────────────────────────────────── */
.st-estimate__grid{display:grid;grid-template-columns:minmax(0,.85fr) minmax(0,1.15fr);gap:clamp(40px,6vw,96px);align-items:start}
.st-steps{list-style:none;margin:36px 0 0;padding:0;display:grid;gap:18px}
.st-steps li{display:flex;align-items:baseline;gap:18px;font-size:18px}
.st-steps span{font-weight:900;font-stretch:125%;font-size:15px;color:color-mix(in oklab,var(--st-accent) 70%,var(--st-ink))}
.st-direct{margin-top:44px;display:grid;gap:6px}
.st-direct__label{margin:0;font-size:13px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:var(--st-ink-muted)}
.st-direct__phone{font-weight:900;font-stretch:125%;font-size:clamp(30px,3vw,42px);text-decoration:none;line-height:1.1}
.st-direct__email{color:var(--st-ink-muted)}
@media(max-width:900px){.st-estimate__grid{grid-template-columns:1fr}}

/* the shared estimate form, dressed for this design: a navy card on paper */
.st .cp-form,.st .cp-done{display:grid;grid-template-columns:1fr 1fr;gap:22px 18px;padding:clamp(24px,3vw,44px);background:var(--st-bg);color:var(--st-fg);border-radius:10px;box-shadow:0 40px 80px -40px rgba(0,0,0,.45)}
.st .cp-done{display:block}
.st .cp-done h3{margin:0 0 12px;font-weight:800;font-stretch:125%;font-size:clamp(26px,2.6vw,36px)}
.st .cp-field{display:flex;flex-direction:column;gap:8px;grid-column:span 2}
.st .cp-field--half{grid-column:span 1}
.st .cp-field label,.st .cp-field legend,.st .cp-chips legend{padding:0;font-weight:700;font-stretch:112%;font-size:14px;letter-spacing:.06em}
.st .cp-field label small{margin-left:6px;font-weight:400;color:var(--st-muted)}
.st .cp-hint{margin:0;font-size:15px;color:var(--st-muted)}
.st .cp-input{width:100%;font:inherit;font-size:17px;color:var(--st-fg);background:color-mix(in srgb,var(--st-fg) 6%,transparent);border:1.5px solid transparent;border-radius:8px;padding:12px 14px;transition:border-color .2s ease}
.st .cp-input:focus{outline:none;border-color:var(--st-accent)}
.st .cp-input::placeholder{color:var(--st-muted)}
.st select.cp-input{appearance:none}
.st select.cp-input option{background:var(--st-bg);color:var(--st-fg)}
.st textarea.cp-input{min-height:120px;resize:vertical}
.st .cp-chips{grid-column:span 2;border:0;margin:0;padding:0}
.st .cp-chips__row{display:flex;flex-wrap:wrap;gap:10px;margin-top:12px}
.st .cp-chip{position:relative}
.st .cp-chip input{position:absolute;inset:0;opacity:0;cursor:pointer}
.st .cp-chip span{display:inline-block;padding:9px 16px;border:1.5px solid var(--st-rule);border-radius:999px;font-size:15px;font-weight:600;transition:all .2s ease}
.st .cp-chip input:checked+span{background:var(--st-accent);border-color:var(--st-accent);color:var(--st-on-accent)}
.st .cp-chip input:focus-visible+span{outline:3px solid var(--st-accent);outline-offset:2px}
.st .cp-drop{position:relative;padding:22px;text-align:center;border:1.5px dashed var(--st-rule);border-radius:8px}
.st .cp-drop:hover,.st .cp-drop:focus-within{border-color:var(--st-accent)}
.st .cp-drop input{position:absolute;inset:0;opacity:0;cursor:pointer}
.st .cp-drop__count{margin:8px 0 0;font-weight:700;color:var(--st-accent)}
.st .cp-hp{position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden}
.st .cp-form__foot{grid-column:span 2;display:flex;flex-wrap:wrap;align-items:center;gap:16px}
.st .cp-btn{display:inline-flex;align-items:center;gap:10px;padding:16px 28px;border-radius:999px;border:1.5px solid transparent;font:inherit;font-weight:700;font-stretch:112%;font-size:16px;cursor:pointer;text-decoration:none}
.st .cp-btn svg{width:18px;height:18px}
.st .cp-btn--solid{background:var(--st-accent);color:var(--st-on-accent)}
.st .cp-btn--line{background:transparent;color:var(--st-fg);border-color:var(--st-rule)}
.st .cp-btn[disabled]{opacity:.6;cursor:progress}
.st .cp-alert{grid-column:span 2;margin:0;padding:14px 16px;border-radius:8px;background:color-mix(in srgb,var(--st-accent) 16%,transparent)}
@media(max-width:640px){.st .cp-field--half{grid-column:span 2}}

/* ── footer + phone thumb bar ──────────────────────────── */
.st-foot{padding-block:clamp(64px,8vw,112px) 120px;border-top:1px solid var(--st-rule)}
.st-foot__big{margin:0;font-weight:900;font-stretch:125%;font-size:clamp(56px,13vw,200px);line-height:.9;letter-spacing:-.02em;text-transform:uppercase;color:transparent;-webkit-text-stroke:1.5px color-mix(in srgb,var(--st-accent) 70%,transparent)}
.st-foot__row{display:flex;flex-wrap:wrap;gap:12px 28px;margin-top:40px;font-size:14px;color:var(--st-muted)}
.st-foot__row a{text-decoration:none}
.st-foot__row a:hover{color:var(--st-accent)}
.st-prose{max-width:760px}
.st-prose h1,.st-prose h2{font-weight:800;font-stretch:120%;line-height:1.1}
.st-thumb{display:none}
@media(max-width:720px){
  .st-thumb{position:fixed;inset:auto 0 0 0;z-index:50;display:grid;grid-template-columns:1fr 1fr;background:var(--st-bg);border-top:1px solid var(--st-rule)}
  .st-thumb a{display:flex;align-items:center;justify-content:center;gap:8px;padding:16px;font-weight:700;font-stretch:112%;text-decoration:none}
  .st-thumb a:last-child{background:var(--st-accent);color:var(--st-on-accent)}
  .st-thumb svg{width:18px;height:18px}
}

/* ── motion: one orchestrated cover, nothing waits on JS ─ */
@media(prefers-reduced-motion:no-preference){
  .st-rise{animation:st-rise .9s cubic-bezier(.2,.7,.2,1) both}
  .st-rise:nth-child(2){animation-delay:.1s}.st-rise:nth-child(3){animation-delay:.2s}.st-rise:nth-child(4){animation-delay:.3s}
  .st .st-cover__owner{animation:st-rise 1.2s cubic-bezier(.2,.7,.2,1) .15s both}
}
@keyframes st-rise{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
`;
}
