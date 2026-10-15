# Session 105 — 2026-10-15

**The design lineup was reset; every family can now sell; one builder builds any new site; a seventh family, Vintage, is underway.** Nothing new is live: all code waits on unmerged branches for "one big push later" (Alex). Docs are on `main`.

## The lineup (decided, in `Modular-Plan.md` "The lineup")
- **Makers first.** Contractors come back later as their own marketing leg (they need leads/marketing, a crowded field). bohdiai.com stops selling to contractors. Only **Cut-Pro and Mazzone** stay, as custom sites, with homes for exactly what they show ("I ONLY care about the sites we have right now fitting"; "if we need to customize them later we deal with it").
- **A standard site = family (layout) + skin (colors, fonts and background).** Handmade touches (lace, frames) are custom-site only ("most makers don't give a hoot about lace; they want their site to sell"). Family names needn't be moods.
- **Families:** the six + **Scenic** (from Shoreline: photo behind, content floating; on Scenic the maker picks the photo from the scene library or provides their own) + **Spotlight** (from Showreel). More are added as BohdiAI grows; a good custom shape can become a family. **Vintage** started today (below).
- **Custom sites:** Rose n' Cat (nursery stays hers), Cut-Pro, Mazzone. **Going away:** old family samples, Halfmoon, True Coat, Ember & Pine + Torch, contractor selling on bohdiai.com; Rustic Rhody moves to a family (then Bulletin goes). **The demo** shows capabilities, not a look: Saltmarsh stays.
- **The plans:** Showcase never has a shop page or prices (and will display 12 pieces from a full catalog, no prices: item 23); Market shows prices + "Ask about this", and the market app takes payments at markets; Full adds the cart, the only way to buy online.
- Dropped the made-up "4.9 out of 5, 180+ customers" reviews line. bohdiai.com gets new sample sites before the old samples are deleted.

## Built (all on branches, pushed, NOT merged)
- **`feat/spotlight-trial`** (from main): Showreel home two to a row, quieter text, shop + piece pages when the catalog is on. Alex likes it "ok", isn't into very large product photos (three to a row only if people complain). Test copy `paper-and-patina-trial` (draft).
- **`feat/family-plans`** (from main): every family follows the plans. Full: working Add to cart (it was a dead button), family cart page with the shared order form (`lib/storefront/OrderRequestForm.tsx`, moved from shoreline), codes, sums, running sales on lists/piece page/cart, the menu's cart shows its count ("Cart (2)"). Market page (QR) in the family look on Market/Full. Showcase: no shop/collections/piece/cart pages, no prices, pieces + collections hidden. Only the cart switch sells online (absent no longer means selling). Buttons no longer clipped by the menu's one-line cap. Saltmarsh's piece page now shows sale prices. Cart + market words loaded on all 40 family sites. Test copy `aurora-candles-homes` has its market page on.
- **`feat/one-builder`** (stacked on family-plans): `scripts/build-site.ts <site | path.ts> --media <dir> [--live] [--dry]` + `lib/build/site-plan.ts` (pure check of the whole content file; nothing written unless all of it is right; every word the design shows required, none unknown). New sites only (refuses a taken subdomain). `scripts/site-words.ts dump <site> <prefix> [shop]` starts a new site's words. Proof: `aurora-built` (draft) rebuilt from an exported content file matches `aurora-candles-homes` word for word on every page.
- **`feat/vintage-family`** (stacked on one-builder): the seventh family.

## Vintage (in progress, Alex not yet satisfied)
- Inspired by decoupage (Victorian). First pass (remix of existing styles + Parlor skin) "looks just like any other family". Second pass (scrapbook album: trade card, photo corners, cabinet card, drawers, tickets, postcards) better but "what makes it vintage?". Alex's references (apothecary tags, a music-hall playbill, Victorian labels/lettering, a Pinterest board of Victorian website backgrounds: mottled parchment, filigree borders, damask) drove the third pass:
  - opening = **playbill** (`PlaybillHero.tsx`): line on an arc (flat on phones when long), oval photo medallion, woodtype name with printed shadow, ribbon banner, rosette rule, double border with scrolled corners;
  - pieces = **apothecary tags** (`GoodsTags.tsx`): notched die-cut, eyelet, framed photo printed onto the paper (multiply), ornate label;
  - about = cabinet card; collections = specimen drawers (photo now shown whole, no hover reveal); markets = ticket stubs; reviews = postcards (`VintagePieces.tsx`); also `GoodsScrapbook.tsx` kept as a style; ornaments in `Ornament.tsx`; styles in `vintage-styles.ts`;
  - skins: **Playbill** (default: kraft, brown-black, oxblood, Rye), **Apothecary** (parchment, deep green, red, Ultra), Parlor (pre-references; may not fit), plus Heirloom, Postmark, Curiosity;
  - background: mottled aged parchment, multiplied onto the skin's paper, scrolling and seamless (`public/textures/wp-ephemera.png`, made by `tmp/make-damask.mjs`), screen edges darkened, a filigree band above each section. Fake handwriting read as "scribble"; real old writing was liked as an idea ("not scribbles") but the paper-scrap collage and damask motif were dropped.
- Alex's last word: "better", then "I think you just can't build what I imagine". Claude's honest read: the structure holds; the art is thin because it's drawn in code. **Next: build Vintage from real art** (old paper scans, engraved frames, labels, borders): Alex's own decoupage papers if he has them, else copyright-free Victorian scans for him to pick from. Asked, not answered.
- Test site `vintage-test` (draft): Saltmarsh's pieces built with the one builder; Lena's quote and the Playbill skin set by hand. Preview code via `tmp/codes.ts vintage-test`.
- Fixes found on the way (in the vintage branch): long marquee phrases no longer overlap (heading width cap), the closing line's eyebrow is centered.

## Decisions / feedback (memory updated)
- Not every site needs polish (Rustic Rhody, Saltmarsh fine); no editing-screen talk unless Alex raises it.
- Don't raise what's needed from Renee. Renee accepted her invite (signed in 2026-10-08).
- Rules serve the work: don't argue rule wording; update docs to match decisions.
- Code-drawn Victorian art reads thin; use real art assets for ornament-heavy looks.

## Lessons
- Ask what a vague word means before building ("vintage": a look or a seller type? Alex: both).
- Show, don't describe, and look yourself first: Playwright full-page shots (`tmp/shot.mjs`, reveals forced on) caught the hidden sections, overlaps and phone breakage before Alex did. Fixed-position layers only paint the first screen in full-page shots.
- CRLF files: line-ending-aware edit scripts, or the Edit tool. Heredocs with quotes still break: write scripts to files.
- `getSiteFeatures` (cached) for features in family renders; family words for new spots must be loaded on every family site (`scripts/site-words.ts load main-street family <json>`).

## Still open (next session)
- Vintage from real art (Alex's answer pending).
- Merge plan: the big push (spotlight-trial, family-plans → one-builder → vintage-family), then Scenic + Spotlight as families, prove it, new bohdiai.com samples, clean up.
- Test sites to delete at clean-up: `paper-and-patina-trial`, `aurora-built`, `vintage-test` (+ `aurora-candles-homes`).
