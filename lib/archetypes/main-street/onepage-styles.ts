/**
 * Main Street — a one-page site's own pieces (Showcase): the whole story under the
 * about card, opened by its "read more", and the contact form at the bottom of the home
 * page. Skin vars only, class-only. Joined into chrome's stylesheet.
 */

const R = '.arch-main-street';

export const ONE_PAGE_CSS = `
    ${R} .ms-anchor{display:block;height:0;scroll-margin-top:88px}
    /* The whole story stays hidden until the about card's "read more" (a link to it) is clicked. */
    ${R} .ms-story{display:none;padding:56px 0 88px;scroll-margin-top:88px}
    ${R} .ms-story:target{display:block}
    ${R} .ms-story-inner{max-width:68ch;display:grid;gap:18px}
    ${R} .ms-story-p{margin:0;color:var(--ms-fg)}
    ${R} .ms-contactbeat{padding:96px 0 110px}
    ${R} .ms-contactbeat-inner{max-width:680px;text-align:center}
    ${R} .ms-contactbeat-intro{color:var(--ms-fg);margin:16px auto 0;max-width:52ch}
    ${R} .ms-contactbeat-form{margin-top:40px;text-align:left}
    ${R} .ms-contactbeat-phone{display:inline-block;margin-top:20px;color:var(--ms-accent);text-decoration:none;border-bottom:1px solid currentColor}
    /* The social links: a line of their own above the footer links, each a button like the site's Send button (accent, its lettering) with the network's name. */
    ${R} .ms-footer-social{display:flex;flex-basis:100%;flex-wrap:wrap;gap:14px;justify-content:center;margin:0 0 8px}
    /* .ms-footer in front so a family's footer-link color (Scenic's) never overrides the button's. */
    ${R} .ms-footer .ms-footer-social a{display:inline-flex;align-items:center;gap:12px;padding:14px 24px 14px 18px;border-radius:2px;background:var(--ms-accent);color:var(--ms-on-accent);text-decoration:none;transition:transform .2s ease,filter .2s ease}
    ${R} .ms-footer .ms-footer-social a:hover{transform:translateY(-2px);filter:brightness(1.08)}
    ${R} .ms-footer-social svg{width:24px;height:24px;flex:none}
    ${R} .ms-footer .ms-footer-social a:focus-visible{outline:2px solid var(--ms-contrast-fg);outline-offset:3px}
    @media(prefers-reduced-motion:reduce){${R} .ms-footer .ms-footer-social a{transition:none}${R} .ms-footer .ms-footer-social a:hover{transform:none}}
    @media(max-width:860px){${R} .ms-story{padding:40px 0 64px}${R} .ms-contactbeat{padding:64px 0 76px}}
`;
