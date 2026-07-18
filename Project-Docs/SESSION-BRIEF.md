# Session Brief — BohdiAI

**Purpose:** the operational state a fresh session needs to start — current state, next actions, and the standing lessons that carry forward. **Stays under 100 lines.** Detailed per-session recaps live in `session-logs/session-NN.md`. At the end of a session, write the recap there, add a one-line entry to the index at the bottom of this file, and update only the Current State + Next Actions sections here. Do not paste full recaps back.

**Operative plan doc:** `Project-Docs/Full-Plan.md`. Every session reads it. Every session updates its checkboxes.

**Last updated:** 2026-07-17, Session 74.

---

## Current state

**Session 75 — the plan was rewritten to reach launch.** The old Full Plan was a plan to prove two things worked, not a plan to launch, so it was silent on selling, the dashboard, the admin and getting paid. It's archived at `historical/Full-Plan-2026-07-05.md`.

Two new docs drive everything now. `Launch-Audit-2026-07-18.md` says plainly what's built and what isn't, verified against code and the live database rather than checkboxes. The rewritten `Full-Plan.md` is the plan itself, in three named phases: **Beta**, **Go Live**, **Growth**. Named, not numbered, because the Master Spec has its own Phase 1 and 2.

**The call that shapes everything: Beta means real stores.** Founding members are comped, but they run real businesses with real shoppers and real money. So anything that stops a maker running their business is Beta — all of commerce, the full editor, listings, the dashboard, market days, the admin, tax, shipping, expenses, and subscription pricing they can see.

Also settled: the Vibe Slider is dead (families are six layouts, not points on a line — picking a feeling is the honest version). The market POS is our screens around the card the maker already takes on their own reader, not us processing cards. Custom domains move to Go Live. No blog, ever.

Prior session's work (texture direction, editor Preview/Publish) is unchanged and recorded in `session-logs/session-74.md`. 976 tests pass. tsc + lint clean.

## Parallel workstream — cowork

Cowork runs on Alex's cadence between our sessions, reading `Project-Docs/Cowork-Instructions.md` as its brief. Progress tracked in `content/niches/_queue.yaml`. Files land as drafts; Alex flips to `approved`; cowork never self-approves. Two workstreams: (1) niche-writer batches for the 45 missing niches — 38 remain end of Session 67; (2) library asset generation — cowork prompts, Claude in Chrome runs images (unlimited Nano Banana Pro), cowork runs videos (Kling 3.0 Turbo, paid), everything uploaded via `POST /api/library/ingest`. When starting a fresh session, check `git log` on `content/niches/` to see if cowork advanced between sessions.

## Next actions

**Session 76 — start Beta.** The plan's Beta section lists the work. The founder admin comes first: it's how a founding member gets an account, so nothing else in Beta can be tested without it. Alex asked for it early and explicitly.

Still owed and not yet placed in a session:

1. **Revise the niche-writer skill's textures section** — per-niche curation was abandoned in Session 74 but the skill still tells cowork to source textures per niche. Drop it so cowork stops producing work we've thrown away.
2. **Multi-tier pricing conversation.** Parked in the plan, needs its own discussion before it lands in a phase.
3. **Decide the maybes** — CSV importers, Claude Vision product auto-fill, customer inbox. Parked in the plan.
4. **Check the onboarding niche picker.** 15 niches are approved in the database but the picker reportedly shows fewer. Two-minute look.

**Owed alongside:**
- Cowork continues niche-writer batches (38 remaining). Prose / palette / fonts / wordmark proceed; leave `textures` empty.
- Investigate the dev feature-flag bypass mystery (low priority; DB row overrides it).

---

## Standing lessons (carry forward every session)

