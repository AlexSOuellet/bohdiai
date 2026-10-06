/**
 * Contractor SWATCH design — the stylesheet. A paint store's color rack: a white
 * page, near-black ink, Bricolage Grotesque for the voice and DM Mono for the
 * chip labels, each job's own color doing the decorating. Chips are white-bordered
 * cards; reviews are printed on wood-grain stir sticks; the crew photo drips.
 * Brand colors arrive as the derived palette → CSS variables (the accent drives
 * the buttons); each chip's color arrives as --chip / --chip-ink on the chip.
 */
import type { DerivedPalette } from '@/lib/color/brand-palette';

export const SWATCH_FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300..800&family=DM+Mono:wght@400;500&display=swap';

const svg = (markup: string): string => `url("data:image/svg+xml,${encodeURIComponent(markup)}")`;

/** Wet paint running off the bottom edge of a photo. Used as a mask. */
const DRIP = svg(
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'><path d='M0 0h100v86c-2 0-2 6-4 6s-2-9-5-9-2 13-5 13-3-11-6-11-2 4-4 4-2-6-5-6-3 10-6 10-2-7-5-7-3 3-5 3-2-9-5-9-2 14-5 14-3-12-6-12-2 5-5 5-2-4-4-4-3 8-6 8-2-6-4-6-3 2-5 2V0z'/></svg>",
);

