## Session 27 (2026-06-04) — Built the REAL storefront engine and ran it live. No steering: Bohdi chooses the archetype + look. Three real stores shipped.

**The arc:** started intending to design skins, and the conversation drove all the way to a working, hands-off storefront generator. Alex's through-line all session: stop testing everything *except* the actual app; build the real engine and run a real onboarding to a real subdomain; and stop controlling the outcome — let Bohdi make the calls.

### What shipped (all committed + pushed, branch `session-12/layout-engine`)
1. **The seven-skin shelf** (`lib/archetypes/main-street/skins.ts`): ember (homey) · tannery / forge / anvil (rugged) · porcelain / botanical / atelier (delicate). Each is a two-surface skin. `makeType` reworked so each skin carries its own **font weights** + optional uppercase display (Anvil heavy, Porcelain hairline, Forge/Anvil caps). `MAIN_STREET_SKIN_TAGS` gives each skin a **character + moods** tag (never a niche list — niches classify to a character elsewhere). Font hrefs per skin. Design doc: `docs/superpowers/specs/2026-06-04-main-street-skin-shelf-design.md`.
2. **The one engine — Bohdi decides, no steering.**
   - **`lib/archetypes/builder.ts`** — the `ArchetypeBuildSpec` contract: `menuDescription`, `fitsCatalog(productCount)`, `looks`, `authoringSpec(brief)`, `parseSubmission`, `mediaJobs` (each tagged `group: 'product'|'feature'`), `applyMedia`, `toPayload` ({content, products}), `render`.
   - **`lib/archetypes/main-street/builder.tsx`** + **`lib/archetypes/gallery/builder.tsx`** — both archetypes implement it. Main Street holds products as separate rows; the Gallery embeds them in its wall. Looks = the 7 skins / the 4 gallery themes.
   - **`lib/archetypes/registry.tsx`** — `ARCHETYPE_SPECS` / `archetypeMenu()` / `archetypeSpec(key)`.
   - **`lib/onboarding/build-archetype-store.ts`** — the engine. Builds the menu (only `fitsCatalog` archetypes), runs Bohdi in a two-step loop: `choose_format(archetypeKey, lookKey)` → returns that archetype's `authoringSpec` → `submit_store(content, products?)`. Generates all media from his prompts: feature jobs free, product jobs capped at `MAX_PRODUCT_IMAGES = 5` and **recycled** across extra products (`recycleProductPhotos`). Unique storage path per job (`{subdomain}/{jobId}`).
   - **`lib/generation/write-archetype-storefront.ts`** — clean persistence by DIRECT inserts: a tenant row, a home `content_pages` row whose `layout_tree.root` is the **archetype envelope** `{ kind:'archetype', archetypeKey, lookKey, mood, catalogSize, content }`, and product `listings` rows (Main Street). NO style sheet, NO borrowed `write_tenant_storefront_layout` RPC.
   - **`app/storefront/_components/StorefrontPage.tsx`** — render branch: if the home page is an archetype envelope, load the tenant's listing rows → `ProductView[]`, and call `spec.render({content, lookKey, products, mood, catalogSize})`. Skips the style-sheet path entirely.
   - **`lib/onboarding/run-storefront.ts`** — gutted to a thin wrapper: every niche routes to `buildArchetypeStore`. The legacy/`runBohdi`-compose paths are no longer routed (code still present, unused).
   - **Removed all steering:** deleted `select-storefront.ts` (the niche→character map + mood→skin rules + rollout gate). The archetype is no longer hardcoded to Main Street.
3. **Catalog size = the one structural gate.** `fitsCatalog`: Main Street any size; Gallery `>= 8` (the wall needs density — a 6-item woodworker is never offered the Gallery). The **goods treatment** now selects from the maker's TRUE catalog size (`catalogSize`, threaded onboarding → envelope → `MainStreet` → `GoodsBeat`), not the home sampling — fixing a real bug where `GoodsBeat` passed `products.length` (10) instead of the entered size (20).
4. **Onboarding catalog-size step** (`app/onboarding/_components/StepCatalogSize.tsx`, wired into `OnboardingFlow`, 7 steps now): a maker picks a tier (a handful=6 / a couple dozen=20 / a big catalog=45) after Mood. Sets `productCount`, which was previously stuck at a hardcoded default of 4.
5. **Build-screen hang fix** (`StepBuild.tsx`): React StrictMode's dev double-mount (mount → cleanup → mount) ran the cleanup that cancelled the status poll, and the "already started" guard bailed before restarting it — so the build ran to completion in the background but the screen's poll was dead and the timer counted forever. Moved cancellation to a **ref the live mount resets**, fire the POST once, resume polling on remount. Also the success link is now env-aware (`storefrontUrl()` → `{sub}.localhost:{port}` in dev, production domain otherwise).

### The real runs (live, on the production Supabase — Alex drove the onboarding, not Claude)
- **`the-mills-bakery`** — baker / rustic → Bohdi chose **Main Street + ember**, 10 products, ~12 min. Looks great: a generated dough-on-the-counter hero with the story telling itself ("Flour. Water. Salt. Time."), full-width procession goods rows of distinct appetizing breads, a real baker portrait beside an actual find-us calendar.
- **`rustic-creations`** — woodworker / dark / 6 products → Bohdi chose **Gallery + gallery-ink**. The dark look was perfect but Gallery was the WRONG shape for 6 items — this is what drove the catalog-size gate (a 6-item shop would now only see Main Street).
- **`creative-clay`** — ceramicist / sunset → **Main Street + ember**, 3:31. Same skin as the bakery → exposed the thin-shelf / mood issue (b above).
- Cost **under $2 each**. Build time dominated by the Kling hero video (~4 min); the Gallery (no video) built in ~75s.

### Quality bar — Alex's reaction
The stores look genuinely designed, not AI slop. Bohdi chose sensible archetypes + skins, wrote real copy, and generated real, appetizing, on-brand imagery end to end with nothing hand-fed. The 75-second video-less build was "a wow moment." This is the thing the last several sessions were chasing.

### NEXT SESSION (Alex will discuss the open issues; the big lever is the shelf)
- **Grow the character × mood grid** — the #1 finding. One warm/homey skin (ember) means mood can't change a bakery/ceramicist's look. Need more than one skin per lane so cozy vs dark vs bright actually diverge. This is the real "skins" work the session was *supposed* to start on.
- **Hero video storage** — stop hotlinking `fal.media`; figure out why the Supabase video upload fails so videos persist. (Parked.)
- Main Street **sub-pages** (shop/about/events) so the nav/cues aren't dead.
- Founder-portrait sameness; an authoring-loop timeout; the eyes/critic loop (still unbuilt); fold the gate so existing stale tenants can be re-run.

---

