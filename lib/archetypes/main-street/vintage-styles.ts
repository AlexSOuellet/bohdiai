/**
 * Main Street — the stylesheet for the scrapbook pieces (the Vintage family's
 * own section styles, Alex 2026-10-15): the trade card, the scrapbook page, the
 * cabinet card, the specimen drawers, the ticket stubs and the postcards. Joined
 * into chrome's stylesheet. Colors are the skin's vars only, so any skin prints
 * them; sizes and turns are nth-child rules, never inline.
 */
/** The filigree band between sections: a symmetric scroll, used as a mask so the skin's ink prints it. */
const FILIGREE = `url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20600%2056%22%3E%0A%3Cg%20fill%3D%22none%22%20stroke%3D%22%23000%22%20stroke-width%3D%222.4%22%20stroke-linecap%3D%22round%22%3E%0A%3Cpath%20d%3D%22M300%2028%20C300%2014%20312%206%20322%2012%20C332%2018%20328%2032%20318%2032%22%20%2F%3E%0A%3Cpath%20d%3D%22M318%2032%20C340%2034%20352%2020%20372%2022%20C392%2024%20398%2040%20388%2046%20C378%2052%20368%2042%20376%2036%22%20%2F%3E%0A%3Cpath%20d%3D%22M372%2022%20C384%208%20404%206%20414%2014%22%20%2F%3E%0A%3Cpath%20d%3D%22M388%2046%20C410%2050%20430%2038%20452%2038%20C474%2038%20486%2030%20500%2028%22%20%2F%3E%0A%3Cpath%20d%3D%22M414%2014%20C426%2022%20440%2020%20448%2012%20C452%208%20450%202%20444%204%22%20%2F%3E%0A%3Cpath%20d%3D%22M452%2038%20C462%2026%20478%2024%20486%2030%22%20%2F%3E%0A%3Cpath%20d%3D%22M500%2028%20L592%2028%22%20%2F%3E%0A%3Cpath%20d%3D%22M330%2040%20C340%2050%20354%2052%20362%2046%22%20%2F%3E%0A%3Cg%20transform%3D%22translate(600%200)%20scale(-1%201)%22%3E%0A%3Cpath%20d%3D%22M300%2028%20C300%2014%20312%206%20322%2012%20C332%2018%20328%2032%20318%2032%22%20%2F%3E%0A%3Cpath%20d%3D%22M318%2032%20C340%2034%20352%2020%20372%2022%20C392%2024%20398%2040%20388%2046%20C378%2052%20368%2042%20376%2036%22%20%2F%3E%0A%3Cpath%20d%3D%22M372%2022%20C384%208%20404%206%20414%2014%22%20%2F%3E%0A%3Cpath%20d%3D%22M388%2046%20C410%2050%20430%2038%20452%2038%20C474%2038%20486%2030%20500%2028%22%20%2F%3E%0A%3Cpath%20d%3D%22M414%2014%20C426%2022%20440%2020%20448%2012%20C452%208%20450%202%20444%204%22%20%2F%3E%0A%3Cpath%20d%3D%22M452%2038%20C462%2026%20478%2024%20486%2030%22%20%2F%3E%0A%3Cpath%20d%3D%22M500%2028%20L592%2028%22%20%2F%3E%0A%3Cpath%20d%3D%22M330%2040%20C340%2050%20354%2052%20362%2046%22%20%2F%3E%0A%3C%2Fg%3E%3C%2Fg%3E%0A%3Cg%20fill%3D%22%23000%22%3E%0A%3Cellipse%20cx%3D%22404%22%20cy%3D%2230%22%20rx%3D%229%22%20ry%3D%223.4%22%20transform%3D%22rotate(-20%20404%2030)%22%20%2F%3E%0A%3Cellipse%20cx%3D%22432%22%20cy%3D%2226%22%20rx%3D%227%22%20ry%3D%222.8%22%20transform%3D%22rotate(18%20432%2026)%22%20%2F%3E%0A%3Cellipse%20cx%3D%22470%22%20cy%3D%2244%22%20rx%3D%227%22%20ry%3D%222.8%22%20transform%3D%22rotate(-12%20470%2044)%22%20%2F%3E%0A%3Ccircle%20cx%3D%22592%22%20cy%3D%2228%22%20r%3D%223%22%20%2F%3E%0A%3Cg%20transform%3D%22translate(600%200)%20scale(-1%201)%22%3E%0A%3Cellipse%20cx%3D%22404%22%20cy%3D%2230%22%20rx%3D%229%22%20ry%3D%223.4%22%20transform%3D%22rotate(-20%20404%2030)%22%20%2F%3E%0A%3Cellipse%20cx%3D%22432%22%20cy%3D%2226%22%20rx%3D%227%22%20ry%3D%222.8%22%20transform%3D%22rotate(18%20432%2026)%22%20%2F%3E%0A%3Cellipse%20cx%3D%22470%22%20cy%3D%2244%22%20rx%3D%227%22%20ry%3D%222.8%22%20transform%3D%22rotate(-12%20470%2044)%22%20%2F%3E%0A%3Ccircle%20cx%3D%22592%22%20cy%3D%2228%22%20r%3D%223%22%20%2F%3E%0A%3C%2Fg%3E%3C%2Fg%3E%0A%3Cg%20fill%3D%22none%22%20stroke%3D%22%23000%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M300%206%20L316%2028%20L300%2050%20L284%2028%20Z%22%2F%3E%3C%2Fg%3E%0A%3Ccircle%20cx%3D%22300%22%20cy%3D%2228%22%20r%3D%225%22%20fill%3D%22%23000%22%2F%3E%0A%3C%2Fsvg%3E")`;

