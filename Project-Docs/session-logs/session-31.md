## Session 31 (2026-06-06) — Finished Main Street: deleted Gallery, rebuilt the content engine, restructured the home, and built the full multi-page storefront

**The arc:** the brief was "finish and complete Main Street." Brainstormed scope with Alex, wrote one design spec for the whole effort, then built it in phases — all committed + pushed on `session-12/layout-engine`, 956 tests green throughout.

### Phase 1 — Gallery deleted
- Removed `lib/archetypes/gallery/`, its registry entry, the build-specs/handoff Gallery tests, the `app/archetype-test/gallery/*` routes + fixtures, and `scripts/test-gallery-archetype.ts`. De-Gallery'd comments in `builder.ts`/`build-archetype-store.ts`. `ARCHETYPE_SPECS` now holds only Main Street (a `registry.test.ts` enforces it).
- Fixed a stale assertion (`looks.length` 7→29, the deep shelf).
- `scripts/retire-gallery-stores.mjs` unpublished the two stale published Gallery tenants (set `content_pages.status='draft'`) so the deleted-archetype path 404s cleanly. The render path already `notFound()`s on an unknown archetype, so nothing crashed.

### Phase 2 — content engine (the prize)
- **Full niche body into authoring.** `authoringSpec(brief)` now embeds `brief.nicheBody` (12k cap) with a "MINE IT — name real materials/techniques/products, sound like THIS niche" instruction. (Was: 1600-char slice in the menu prompt only; authoring re-fed nothing.)
- **Wider slots + story arc + voice.** Product `description` 300→600; the moment story must tell ONE arc across its ≤4 lines; the VOICE block demands concrete niche-specific detail and "rewrite any line that could appear on any shop."
- **Deepen pass.** `authorStore` runs one extra instructed turn after the first valid draft (re-read vs the niche file + a quality bar, rewrite weak parts, resubmit). Falls back to the first valid draft → can't fail a good build. Tested with a mocked Anthropic client.
- **Image rules.** `lib/onboarding/image-directives.ts` (`withImageDirectives`) appends a photorealism directive to every image prompt and, for person images, a gender phrase from the existing `inferGenderFromName`/`personPhrase`. `MediaJob` gained `subjectIsPerson` (Main Street sets it on the portrait; hero/products false). Engine applies via `prepareJobPrompt`.

### Phase 3a — home restructure (About/calendar split)
- `founder.treatment` added to the schema (Bohdi pick, like goods) + optional `eyebrow`/`heading` for the card. Four MAKER-ONLY treatments: quote / portrait / letter / **card** (the "Meet June" look). `FounderFindUs` (calendar-led) deleted; the calendar pulled out of every founder treatment.
- `selectFounderTreatment` drops the `findUsRows` input entirely (unknown at onboarding) — Bohdi's pick wins, else mood (intimate→card, cinematic→portrait, else quote).
- New `FindUsBeat` renders the calendar as its own home section (base surface, shown only when `findUs.rows.length>0`, links to /events). `FindUsList` exported from `FounderBeats` with an `onContrast` flag so it reads on either surface.

### Phase 3b — the full multi-page storefront (built straight off the spec, no plan doc)
- `render` is page-aware; `ArchetypeBuildSpec` gained `renderProduct` / `renderContentPage` (body paragraphs OR pre-rendered HTML for legal) / `renderShell` (wrap a bespoke body in the chrome).
- `pages.tsx`: the shared sub-page shell (`MainStreetSubPage` = root + solid nav header with real routes + footer) and ShopPage / AboutPage / EventsPage / ContactPage / ContentPage.
- Schema grew optional `about` (heading + 2-5 story paragraphs — the full story behind the home teaser) and `contact` (heading + intro); both Bohdi-authored.
- **Routing:** `StorefrontPage` maps `/shop /events /about /contact` to archetype pages off the tenant's home `/` envelope (`loadHomeArchetypeEnvelope`); the live `/listings/[slug]` renders `MainStreetProduct`; `LegalPage` renders the legal HTML in MS chrome; cart / collections (index + `[slug]`) / subscriptions reskinned via `renderShell`. All have a legacy fallback for non-archetype tenants.

### What's left / next
- **Alex runs a fresh onboarding** (strong-vocabulary niche) and walks the whole site — the only way to judge content richness. Tune the deepen pass / prompts from what he sees.
- **Real checkout** (line items + payment) is unbuilt platform-wide — the commerce build. The cart page is an empty-state stub in MS chrome.
- Optional: a fuller cart-with-items view; the generic content-page template is built + wired (`renderContentPage`) but no live maker-added-page route exists yet (makers add pages post-onboarding).

### Process notes
- Alex stopped me writing a plan DOC per phase (one spec covered it) — built 3b directly off the spec. And he stopped me drawing scope lines to defer the commerce/edge pages ("why do you keep skipping things — I want this FINISHED"); reskinned cart/collections/subscriptions into MS chrome after. Lesson reinforced: don't narrow scope, finish the whole thing.

---

