/**
 * The buyer's account pages' layout (the `ba-` classes), shared by every design.
 * Colours and type come from the design: each one sets these in its own look,
 * scoped to `.ba-page` inside its frame:
 *
 *   --ba-fg, --ba-muted, --ba-accent, --ba-on-accent, --ba-rule,
 *   --ba-paper (the card behind the forms), --ba-display (heading font),
 *   --ba-radius
 */
export const BUYER_ACCOUNT_CSS = `
.ba-page{--ba-pad:clamp(22px,4vw,44px);width:min(860px,calc(100% - 32px));margin:clamp(40px,8vh,96px) auto clamp(56px,10vh,120px);color:var(--ba-fg)}
.ba-card{max-width:520px;margin:0 auto;padding:var(--ba-pad);background:var(--ba-paper);border-radius:var(--ba-radius,0)}
.ba-account{padding:var(--ba-pad);background:var(--ba-paper);border-radius:var(--ba-radius,0)}
.ba-title{margin:0 0 8px;font-family:var(--ba-display,inherit);font-weight:500;font-size:clamp(30px,5vw,46px);line-height:1.1;color:var(--ba-fg)}
.ba-lede{margin:0 0 24px;color:var(--ba-muted)}
.ba-sub{margin:32px 0 12px;font-family:var(--ba-display,inherit);font-weight:500;font-size:clamp(20px,3vw,26px);color:var(--ba-fg)}
.ba-form{display:grid;gap:18px}
.ba-field{display:grid;gap:6px}
.ba-field label{font-size:.85em;font-weight:600;letter-spacing:.06em;color:var(--ba-muted)}
.ba-field input{width:100%;font:inherit;color:var(--ba-fg);background:transparent;border:1px solid var(--ba-rule);border-radius:var(--ba-radius,0);padding:12px 14px}
.ba-field input:focus{outline:2px solid var(--ba-accent);outline-offset:1px}
.ba-pw{position:relative}
.ba-pw input{padding-right:4.5rem}
.ba-pw-toggle{position:absolute;top:0;right:0;bottom:0;padding:0 14px;background:none;border:0;font:inherit;font-size:.85em;font-weight:600;color:var(--ba-muted);cursor:pointer}
.ba-pw-toggle:hover,.ba-pw-toggle:focus-visible{color:var(--ba-fg)}
.ba-hint{font-size:.85em;color:var(--ba-muted)}
.ba-error{margin:0;color:var(--ba-accent);font-weight:600}
.ba-btn{justify-self:start;display:inline-block;font:inherit;font-weight:600;background:var(--ba-accent);color:var(--ba-on-accent);border:0;border-radius:var(--ba-radius,0);padding:14px 26px;cursor:pointer;text-decoration:none}
.ba-btn:disabled{opacity:.6;cursor:progress}
.ba-links{display:flex;flex-wrap:wrap;gap:8px 24px;margin:20px 0 0}
.ba-link{font:inherit;background:none;border:0;padding:0;color:var(--ba-fg);text-decoration:underline;text-underline-offset:3px;cursor:pointer}
.ba-account > .ba-links{margin:0 0 16px}
.ba-account-head{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-start;gap:16px}
.ba-empty{display:grid;gap:16px;justify-items:start;color:var(--ba-muted)}
.ba-empty p{margin:0}
.ba-orders,.ba-lines{list-style:none;margin:0;padding:0;border-top:1px solid var(--ba-rule)}
.ba-order-row{border-bottom:1px solid var(--ba-rule)}
.ba-order-row a{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr) minmax(0,1fr) auto;gap:12px;align-items:center;padding:14px 0;color:var(--ba-fg);text-decoration:none}
.ba-order-row a:hover .ba-order-number{text-decoration:underline}
.ba-order-number{font-weight:600}
.ba-order-day,.ba-order-status{color:var(--ba-muted)}
.ba-order-total{font-weight:600;text-align:right}
.ba-line{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:12px;padding:12px 0;border-bottom:1px solid var(--ba-rule)}
.ba-line-option{display:block;color:var(--ba-muted);font-size:.9em}
.ba-line-qty{color:var(--ba-muted)}
.ba-line-price{font-weight:600}
.ba-sum{margin:16px 0 0 auto;max-width:320px;display:grid;gap:6px}
.ba-sum div{display:flex;justify-content:space-between;gap:16px}
.ba-sum dd{margin:0}
.ba-sum-total{border-top:1px solid var(--ba-fg);padding-top:10px;margin-top:4px;font-weight:700}
.ba-reorder{display:grid;gap:8px;justify-items:end}
@media (max-width:640px){
  .ba-order-row a{grid-template-columns:minmax(0,1fr) auto}
  .ba-order-day,.ba-order-status{grid-column:1}
  .ba-order-total{grid-row:1;grid-column:2}
  .ba-reorder{justify-items:start}
}
`;
