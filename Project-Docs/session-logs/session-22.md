## Session 22 (2026-06-02) — the Gallery: first true maker-shop archetype, built + rendering; products as DB rows into containers; try-on, branding, niche/mood, and moment-portability all locked

This session executed the Session-21 directive: build a TRUE maker-shop archetype — browsable inventory front and center, commerce prominent, story as supporting material. The result is the **Gallery**, and it landed. Alex, mid-session: "THIS IS DIFFERENT. THIS IS UNIQUE. What I have been looking for all along."

### How we got there
Co-worked with Gemini (Alex relaying). Gemini proposed a 4-archetype launch matrix (Broadsheet, Atelier, Blueprint, Lookbook). We took the *shape* of that advice (a lean ~4-archetype catalog) but rejected two parts: the Broadsheet as a store (we already found it's a publication, buries inventory — keep it for publication-first niches only), and the build-all-four sequence (build ONE, prove it, then replicate — per our own build-the-pattern rule). Picked the image-forward gallery as the first to build. Renamed it from Gemini's "Atelier" to the plain **Gallery** (jargon-kill, matches the plain-English rule). Used the brainstorming skill's VISUAL COMPANION (browser mockups) to compare three compositions (curated grid / salon wall / showcase scroll) and three openings (masthead / side-rail / woven) with Alex before writing any code. He chose the dense salon wall.

### What shipped (all committed, branch `session-12/layout-engine`)
- `lib/archetypes/content.ts` — the SHARED catalog core: `ProductView`, `CatalogMedia` (image|video), `CatalogVariation`. Mirrors the real `listings` + `variation_*` tables. This is archetype-agnostic on purpose — it's what makes try-on possible. Archetypes must NOT invent bespoke product shapes; they read this.
- `lib/archetypes/gallery/schemas.ts` — niche-neutral content schema with MAX-length caps on every field (the Session-21 lesson). Collections is a titled section (eyebrow + items). Body cap 480.
- `lib/archetypes/gallery/themes.ts` — four curated themes (bone / slate / ink / linen), a shared Fraunces + Archivo + DM-Mono pairing, and the per-theme unifying photo GRADE (the trick that harmonizes mismatched photos into one set).
- `lib/archetypes/gallery/shared.tsx` — factored chrome + helpers: `GalleryRoot` (fonts + compiled CSS + staged main), `GalleryHeader` (home masthead + compact inner-page variants), `GalleryFooter` (maker columns + the guaranteed legal row), `typeRoleCss`, `rootCss`, `fontHrefForTheme`, `TILE_ASPECTS`, `GalleryRoles`. One source of truth so home and product can't drift.
- `lib/archetypes/gallery/Gallery.tsx` — home renderer (the six regions).
- `lib/archetypes/gallery/GalleryProduct.tsx` — product page renderer: reads a `ProductView` row, media gallery (incl. a video tile), seller variations, add-to-cart, full description.
- `lib/archetypes/gallery/index.ts` — bundled `galleryArchetype` + exports.
- `scripts/test-gallery-archetype.ts` — Bohdi harness (jewelry / ELEGANT / "Quill & Stone"). Improved char-count guidance.
- `app/archetype-test/gallery/page.tsx` + `app/archetype-test/gallery/product/page.tsx` — render routes. PREVIEW-ONLY stand-in image injection lives in the routes, NOT the archetype.
- `app/archetype-test/gallery-fixture.json` (Bohdi's authored home, ran twice — latest is the `gallery-ink` theme, "Shop by material" collections) + `app/archetype-test/gallery-product-fixture.json` (a labradorite-ring row: 4 media incl. video, 2 variations).
- Verified: typecheck clean, home + product routes both 200, markers present.

### The six regions (the Gallery composition)
identity → wall (centerpiece, dense masonry, price chips) → collections (its own full-bleed contrasting band + an authored eyebrow, category-card caption bars) → maker (the palette INVERTED into a dark story+face band, REQUIRED — the authority point) → markets (optional) → footer (maker columns + a platform-GUARANTEED Home/Privacy/Terms legal row). Openings (masthead/side-rail/woven) are chosen by Bohdi/us via niche+mood, NOT the maker; only the masthead opening is built for v1.

### Decisions locked this session
1. **Products + descriptions are DB ROWS poured into archetype CONTAINERS.** The archetype never authors the catalog. The shared `ProductView` shape (one place, mirrors listings+variations) is what lets the same product render in any archetype — the try-on foundation. Multi-image + video supported.
2. **Try-on.** Makers switch archetypes from the editor; safe by construction because every shape is finished. Content, branding, and the moment preference all live in a SHARED PORTABLE layer; each archetype re-expresses them. Design archetype schemas around the shared core so switching is one click, not a re-author.
3. **Branding split.** Name / logo / voice / story are the maker's and portable. Brand color enters ONLY as theme-selector + accent — never the background/text contrast pair. NO arbitrary brand fonts (deliberate trade for the designed-look guarantee). Photos harmonized by the grade. Vision later suggests theme/accent from real photos. (Add the logo slot + brand-color→accent when building real.)
4. **Niche + mood.** niche+mood SELECTS the archetype; mood PICKS the theme within it; niche INFORMS content (voice, products, variations). The niche schema's old design-direction/token-boundary role DISSOLVES into the archetype — the niche schema now governs voice + fields only.
5. **Catalog size is a third selection input.** Few-product niches must NOT be matched to the Gallery (sparse wall). 
6. **Moments intro is NOT for the Gallery** (it carries its own punch). The intro belongs in front of the SIMPLE/typical build, MELDING into the hero (not a gate). The moment is a PORTABLE layer, not welded to one archetype — carry the intent across try-on, each archetype re-expresses the form. Video: low-res during build + enhance after; a reusable video/image LIBRARY (bank every generation, reuse or generate fresh).
7. **Section toggles.** Optional sections (collections, markets) can be turned off / drop when no data. The wall and the maker story CANNOT be hidden (authority principle).
8. **Naming + sequencing.** Plain names over designer jargon ("Gallery" not "Atelier"). Build one archetype, prove it, then grow the lean ~4-archetype catalog.

### The no-hardcode discipline (held this time)
The renderer owns ONLY structure (grid, column counts, tile-aspect rhythm, spacing). Every color is the palette or a derivation: the maker band is the palette's own pair inverted; footer surface, muted-on-dark text, and the collections band are color-mixes of palette colors; price chips are the palette's own pair so they read on any photo; the photo grade + accent tint are archetype-owned atmosphere. Every type value is a named role. Alex explicitly verified the discipline ("did you fix the page or the archetype" — the collections fix went into the ARCHETYPE, not the test route).

### Findings
- **Bohdi miscounts characters badly.** First run burned 5 turns fighting a 420-char body cap. Fixed by telling him plainly he's bad at counting and to stay comfortably under, and bumping the cap to 480 — second run validated on turn 1. Apply this guidance pattern to every archetype harness.
- **Theme pick is stochastic.** bone first run, ink second, identical brief. Mood must drive the theme pick DETERMINISTICALLY in the real engine, not leave it to Bohdi's coin flip.
- **The Gallery is the most image-hungry archetype.** A dense wall is 12-24+ images. At onboarding, fill it from STOCK (Unsplash, per the image strategy), reserve generation for hero/atmosphere, and have the maker swap in their real photos afterward. Image SELECTION (stock / library / uploads) over always-generating is the cost lever. There is no image picker yet — current images are stand-ins injected by the test route.

### Next session — start here
1. **Engine integration** (the big one the Session-21 brief flagged as still open). Archetype SELECTION from niche + mood + catalog-size; deterministic mood→theme; wire the wall to read CATALOG ROWS instead of Bohdi stand-ins; onboarding picks an archetype; storefront resolver renders archetype + content.
2. **Companion pages** in the Gallery's language: shop/catalog, about, cart/checkout (product page done as the first).
3. **Image picker + stock pipeline** — the cost answer and the selection capability, in onboarding + the dashboard editor.
4. **Fold the multi-page set into the Archetype contract** — product page is a sibling renderer for now; the contract (`types.ts`) still has a single `render`. Generalize once the page set is proven.
5. **The other two openings** (side-rail, woven) as selection variants once the masthead shape is solid.
6. **Parked design tracks** (not blocking): the portable moment layer in front of the Simple build + the video/image library; the try-on switcher UI; reconcile the niche-schema-design-role-dissolves decision into the Master Spec / decisions log.

Branch: `session-12/layout-engine`.

---

