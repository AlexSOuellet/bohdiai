## Session 29 (2026-06-05) — Built the deep skin shelf (29 skins), discovered skins are a small lever on the same shape, and built the TRY-ON conversion tool + first admin dashboard

**The arc:** started by building the deep skin shelf, ran it live, and the live result drove a long diagnosis that reframed the whole skin effort — then pivoted to building the try-on conversion tool (the real differentiation lever) end to end, including the first piece of the admin back end.

### 1. The deep skin shelf — BUILT + committed
- Grew `MAIN_STREET_SKINS` from 7 to **29 skins across 9 maker-worlds** (Hearth, Workshop, Fine, Garden, Studio, Mystic, Playroom, Press, Relic), 3-4 each. New worlds: Studio/Mystic/Playroom/Press/Relic.
- `SkinTag.character` → `world` (new `MakerWorld` type, 9 values). `MAIN_STREET_SKIN_TAGS`, `MAIN_STREET_FONT_HREFS`, and `SKIN_DESCRIPTIONS` (Bohdi's menu) all cover the 29.
- A test enforces **no two skins share a display face** (the "no cousins" line), plus every world has ≥3 skins and all 9 worlds are filled.
- Pure data; no renderer change. 78 Main Street tests pass, typecheck + lint clean. Committed (`d342888`).

### 2. The live test that reframed everything
- Alex ran an onboarding: **rachels-relics** (vintage_reseller, sunset, 45 products) → **Bohdi chose Orchard** (a Hearth golden-evening skin), NOT a Relic skin. He also chose **Main Street over Gallery** despite the big catalog.
- **Why:** catalog size only GATES the menu (it doesn't choose); nothing maps niche→world; Bohdi free-picks from descriptions; the **mood (sunset = golden) pulled him to Orchard** over the niche's world. Confirmed in code: `MAIN_STREET_SKIN_TAGS`/`world` are read by NOTHING in selection — Bohdi picks off `SKIN_DESCRIPTIONS` only.
- **Fonts were a red herring:** verified all 29 Google-Fonts URLs return 200 (they load), and `MainStreetRoot` injects the per-skin `fontHref` — so Hedvig etc. DO render. The "looks the same" complaint is real but it's because: (a) the warm-craft skins are **cousins** (warm cream + a serif), and (b) **on the same bones a skin is a SMALL lever**. Proven by swapping rachels-relics live: Orchard↔Heirloom (both warm serifs) = no visible change; Orchard↔Marquee (black/neon, all-caps) = dramatic but WRONG for vintage. So skins ARE a real lever, but the big differentiator is SHAPE (archetype) + content/photography, not a font swap on one shape.

### 3. Long brainstorm — how moods work within worlds (no code; conclusions)
- Walked: niche→world lock, mood→skin-within-world, "palettes inside a skin," "who picks the font." Hit the core tension: **full determinism (niche+mood→one skin) makes every vintage-sunset store a CLONE** (same font), which the brand can't afford; but **most makers have no brand at onboarding**, so a "brand breaks the tie" mechanism mostly won't fire.
- **Landed:** DON'T force niche→world now (given cousins it wouldn't have helped). Keep Bohdi choosing at onboarding. The real divergence lever is the **TRY-ON editor**, driven by **BRAND VOICE** — every maker can describe their voice on day one even with no logo; **voice drives the skin, niche pins the world, mood drives the color.** Makers choose **archetypes** more than skins.
- A skin font **de-clustering** (re-pick 11 skins so each world spans distinct type personalities, not all serifs) was attempted then **REVERTED half-done** at Alex's call. `skins.ts` is back to the committed deep shelf; **skin-divergence (make craft skins genuinely distinct, not cousins) is PARKED** as the durable skin work.

### 4. TRY-ON conversion tool — BUILT end to end (the session's main deliverable)
- **Spec:** `docs/superpowers/specs/2026-06-05-archetype-tryon-conversion-design.md`. **Plan:** `docs/superpowers/plans/2026-06-05-archetype-tryon.md`.
- **Model:** a store is *content* (the maker) + the archetype's *expression*. A `PortableStore` bundle (`lib/archetypes/portable.ts`) is the archetype-neutral handoff. Each archetype gains `handOff(content) → PortableStore` (extract); the target re-uses its existing `authoringSpec`/`parseSubmission`/`mediaJobs`/`applyMedia`/`toPayload`, and `authorFromPortable` (`lib/tryon/author-from-portable.ts`) runs Bohdi with a try-on preamble so he **re-expresses the same maker** (keeps wordmark, voice, exact product names/prices) instead of inventing.
- **Versions, not new tenants:** a `store_versions` table (`20260605000001`) holds saved variants on the SAME tenant; the envelope is **self-contained** — it carries its own `products` so a version never touches the live `listings`/`content_pages`. Preview in place via `?v=<label>` (resolver branch in `StorefrontPage` + `storefront/page.tsx`). Live store stays at `/`.
- **Conversion orchestrator** `lib/tryon/convert.ts`: handoff → brief from tenant niche+mood → `authorFromPortable` → media (reuse the maker photo + any source product photos via the pure, tested `partitionMedia`; generate only the rest, product capped at 5 + recycled) → write a version. `lib/tryon/write-version.ts` (upsert/read).
- **API + dashboard (start of the back end):** `POST /api/admin/tryon`; an admin dashboard at **`/admin/tryon`** listing active tenants (live archetype + existing versions) with a "Try on Main Street" button per row. No auth yet — founder/dev only (gate before shipping).
- **VERIFIED LIVE:** ran `abigails-custom-creations` (crocheter, Gallery, gallery-linen) → a **Main Street version**. Bohdi re-expressed in 3 turns: kept her wordmark, wrote a hero story straight from her maker bio, kept all 10 real product names/prices, reused her maker photo for the founder, generated a STILL hero + 5 product photos (recycled to all 10). Skin **defaulted to Ember** (selection deferred — that's the parked brand-voice work). Live Gallery untouched. Tests/typecheck/lint clean throughout; new unit tests for handOff, authorFromPortable, partitionMedia.

### 5. Alex's verdict on the converted store (the real payoff + next work)
- **Likes Main Street MUCH more than Gallery for Abigail** — exactly the comparison the tool exists to enable. **EXCEPT** Gallery's **About** and **where-to-find-us (markets)** are MUCH better. Diagnosis: Main Street's home is a SALES PAGE so its About is a **teaser** (founder quote + cue to a separate page) and find-us is a small calendar teaser, whereas Gallery gives the maker story/face a full band and the markets a proper list.
- **NEXT SESSION (Alex's ask):** strengthen Main Street's **founder/About beat + find-us** to the fullness Gallery gives them — real sections, not teasers. (Bigger later idea: let try-on graft Gallery's About/markets treatment onto Main Street via the portable layer.)

### Other next-session items
- Skin-divergence (parked): make the craft-world skins genuinely distinct (not cousins), so brand-voice→skin actually produces visibly different stores.
- Try-on follow-ups: a **make-live / publish** button (copy a version into the live home), **owner-gating of `?v=`** previews, wiring **brand-voice→skin selection**, and generalizing `handOff`/`takeOn` to every archetype (any-to-any try-on).

### Topics Alex flagged for tomorrow's DISCUSSION (not action yet)
- **Does Gallery work as a standalone archetype at all?** Given Main Street >> Gallery for Abigail, consider **demoting Gallery to just a PRODUCT/CATALOG PAGE inside Main Street** rather than its own storefront archetype. Open question — discuss before touching anything.
- **Add VARIANTS to the Main Street About section** — selectable treatments for the founder/About beat the way `goods` and `founder` already have. This is how we'd answer Alex's "Gallery's About is better": give Main Street a fuller About variant, not just the teaser.

### Process notes
- Saved a memory **`feedback_preview_does_not_work`**: the `Claude_Preview` MCP loses its server handle on navigation and Bash can't reach the Windows localhost — don't try to load pages; hand Alex the URL and ask for the F12 console. (Burned real time wrestling it this session.)
- `swap-skin.ts` (throwaway) removed; `run-tryon.ts` kept as the CLI proof harness. `scripts/gen-skin-shelf.ts` + `skin-shelf.html` (a visual contact-sheet of all 29 skins, opened in the browser to judge them) remain untracked.

---

