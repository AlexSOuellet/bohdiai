# Session 65 — 2026-07-06

**Focus:** land Phase 1 (family layer wiring) end-to-end. Twelve commits, all six moods run through a fresh onboarding at end.

## What went in

**Decisions locked (§1.0, §1.1).**
- "Family" is internal; "mood" is public. Same concept, two words.
- Six moods only (Cozy, Rustic, Dark, Luxury/Elegant, Cheerful, Modern). Industrial retires.
- Storage stays `tenants.mood_key`. No new column.
- Skins stay and grow — within-family editor options later. Onboarding picks the family's default; maker swaps.
- v2 stack orders locked, but every section on at onboarding (length-as-lever retired). Rationale: the maker sees their own onboarding output first, and a thin site reads as unfinished, not premium.
- Nav lists every page the store has. Copywriter doesn't author nav labels.
- Sections without per-family designs (Footer, Close CTA, Contact page, FAQ page) share one shape for now.
- Dark hero = Floating Card and Luxury Products = Switcher — both previously flagged, both locked.
- Reviews seed at onboarding as sample content the maker edits.
- Two design mockups (`tmp/mockups/defaults-matrix.html`, `tmp/mockups/family-stacks-v2.html`) are load-bearing for Phase 1; added to CLAUDE.md required-reading. Both cleaned of stale flags.

**Family registry (§1.1).** New file `lib/archetypes/main-street/families.ts` with six entries. Each entry carries `sectionDefaults`, `sectionStack`, `typePackage`, `palette`, `texture`, `wallpaper`, `imageryGrade`, `fontHref`, `defaultSkin`. `getFamily(mood)` accepts loose input and handles `elegant` → Luxury + `industrial` → Modern aliases with a Cozy fallback for missing values. 44 tests cover completeness, valid variant IDs, single lead per family, every-section-on-except-Contact, and default-skin naming.

**English centralization (rides with §1.1).** Added `REFERENCE_LABELS` to `defaults.ts` — one nested map for mood labels + descriptions, family palette / type package / texture / wallpaper / imagery grade names, and all 29 skin labels + descriptions. `families.ts`, `moods.ts`, `skins.ts` reference the map instead of literal English. When the rule was pushed on ("existing precedent isn't the test"), extended it beyond the renderer to reference-data files. One place for i18n or copy edits.

**Renderer reads family (§1.3).** `MAIN_STREET_SPEC.render` receives `mood`, resolves the family via `getFamily(mood)`, and computes an effective `MainStreetTreatments` object (family defaults with preview URL overrides layered on top). `MainStreet.tsx`, `pages.tsx` sub-pages, and the product / content / shell renderers all receive `treatments` and paint through the family. Preview URL params still layer on top for dev. Rides in: React `cache()` on `loadHomeEnvelope` + `loadTenantChrome` (Audit #79 — 3-4× loads → 1 per request), storefront query filters (`status='active'` + `deleted_at IS NULL`, Audit #70).

**Section stack walking (§1.4).** `MainStreet.tsx` walks `family.sectionStack` instead of a hardcoded order. Each family's opens-with lead surfaces — Cozy with the maker letter, Rustic with the workbench, Dark with a slow product, Luxury with the collection chapters, Cheerful with a loud marquee, Modern with the grid. Every content section is on by default; Contact stays off because its home block isn't built yet. `showMarquee` prop retired (marquee is on for every family via the stack).

**Copywriter authors CONTENT ONLY (§1.5).** Removed `.treatment` from `goods`, `collections`, `reviews`, `findUs`, `founder` in the content schema. Removed the two required treatment enums from the copywriter output schema. Deleted `treatment-roll.ts` + `treatment-roll.test.ts` (D48 retired). Copywriter prompt drops the "you drew X" language and the treatment menus; prompt now says explicitly the BODY is the family's call. Pipeline drops the `rand` param on `directAndProduce`; `CrewBuildResult.choices` shrinks to `heroKind`. `log-choices.ts` drops `goods-treatment` + `founder-treatment` decision rows (two rows per build: trajectory + moment-kind). Every Beat component drops the `?? content.<section>.treatment` fallback.

**Family provides paint (§1.6).** Each Family names a `defaultSkin` — Cozy → Ember, Rustic → Tannery, Dark → Hearthstone, Luxury → Atelier, Cheerful → Confetti, Modern → Studio. Pipeline resolves the family from `brief.moodKey` after the crew runs and uses `family.defaultSkin` as `chosen.lookKey`. The Graphic Artist still designs imagery but the skin is deterministic per family. The 29 skins remain reachable via `moodAlignedSkins` so Editor Door 1 can offer within-family swaps.

**Nav lists every page (§1.7).** `MAIN_STREET_NAV` grows to six items (Shop, Collections, About, Events, Reviews, Contact). `resolveNav()` takes zero arguments and returns the fixed page list. `identity.nav` dropped from the copywriter schema and prompt; marked LEGACY-optional in the content schema for envelope back-compat. Copywriter no longer authors nav labels. Chrome drops the `identity.nav` read.

**Collections persist before flip (§1.9).** `writeArchetypeStorefront` split into two functions — the write-draft function inserts tenant (draft) + page + listings; the new `publishArchetypeStorefront(tenantId)` does the flip. `build-archetype-store.ts` runs draft-write → `persistCollections` → publish. Fixes Audit #10 (race window where store was live but `/collections/[slug]` 404d).

## Live-test at end of session

Alex ran onboarding on all six moods. Every one produced a functional storefront. Section variants, section order, nav variants, palettes, and type all landed per family. Real design + content issues surfaced (details carry to Session 66). Every family did "pretty good" — bar is met for shipping Phase 1.

## Not landed (carrying forward)

- **§1.5 audit rollups.** Publish full Anthropic tool schemas as `input_schema` on all four crew stages, and wire `AbortController` through `withTimeout`. Both are build-pipeline reliability, not user-visible. Follow-up commit before beta.
- **§1.8 imagery grade.** Deferred by the plan text — first-cut builds without dynamic grading ship coherent output.

## Lessons that landed as standing rules

- **Plain English scrub rule** (`feedback_plain_english_scrub_rule.md`) — pre-send check: no spec IDs, no file names, no backticks, no tool names, no code-part nouns in chat. If Alex says "plain english" mid-conversation, rewrite the previous message.
- **Precedent isn't the test.** The rule "no hardcoded English in the renderer" was the letter; the spirit extends to reference-data files too. Extended, and applied to `moods.ts` and `skins.ts` at the same time.
- **Stick to the plan.** Numbered phase order isn't arbitrary. Skipping §1.6 to jump ahead to §1.7 was veering; Alex caught it. Order held after that.
- **Don't hand a partial test.** A fresh onboarding is the real test; two half-tests on old tenants is not. Wait until the whole thing is functional before asking for eyes.

## Numbers

- 12 commits (§1.0/1.1 → §1.9).
- 940 tests pass at close. tsc clean. lint clean (0 errors).
- Full test suite grew from 896 to 940 during the session.
