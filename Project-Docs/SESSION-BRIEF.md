# Session Brief — BohdiAI

**Purpose:** the operational state a fresh session needs to start — current state, next actions, and the standing lessons that carry forward. **Stays under 100 lines.** Detailed per-session recaps live in `session-logs/session-NN.md`. At the end of a session, write the recap there, add a one-line entry to the index at the bottom of this file, and update only the Current State + Next Actions sections here. Do not paste full recaps back.

**Operative plan doc:** `Project-Docs/Full-Plan.md`. Every session reads it. Every session updates its checkboxes.

**Last updated:** 2026-07-06, end of Session 64.

---

## Current state

**Phase 0 (Foundation + cleanup) complete.** CI green. Three unused deps deleted (`lenis`, `framer-motion`, `@material/material-color-utilities`). One migration dropped four dead tables (`page_blocks`, `design_tokens`, `style_sheets`, `editor_history`) + enabled RLS on `notify_interest`. Types regenerated + every `as unknown as` shim around `supabaseAdmin()` deleted. Renderer swept — every hardcoded English string routed through `DEFAULT_STRINGS` / `DEFAULT_COUNTS`; missing `<main>` landmarks + About page `<h1>` + `MomentHero` `'use client'` added; nine unnecessary `'use client'` declarations removed; `:focus-visible` ring added. Docs archived to `Project-Docs/historical/`. Audit findings saved to `Audit-2026-07-05.md`. CLAUDE.md required-reading list updated. Master Spec / Tech Arch Spec / Decisions Log superseded sections marked.

**896 tests pass, tsc clean, lint clean (0 errors).**

**Two live test tenants:** `soul-splatter` and `soul-splatter-bright`.

## Next actions

**Session 65 — start Phase 1 (Family layer wiring).**

Six open decisions to lock with Alex before writing code (Full-Plan §1.0):
1. Mood ↔ family map — seven moods currently, six families. Which collapses?
2. Skins vs family paint — retire the 29 skins or keep as within-family variants?
3. Section stack per family — lock the `tmp/mockups/family-stacks-v2.html` proposal or revisit?
4. Nav authoring — delete `identity.nav` from copywriter and derive from family?
5. Founder + Nav per-family defaults — lock now or wire with placeholders?
6. `tenants.family_key` new column vs. reuse `mood_key`?

Then build: family registry (`families.ts`), mood→family map, renderer reads family not content, section stack from family, copywriter authors CONTENT ONLY, paint per family, nav derivation. Rolls in audit fixes: consolidate duplicate data loads, add storefront status/deleted_at filters, persist collections before "live" flip, wire real AbortController on Bohdi calls, publish full Anthropic tool schemas.

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
