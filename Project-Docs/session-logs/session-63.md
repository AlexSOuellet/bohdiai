# Session 63 — 2026-07-04

## What we did

Almost the whole session was cleanup on the archetype code — inline-styles sweep across every Main Street component, hardcoded English fallbacks stripped, LINK_TARGETS extended, collections DB persistence built, build runner fire-and-forget fixed. All uncommitted. Then, late in the session, Alex called out that I'd lost the direction: I was cleaning the substrate when the actual gate for a runnable onboarding is wiring the **family layer** we've been designing for weeks.

**Nothing from this session is committed. Alex said: not starting the family wiring today; tomorrow.**

## What I did do (uncommitted)

- **All 16 Main Street components converted to class-only.** Zero inline style props with hardcoded values across every hero (Moment, Split, Stacked, Typographic, Floating card, Editorial cover, Collage), every goods treatment (Procession, Switcher, Slideshow — the other five were already class-only), the founder beats (Quote, Portrait, Letter, Card, Workbench, Editorial, Signature) plus the shared FounderBand + AboutCue + FindUsList, beats.tsx (GoodsHead, GoodsViewAllCta, GoodsMarquee, Close), MainStreetProduct, MainStreetContactForm, and chrome (logo lockup, footer, Media placeholder). Every declaration lives in `skinVarsCss` under `.ms-*` scoped classes. Dynamic per-instance values (Constellation scatter positions, active-slide opacity, per-scroll nav surface colors on MomentHero) pass as CSS custom properties or data attributes on wrappers, never as literal inline properties.
- **`DEFAULT_STRINGS` map** at `lib/archetypes/main-street/defaults.ts` — one place for empty-state copy (`emptyShop`, `emptyCollections`, `emptyReviews`, `emptyEvents`) plus product page and contact form labels. Every hardcoded English fallback in `pages.tsx` removed; the copywriter authors the values, and if a real build lands with them missing, that's now a copywriter bug not something the renderer papers over.
- **Preview seeds relocated** — `seedPreviewFindUs` moved from `findus.ts` into a preview-only fixture at `lib/archetypes/main-street/__fixtures__/preview-findus.ts` with a comment naming the Rhode Island venue names as illustrative preview content only.
- **`LINK_TARGETS` extended** with `collections` + `testimonials`; `LINK_HREFS` map updated so a nav item pointed at either target has a real route.
- **Reviews home band `viewAll` wired** on `MainStreet.tsx` — passes `viewAll={{ href: '/testimonials', label: content.reviews.viewAllLabel }}` when the copywriter authored a label; renders nothing when they didn't (no hardcoded fallback).
- **Collections DB persistence** — the archetype schema now supports `content.collections.items` (name / description / slug), the copywriter authors 3 niche-appropriate collections at build time, and `build-archetype-store.ts` has a new `persistCollections` function that inserts real `collections` DB rows and round-robin assigns each product a `primary_collection_id` so `/collections/[slug]` has content on the first live view. Errors are logged but never fail the build.
- **Build runner fire-and-forget fixed** — `app/api/onboarding/start/route.ts` used `void runBuild(...)` which is fine in dev but on Vercel prod can freeze after the response returns; wrapped with Next.js `after()` so the build survives past the request lifetime.
- **Copywriter prompt updates** — added collections authoring, `findUs.title`, `reviews.viewAllLabel`, expanded nav to 2-6 items with collections/testimonials as valid targets. **BUT preserved the D48 dice-roll model** for goods.treatment and founder.treatment — that's the stale mistake called out below.
- **All 1412 tests green** (+4 for persistCollections), tsc clean, lint clean (only pre-existing `<img>` warnings).

## The mistake — where I lost the direction

Alex's opening ask this session was "all pages fixed and ready for onboarding, NO hardcoding or inline styles, collections should be built like every other page." That was the surface. Underneath, the strategic direction for weeks has been the **family layer** — six families (Cozy / Rustic / Dark / Luxury / Cheerful / Modern) each carrying its own section stack, its own defaults for every section variant (hero / goods / collections / reviews / find-us / founder / nav / marquee position), its own type package, palette, textures, imagery grade. Bohdi authors CONTENT ONLY; the family picks section variants. The current model (`Family-Layout-Model.md`, `Family-Style-Sheets.md`, my own memory `project_bohdi_no_longer_curates_structure`) is unambiguous.

I read the readiness plan's B2–B6 blockers as the goal and did them + a wall of extra cleanup. I preserved the D48 dice-roll in the copywriter prompt (Bohdi "drew" a treatment) instead of treating the whole "Bohdi picks treatments" model as retired. When Alex pushed on "why are you converting archetypes — we don't use them anymore," I pushed back on the naming (`lib/archetypes/main-street/` IS the live folder, no other code path is wired) instead of understanding what he meant: the whole "archetype = Bohdi picks a store shape" concept died with Session 36, the "single template + skins" model died after that, and where things stand now is families + multiple treatments per section — a model where "archetype" isn't the right word for what we build any more. My cleanup was to the substrate; the actual next thing is the family layer.

## The hard conversation

