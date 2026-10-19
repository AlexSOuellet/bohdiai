/**
 * Main Street — the gallery section's stylesheet (Plan-Backends.md, the gallery
 * section). One idea: the maker's photos at their real shape, hung the way each
 * family hangs things. The wall is CSS columns, so mixed shapes stack without
 * cropping; Modern is the one strict grid. Colors are the skin's vars only, the
 * tilts are nth-child rules, never inline. Joined into chrome's stylesheet.
 */

const R = '.arch-main-street';
const fam = (key: string): string => `${R}[data-ms-family="${key}"]`;

export const GALLERY_CSS = `
    /* ── THE WALL (every family) */
    ${R} .ms-gal-section{padding:96px 0 110px}
    ${R} .ms-gal-head{display:grid;gap:12px;max-width:62ch;margin-bottom:48px}
    ${R} .ms-gal-lede{color:var(--ms-fg-muted)}
    ${R} .ms-gal-wall{list-style:none;margin:0;padding:0;columns:3;column-gap:28px}
    ${R} .ms-gal-wall[data-count="1"]{columns:1;max-width:640px}
    ${R} .ms-gal-wall[data-count="2"]{columns:2}
    ${R} .ms-gal-item{break-inside:avoid;margin:0 0 28px}
    ${R} .ms-gal-piece{display:grid;gap:12px;width:100%;padding:0;border:0;background:none;color:var(--ms-fg);text-align:left;cursor:zoom-in}
    ${R} .ms-gal-piece:focus-visible{outline:3px solid var(--ms-accent);outline-offset:4px}
    ${R} .ms-gal-frame{display:block;overflow:hidden}
    ${R} .ms-gal-frame img{display:block;width:100%;height:auto;transition:transform .7s cubic-bezier(.2,.7,.2,1),filter .7s}
    ${R} .ms-gal-piece:hover .ms-gal-frame img{transform:scale(1.03)}
    @media(max-width:860px){
      ${R} .ms-gal-section{padding:64px 0 76px}
      ${R} .ms-gal-wall,${R} .ms-gal-wall[data-count="2"]{columns:2;column-gap:16px}
      ${R} .ms-gal-item{margin-bottom:18px}
    }
    @media(max-width:420px){${R} .ms-gal-wall,${R} .ms-gal-wall[data-count="2"]{columns:1}}

    /* ── THE VIEWER (every family) */
    ${R} .bc-lb{position:fixed;inset:0;z-index:70;display:grid;place-items:center;background:color-mix(in srgb,var(--ms-contrast-bg) 94%,transparent);padding:clamp(16px,4vw,60px)}
    ${R} .bc-lb figure{display:grid;gap:14px;justify-items:center;max-height:100%;margin:0}
    ${R} .bc-lb img{max-height:80vh;max-width:min(1200px,92vw);object-fit:contain}
    ${R} .bc-lb figcaption{font-family:var(--ms-body);color:var(--ms-contrast-fg);text-align:center}
    ${R} .bc-lb button{position:absolute;display:grid;place-items:center;width:52px;height:52px;border:0;border-radius:50%;background:var(--ms-accent);color:var(--ms-on-accent);font-size:22px;line-height:1;cursor:pointer}
    ${R} .bc-lb button:focus-visible{outline:3px solid var(--ms-contrast-fg);outline-offset:3px}
    ${R} .bc-lb__close{top:18px;right:18px}
    ${R} .bc-lb__prev{left:18px;top:50%;margin-top:-26px}
    ${R} .bc-lb__next{right:18px;top:50%;margin-top:-26px}

    /* ── COZY: soft photos on a warm mat */
    ${fam('cozy')} .ms-gal-frame{border-radius:14px;padding:10px;background:color-mix(in srgb,var(--ms-fg) 6%,var(--ms-bg))}
    ${fam('cozy')} .ms-gal-frame img{border-radius:8px}

    /* ── RUSTIC: a thick dark frame round each */
    ${fam('rustic')} .ms-gal-frame{border:10px solid color-mix(in srgb,var(--ms-fg) 82%,var(--ms-bg));box-shadow:0 14px 24px -14px var(--ms-shadow)}

    /* ── DARK: no frame; the photos rest dim and come up when you point at them */
    ${fam('dark')} .ms-gal-frame img{filter:brightness(.78) saturate(.9)}
    ${fam('dark')} .ms-gal-piece:hover .ms-gal-frame img,${fam('dark')} .ms-gal-piece:focus-visible .ms-gal-frame img{filter:none}
    ${fam('dark')} .ms-gal-name{color:var(--ms-fg-muted)}

    /* ── ELEGANT: two big columns, room to breathe, a fine mat */
    ${fam('luxury')} .ms-gal-wall{columns:2;column-gap:56px}
    ${fam('luxury')} .ms-gal-item{margin-bottom:56px}
    ${fam('luxury')} .ms-gal-frame{padding:16px;border:1px solid var(--ms-rule)}
    ${fam('luxury')} .ms-gal-piece{text-align:center;justify-items:center}
    @media(max-width:860px){${fam('luxury')} .ms-gal-wall{columns:1}${fam('luxury')} .ms-gal-item{margin-bottom:36px}}

    /* ── CHEERFUL: white snapshots, each tipped a little */
    ${fam('cheerful')} .ms-gal-piece{padding:12px 12px 16px;background:color-mix(in srgb,var(--ms-bg) 18%,white);color:var(--ms-fg);box-shadow:0 10px 22px -12px var(--ms-shadow);transition:transform .5s cubic-bezier(.2,.7,.2,1)}
    ${fam('cheerful')} .ms-gal-item:nth-child(3n+1) .ms-gal-piece{transform:rotate(-1.6deg)}
    ${fam('cheerful')} .ms-gal-item:nth-child(3n+2) .ms-gal-piece{transform:rotate(1.2deg)}
    ${fam('cheerful')} .ms-gal-item:nth-child(3n) .ms-gal-piece{transform:rotate(-.5deg)}
    ${fam('cheerful')} .ms-gal-piece:hover,${fam('cheerful')} .ms-gal-piece:focus-visible{transform:rotate(0deg) translateY(-4px)}
    ${fam('cheerful')} .ms-gal-piece:hover .ms-gal-frame img{transform:none}

    /* ── MODERN: the one strict grid, squares tight together */
    ${fam('modern')} .ms-gal-wall{columns:auto;display:grid;grid-template-columns:repeat(3,1fr);gap:4px}
    ${fam('modern')} .ms-gal-wall[data-count="1"],${fam('modern')} .ms-gal-wall[data-count="2"]{grid-template-columns:repeat(2,1fr);max-width:none}
    ${fam('modern')} .ms-gal-item{margin:0}
    ${fam('modern')} .ms-gal-piece{position:relative;gap:0}
    ${fam('modern')} .ms-gal-frame{aspect-ratio:1/1}
    ${fam('modern')} .ms-gal-frame img{height:100%;object-fit:cover}
    ${fam('modern')} .ms-gal-name{position:absolute;left:0;bottom:0;padding:8px 10px;background:var(--ms-fg);color:var(--ms-bg);opacity:0;transition:opacity .25s}
    ${fam('modern')} .ms-gal-piece:hover .ms-gal-name,${fam('modern')} .ms-gal-piece:focus-visible .ms-gal-name{opacity:1}
    @media(max-width:860px){${fam('modern')} .ms-gal-wall{grid-template-columns:repeat(2,1fr)}${fam('modern')} .ms-gal-name{position:static;opacity:1;background:none;color:var(--ms-fg);padding:6px 2px 10px}}
    @media(hover:none){${fam('modern')} .ms-gal-name{position:static;opacity:1;background:none;color:var(--ms-fg);padding:6px 2px 10px}}

    /* ── VINTAGE: cabinet cards, a double rule round each */
    ${fam('vintage')} .ms-gal-piece{padding:14px 14px 18px;background:color-mix(in srgb,var(--ms-bg) 70%,#fff);border:1px solid color-mix(in srgb,var(--ms-fg) 40%,transparent);outline:1px solid color-mix(in srgb,var(--ms-fg) 40%,transparent);outline-offset:-7px;text-align:center;justify-items:center}
    ${fam('vintage')} .ms-gal-frame img{filter:sepia(.12)}
    ${fam('vintage')} .ms-gal-piece:focus-visible{outline:3px solid var(--ms-accent);outline-offset:4px}

    /* ── SCENIC: matted prints floating over the scene */
    ${fam('scenic')} .ms-gal-head{padding:22px 26px;background:var(--sc-glass-strong,var(--ms-bg));backdrop-filter:blur(8px)}
    ${fam('scenic')} .ms-gal-piece{padding:clamp(12px,1.6vw,20px);background:var(--ms-bg);text-align:center;justify-items:center;filter:drop-shadow(0 2px 2px rgba(0,0,0,.25)) drop-shadow(0 22px 26px rgba(8,18,24,.45));transition:transform .8s cubic-bezier(.2,.7,.2,1)}
    ${fam('scenic')} .ms-gal-item:nth-child(odd) .ms-gal-piece{transform:rotate(-.8deg)}
    ${fam('scenic')} .ms-gal-item:nth-child(even) .ms-gal-piece{transform:rotate(.9deg)}
    ${fam('scenic')} .ms-gal-piece:hover,${fam('scenic')} .ms-gal-piece:focus-visible{transform:rotate(0deg) translateY(-6px)}
    ${fam('scenic')} .ms-gal-piece:hover .ms-gal-frame img{transform:none}

    /* ── SPOTLIGHT: big, two to a row, the name on a strip of color */
    ${fam('spotlight')} .ms-gal-wall{columns:2;column-gap:20px}
    ${fam('spotlight')} .ms-gal-item{margin-bottom:20px}
    ${fam('spotlight')} .ms-gal-piece{gap:0}
    ${fam('spotlight')} .ms-gal-name{padding:12px 16px;background:var(--ms-accent);color:var(--ms-on-accent)}
    @media(max-width:860px){${fam('spotlight')} .ms-gal-wall{columns:1}}

    @media(prefers-reduced-motion:reduce){
      ${R} .ms-gal-frame img,${R} .ms-gal-piece,${R} .ms-gal-name{transition:none}
      ${R} .ms-gal-piece:hover .ms-gal-frame img{transform:none}
    }
`;