- **Bohdi authors CONTENT ONLY.** Structure / nav / sections / treatments come from the family (renderer). Never from Bohdi.
- **Mood is public. Family is internal.** Public copy always says mood. Never expose "family" to a maker.
- **No hardcoded strings in the renderer. No inline styles. No shortcuts.** All strings through `DEFAULT_STRINGS`/`DEFAULT_COUNTS`. Dynamic per-instance values pass as CSS custom properties or `data-*` attributes.
- **Tests are part of done.** No feature is complete without tests. Backlog compounds.
- **Ship complete, not partial.** Code + tests + types + verification before "done." Ask Alex if exception.
- **Verify visual work before commit.** Alex's eyes gate any change with visible output. Tests-green ≠ looks-right.
- **Verify against real code + live data, not memory.** Confident inference is the trap; the check IS the answer.
- **Render configured content in configured order.** Don't compute freshness, hide past items, or invent relative labels. The maker keeps content current.
- **Cite, don't paraphrase the spec.** Re-read + cite. Don't state from memory.
- **Don't inflate blockers.** Name only what actually blocks the run. Keep "block the test" separate from "make the site live."
- **A comparison set's job is variance ACROSS the set.** Best-of-each in isolation converges.
- **Hold the full direction; don't lurch off one comment.** A single remark adjusts within an established direction; only a full-direction change repoints.
- **When asked "is this a shortcut?", separate root-cause from convenient. Don't defend the easy version.**
- **Show, don't describe, for visible-output decisions.** Font, color, layout, treatment — render a specimen, don't argue.
- **Plain English in chat. One idea per line.** No doc-speak, no shorthand (`§6.2`, `D5`), no jargon Alex didn't use first.
- **No flattery. No reflexive agreement.** Rank ideas by merit, concede only on principle.
- **Don't invent under pushback.** Acknowledge and wait; don't fill the gap with a new guess.
- **Design discipline is not restraint.** Match the maker's real brand energy (Sheri's saturated maximalism). Don't default to clean/white/minimal.
- **A "structural fix" that only fixes the failure surface is a shortcut.** Audit every affected surface, not just the loud one.
- **Don't drift to serif; don't pick safe/lazy.** Bold, distinctive, executed — serif only where it earns it. Don't overcorrect to absolutes.
- **Every phase in the Full Plan updates its checkboxes as work lands.** Don't let the plan and reality drift.
- **Assets today's pipeline ignores may be tomorrow's editor fuel.** "Retire it" is not a safe default just because it's unused now. Ask whether the next phase earns it a job before pulling the plug.
- **Verify agent-reported state instead of trusting it.** Cowork reported "40 uncommitted files"; actual was 4. Read `git status` yourself, don't quote what the agent saw.
- **When Alex says stop / don't change, STOP — even mid-fix.** Session 73 repeatedly edited before he'd said go; he had to say "I did not tell you to change anything."
- **Don't grade your own homework on a comparison set.** Curation = viewing a wide set AND rejecting, including saying "I'm two short," not padding to a target count with near-identical grabs. Sameness across a set is STRUCTURAL (same kind of thing), not fixable by turning up a dial.
- **Never race Alex's dev server.** Don't force-kill his `next dev` or delete `.next` under a running server — it corrupts the Turbopack cache ("missing required error components"). Use the Bash tool for headless checks on your own port; let him own his server.
- **Don't cause side effects Alex didn't ask for.** `seed-editor-test-owner.mjs` resets the password every run — running it "just for the admin row" clobbered his known password. Read what a script does before running it for a narrow purpose.

---

## Session log index

Full recaps live in `session-logs/session-NN.md`. This is the one-line index.

