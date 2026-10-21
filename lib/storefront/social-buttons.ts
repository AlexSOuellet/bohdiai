/**
 * The social links' look, one rule for every design (Alex, 2026-10-21: "we should
 * not have to change these per site"). Each link is a button with its icon and its
 * name, in the design's own button colours: a design names those once, as
 * `--btn-bg` and `--btn-fg` (the colours of its other buttons, the Send button's),
 * and may name them again on a dark band (its footer). No design styles the social
 * links itself, so every site, and every design added later, gets them from its
 * own colours.
 *
 * The lettering is the design's own (the names inherit the footer's type). The
 * colours carry !important because designs colour every link in their footer.
 */
export const SOCIAL_BUTTONS_CSS = `
.social-btns{display:flex;flex-basis:100%;flex-wrap:wrap;gap:14px;justify-content:center;margin:0 0 8px}
.social-btns a{display:inline-flex;align-items:center;gap:10px;padding:12px 22px 12px 16px;border-radius:var(--btn-radius,2px);background:var(--btn-bg)!important;color:var(--btn-fg)!important;text-decoration:none!important;transition:transform .2s ease,filter .2s ease}
.social-btns a:hover{transform:translateY(-2px);filter:brightness(1.08)}
.social-btns a:focus-visible{outline:2px solid var(--btn-bg);outline-offset:3px}
.social-btns svg{width:24px;height:24px;flex:none}
@media(prefers-reduced-motion:reduce){.social-btns a{transition:none}.social-btns a:hover{transform:none}}
`;
