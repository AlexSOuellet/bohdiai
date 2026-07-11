# Session Brief — BohdiAI

**Purpose:** the operational state a fresh session needs to start — current state, next actions, and the standing lessons that carry forward. **Stays under 100 lines.** Detailed per-session recaps live in `session-logs/session-NN.md`. At the end of a session, write the recap there, add a one-line entry to the index at the bottom of this file, and update only the Current State + Next Actions sections here. Do not paste full recaps back.

**Operative plan doc:** `Project-Docs/Full-Plan.md`. Every session reads it. Every session updates its checkboxes.

**Last updated:** 2026-07-10, Session 69.

---

## Current state

**Session 69 reshaped Wave D and tested the editor swap.** Alex redirected the original plan (strip mood-baking + ship filter grade) — atmospherics baked into images are fine at onboarding, but PRODUCT identity must stay honest to the maker's real range. Two crew guardrails landed instead: (1) Copywriter authors products from the niche's honest range regardless of mood; a candle maker's line spans black, cream, terracotta, ivory, sage no matter which mood; every product description must name actual material and color. (2) Graphic Artist keeps the authored color and material of the product itself; only setting, light, and framing follow the mood. Verified live — Aurora Candles (pre-guardrail) came back 4/5 dark; Lenticular Lumens (post-guardrail) came back charcoal, black, ivory, oxblood, pale sage. The copywriter narratively bridged Pale Amber ("Not every room earns its shadow"). Saltgrass rendered slightly darker than authored — minor residual worth watching.

**Also landed:** Industrial retired from the picker (was still surfacing); Seedance video default dropped from 6s to 4s (~33% cost cut per video-hero build); FloatingCard hero brand-size fix so long shop names don't break mid-character.

**Editor Door 1 rediscovered.** I proposed adding a URL-param preview; Alex pushed back — the editor already exists at `/dashboard/website` (mood radios, skin shelf, "Use this look" in-place re-skin). Full-Plan Phase 3 is stale. Alex tried the swap through every mood on Lenticular; Rustic needed a click-away-and-back once on first entry (one-shot UI hiccup, not reproducing).

**Detours:** three-week-old `editor-test@bohdiai.com` session silently refreshing across four onboardings; created `alex@bohdiai.com` / `password` via `scripts/seed-editor-test-owner.mjs` with admin on Lenticular + Living Beauty. Then `/dashboard/website` 404'd until we upserted an `editor` row into `feature_flags`; dev NODE_ENV bypass fired for onboarding but not editor and we don't know why.

**Onboardings run:** Aurora Candles (Dark, pre-guardrail), Lenticular Lumens (Dark, post-guardrail), Living Beauty (Cheerful × florist).

Five commits: `0760bac` (Industrial), `61a0f3a` (crew guardrails), `af2c1e2` (Seedance 4s), `2e7a9b6` (FloatingCard), `991d112` (editor flag script). Tests pass, tsc + lint clean.

**Open — carry to Session 70:** Dev feature-flag bypass mystery. Wave D done via guardrails; E (sub-page compositions) and F (audit rollups) still pending. (Reviews-cards fade on Cheerful was diagnosed + fixed Session 70 as `.ms-family-texture` z-index — wallpaper layer was painting above sections instead of behind them; changed to z-index:-1 with `isolation:isolate` on the container clamping it to the bottom of the stacking context. Saltgrass "residual" was carried forward from Session 69 as a Claude-inserted observation Alex never reported — dropped from the open list.)

## Parallel workstream — cowork

Cowork runs on Alex's cadence between our sessions, reading `Project-Docs/Cowork-Instructions.md` as its brief. Progress tracked in `content/niches/_queue.yaml`. Files land as drafts; Alex flips to `approved`; cowork never self-approves. Two workstreams: (1) niche-writer batches for the 45 missing niches — 38 remain end of Session 67; (2) library asset generation — cowork prompts, Claude in Chrome runs images (unlimited Nano Banana Pro), cowork runs videos (Kling 3.0 Turbo, paid), everything uploaded via `POST /api/library/ingest`. When starting a fresh session, check `git log` on `content/niches/` to see if cowork advanced between sessions.

## Next actions

**Session 70 — move on after the fade-out fix.**

1. **Full Plan Phase 3 checkboxes.** Editor Door 1 is built and working. The plan lists it as unbuilt. Update to reflect reality.

**Owed alongside:**
- Niche-writer skill update — cut textures section from 10-14 names to 3-5 directions with prompts (feeds Editor Door 2 shelf). Blocks cowork redoing texture sections on the five draft style sheets.
- Bulk-approve DB `niches.status = 'approved'` for niches Alex trusts so the onboarding picker shows more than 2 options.
- Cowork continues niche-writer batches (38 remaining in the Session-45 batch).
- Session-65 §1.5 audit rollups (tool schemas + AbortController) still owed; slot in Wave F when the surface is settled.
- Investigate the dev feature-flag bypass mystery (low priority; DB row overrides it). Alex signs out of the stale editor-test session and stays as alex@bohdiai.com from here.

**Wave state:** D done via crew guardrails (not strip-and-grade). E (sub-page compositions) and F (audit rollups) still pending. Alex's rule stands: all waves land before Phase 2 begins.

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

---

## Session log index

Full recaps live in `session-logs/session-NN.md`. This is the one-line index.

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