export const VINTAGE_CSS = `

    /* ── THE PAGE — Alex's Victorian backgrounds: mottled, aged parchment that runs
       down the whole page (it scrolls with the content), darker toward the edges of
       the screen, and a filigree band printed between the sections. */
    .arch-main-street[data-ms-family="vintage"] .ms-fu-section{background:transparent}
    .arch-main-street[data-ms-family="vintage"] .ms-family-texture{position:absolute;background-size:1200px auto;background-repeat:repeat;background-position:0 0}
    .arch-main-street[data-ms-family="vintage"]::after{content:"";position:fixed;inset:0;z-index:-1;pointer-events:none;background:radial-gradient(ellipse 75% 70% at 50% 45%,transparent 55%,color-mix(in srgb,var(--ms-fg) 26%,transparent) 100%)}
    .arch-main-street[data-ms-family="vintage"] .ms-tag-section,.arch-main-street[data-ms-family="vintage"] .ms-drawers,.arch-main-street[data-ms-family="vintage"] .ms-tix,.arch-main-street[data-ms-family="vintage"] .ms-post,.arch-main-street[data-ms-family="vintage"] .ms-close-section{position:relative}
    .arch-main-street[data-ms-family="vintage"] .ms-tag-section::before,.arch-main-street[data-ms-family="vintage"] .ms-drawers::before,.arch-main-street[data-ms-family="vintage"] .ms-tix::before,.arch-main-street[data-ms-family="vintage"] .ms-post::before,.arch-main-street[data-ms-family="vintage"] .ms-close-section::before{content:"";position:absolute;top:calc(var(--ms-section) * .35);left:50%;width:min(560px,82%);aspect-ratio:600/56;transform:translateX(-50%);background:var(--ms-fg);opacity:.75;-webkit-mask:${FILIGREE} center/contain no-repeat;mask:${FILIGREE} center/contain no-repeat}

    /* ── PLAYBILL — the opening (Alex's music-hall bill) ────────────────── */
    .arch-main-street .ms-bill-hero{padding-bottom:var(--ms-section);color:var(--ms-fg)}
    .arch-main-street .ms-bill-nav{display:flex;align-items:center;justify-content:space-between;padding:14px 40px;color:var(--ms-fg)}
    .arch-main-street .ms-bill-sheet{position:relative;max-width:980px;margin:clamp(10px,3vw,34px) auto 0;padding:clamp(44px,6vw,84px) clamp(26px,6vw,92px) clamp(46px,6vw,80px);text-align:center;border:3px solid var(--ms-fg);outline:1px solid var(--ms-fg);outline-offset:-14px}
    .arch-main-street .ms-bill-corner{position:absolute;width:clamp(40px,5vw,62px);height:auto;color:var(--ms-fg)}
    .arch-main-street .ms-bill-corner--tl{top:22px;left:22px}
    .arch-main-street .ms-bill-corner--tr{top:22px;right:22px;transform:scaleX(-1)}
    .arch-main-street .ms-bill-corner--bl{bottom:22px;left:22px;transform:scaleY(-1)}
    .arch-main-street .ms-bill-corner--br{bottom:22px;right:22px;transform:scale(-1,-1)}
    .arch-main-street .ms-bill-arch{display:block;width:min(640px,94%);height:auto;margin:0 auto -4px;overflow:visible}
    .arch-main-street .ms-bill-arch-text{fill:var(--ms-accent);font-size:30px;letter-spacing:.16em}
    /* A longer line sets smaller and tighter so it always fits the arc. */
    .arch-main-street .ms-bill-arch[data-length="m"] .ms-bill-arch-text{font-size:24px;letter-spacing:.12em}
    .arch-main-street .ms-bill-arch[data-length="l"] .ms-bill-arch-text{font-size:19px;letter-spacing:.08em}
    .arch-main-street .ms-bill-arch[data-length="xl"] .ms-bill-arch-text{font-size:15px;letter-spacing:.05em}
    /* The line set flat: only on phones, in place of an arc too long to read small. */
    .arch-main-street .ms-bill-kicker{display:none;color:var(--ms-accent);margin:0 auto 18px;max-width:none}
    .arch-main-street .ms-bill-medallion{width:clamp(150px,18vw,220px);aspect-ratio:4/5;margin:8px auto 26px;border-radius:50%;overflow:hidden;box-shadow:0 0 0 4px var(--ms-bg),0 0 0 6px var(--ms-fg),0 0 0 10px var(--ms-bg),0 0 0 11px var(--ms-fg)}
    .arch-main-street .ms-bill-medallion .archetype-photo{display:block;width:100%;height:100%;object-fit:cover}
    .arch-main-street .ms-bill-brand{margin:0 auto;max-width:14ch;color:var(--ms-fg);font-size:clamp(54px,9.4vw,136px);line-height:.92;text-shadow:3px 3px 0 var(--ms-accent);text-wrap:balance}
    .arch-main-street .ms-bill-ribbon{display:inline-block;margin:30px auto 0;padding:13px 52px;background:var(--ms-accent);clip-path:polygon(0 0,100% 0,calc(100% - 20px) 50%,100% 100%,0 100%,20px 50%)}
    .arch-main-street .ms-bill-sub{margin:0;max-width:46ch;color:var(--ms-on-accent);font-style:italic}
    .arch-main-street .ms-bill-rule{display:flex;align-items:center;justify-content:center;gap:16px;margin:30px auto 28px;color:var(--ms-fg)}
    .arch-main-street .ms-bill-rosette{width:30px;height:30px;flex:none}
    .arch-main-street .ms-bill-flourish{width:min(300px,52%);height:auto}
    .arch-main-street .ms-bill-actions{display:flex;gap:22px;justify-content:center;align-items:center;flex-wrap:wrap}
    .arch-main-street .ms-bill-cta{background:var(--ms-fg);color:var(--ms-bg);padding:15px 32px;outline:1px solid var(--ms-fg);outline-offset:3px;max-width:100%;white-space:normal}
    .arch-main-street .ms-bill-cta:hover{background:var(--ms-accent);outline-color:var(--ms-accent)}
    .arch-main-street .ms-bill-cta2{color:var(--ms-fg);border-bottom:1px solid currentColor;padding:6px 2px;max-width:100%;white-space:normal}

    /* ── TAGS — the pieces (Alex's apothecary tags) ─────────────────────── */
    .arch-main-street .ms-tag-section{padding:var(--ms-section) 0}
    .arch-main-street .ms-tag-rank{--ms-tag-gap:clamp(18px,2.4vw,30px);list-style:none;margin:var(--ms-loose) 0 0;padding:0;display:flex;flex-wrap:wrap;justify-content:center;gap:var(--ms-tag-gap)}
    .arch-main-street .ms-tag-item{flex:0 0 calc((100% - 3 * var(--ms-tag-gap)) / 4)}
    .arch-main-street .ms-tag{position:relative;display:flex;flex-direction:column;align-items:center;gap:16px;height:100%;padding:46px 18px 22px;color:var(--ms-fg);background-color:color-mix(in srgb,var(--ms-bg) 82%,#fff);background-image:var(--ms-texture-url);background-size:640px;background-position:center;background-blend-mode:multiply;transition:transform .35s ease;
      -webkit-mask:radial-gradient(circle 18px at 0 0,#0000 98%,#000) top left/51% 51% no-repeat,radial-gradient(circle 18px at 100% 0,#0000 98%,#000) top right/51% 51% no-repeat,radial-gradient(circle 18px at 0 100%,#0000 98%,#000) bottom left/51% 51% no-repeat,radial-gradient(circle 18px at 100% 100%,#0000 98%,#000) bottom right/51% 51% no-repeat;
              mask:radial-gradient(circle 18px at 0 0,#0000 98%,#000) top left/51% 51% no-repeat,radial-gradient(circle 18px at 100% 0,#0000 98%,#000) top right/51% 51% no-repeat,radial-gradient(circle 18px at 0 100%,#0000 98%,#000) bottom left/51% 51% no-repeat,radial-gradient(circle 18px at 100% 100%,#0000 98%,#000) bottom right/51% 51% no-repeat}
    .arch-main-street .ms-tag:hover,.arch-main-street .ms-tag:focus-visible{transform:translateY(-5px)}
    .arch-main-street .ms-tag-eyelet{position:absolute;top:16px;left:50%;width:15px;height:15px;margin-left:-7.5px;border-radius:50%;background:var(--ms-bg);box-shadow:inset 0 0 0 3px color-mix(in srgb,var(--ms-accent) 55%,var(--ms-fg)),0 0 0 1px var(--ms-rule)}
    .arch-main-street .ms-tag-frame{display:block;width:100%;aspect-ratio:1;overflow:hidden;box-shadow:0 0 0 1px var(--ms-fg)}
    /* The photo is printed onto the tag: white backgrounds take on the old paper. */
    .arch-main-street .ms-tag-frame .archetype-photo{display:block;width:100%;height:100%;object-fit:cover;mix-blend-mode:multiply}
    .arch-main-street .ms-tag-label{display:flex;flex-direction:column;align-items:center;gap:5px;width:100%;margin-top:auto;padding:12px 12px 11px;text-align:center;border:1px solid var(--ms-fg);outline:1px solid var(--ms-fg);outline-offset:3px;border-radius:40px/16px;background:color-mix(in srgb,var(--ms-bg) 70%,#fff)}
    .arch-main-street .ms-tag-name{color:var(--ms-fg);font-size:clamp(17px,1.5vw,21px);line-height:1.12}
    .arch-main-street .ms-tag-price{color:var(--ms-accent)}

    /* The end-of-sampling button, printed like the bill's own: square, ink on paper. */
    .arch-main-street[data-ms-family="vintage"] .ms-shopcue-btn{border-radius:0;background:var(--ms-fg);color:var(--ms-bg);outline:1px solid var(--ms-fg);outline-offset:3px}

    /* ── HEADINGS — every section head set like a bill line, centered over a double rule. */
    .arch-main-street[data-ms-family="vintage"] .ms-goodshead{flex-direction:column;align-items:center;text-align:center;gap:14px}
    .arch-main-street[data-ms-family="vintage"] .ms-goodshead-title,.arch-main-street[data-ms-family="vintage"] .ms-drawers-title,.arch-main-street[data-ms-family="vintage"] .ms-tix-title,.arch-main-street[data-ms-family="vintage"] .ms-post-title{max-width:none;margin-inline:auto}
    .arch-main-street[data-ms-family="vintage"] .ms-goodshead-title::after,.arch-main-street[data-ms-family="vintage"] .ms-drawers-title::after,.arch-main-street[data-ms-family="vintage"] .ms-tix-title::after,.arch-main-street[data-ms-family="vintage"] .ms-post-title::after{content:"";display:block;width:170px;margin:18px auto 0;border-top:4px double var(--ms-accent)}

    /* ── SCRAPBOOK — the pieces ───────────────────────────────────────────── */
    .arch-main-street .ms-scrap-section{padding:var(--ms-section) 0}
    .arch-main-street .ms-scrap-page{list-style:none;margin:var(--ms-loose) 0 0;padding:clamp(28px,4.5vw,64px);display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:clamp(30px,4vw,56px) clamp(18px,2.6vw,36px);align-items:start;background:color-mix(in srgb,var(--ms-bg) 70%,#fff);box-shadow:inset 0 0 0 1px var(--ms-rule),0 34px 56px -40px rgba(40,22,12,.6)}
    .arch-main-street .ms-scrap-item{grid-column:span 4}
    .arch-main-street .ms-scrap-item:nth-child(6n+1){grid-column:span 5;transform:rotate(-2deg)}
    .arch-main-street .ms-scrap-item:nth-child(6n+2){grid-column:span 4;transform:rotate(1.6deg);margin-top:44px}
    .arch-main-street .ms-scrap-item:nth-child(6n+3){grid-column:span 3;transform:rotate(-1deg);margin-top:12px}
    .arch-main-street .ms-scrap-item:nth-child(6n+4){grid-column:span 4;transform:rotate(2.2deg);margin-top:20px}
    .arch-main-street .ms-scrap-item:nth-child(6n+5){grid-column:span 3;transform:rotate(-2.6deg);margin-top:56px}
    .arch-main-street .ms-scrap-item:nth-child(6n+6){grid-column:span 5;transform:rotate(1deg)}
    /* A short last row spreads out instead of leaving a hole: two left over share the row, one sits in the middle. */
    .arch-main-street .ms-scrap-item:nth-child(6n+4):nth-last-child(2),.arch-main-street .ms-scrap-item:nth-child(6n+5):last-child{grid-column:span 6}
    .arch-main-street .ms-scrap-item:nth-child(6n+4):last-child{grid-column:4 / span 6}
    .arch-main-street .ms-scrap-link{display:block;color:var(--ms-fg);transition:transform .35s ease}
    .arch-main-street .ms-scrap-link:hover,.arch-main-street .ms-scrap-link:focus-visible{transform:translateY(-6px)}
    .arch-main-street .ms-scrap-photo{position:relative;display:block;padding:10px;background:color-mix(in srgb,var(--ms-bg) 35%,#fff);box-shadow:0 14px 22px -14px rgba(40,22,12,.55)}
    .arch-main-street .ms-scrap-photo .archetype-photo{display:block;width:100%;aspect-ratio:4/5;object-fit:cover}
    .arch-main-street .ms-scrap-corner{position:absolute;width:30px;height:30px;background:var(--ms-contrast-bg)}
    .arch-main-street .ms-scrap-corner--tl{top:-5px;left:-5px;clip-path:polygon(0 0,100% 0,0 100%)}
    .arch-main-street .ms-scrap-corner--tr{top:-5px;right:-5px;clip-path:polygon(0 0,100% 0,100% 100%)}
    .arch-main-street .ms-scrap-corner--bl{bottom:-5px;left:-5px;clip-path:polygon(0 0,0 100%,100% 100%)}
    .arch-main-street .ms-scrap-corner--br{bottom:-5px;right:-5px;clip-path:polygon(100% 0,100% 100%,0 100%)}
    /* The paper tag: a notched shipping tag with its eyelet, tied on below the photo. */
    .arch-main-street .ms-scrap-tag{position:relative;display:inline-flex;flex-direction:column;gap:3px;max-width:88%;margin:-20px 0 0 22px;padding:11px 18px 11px 34px;background:color-mix(in srgb,var(--ms-bg) 82%,var(--ms-accent));color:var(--ms-fg);transform:rotate(-3deg);clip-path:polygon(16px 0,100% 0,100% 100%,16px 100%,0 50%)}
    .arch-main-street .ms-scrap-tag::before{content:"";position:absolute;left:16px;top:50%;width:8px;height:8px;margin-top:-4px;border-radius:50%;background:var(--ms-bg);box-shadow:inset 0 0 0 2px color-mix(in srgb,var(--ms-accent) 70%,transparent)}
    .arch-main-street .ms-scrap-name{display:block;line-height:1.15}
    .arch-main-street .ms-scrap-price{display:block;color:var(--ms-accent)}

    /* ── CABINET CARD — the about ─────────────────────────────────────────── */
    .arch-main-street .ms-cab-section{padding:var(--ms-section) 0;background:var(--ms-contrast-bg);color:var(--ms-contrast-fg)}
    .arch-main-street .ms-cab-grid{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:clamp(36px,6vw,96px);align-items:center}
    .arch-main-street .ms-cab-card{justify-self:center;width:min(100%,380px);margin:0;padding:18px 18px 48px;background:var(--ms-bg);border-radius:6px;transform:rotate(-2deg);box-shadow:inset 0 0 0 7px var(--ms-bg),inset 0 0 0 8px var(--ms-accent),0 30px 44px -26px rgba(0,0,0,.6)}
    .arch-main-street .ms-cab-window{display:block;overflow:hidden;aspect-ratio:3/4;border-radius:999px 999px 6px 6px;box-shadow:inset 0 0 0 1px var(--ms-rule)}
    .arch-main-street .ms-cab-window .archetype-photo{display:block;width:100%;height:100%;object-fit:cover}
    .arch-main-street .ms-cab-imprint{margin-top:16px;text-align:center;color:var(--ms-fg);font-variant:small-caps;letter-spacing:.12em}
    .arch-main-street .ms-cab-quote{margin:0;font-size:clamp(22px,2.6vw,34px);line-height:1.35;max-width:30ch}
    .arch-main-street .ms-cab-flourish{display:block;width:220px;max-width:70%;height:auto;margin:26px 0;color:var(--ms-accent)}
    .arch-main-street .ms-cab-sig{display:block;color:var(--ms-contrast-fg)}
    .arch-main-street .ms-cab-cue{display:table;margin-top:28px;color:var(--ms-contrast-fg);border-bottom:1px solid currentColor;padding-bottom:2px}

    /* ── SPECIMEN DRAWERS — the collections ───────────────────────────────── */
    .arch-main-street .ms-drawers{padding:var(--ms-section) 0}
    .arch-main-street .ms-drawers-head{text-align:center;margin-bottom:var(--ms-loose)}
    .arch-main-street .ms-drawers-eyebrow{display:block;color:var(--ms-accent);margin-bottom:10px}
    .arch-main-street .ms-drawers-title{display:block;max-width:none;margin:0;color:var(--ms-fg)}
    .arch-main-street .ms-drawers-cabinet{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px;padding:16px;background:var(--ms-contrast-bg);border-radius:4px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.08),0 34px 46px -32px rgba(20,10,4,.7)}
    .arch-main-street .ms-drawer{display:flex;flex-direction:column;color:var(--ms-fg);background:rgba(0,0,0,.28)}
    .arch-main-street .ms-drawer-peek{display:block;aspect-ratio:4/3;overflow:hidden;box-shadow:inset 0 0 0 1px rgba(255,255,255,.12)}
    .arch-main-street .ms-drawer-peek .archetype-photo{display:block;width:100%;height:100%;object-fit:cover;transition:transform .6s ease}
    .arch-main-street .ms-drawer:hover .ms-drawer-peek .archetype-photo,.arch-main-street .ms-drawer:focus-visible .ms-drawer-peek .archetype-photo{transform:scale(1.04)}
    .arch-main-street .ms-drawer-face{display:flex;flex-direction:column;align-items:center;gap:16px;padding:22px 16px 18px;background:linear-gradient(180deg,color-mix(in srgb,var(--ms-contrast-bg) 78%,#fff),var(--ms-contrast-bg));box-shadow:inset 0 0 0 1px rgba(255,255,255,.14),inset 0 -8px 12px rgba(0,0,0,.28)}
    .arch-main-street .ms-drawer-plate{display:flex;flex-direction:column;align-items:center;gap:3px;min-width:72%;padding:10px 16px;text-align:center;background:var(--ms-bg);color:var(--ms-fg);border:2px solid var(--ms-accent);border-radius:3px;box-shadow:0 0 0 3px color-mix(in srgb,var(--ms-accent) 35%,transparent)}
    .arch-main-street .ms-drawer-count{color:var(--ms-fg-muted)}
    .arch-main-street .ms-drawer-knob{width:18px;height:18px;border-radius:50%;background:radial-gradient(circle at 35% 35%,color-mix(in srgb,var(--ms-accent) 40%,#fff),var(--ms-accent) 60%,color-mix(in srgb,var(--ms-accent) 55%,#000));box-shadow:0 2px 3px rgba(0,0,0,.45)}
    .arch-main-street .ms-drawers-all{display:table;margin:var(--ms-loose) auto 0;color:var(--ms-fg);border-bottom:1px solid currentColor}

    /* ── TICKET STUBS — the markets ───────────────────────────────────────── */
    .arch-main-street .ms-tix{padding:var(--ms-section) 0}
    .arch-main-street .ms-tix-title{display:block;max-width:none;text-align:center;margin:0 0 var(--ms-loose);color:var(--ms-fg)}
    .arch-main-street .ms-tix-row{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;justify-content:center;gap:28px 22px}
    .arch-main-street .ms-tix-stub{display:flex;width:min(310px,100%);min-height:150px;color:var(--ms-fg);background:color-mix(in srgb,var(--ms-accent) 16%,var(--ms-bg));
      -webkit-mask:radial-gradient(circle 12px at 0 50%,#0000 97%,#000) left/51% 100% no-repeat,radial-gradient(circle 12px at 100% 50%,#0000 97%,#000) right/51% 100% no-repeat;
              mask:radial-gradient(circle 12px at 0 50%,#0000 97%,#000) left/51% 100% no-repeat,radial-gradient(circle 12px at 100% 50%,#0000 97%,#000) right/51% 100% no-repeat}
    .arch-main-street .ms-tix-stub:nth-child(odd){transform:rotate(-1.5deg)}
    .arch-main-street .ms-tix-stub:nth-child(even){transform:rotate(1.2deg);margin-top:12px}
    .arch-main-street .ms-tix-perf{flex:none;width:38px;background:color-mix(in srgb,var(--ms-accent) 30%,var(--ms-bg));border-right:2px dashed color-mix(in srgb,var(--ms-fg) 40%,transparent)}
    .arch-main-street .ms-tix-body{flex:1;display:flex;flex-direction:column;justify-content:center;gap:6px;padding:18px 26px 18px 20px;box-shadow:inset 0 0 0 7px transparent,inset 0 0 0 8px var(--ms-rule)}
    .arch-main-street .ms-tix-day{color:var(--ms-accent);font-size:1.35em}
    .arch-main-street .ms-tix-where{display:block;max-width:none;white-space:normal;overflow:visible;line-height:1.2}
    .arch-main-street .ms-tix-time{color:var(--ms-fg-muted)}
    .arch-main-street .ms-tix-all{display:table;margin:var(--ms-loose) auto 0;color:var(--ms-fg);border-bottom:1px solid currentColor}

    /* ── POSTCARDS — the reviews ──────────────────────────────────────────── */
    .arch-main-street .ms-post{padding:var(--ms-section) 0}
    .arch-main-street .ms-post-head{text-align:center;margin-bottom:var(--ms-loose)}
    .arch-main-street .ms-post-eyebrow{display:block;color:var(--ms-accent);margin-bottom:10px}
    .arch-main-street .ms-post-title{display:block;max-width:none;margin:0;color:var(--ms-fg)}
    .arch-main-street .ms-post-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:40px 34px;max-width:1000px;margin:0 auto}
    .arch-main-street .ms-post-card{position:relative;margin:0;display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,1fr);gap:24px;min-height:220px;padding:30px 26px 26px;color:var(--ms-fg);background:color-mix(in srgb,var(--ms-bg) 45%,#fff);background-image:linear-gradient(var(--ms-rule),var(--ms-rule));background-size:1px 66%;background-position:58% 62%;background-repeat:no-repeat;box-shadow:0 1px 0 var(--ms-rule),0 24px 32px -24px rgba(40,22,12,.55)}
    .arch-main-street .ms-post-card:nth-child(odd){transform:rotate(-1.4deg)}
    .arch-main-street .ms-post-card:nth-child(even){transform:rotate(1.2deg)}
    .arch-main-street .ms-post-msg{grid-column:1;align-self:center;margin:0}
    .arch-main-street .ms-post-quote{margin:0;font-style:italic;line-height:1.5}
    .arch-main-street .ms-post-addr{grid-column:2;align-self:end;display:flex;flex-direction:column;gap:12px;padding-top:86px}
    .arch-main-street .ms-post-who,.arch-main-street .ms-post-from{display:block;padding-bottom:6px;border-bottom:1px solid var(--ms-rule)}
    .arch-main-street .ms-post-from{color:var(--ms-fg-muted)}
    /* The stamp: a little picture with a perforated edge cut by the mask; the postmark rings it. */
    .arch-main-street .ms-post-stamp{position:absolute;top:18px;right:18px;width:54px;height:64px;padding:6px;background:color-mix(in srgb,var(--ms-bg) 35%,#fff);
      -webkit-mask:radial-gradient(circle,#000 66%,#0000 68%) 0 0/8px 8px round,linear-gradient(#000 0 0) 4px 4px/calc(100% - 8px) calc(100% - 8px) no-repeat;
              mask:radial-gradient(circle,#000 66%,#0000 68%) 0 0/8px 8px round,linear-gradient(#000 0 0) 4px 4px/calc(100% - 8px) calc(100% - 8px) no-repeat}
    .arch-main-street .ms-post-stamp-art{display:block;width:100%;height:100%;background:var(--ms-accent);background-image:radial-gradient(ellipse 30% 26% at 50% 40%,color-mix(in srgb,var(--ms-on-accent) 70%,transparent) 0 95%,transparent 100%),radial-gradient(ellipse 46% 26% at 50% 100%,color-mix(in srgb,var(--ms-on-accent) 70%,transparent) 0 95%,transparent 100%)}
    .arch-main-street .ms-post-mark{position:absolute;top:30px;right:52px;width:64px;height:64px;border:2px solid color-mix(in srgb,var(--ms-fg) 42%,transparent);border-radius:50%;transform:rotate(-12deg)}
    .arch-main-street .ms-post-mark::after{content:"";position:absolute;top:18px;left:26px;width:72px;height:26px;background:repeating-linear-gradient(180deg,color-mix(in srgb,var(--ms-fg) 38%,transparent) 0 2px,transparent 2px 8px)}
    .arch-main-street .ms-post-all{display:table;margin:var(--ms-loose) auto 0;color:var(--ms-fg);border-bottom:1px solid currentColor}

    @media(max-width:860px){
      .arch-main-street .ms-bill-nav{padding-inline:20px}
      .arch-main-street .ms-bill-sheet{outline-offset:-10px}
      .arch-main-street .ms-bill-ribbon{padding:12px 34px}
      .arch-main-street .ms-tag-item{flex-basis:calc((100% - var(--ms-tag-gap)) / 2)}
      .arch-main-street .ms-tag{padding:40px 12px 16px}
      .arch-main-street .ms-scrap-page{grid-template-columns:repeat(2,minmax(0,1fr));padding:22px}
      .arch-main-street .ms-scrap-page > .ms-scrap-item:nth-child(n){grid-column:auto;margin-top:0}
      .arch-main-street .ms-scrap-page > .ms-scrap-item:nth-child(even){margin-top:28px}
      .arch-main-street .ms-cab-grid{grid-template-columns:1fr}
      .arch-main-street .ms-post-row{grid-template-columns:1fr}
      .arch-main-street .ms-post-card{grid-template-columns:1fr;background-image:none}
      .arch-main-street .ms-post-addr{grid-column:1;padding-top:0}
      .arch-main-street .ms-post-msg{padding-right:84px}
      .arch-main-street .ms-post-mark{right:24px;top:40px;width:52px;height:52px}
      .arch-main-street .ms-post-mark::after{display:none}
    }
    /* Phones: the album page runs one piece at a time, each a little off-center the other way. */
    @media(max-width:560px){
      .arch-main-street .ms-bill-arch[data-length="l"],.arch-main-street .ms-bill-arch[data-length="xl"]{display:none}
      .arch-main-street .ms-bill-kicker[data-length="l"],.arch-main-street .ms-bill-kicker[data-length="xl"]{display:block;white-space:normal;padding:4px 40px 0}
      .arch-main-street .ms-scrap-page{grid-template-columns:1fr;gap:34px}
      .arch-main-street .ms-scrap-page > .ms-scrap-item:nth-child(n){width:86%;margin-top:0;justify-self:start}
      .arch-main-street .ms-scrap-page > .ms-scrap-item:nth-child(even){justify-self:end}
    }
    @media(prefers-reduced-motion:reduce){
      .arch-main-street .ms-scrap-link,.arch-main-street .ms-drawer-peek .archetype-photo,.arch-main-street .ms-tag{transition:none}
    }
`;