- Session 74 (2026-07-17): Texture direction settled by subtraction + editor publish model. Niche-writer texture curation ABANDONED (D63); picker stripped to Family default + No texture + opacity dial; candle prototype textures deleted, candle style sheet kept with empty texture list; blend engine + loader parked. Family-wallpaper choice + strength now SAVES on `root.texture` and re-applies live. Two Alex-found bugs fixed at root: editor preview now carries the selected feeling (`previewMood`/`resolvePreviewMood`) so it shows the whole family not just the skin; Publish now counts a feeling change as dirty (`isLookDirty`), fixing Rustic/Cozy not activating when they share the live skin. Editor publish model (D64): two buttons — Preview (full-size staged view, reused tab) + Publish (go-live, dirty-gated); "View live site" try-on link removed (`ViewLiveSiteLink.tsx` deleted); staging session-only, persisted draft deferred. New `lib/editor/texture.ts` + `lib/editor/look-dirty.ts` (+tests). Committed `c56442d`. 976 tests pass (+28), tsc + lint clean.
- Session 73 (2026-07-16): NOTHING SETTLED — built a texture prototype and tested it. Editor Door 2 texture picker built + preview-wired: a tenant's `primary_niche` loads its texture shelf from `content/style-sheets/niche-<slug>.json`; the maker picks (Family default / No texture / shelf entry) and the storefront preview re-renders via `previewTexture` + `previewTextureOpacity` URL params. How the prototype works (NOT a decided design): texture is a TRANSPARENT ALPHA PNG (pattern-in-alpha, black RGB), sourced from stock then processed once with `sharp` (grayscale→negate→alpha), not AI-generated; it BLENDS onto the maker's background instead of repainting — `multiply` on light families (deepen), invert+`screen` on dark families (lighten), mode chosen per family from bg luminance (`hexIsDark`, 0.4). Background color preserved. First shelf: candle-maker, 5 entries — 3 that render clearly (Woven Linen / Aged Glaze / Marble Swirl) + 2 near-invisible (Handmade Paper, Cotton Tooth, ~2-3% ink). Alex judges whether any of it stays. New files: `niche-candles.json`, 5 processed PNGs in `public/textures/niche/candles/`, `lib/editor/load-niche-textures.ts` (+test), `ViewLiveSiteLink.tsx` (reused live-site tab carrying try-on via localStorage). Preview-only — no `commitTexture` persist yet. 948 tests pass (+8). tsc+lint clean. Alex live-tested on Aurora Candles, confirmed multiply preserves each palette's color, then approved commit. Long frustrating path to get there — full wrong-turns record (JPG→soft-light→fixed-ink PNG→fg-mask→alpha-blend) and process lessons (stop when told, don't self-grade curation, don't race Alex's dev server, don't reset his password) in the session log.
- Session 72 (2026-07-14): Wave F closed — both audit rollups landed. Real `input_schema` on the four crew stages (copywriter, cinematographer, graphic-artist, directors-cut) mirrors each stage's Zod schema; model gets structural guidance up front so retries don't burn on missing required fields. `withTimeout` rewritten to accept a factory `(signal: AbortSignal) => Promise<T>` and abort on timeout; threaded through all 5 crew stages, `fal.ts`, and both `moments/media.ts` calls. Regression tests per stage + signal-threading tests + `with-timeout.test.ts` re-cast. 941 tests pass (+16). tsc + lint clean. Full-Plan §1.5 checkboxes flipped. Second half of session opened a long unresolved discussion about niche textures — where they live, what they look like, how they render. Arc: initial "3-5 photorealistic material prompts per niche" direction rejected as Web1-ish material photography; consensus that family wallpapers today set the subtlety bar (Cheerful too loud, burlap most literal); direction landed at "neutral atmospheric surfaces overlaid via blend modes on the maker's palette" but full spec not settled. Alex called break. Niche-writer skill's textures section carries a REVISION PENDING banner. Also committed: cowork's between-session output — video-conditional-on-natural-loop policy, aspect-ratio-grouped image prompts, ingest moved out of cowork sandbox to `python ingest_post.py --batch` script Alex runs locally, plus 5 style sheet font/wordmark reshuffles and new `ingest_post.py` in root.
- Session 71 (2026-07-13): Wave E closed — sub-page compositions. Scope shifted from "30 unique compositions" to "four canonical library shapes, each painted per family through the skin system." `/shop` renders a three-column product grid (activated the dormant `.ms-catalog-*` CSS in chrome.tsx). `/collections` renders editorial spreads — one collection per band, alternating image left / right. `/events` renders `FindUsCalendar` as the primary view with clickable events (anchor scroll to a detail list below, plus a "Get directions" Google Maps link per row); `FindUsCalendar` gained an optional `eventHrefs: readonly string[]` prop, RSC-safe because it's an array not a callback. `/testimonials` renders a two-column wall of quote cards. `/about` stayed as-is. Every sub-page dropped its `treatments` prop; callers in `builder.tsx` and `pages.test.tsx` updated. Working approach pivoted mid-session away from `tmp/mockups/` iteration to editing production TSX directly, one sub-page at a time. Alex flagged the testimonials summary-without-per-review-ratings inconsistency and deferred richer testimonials (ratings, click-through, filter, photos) to a "real testimonials" phase once verified-purchase reviews exist. Five commits. 925 tests pass.
- Session 70 (2026-07-11): Fixed the family wallpaper wash (`.ms-family-texture` at `z-index:0` inside `isolation:isolate` was painting ABOVE sections; changed to `z-index:-1`). One CSS line killed the reviews-cards Cheerful fade AND broad-family button/background dimming Alex was seeing. Retired-code cleanup sweep: deleted the whole Try-On feature (admin page + button + API route + `lib/tryon/` + `store_versions` table + `authoringSpec` + Try-On preview branch in StorefrontPage) — Try-On was built for a multi-archetype world that hasn't existed since Session 31 when Gallery was deleted. Also deleted: orphan `/api/onboarding/generate` endpoint, `generateStorefront` fallback, retired Gallery route, `PortableStore` type, retired mood JSON files, three `industrial` skin tags, `simple` mood in Main Street's suitableFor, legacy `NavItem`/`NavEntry`/`identity.nav` in Bohdi's schema. Scrubbed vocabulary: `spotlight`/`sunset`/`image` in crew tests + comments, `Playful` → `Cheerful` in docs + mockup filenames. 15 files deleted, 25 modified, one drop migration. Tests: 925 pass. Two commits. Alex confirmed onboarding + editor swap still work end-to-end.
- Session 69 (2026-07-10): Wave D reshaped from strip-mood-baking to two crew guardrails — products stay honest to the niche's real range regardless of mood; graphic artist keeps authored color and material, only atmosphere follows the mood. Verified live: Aurora Candles (pre-guardrail, 5/5 dark) vs Lenticular Lumens (post-guardrail, real diversity). Also landed: Industrial retired from the picker, Seedance video 6s → 4s, FloatingCard hero fix for long shop names. Editor Door 1 rediscovered as already-built — the Full Plan Phase 3 checkboxes are stale. Alex tried the swap through every mood on Lenticular; Rustic needed a click-away-and-back once. Detours: three-week-old `editor-test@bohdiai.com` session tangle resolved by seeding `alex@bohdiai.com`; `/dashboard/website` 404 patched by upserting the `editor` feature-flag row (dev NODE_ENV bypass mystery still open). Open: reviews-cards fade-out on Cheerful. Five commits.
- Session 68 (2026-07-09): Closed Waves B and C. B3 pull-quote grid-stack; B4 split-center navbar cap + wordmark wrap; B5 Cheerful mobile Collage clean stack; B6 Cozy mobile Constellation no-overlap; B7 added mid-session — Cheerful navbar fade over Collage image. C1 family wallpapers paint behind every section (six PNGs in `/public/textures/`, tuned subtle); C2 Luxury flipped Chapters + Pull-Quote to contrast, Modern flipped goods to contrast after original Cascade+Rating plan created a three-in-a-row clump. Also re-pointed niche-writer skill from missing leatherworker.json to woodworker.json. Editor Door 2 texture picker model locked: family bench + niche shelf combined. Long design chat surfaced Wave D scope (Graphic Artist skin-pick cruft, mood-baking still in image prompts, cinematic hero used by 4/6 families, library-image test failed as boring). Six commits (five feature + docs). 954 tests pass.
- Session 67 (2026-07-08): Closed Wave A (A5 — Rustic crate label contrast) and started Wave B (B1 founder attribution wrap, B2 shop CTA button wrap). Landed image library plumbing (`library_assets` table + Storage bucket + `/api/library/ingest` endpoint + docs). Cowork drafted 5 niches from Session-45 batch in parallel. 954 tests pass.
- Session 66 (2026-07-07): Six-family walkthrough with Alex. Drafted `Session-66-Fix-Plan.md` (six waves). Landed Wave A items A1–A4: Cozy hero refactor (CTAs → subheading + z-index/color-mix fix), Reviews → Testimonials rename, Testimonials moved to footer, Modern marquee spacing + SplitHero nav full-width fix. A5 (Rustic labels) carries to Session 67.
- Session 65 (2026-07-06): Phase 1 landed — family registry, renderer reads family, section stack walking, copywriter authors CONTENT only, family default skin, nav lists every page, collections persist before publish. Alex ran all six moods through fresh onboardings; all rendered pretty well; design + content issues carry to Session 66. Twelve commits.
- Session 64 (2026-07-05/06): Phase 0 executed — codebase mechanical cleanup, database cleanup, renderer sweep (no hardcoding + no inline styles once and for all), documentation reset. Full Plan approved as operative doc.
- Session 63 (2026-07-04): substrate cleanup pass — all archetype files class-only, `DEFAULT_STRINGS` map, collections DB persistence, build runner fire-and-forget fixed. Direction correction: family layer wiring is the actual gate.
- Session 62 (2026-07-03): find-us corrections applied + destination pages built. `Onboarding-Readiness-Plan.md` written (now superseded by Full Plan).
- Session 61 (2026-07-02): find-us section built — six treatments. Not signed off.
- Session 60 (2026-07-01): reviews/testimonials section built onboarding-complete — four shared treatments.
- Session 59 (2026-06-30): marquee section built onboarding-complete — one shape all families.
- Session 58 (2026-06-29): collections section built — six per-family bands.
- Session 57 (2026-06-28): About went to seven treatments, nav to four registers.
- Sessions 40-56: sections built, families designed, editor design started. See individual logs.
- Sessions 30-39: Main Street becomes sole archetype, families framework designed, Bohdi crew built.
- Sessions 20-29: earlier design/build cycles under superseded models (blocks/widgets/layout engine).
- Sessions 0-19: Phase 0 build (marketing site + Supabase + waitlist).
