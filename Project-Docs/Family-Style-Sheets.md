# Family Style Sheets — the look spec for the six families

**Date:** 2026-06-24 (Session 52) · **Status:** designed and mocked up; not yet built into the engine. This is the single source of truth for what each family looks like.

This sits under `Family-Layout-Model.md` (which says *how* families work — stacked layout, modular sections). This doc says *what each family looks like* — its colors, textures, wallpapers, fonts, and imagery grade.

---

## The model in one paragraph

There are **six mood families**: Cozy, Rustic, Dark, Luxury/Elegant, Playful, Modern/Minimalist. Each is defined by a **style sheet** with five parts: color combinations, textures, wallpapers, fonts, and imagery grade. The stacked layout never changes (per `Family-Layout-Model.md`); families differ by their section variants + order AND by this look/feel. A maker picks a family; the engine builds with that family's **defaults** and the editor lets them swap to any option within the family.

## Hard rules (settled this session)

1. **Every font is unique to one family.** No face appears in two families — 72 faces total, 12 per family. The editor lets makers choose any font anyway, so there's no reason to share. (Alex: "there are millions of fonts.")
2. **Defaults are chosen on merit, not by list position** — the option that best represents the family *and* is most distinct from the other families. Each is marked with a ★ in the style sheet.
3. **Fonts are grouped two ways:** the full bench listed **by role** (Headers / Body / Labels / Accent — 3 each), AND **packages** (header + body + label + accent paired to work together — 3 per family). The default package's faces are the per-role defaults.
4. **No serif drift, no safe/lazy picks.** Serif only where it earns it (Cozy warm serifs, Dark/Luxury dramatic serifs); push robust + distinctive faces, not the over-used defaults (this is why Rustic's default moved off Bebas Neue → Alfa Slab One). See `feedback_serif_drift_and_generic` memory.
5. **Imagery filters are dynamic, not fixed.** Image *creation* stays free; the engine normalizes each image (exposure + white balance) then applies the family grade to *that* image, so the look lands on any photo. Fixed CSS filter values tuned to one photo do NOT generalize. (See `Family-Layout-Model.md` build-requirement note.)
6. **Imagery feeling comes from staging, not only grade.** A grade shifts color/era; it cannot restage a cozy windowsill into a workshop. Setting-driven looks need a family-appropriate **staged** library shot (same product, different scene — a pick, not a per-maker generation). Texture-blend (burlap/kraft INTO the photo) does push the *material feel* a real distance — proven this session.

---

## The six families (defaults marked ★; full bench listed)

Content used in every mockup is identical (the same candle shop "Marlow Candle Co.") so only the look changes.

### Cozy — warm, hand-made, intimate; the candlelit morning
- **Default hero:** Story · **Color ★:** Cream & Ember (`#F4EAD7` / `#2B1A12` / `#7A6249` / `#C8431B`) · **Texture ★:** Linen · **Wallpaper ★:** Cream linen · **Imagery ★:** Soft & warm
- **Headers:** Fraunces ★ · Hedvig Letters Serif · Yeseva One
- **Body:** Newsreader ★ · Mulish · Crimson Pro
- **Labels:** IBM Plex Mono ★ · Sometype Mono · Courier Prime
- **Accent/script:** Pinyon Script ★ · Caveat · Dancing Script
- **Default package — The Journal:** Fraunces / Newsreader / IBM Plex Mono / Pinyon Script

### Rustic — hand-built, weathered, honest; the market stall & woodshop
- **Default hero:** Stacked · **Color ★:** Barnwood & Rust (`#2E2114` / `#E6D8BE` / `#9C8A6C` / `#B5491F`) · **Texture ★:** Burlap · **Wallpaper ★:** Walnut planks · **Imagery ★:** Burlap blend
- **Headers:** Alfa Slab One ★ · Bebas Neue · Ultra
- **Body:** Bitter ★ · Work Sans · Domine
- **Labels:** Cutive Mono ★ · Special Elite · Saira Stencil One
- **Accent/hand:** Permanent Marker ★ · Rye · Rock Salt
- **Default package — The Woodshop:** Alfa Slab One / Bitter / Cutive Mono / Permanent Marker
- *(Note: default moved off Bebas Neue this session — too over-used / "safe".)*

### Dark — low light, deep shadow, moody, a little mysterious
- **Default hero:** Floating card *(open — Alex not fully sold; easy to swap)* · **Color ★:** Ink & Ember (`#14100C` / `#E8DCC8` / `#9A8A72` / `#C9772F`) · **Texture ★:** Smoke · **Wallpaper ★:** Dark smoke · **Imagery ★:** Ember glow
- **Headers:** Gloock ★ · Prata · Eczar
- **Body:** Spectral ★ · Cardo · EB Garamond
- **Labels:** Syne ★ · Martian Mono · Fragment Mono
- **Accent/gothic:** Cinzel ★ · UnifrakturCook · IM Fell English
- **Default package — The Apothecary:** Gloock / Spectral / Syne / Cinzel

### Luxury / Elegant — refined, from restrained to opulent; type + gold + air
- **Default hero:** Typographic · **Color ★:** Ivory & Gold (`#F4F1EB` / `#1A1714` / `#8A8270` / `#9C7B3A`) · **Texture ★:** Marble · **Wallpaper ★:** White marble · **Imagery ★:** Clean & bright
- **Headers:** Playfair Display ★ · DM Serif Display · Rozha One
- **Body:** Cormorant Garamond ★ · Jost · Sorts Mill Goudy
- **Labels:** Tenor Sans ★ · Marcellus · Outfit
- **Accent/ornate:** Cinzel Decorative ★ · Italiana · Tangerine
- **Default package — The Maison:** Playfair Display / Cormorant Garamond / Tenor Sans / Cinzel Decorative
- *(Note: Bodoni Moda rejected — didone hairlines drop out on screen, same reason it failed for the Studio skin. Playfair is the robust luxe replacement.)*

### Playful — bright, lifted, full of color; the store that smiles back
- **Default hero:** Collage · **Color ★:** Confetti (`#FCEFD6` / `#20223A` / `#FB4D3D` + `#6C4AB6`) · **Texture ★:** Confetti · **Wallpaper ★:** Paper cut-outs · **Imagery ★:** On a color card
- **Headers:** Fredoka ★ · Baloo 2 · Unbounded
- **Body:** Nunito ★ · Figtree · Poppins
- **Labels:** DM Mono ★ · Spline Sans Mono · Overpass Mono
- **Accent/hand:** Lilita One ★ · Chango · Gloria Hallelujah
- **Default package — Confetti:** Fredoka / Nunito / DM Mono / Lilita One
- *(Playful palettes carry TWO accents in play — single-accent reads too tame.)*

### Modern / Minimalist — clean, bare, structural; minimal → industrial
- **Default hero:** Split · **Color ★:** Paper & Ink (`#FAFAF8` / `#111110` / `#7D7D78` / `#E5341B`) · **Texture ★:** Concrete · **Wallpaper ★:** Concrete · **Imagery ★:** Clean & cool
- **Headers:** Archivo ★ · Familjen Grotesk · Space Grotesk
- **Body:** Manrope ★ · Hanken Grotesk · IBM Plex Sans
- **Labels:** JetBrains Mono ★ · Fira Code · Red Hat Mono
- **Accent/industrial:** Saira Condensed ★ · Bricolage Grotesque · Anton
- **Default package — The Grid:** Archivo / Manrope / JetBrains Mono / Saira Condensed

---

## Section defaults (the matrix)

Per family, the default for each section. **Hero, Goods, Collections, Reviews, About, Nav, and Marquee** are designed/built; the rest are blank until we design them. Full matrix: `tmp/mockups/defaults-matrix.html`. Sections still to design: Map/Find-us, Footer, CTA, Contact, FAQ (most double up or are shared — the utility sections stay one shared shape wearing the family's paint, not a per-family shape).

The eight goods treatments are all BUILT (`lib/archetypes/main-street/`): marquee, procession (the Constellation), switcher, slideshow, module, table, index, lookbook. There is **no family→default-goods wiring in code yet** — that arrives with the family layer; this column is the recorded decision the wiring will read.

| Family | Default hero | Default goods | Default collections | Default reviews |
|---|---|---|---|---|
| Cozy | Story | Constellation *(procession)* | Cupboard *(labeled shelves)* | Guestbook *(pinned notes)* |
| Rustic | Stacked | Marquee | Crates *(stacked wood crates)* | Guestbook *(pinned notes)* |
| Dark | Floating card *(open)* | Slideshow | Portals *(lit doorways from shadow)* | Pull-Quote *(one big voice)* |
| Luxury / Elegant | Typographic | Switcher *(provisional — Index & Lookbook both fit Luxury; revisit)* | Chapters *(couture lookbook)* | Pull-Quote *(one big voice)* |
| Playful *(= Cheerful mood)* | Collage | **Table** *(locked)* | Color lanes *(full-width candy bands)* | Texts *(message bubbles)* |
| Modern / Minimalist | Split | Module | Cascade *(diagonal of overlapping covers)* | Rating *(big star hero)* |

**Collections notes.** Six bands, one unique *shape* per family (designed + approved off `tmp/mockups/collections-bands-v1.html`): **Cupboard** (Cozy — labeled shelves), **Crates** (Rustic — stacked wood crates), **Portals** (Dark — lit doorways from shadow), **Chapters** (Luxury — couture lookbook, roman numerals), **Color lanes** (Cheerful — full-width candy bands), **Cascade** (Modern — a diagonal of overlapping covers). Each is a home-page *teaser* (2–3 collection covers + name) pointing at the Collections page; the band wears the family's own fonts/imagery, so the mockup's fonts are stand-ins. The shapes are deliberately non-overlapping with each other AND with the eight goods treatments (collections read as *groups you enter*, not products on display). Building into the engine now; no family→default-Collections wiring in code yet (arrives with the family layer, same as goods/About/Nav).

**Reviews notes (BUILT).** Unlike the six-shape Collections band, Reviews is a **shared pool of four treatments** (like the four nav registers) — a store wears one, families double up. The four (all built skin-agnostic + class-only in `lib/archetypes/main-street/`, designed off `tmp/mockups/reviews-treatments-v1.html`): **Rating** (one enormous star rating is the hero, a strip of pulled quotes underneath — Alex's "stars are the emphasis" call), **Pull-Quote** (one big editorial voice at a time, cycling), **Guestbook** (testimonials as pinned paper slips, hand-placed and rotated), **Texts** (the real messages customers sent, as chat bubbles). Per-family defaults: **Cozy + Rustic → Guestbook**, **Dark + Luxury → Pull-Quote**, **Cheerful → Texts**, **Modern → Rating**. At launch these are **seller-curated testimonials** the copywriter seeds every build (onboarding-complete, like the find-us dates D38 — plausible, maker-editable, NOT labeled "sample"); verified-purchase reviews stay Phase 2. The home shows a handful; the pool grows to a full page + a nav link as a maker accumulates them. Previewable via **`?reviews=<treatment>`** (seeds sample testimonials when a store has none). No family→default-Reviews wiring in code yet — the copywriter authors CONTENT only and the treatment stays the dispatcher default (rating) until the family layer wires the per-family pick above.

**Goods notes.** Cheerful's default is the **Table** — the warm, tactile, abundant body; it replaced the Carousel, which was dropped for rhyming with the Marquee (two card rows are one idea, not two). The **Index** (type-led) and **Lookbook** (alternating spreads) are new bodies that lean elegant/editorial; they're in the shelf for any family but aren't anyone's locked default yet — the Luxury default may move to one of them. The Table's honest gap: its final form wants staged, cut-out product imagery; today each product photo reads as a print laid on the surface.

**Marquee notes (BUILT — Session 59).** Unlike the six-shape Collections band, the Marquee is **one shape for every family** — a loud full-width band of big display type on the skin's own accent, so it's rust-on-barnwood for Rustic and red-candy for Cheerful with no per-family code. **Two lines** (from the original mockup): a bright **voice** line over a dim, reverse-scrolling **info** line. The voice is authored by the copywriter at build time (`content.marquee.voice` — a few brand phrases; legacy stores derive it from other authored copy); the info line **assembles from the store's live data** (find-us dates + collection names) so it's never hardcoded and updates itself. Built skin-agnostic + class-only (`MarqueeBeat`, CSS in `skinVarsCss` under `.ms-mq-*`, reduced-motion static); previewable via **`?marquee=`** (a pure on/off toggle — content comes from the real store). What *varies* per family is not the shape but the **stack POSITION and on/off** — loud-and-high for Cheerful/Rustic, a mid-stack divider for Modern, off-by-default for Cozy/Dark/Luxury. Those per-family stack orders are **proposed, not locked** (`tmp/mockups/family-stacks-v2.html`) and get wired with the family layer; the maker adding their own marquee content is a later editor feature on top of this.

---

## Mockup artifacts (all in `tmp/mockups/`)

- `cozy-stylesheet.html`, `rustic-stylesheet.html`, `dark-stylesheet.html`, `luxury-stylesheet.html`, `playful-stylesheet.html`, `modern-stylesheet.html` — the six style sheets (color / textures / wallpapers / fonts-by-role + packages / imagery), defaults ★.
- `type-packages.html` — all 18 packages on one page.
- `defaults-matrix.html` — the family × (sections + style defaults) matrix.
- `reviews-treatments-v1.html` — the four reviews/testimonials treatments (Rating / Pull-Quote / Guestbook / Texts), each shown in a different family's paint to prove the shared shapes wear any skin.
- `families-heroes.html` — all six default heroes on one scroll page, built from the defaults.
- `filter-test.html` — proof that texture-blend can push the same shot rustic.
- `img/` — generated source images: `hero.png` (the shared neutral candle base), `collage-*.png`, and the per-family wallpapers (`wp-*.png`). Generated via Higgsfield (recraft-v4-1).

## How it maps to the engine (build feasibility)

- **Skins → families.** `lib/archetypes/main-street/skins.ts` already injects per-tenant CSS variables and the renderer names no font/color. A family is a richer skin: a palette set + a font *package* (the per-role faces) + a texture/wallpaper + a grade rule.
- **Fonts** are all Google Fonts — loadable per family via the existing font-href pattern (`MAIN_STREET_FONT_HREFS`).
- **Dynamic grade** is the one genuinely new pipeline piece: read image → normalize exposure/WB → apply the family's grade. Library shots pre-normalized; uploads normalized on the way in.
- **Sections** become the modular recipe + catalog already planned in `Family-Layout-Model.md`.
- **Wallpapers/staged imagery** come from the tagged image library (also in `Family-Layout-Model.md`).