export function swatchCss(p: DerivedPalette): string {
  return `
.sw{
  --sw-paper:#fbfaf6;--sw-ink:#1b1b1f;--sw-soft:#5d5d66;--sw-line:rgba(27,27,31,.12);
  --sw-accent:${p.accent};--sw-on-accent:${p.onAccent};--sw-brand:${p.bg};
  --sw-display:'Bricolage Grotesque',system-ui,sans-serif;--sw-mono:'DM Mono',ui-monospace,monospace;
  --sw-wrap:1240px;--sw-gutter:clamp(20px,4vw,48px);--sw-section:clamp(80px,9vw,136px);
  position:relative;background:var(--sw-paper);color:var(--sw-ink);font-family:var(--sw-display);
  font-size:18px;line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:clip;
}
.sw *,.sw *::before,.sw *::after{box-sizing:border-box}
.sw a{color:inherit}
.sw img,.sw video{display:block;max-width:100%}
.sw :focus-visible{outline:3px solid var(--sw-accent);outline-offset:3px}
.sw-wrap{width:100%;max-width:var(--sw-wrap);margin-inline:auto;padding-inline:var(--sw-gutter)}
.sw-skip{position:absolute;left:-9999px;top:8px;z-index:60;background:var(--sw-ink);color:var(--sw-paper);padding:10px 16px}
.sw-skip:focus{left:8px}
.sw-section{padding-block:var(--sw-section)}

/* ── voices ────────────────────────────────────────────── */
.sw-eyebrow{margin:0 0 18px;font-family:var(--sw-mono);font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:var(--sw-soft)}
.sw-title{margin:0;font-weight:750;font-size:clamp(34px,4vw,58px);line-height:1;letter-spacing:-.03em;text-wrap:balance}
.sw-lede{margin:20px 0 0;max-width:54ch;font-size:clamp(17px,1.4vw,20px);color:var(--sw-soft)}
.sw-btn{display:inline-flex;align-items:center;gap:10px;padding:14px 22px;border:2px solid var(--sw-ink);font-family:var(--sw-mono);font-weight:500;font-size:14px;letter-spacing:.06em;text-transform:uppercase;text-decoration:none;transition:transform .2s ease,box-shadow .2s ease}
.sw-btn svg{width:17px;height:17px}
.sw-btn:hover{transform:translate(-2px,-2px);box-shadow:4px 4px 0 var(--sw-ink)}
.sw .sw-btn--ink{background:var(--sw-ink);color:var(--sw-paper)}
.sw-btn--accent{background:var(--sw-accent);color:var(--sw-on-accent)}
.sw-btn--line{background:transparent}

/* ── header ────────────────────────────────────────────── */
.sw-head{position:sticky;top:0;z-index:40;background:color-mix(in srgb,var(--sw-paper) 92%,transparent);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-bottom:1px solid var(--sw-line)}
.sw-head__row{display:flex;align-items:center;justify-content:space-between;gap:18px;min-height:74px}
.sw-mark{display:flex;align-items:baseline;gap:10px;text-decoration:none}
.sw-mark__name{font-weight:800;font-size:25px;letter-spacing:-.03em}
.sw-mark__trade{font-family:var(--sw-mono);font-size:13px;letter-spacing:.1em;text-transform:uppercase;color:var(--sw-soft)}
.sw-head__actions{display:flex;align-items:center;gap:20px}
.sw-head__phone{display:inline-flex;align-items:center;gap:8px;text-decoration:none;font-family:var(--sw-mono);font-size:15px}
.sw-head__phone svg{width:16px;height:16px}
.sw-head .sw-btn{padding:10px 16px;font-size:13px}
@media(max-width:720px){.sw-mark__trade,.sw-head__phone span{display:none}}

/* ── the wall of color ─────────────────────────────────── */
.sw-wall{position:relative;padding-bottom:clamp(40px,5vw,72px)}
.sw-wall__bands{display:flex;height:min(70svh,680px);min-height:420px}
.sw-band{position:relative;flex:1 1 0;background:var(--chip);color:var(--chip-ink);transition:flex-grow .6s cubic-bezier(.2,.7,.2,1)}
.sw-band:hover{flex-grow:1.35}
.sw-band__name{position:absolute;left:14px;top:16px;writing-mode:vertical-rl;font-family:var(--sw-mono);font-size:13px;letter-spacing:.12em;text-transform:uppercase}
.sw-band--photo{flex:2.6 1 0;overflow:hidden}
.sw-band--photo img,.sw-band--photo video{width:100%;height:100%;object-fit:cover}
.sw-wall__labelwrap{position:relative;margin-top:calc(-1 * clamp(160px,18vw,240px))}
.sw-label{position:relative;max-width:640px;background:#fff;padding:clamp(26px,3vw,40px);box-shadow:0 30px 60px -30px rgba(27,27,31,.35);border-top:10px solid var(--sw-accent)}
.sw-label__kicker{margin:0 0 16px;font-family:var(--sw-mono);font-size:12.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--sw-soft)}
.sw-label__headline{margin:0;font-weight:800;font-size:clamp(34px,3.8vw,54px);line-height:1;letter-spacing:-.035em;text-wrap:balance}
.sw-label__headline em{font-style:normal;background:linear-gradient(transparent 62%,color-mix(in srgb,var(--sw-accent) 55%,transparent) 62%)}
.sw-label__sub{margin:18px 0 0;font-size:18px;color:var(--sw-soft)}
.sw-label__ctas{display:flex;flex-wrap:wrap;gap:12px;margin-top:26px}
@media(max-width:800px){
  .sw-wall__bands{height:46svh;min-height:300px}
  .sw-band__name{display:none}
  .sw-band--photo{flex-grow:3}
  .sw-wall__labelwrap{margin-top:-60px}
}
@media(prefers-reduced-motion:no-preference){
  .sw-band{animation:sw-drop .9s cubic-bezier(.2,.7,.2,1) both}
  .sw-band:nth-child(2){animation-delay:.06s}.sw-band:nth-child(3){animation-delay:.12s}.sw-band:nth-child(4){animation-delay:.18s}
  .sw-band:nth-child(5){animation-delay:.24s}.sw-band:nth-child(6){animation-delay:.3s}.sw-band:nth-child(7){animation-delay:.36s}
  .sw-label{animation:sw-up .9s cubic-bezier(.2,.7,.2,1) .35s both}
}
@keyframes sw-drop{from{clip-path:inset(0 0 100% 0)}to{clip-path:inset(0 0 0 0)}}
@keyframes sw-up{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}

/* ── what we paint ─────────────────────────────────────── */
.sw-say__title{margin:0;max-width:18ch;font-weight:800;font-size:clamp(40px,5.4vw,80px);line-height:.98;letter-spacing:-.04em}
.sw-tags{display:flex;flex-wrap:wrap;gap:10px;list-style:none;margin:34px 0 0;padding:0}
.sw-tag{padding:9px 16px;border:1.5px solid var(--sw-ink);border-radius:999px;font-family:var(--sw-mono);font-size:14px;letter-spacing:.04em}
.sw-say__detail{margin:30px 0 0;max-width:70ch;font-size:clamp(17px,1.4vw,20px);color:var(--sw-soft)}

/* ── the deck of chips ─────────────────────────────────── */
.sw-deck{background:#f1efe8}
.sw-deck__head{margin-bottom:clamp(40px,5vw,64px)}
.sw-chips{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:clamp(18px,2vw,28px);list-style:none;margin:0;padding:0}
.sw-chip{background:#fff;padding:10px 10px 0;box-shadow:0 18px 40px -26px rgba(27,27,31,.5);transition:transform .35s cubic-bezier(.2,.7,.2,1),box-shadow .35s ease}
.sw-chip:nth-child(4n+2){transform:translateY(34px)}
.sw-chip:nth-child(4n+4){transform:translateY(18px)}
.sw-chip:hover{transform:translateY(-8px) rotate(-1deg);box-shadow:0 30px 50px -26px rgba(27,27,31,.55);z-index:2}
.sw-chip__photo{aspect-ratio:4/5;overflow:hidden}
.sw-chip__photo img,.sw-chip__photo video{width:100%;height:100%;object-fit:cover}
.sw-chip__color{display:grid;gap:2px;margin:10px -10px 0;padding:16px 16px 18px;min-height:120px;background:var(--chip,#d9d6cc);color:var(--chip-ink,var(--sw-ink))}
.sw-chip__name{font-weight:750;font-size:19px;line-height:1.15;letter-spacing:-.01em}
.sw-chip__caption{font-size:15px;opacity:.9}
.sw-chip__tag{margin-top:8px;font-family:var(--sw-mono);font-size:11.5px;letter-spacing:.12em;text-transform:uppercase;opacity:.75}
@media(max-width:1000px){.sw-chips{grid-template-columns:repeat(2,minmax(0,1fr))}.sw-chip:nth-child(n){transform:none}.sw-chip:nth-child(2n){transform:translateY(26px)}}
@media(max-width:520px){.sw-chips{grid-template-columns:1fr}.sw-chip:nth-child(n){transform:none}}

/* ── reviews on stir sticks ────────────────────────────── */
.sw-sticks__list{list-style:none;margin:clamp(40px,5vw,64px) 0 0;padding:0;display:grid;gap:clamp(18px,2.4vw,30px)}
.sw-stick{position:relative;max-width:1040px;padding:28px 72px 26px 40px;border-radius:999px 26px 26px 999px;color:#2b1d10;
  background:repeating-linear-gradient(92deg,rgba(120,80,40,.10) 0 2px,transparent 2px 9px),repeating-linear-gradient(88deg,rgba(255,255,255,.18) 0 1px,transparent 1px 23px),linear-gradient(180deg,#e7c79b,#d9b27c);
  box-shadow:inset 0 -6px 0 rgba(90,56,22,.18),0 16px 30px -18px rgba(60,36,12,.6)}
.sw-stick::after{content:"";position:absolute;right:26px;top:50%;width:18px;height:18px;margin-top:-9px;border-radius:50%;background:var(--sw-paper);box-shadow:inset 0 2px 3px rgba(60,36,12,.4)}
.sw-stick:nth-child(odd){rotate:-1.2deg}
.sw-stick:nth-child(even){rotate:.9deg;margin-left:clamp(0px,6vw,90px)}
.sw-stick__quote{margin:0;font-size:clamp(18px,1.6vw,22px);font-weight:500;line-height:1.4}
.sw-stick__who{margin:10px 0 0;font-family:var(--sw-mono);font-size:13px;letter-spacing:.06em;text-transform:uppercase;opacity:.75}
.sw-note{margin:32px 0 0;font-family:var(--sw-mono);font-size:13px;color:var(--sw-soft)}
@media(max-width:640px){.sw-stick{padding:22px 54px 22px 26px;border-radius:40px 18px 18px 40px}.sw-stick:nth-child(n){rotate:0deg;margin-left:0}}

/* ── who shows up ──────────────────────────────────────── */
.sw-crew{border-top:1px solid var(--sw-line)}
.sw-crew__grid{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:clamp(36px,5vw,80px);align-items:center}
.sw-crew__photo{aspect-ratio:4/5;overflow:hidden;-webkit-mask:${DRIP} center/100% 100% no-repeat;mask:${DRIP} center/100% 100% no-repeat}
.sw-crew__photo img,.sw-crew__photo video{width:100%;height:100%;object-fit:cover}
.sw-crew__quote{margin:0;font-weight:800;font-size:clamp(32px,3.6vw,52px);line-height:1.02;letter-spacing:-.035em;text-wrap:balance}
.sw-crew__who{margin:16px 0 26px;font-family:var(--sw-mono);font-size:13px;letter-spacing:.1em;text-transform:uppercase;color:var(--sw-soft)}
.sw-crew__body{margin:0 0 14px;max-width:52ch;color:var(--sw-soft)}
@media(max-width:860px){.sw-crew__grid{grid-template-columns:1fr}}

/* ── where + the estimate on a color card ──────────────── */
.sw-estimate{background:var(--sw-brand);color:#fff}
.sw-estimate .sw-eyebrow,.sw-estimate .sw-lede,.sw-estimate .sw-area{color:rgba(255,255,255,.72)}
.sw-estimate__head{max-width:760px}
.sw-area{margin:26px 0 0;max-width:60ch}
.sw-area strong{color:#fff;font-weight:700}
.sw-towns{display:flex;flex-wrap:wrap;gap:8px;list-style:none;margin:18px 0 0;padding:0}
.sw-towns li{padding:7px 14px;border:1px solid rgba(255,255,255,.35);border-radius:999px;font-family:var(--sw-mono);font-size:13px}
.sw-card{display:grid;grid-template-columns:56px minmax(0,1fr);margin-top:clamp(40px,5vw,64px);background:#fff;color:var(--sw-ink);box-shadow:0 40px 80px -40px rgba(0,0,0,.6)}
.sw-card__strip{display:flex;flex-direction:column}
.sw-card__strip span{flex:1;background:var(--chip)}
.sw-card__body{padding:clamp(24px,3.4vw,48px)}
.sw-card__steps{margin:0 0 26px;font-family:var(--sw-mono);font-size:14px;letter-spacing:.03em;color:var(--sw-soft)}
.sw-card__direct{margin:26px 0 0;font-family:var(--sw-mono);font-size:14px;color:var(--sw-soft)}
.sw-card__direct a{color:var(--sw-ink);font-weight:500}
@media(max-width:640px){.sw-card{grid-template-columns:14px minmax(0,1fr)}}

/* the shared estimate form, dressed for this design */
.sw .cp-form,.sw .cp-done{display:grid;grid-template-columns:1fr 1fr;gap:20px 18px}
.sw .cp-done{display:block}
.sw .cp-done h3{margin:0 0 10px;font-weight:800;font-size:30px;letter-spacing:-.03em}
.sw .cp-field{display:flex;flex-direction:column;gap:7px;grid-column:span 2}
.sw .cp-field--half{grid-column:span 1}
.sw .cp-field label,.sw .cp-field legend,.sw .cp-chips legend{padding:0;font-family:var(--sw-mono);font-size:12.5px;letter-spacing:.1em;text-transform:uppercase}
.sw .cp-field label small{margin-left:6px;text-transform:none;letter-spacing:0;color:var(--sw-soft)}
.sw .cp-hint{margin:0;font-size:15px;color:var(--sw-soft)}
.sw .cp-input{width:100%;font:inherit;font-size:17px;color:var(--sw-ink);background:#fff;border:1.5px solid var(--sw-line);padding:12px 14px;border-radius:0;transition:border-color .2s ease}
.sw .cp-input:focus{outline:none;border-color:var(--sw-ink)}
.sw .cp-input::placeholder{color:#9a9aa2}
.sw select.cp-input{appearance:none}
.sw textarea.cp-input{min-height:120px;resize:vertical}
.sw .cp-chips{grid-column:span 2;border:0;margin:0;padding:0}
.sw .cp-chips__row{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
.sw .cp-chip{position:relative}
.sw .cp-chip input{position:absolute;inset:0;opacity:0;cursor:pointer}
.sw .cp-chip span{display:inline-block;padding:8px 14px;border:1.5px solid var(--sw-ink);border-radius:999px;font-size:15px;transition:all .2s ease}
.sw .cp-chip input:checked+span{background:var(--sw-ink);color:var(--sw-paper)}
.sw .cp-chip input:focus-visible+span{outline:3px solid var(--sw-accent);outline-offset:2px}
.sw .cp-drop{position:relative;padding:20px;text-align:center;border:1.5px dashed var(--sw-soft)}
.sw .cp-drop:hover,.sw .cp-drop:focus-within{border-color:var(--sw-ink)}
.sw .cp-drop input{position:absolute;inset:0;opacity:0;cursor:pointer}
.sw .cp-drop__count{margin:8px 0 0;font-weight:700}
.sw .cp-hp{position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden}
.sw .cp-form__foot{grid-column:span 2;display:flex;flex-wrap:wrap;align-items:center;gap:14px}
.sw .cp-btn{display:inline-flex;align-items:center;gap:10px;padding:15px 24px;border:2px solid var(--sw-ink);font-family:var(--sw-mono);font-weight:500;font-size:14px;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;text-decoration:none}
.sw .cp-btn svg{width:17px;height:17px}
.sw .cp-btn--solid{background:var(--sw-accent);color:var(--sw-on-accent)}
.sw .cp-btn--line{background:transparent;color:var(--sw-ink)}
.sw .cp-btn[disabled]{opacity:.6;cursor:progress}
.sw .cp-alert{grid-column:span 2;margin:0;padding:12px 14px;background:color-mix(in srgb,var(--sw-accent) 18%,#fff)}
@media(max-width:640px){.sw .cp-field--half{grid-column:span 2}}

/* ── footer + phone thumb bar ──────────────────────────── */
.sw-foot{padding-bottom:110px;background:var(--sw-paper)}
.sw-foot__strip{display:flex;height:28px}
.sw-foot__strip span{flex:1;background:var(--chip)}
.sw-foot__row{display:flex;flex-wrap:wrap;gap:10px 26px;padding-top:34px;font-family:var(--sw-mono);font-size:13px;color:var(--sw-soft)}
.sw-foot__name{color:var(--sw-ink);font-weight:500}
.sw-foot__row a{text-decoration:none}
.sw-foot__row a:hover{color:var(--sw-ink)}
.sw-prose{max-width:760px}
.sw-thumb{display:none}
@media(max-width:720px){
  .sw-thumb{position:fixed;inset:auto 0 0 0;z-index:50;display:grid;grid-template-columns:1fr 1fr;background:var(--sw-ink);color:var(--sw-paper)}
  .sw-thumb a{display:flex;align-items:center;justify-content:center;gap:8px;padding:16px;font-family:var(--sw-mono);font-size:14px;text-transform:uppercase;text-decoration:none}
  .sw-thumb a:last-child{background:var(--sw-accent);color:var(--sw-on-accent)}
  .sw-thumb svg{width:17px;height:17px}
}
`;
}
