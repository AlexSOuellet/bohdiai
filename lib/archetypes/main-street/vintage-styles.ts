/**
 * Main Street — the stylesheet for the scrapbook pieces (the Vintage family's
 * own section styles, Alex 2026-10-15): the trade card, the scrapbook page, the
 * cabinet card, the specimen drawers, the ticket stubs and the postcards. Joined
 * into chrome's stylesheet. Colors are the skin's vars only, so any skin prints
 * them; sizes and turns are nth-child rules, never inline.
 */
export const VINTAGE_CSS = `
    /* ── TRADE CARD — the opening ─────────────────────────────────────────── */
    .arch-main-street .ms-trade-hero{position:relative;padding-bottom:var(--ms-section);color:var(--ms-fg)}
    .arch-main-street .ms-trade-nav{display:flex;align-items:center;justify-content:space-between;padding:14px 40px;color:var(--ms-fg)}
    .arch-main-street .ms-trade-stage{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr);gap:clamp(28px,5vw,80px);align-items:center;padding-top:clamp(24px,5vw,64px)}
    .arch-main-street .ms-trade-stage[data-photo="false"]{grid-template-columns:minmax(0,760px);justify-content:center}
    .arch-main-street .ms-trade-card{position:relative;text-align:center;color:var(--ms-fg);background:color-mix(in srgb,var(--ms-bg) 78%,#fff);border:2px solid var(--ms-fg);outline:1px solid var(--ms-fg);outline-offset:-12px;padding:clamp(48px,7vw,88px) clamp(32px,5vw,72px);box-shadow:0 26px 44px -30px rgba(40,22,12,.6)}
    .arch-main-street .ms-trade-corner{position:absolute;width:clamp(40px,5vw,60px);height:auto;color:var(--ms-accent)}
    .arch-main-street .ms-trade-corner--tl{top:18px;left:18px}
    .arch-main-street .ms-trade-corner--tr{top:18px;right:18px;transform:scaleX(-1)}
    .arch-main-street .ms-trade-corner--bl{bottom:18px;left:18px;transform:scaleY(-1)}
    .arch-main-street .ms-trade-corner--br{bottom:18px;right:18px;transform:scale(-1,-1)}
    .arch-main-street .ms-trade-eyebrow{color:var(--ms-accent);margin-bottom:20px}
    .arch-main-street .ms-trade-brand{margin:0;color:var(--ms-fg);font-size:clamp(46px,7.2vw,112px);line-height:.95;text-wrap:balance}
    .arch-main-street .ms-trade-flourish{display:block;width:min(260px,72%);height:auto;margin:26px auto;color:var(--ms-accent)}
    .arch-main-street .ms-trade-sub{color:var(--ms-fg-muted);max-width:36ch;margin:0 auto 30px}
    .arch-main-street .ms-trade-actions{display:flex;gap:18px;justify-content:center;align-items:center;flex-wrap:wrap}
    .arch-main-street .ms-trade-cta{background:var(--ms-accent);color:var(--ms-on-accent);padding:14px 28px;border-radius:2px;max-width:100%;white-space:normal}
    .arch-main-street .ms-trade-cta2{color:var(--ms-fg);border-bottom:1px solid currentColor;padding:6px 2px;max-width:100%;white-space:normal}
    /* The opening photo, pasted in as a die-cut scrap: a scalloped edge cut by the mask. */
    .arch-main-street .ms-trade-scrap{justify-self:center;width:min(100%,440px);padding:16px;background:color-mix(in srgb,var(--ms-bg) 55%,#fff);transform:rotate(3deg);
      -webkit-mask:radial-gradient(circle,#000 68%,#0000 70%) 0 0/20px 20px round,linear-gradient(#000 0 0) 10px 10px/calc(100% - 20px) calc(100% - 20px) no-repeat;
              mask:radial-gradient(circle,#000 68%,#0000 70%) 0 0/20px 20px round,linear-gradient(#000 0 0) 10px 10px/calc(100% - 20px) calc(100% - 20px) no-repeat}
    .arch-main-street .ms-trade-scrap .archetype-photo{display:block;width:100%;aspect-ratio:4/5;object-fit:cover}

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
    .arch-main-street .ms-drawer-peek{display:block;height:84px;overflow:hidden;transition:height .5s ease}
    .arch-main-street .ms-drawer-peek .archetype-photo{display:block;width:100%;height:200px;object-fit:cover}
    .arch-main-street .ms-drawer:hover .ms-drawer-peek,.arch-main-street .ms-drawer:focus-visible .ms-drawer-peek{height:180px}
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
      .arch-main-street .ms-trade-nav{padding-inline:20px}
      .arch-main-street .ms-trade-stage{grid-template-columns:1fr}
      .arch-main-street .ms-trade-scrap{width:min(78%,360px);order:-1}
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
      .arch-main-street .ms-scrap-page{grid-template-columns:1fr;gap:34px}
      .arch-main-street .ms-scrap-page > .ms-scrap-item:nth-child(n){width:86%;margin-top:0;justify-self:start}
      .arch-main-street .ms-scrap-page > .ms-scrap-item:nth-child(even){justify-self:end}
    }
    @media(prefers-reduced-motion:reduce){
      .arch-main-street .ms-scrap-link,.arch-main-street .ms-drawer-peek{transition:none}
    }
`;
