## Session 33 (2026-06-07) — Built the Director + Crew, ran two live builds, then a punch list

**The arc:** built the full five-stage crew from the trajectory down (the Session 32 design), stripped all bias and all non-rendering length caps at Alex's insistence, fixed the cap bug that failed the first build, ran two successful live builds, then Alex walked them and surfaced a punch list. Branch `session-12/layout-engine`; all crew code committed + pushed.

### What shipped (committed + pushed)
- **The crew pipeline** — `lib/onboarding/crew/`: `trajectory.ts` (schema), `director.ts`, `copywriter.ts` + `copywriter-schema.ts`, `cinematographer.ts`, `graphic-artist.ts`, `directors-cut.ts`, `pipeline.ts` (`directAndProduce`), `types.ts`, each with a test. `directAndProduce` replaces `authorStore` inside `build-archetype-store.ts`; `run-storefront.ts` unchanged.
- **D41 skin gate wired** — `lib/archetypes/main-street/skin-selection.ts` (`MOOD_SKIN_TAGS` bridge + `moodAlignedSkins`), consumed by the Graphic Artist and hard-validated. `SKIN_DESCRIPTIONS` moved to `skins.ts` (single source); the builder imports it.
- **Bias removed** — director/copywriter/cinematographer/graphic-artist prompts hand over role + materials (full niche, mood) + structural field spec only. Full niche body, untruncated.
- **Caps removed on non-rendering fields** — `ScenePrompt`, `PhotoSlot.prompt`, `ProductSchema.imagePrompt`, the trajectory fields, and the GraphicSpec image prompts now carry only a non-empty floor (`.min(1)`); caps stay only on rendered text (and `alt`/`slug`). Stage errors append the last validation issues.
- Three commits: `bf68dd7` (crew), `1371fc8` (field limits + error enrichment — superseded in part), `3118c79` (drop caps). 1000 tests green throughout.

### The two live builds
`wallys-wood` (woodworker / rustic) and `claires-candles` (candles / sunset) both built. The first `wallys-wood` attempt FAILED on the unstated scene cap; removing the caps fixed it.

### PUNCH LIST — all OPEN, next session, in suggested order
1. **Moment rebuild (structural, do first)** — extract it from the hero into a PORTABLE front-door layer that plays first, then melts into the Main Street hero (and can gate a heroless archetype). Add the play-once per-shop cookie, the footer "Intro" replay, and the deep-link bypass. (D33 + D43.)
2. **Shrink the type scale** — `makeType` in `skins.ts`: brand 124 / storyline 76 / closeHead 92 / goodsHead 64 / quote 44 are all oversized; every hero and the About quote read huge.
3. **Gender-neutral About image (D42)** — delete `lib/name-gender.ts` + its use in `image-directives.ts`; frame the maker by hands/work/bench; no onboarding gender question.
4. **Contact form + dead CTA** — build the contact/custom-order form on the Contact page (wire to `/api/contact`); the close CTA is a hardcoded `href="#"` in `beats.tsx` — point it at the form.
5. **Mobile/responsive pass** — navbar scrunches at the top; the site isn't responsive.
6. **Lower priority** — product detail shows one image (crew writes one image prompt per product); goods treatment converges across builds (free pick now gravitates; consider keying it to the trajectory's feel, not the marquee line's residual size language).

### Process notes (carry forward)
- **Bias is the throughline.** Every imposed cap, example, default, or heuristic is suspect. Caught this session: the niche re-truncation (already fixed once in S31), the schema length caps, the name→gender table, and worked examples in prompts.
- **Don't state the spec from memory.** Claude mis-described the Moment behavior twice; the decision (portable, plays first, then melts into the hero) had to be re-read and cited. Cite, don't paraphrase.
- **Don't build when asked a question.** Claude jumped to building twice while Alex was diagnosing. Build only when told.

---