After the pushback I asked Alex to clarify what "we don't use archetypes anymore" meant. He walked the history: archetypes = when multiple layouts existed and Bohdi picked (didn't work); then single template + skins (also didn't work); now families + multiple treatments per section. Then he said: "Bohdi does 0 picking. All Bohdi does is create content. The renderer does the rest. You need to find out where you lost track and get back up to speed with what we have been doing before things get messed up beyond fixing."

I re-read `Family-Layout-Model.md`, `Family-Style-Sheets.md`, `Layout-Language.md`, and Session 62's recap. Wrote up the direction plainly in chat. Alex confirmed: the maker picks a **mood** at onboarding (public term); internally that IS a **family** (engineering term). The editor lets the maker try other families as if they had picked that mood at onboarding. We are **not starting the family wiring today**; tomorrow.

His parting instruction: "Make sure you document this completely so you do not lose track again."

## What's documented for tomorrow

- **New memory:** `project_mood_and_family_naming` — public term is mood, internal term is family, Bohdi authors CONTENT ONLY, renderer picks section variants from family defaults. Added to `MEMORY.md` index.
- **New plan doc:** `Project-Docs/Family-Wiring-Plan.md` — the direction, what exists today (all treatments built, matrix documented), what needs to be wired (registry, mood→family map, tenant column, renderer reads family, section stack from family, copywriter authors content only, nav derivation, paint per family, imagery grade, editor try-another-family), which of today's uncommitted work stays vs. gets rewritten under the family model, and the open questions for tomorrow.
- **This session recap.**

## Standing lessons banked

- **Comprehensive design direction beats narrow task interpretation.** When Alex says "keep working until I can run a full onboarding," the actual gate is the strategic direction that's been in flight for weeks, not the immediate task list of cleanup blockers. A cleanup pass that contradicts the direction (preserving Bohdi's treatment picks when the family should pick) is still off-plan. Re-read the direction doc BEFORE interpreting the task as literally as possible.
- **"Archetype" is a legacy word in the code but a retired concept in the model.** `lib/archetypes/main-street/` still hosts the code because the folder hasn't been renamed. But the archetype concept (Bohdi picks a store shape) died in Session 36 and the "single template + skins" replacement died after that. Current model is families + multiple treatments per section. When I read "archetype" in the code path, I need to remember the model is families now.
- **Mood is the maker-facing word. Family is the engineering word.** They're the same thing. Never expose "family" to the maker in UI, marketing, or copy.

## Files touched (uncommitted)

Class-only conversions across `lib/archetypes/main-street/`:
- Heroes: `MomentHero.tsx`, `SplitHero.tsx`, `StackedHero.tsx`, `TypographicHero.tsx`, `FloatingCardHero.tsx`, `EditorialCoverHero.tsx`, `CollageHero.tsx` + all seven test files
- Goods treatments: `GoodsProcession.tsx`, `GoodsSwitcher.tsx`, `GoodsSlideshow.tsx` + `GoodsBeat.test.tsx`
- Beats: `beats.tsx`, `FounderBeats.tsx` (all 7 treatments + FounderBand + AboutCue + FindUsList), `MainStreetProduct.tsx`, `MainStreetContactForm.tsx`
- Chrome: `chrome.tsx` (massive CSS additions to `skinVarsCss` + logo lockup + footer + Media placeholder to class-only)
- Schema + content: `pages.tsx`, `pages.test.tsx`, `MainStreet.tsx`, `schemas.ts`, `findus.ts`, `links.ts`, `builder.tsx`

New files:
- `lib/archetypes/main-street/defaults.ts` — DEFAULT_STRINGS map
- `lib/archetypes/main-street/__fixtures__/preview-findus.ts` — preview-only seeds
- `lib/onboarding/persist-collections.test.ts` — 4 new tests

Storefront pages:
- `app/storefront/cart/page.tsx` — class-only
- `app/storefront/subscriptions/page.tsx` — class-only

Onboarding pipeline (partial — the treatment picks still contradict the family model):
- `lib/onboarding/build-archetype-store.ts` — persistCollections added
- `lib/onboarding/crew/copywriter.ts` — prompt update (kept D48 dice roll — needs revision tomorrow)
- `lib/onboarding/crew/copywriter-schema.ts` — added collections + reviews.viewAllLabel + findUs.title
- `lib/onboarding/crew/normalize-copy.ts` + test — thread the new fields through
- `lib/onboarding/crew/pipeline.ts` — thread `copy.collections` into the content envelope

Build runner:
- `app/api/onboarding/start/route.ts` — `after()` instead of `void runBuild(...)`

Pre-existing working-tree leftovers (not this session): `.claude/settings.local.json`, `scripts/build-soul-splatter-bright.ts`.

## Not this session

- No commit. All work uncommitted.
- No deploy.
- No family wiring — that's tomorrow.

## Next actions

**Read `Project-Docs/Family-Wiring-Plan.md` first thing tomorrow.** It carries the open questions (mood → family map, skins vs. family paint, nav derivation, the two "open" section defaults, family_key column vs. reusing mood_key) and the wiring order (registry → tenant persistence → renderer → stack → copywriter cleanup → paint → imagery grade → editor try-another-family). Walk the open questions with Alex; write no code until we've aligned on them. Then start with Cozy (Main Street = Cozy) as the first end-to-end wired family.
