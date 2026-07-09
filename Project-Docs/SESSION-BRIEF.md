# Session Brief — BohdiAI

**Purpose:** the operational state a fresh session needs to start — current state, next actions, and the standing lessons that carry forward. **Stays under 100 lines.** Detailed per-session recaps live in `session-logs/session-NN.md`. At the end of a session, write the recap there, add a one-line entry to the index at the bottom of this file, and update only the Current State + Next Actions sections here. Do not paste full recaps back.

**Operative plan doc:** `Project-Docs/Full-Plan.md`. Every session reads it. Every session updates its checkboxes.

**Last updated:** 2026-07-09, Session 68.

---

## Current state

**Session 68 closed Wave B end-to-end.** B3 landed as a structural fix on the pull-quote treatment (grid-stack the stage so long quotes cannot overflow the min-height and spill onto the dots/viewall). B4-B7 landed together: split-center navbar cap so long wordmarks wrap instead of squeezing the flanking labels (Heavenly Scents, Knotty Knits); Cheerful mobile Collage hero stacks with explicit row anchoring; Cozy mobile Constellation drops the negative-margin overlaps that caused image-over-image collisions; Cheerful navbar over the Collage hero image gets a subtle vertical fade backdrop so nav labels stay legible over the top-right shot. B7 was added mid-session when Alex spotted the navbar contrast bug while eyeballing B3 on Sheri's Dips.

**Also landed:** niche-writer skill re-pointed from `niche-leatherworker.json` (never existed) to `niche-woodworker.json` (the de facto bar — the same skill cites "Walnut Hull," a woodworker.json color, as its exemplar). Small doc-only carry-over from Session 67.

Three commits: `296fc09` (B3), `3b2856e` (B4-B7), `ee92e2b` (niche-writer). 954 tests pass, tsc clean, lint clean.

Fix-plan waves still pending: C (family textures + section-surface variation), D (imagery grade §1.8), E (sub-page compositions), F (Session-65 audit rollups). All must land before Phase 2 begins per Alex.

**Test tenants:** Same seven live tenants — all now render with Session-66 + Session-67 + Session-68 fixes via the family-default pipeline.

## Parallel workstream — cowork

Cowork runs on Alex's cadence between our sessions, reading `Project-Docs/Cowork-Instructions.md` as its brief. Progress tracked in `content/niches/_queue.yaml`. Files land as drafts; Alex flips to `approved`; cowork never self-approves. Two workstreams: (1) niche-writer batches for the 45 missing niches — 38 remain end of Session 67; (2) library asset generation — cowork prompts, Claude in Chrome runs images (unlimited Nano Banana Pro), cowork runs videos (Kling 3.0 Turbo, paid), everything uploaded via `POST /api/library/ingest`. When starting a fresh session, check `git log` on `content/niches/` to see if cowork advanced between sessions.

## Next actions

**Session 69 — start Wave C.**

1. Wave C1 — upload the six wallpaper PNGs from `tmp/mockups/img/wp-*.png` to Supabase storage; add `--ms-texture-url` + `--ms-texture-opacity` CSS variables per family; apply the texture layer over base and contrast surfaces per family; update `Family-Style-Sheets.md` to add the three-textures-per-family bench.
2. Wave C2 — audit Luxury's six section variants and flip at least two to render on the contrast surface (likely Editorial founder + Chapters collections); same audit for Modern (likely Rating reviews + Signature founder). Regenerate one live build in each and confirm the visual rhythm has changed.
3. After Wave C: Wave D (imagery grade §1.8 pulled forward), then E (sub-page compositions), then F (audit rollups).

**Owed alongside:**
- Bulk-approve DB `niches.status = 'approved'` for niches Alex trusts, so the onboarding picker shows more than 2 options.
- Cowork continues niche-writer batches (38 remaining in the Session-45 batch).
- Once library has coverage for a few niches, wire onboarding's Graphic Artist stage to read library-first.
- Session-65 §1.5 audit rollups (tool schemas + AbortController) still owed; slot in Wave F when the surface is settled.

Alex's rule for Session-66-Fix-Plan: all waves land before Phase 2 begins.

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

- Session 68 (2026-07-09): Closed Wave B end-to-end. B3 pull-quote grid-stack; B4 split-center navbar cap + wordmark wrap; B5 Cheerful mobile Collage clean stack; B6 Cozy mobile Constellation no-overlap; B7 added mid-session — Cheerful navbar fade over the Collage hero image. Also re-pointed niche-writer skill from missing leatherworker.json to woodworker.json (the de facto bar). Three commits. 954 tests pass.
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
