# Session Brief — BohdiAI

**Purpose:** the operational state a fresh session needs to start — current state, next actions, and the standing lessons that carry forward. **Stays under 100 lines.** Detailed per-session recaps live in `session-logs/session-NN.md`. At the end of a session, write the recap there, add a one-line entry to the index at the bottom of this file, and update only the Current State + Next Actions sections here. Do not paste full recaps back.

**Operative plan doc:** `Project-Docs/Full-Plan.md`. Every session reads it. Every session updates its checkboxes.

**Last updated:** 2026-07-07, Session 66.

---

## Current state

**Session 66 landed Wave A (four of five items) of `Session-66-Fix-Plan.md`.** Nav lists Shop / Collections / About / Events / Contact (Testimonials moved to footer). Cozy hero drops dead CTAs in favor of a subheading; the actual root cause of "text washing over the hero" was a z-index bug (brand frame was under the scrim) — fixed. SplitHero on Modern now renders its nav across the FULL width instead of being trapped in the text half. Reviews → Testimonials rename shipped throughout the user-facing surface. Modern marquee/CTA overlap resolved.

507 tests pass, tsc clean, lint clean.

Fix-plan waves still pending: A5 (Rustic collection labels contrast), Waves B (container-absorbs sweep), C (family textures + section-surface variation), D (imagery grade §1.8), E (sub-page compositions), F (Session-65 audit rollups). All six waves must land before Phase 2 begins per Alex.

**Test tenants:** Same seven live from Session 65's onboardings — all now render with the Session-66 nav/hero/testimonials updates via the family-default pipeline (no envelope patches needed). Classic Loafs got a one-off DB patch for its `moment.sub` (long descriptive sentence → "Bread worth coming home to"); the other six still show whatever the crew authored at Session-65 time until re-onboarded or edited.

## Next actions

**Session 67 — finish Wave A + start Wave B.**

1. Land A5 (Rustic collections page label contrast).
2. Wave B — container-absorbs sweep. Six surfaces to audit (About founder attribution, shop CTA button label, testimonials section overlap, Modern navbar edge cases, Cheerful mobile hero, Cozy mobile shop).
3. Then move to Wave C (textures + Luxury/Modern surface variation) once B is clean.
4. Session-65 §1.5 audit rollups (tool schemas + AbortController) still owed; slot in Wave F when the surface is settled.

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

---

## Session log index

Full recaps live in `session-logs/session-NN.md`. This is the one-line index.

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
