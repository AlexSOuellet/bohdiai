# Session Brief — BohdiAI

**Purpose:** the operational state a fresh session needs to start — current state, next actions, and the standing lessons that carry forward. **Stays under 100 lines.** Detailed per-session recaps live in `session-logs/session-NN.md`. At the end of a session, write the recap there, add a one-line entry to the index at the bottom of this file, and update only the Current State + Next Actions sections here. Do not paste full recaps back.

**Operative plan doc:** `Project-Docs/Full-Plan.md`. Every session reads it. Every session updates its checkboxes.

**Last updated:** 2026-07-06, Session 65.

---

## Current state

**Phase 0 complete. Phase 1 decisions all locked with Alex (Session 65).**

Phase 0 recap: CI green. Three unused deps deleted. One migration dropped four dead tables + enabled RLS on `notify_interest`. Types regenerated + every `as unknown as` shim around `supabaseAdmin()` deleted. Renderer swept — every hardcoded English string through `DEFAULT_STRINGS`/`DEFAULT_COUNTS`; missing `<main>` landmarks + About page `<h1>` + `MomentHero` `'use client'` added; nine unnecessary `'use client'` declarations removed; `:focus-visible` ring added. Docs archived to `Project-Docs/historical/`. Audit findings saved to `Audit-2026-07-05.md`. Master Spec / Tech Arch Spec / Decisions Log superseded sections marked.

Phase 1 decision lock (see Full-Plan §1.0 for the full record): mood stays public, `mood_key` stays the storage column, family is internal only; skins stay + grow as within-family editor options; v2 stack orders locked for all six families BUT every section is on by default at onboarding (v2's length-as-lever is retired — onboarding always ships the full stack so the maker never sees a thin site); sections without per-family designs (Footer, Close CTA band, Contact page, FAQ page) share one shape for now; nav renders every page created at onboarding, per-section on/off toggles come with the editor in Phase 3; Reviews seed at onboarding as sample content; Dark hero = Floating Card and Luxury Products = Switcher both locked; Industrial mood retires.

**938 tests pass, tsc clean, lint clean (0 errors).**

**Two live test tenants:** `soul-splatter` and `soul-splatter-bright`.

## Next actions

**Session 65 continues — Phase 1 code work.**

1. Doc cleanup commit (Full-Plan §1.0 cleanup list): clear the "Dark hero unsold" footnote + Switcher amber in `tmp/mockups/defaults-matrix.html`; strip the stale caveats in `tmp/mockups/family-stacks-v2.html`; verify the Reviews-built claim (confirmed — matrix is right, v2 caveat is stale on Reviews; Contact home-block genuinely not built).
2. Phase 0 visual sign-off gate: Alex eyeballs `soul-splatter` + `soul-splatter-bright` post-renderer-sweep and confirms they render right.
3. Family registry (`lib/archetypes/main-street/families.ts`) — six entries seeded from the defaults matrix + v2 stacks + Family-Style-Sheets.
4. Renderer reads family via `mood_key` lookup, not from `content.<section>.treatment`. Section stack walks `family.sectionStack`.
5. Copywriter authors CONTENT ONLY — delete `.treatment` fields, delete `identity.nav`. Reviews sample content stays authored.
6. Nav renders from page inventory with family-picked variant.
7. Audit fixes ride along in the phases they touch: consolidate duplicate data loads (1.3), add storefront `status='active'` + `deleted_at IS NULL` filters (1.3), persist collections before "live" flip (1.9), wire AbortController on Bohdi calls (1.5), publish full Anthropic tool schemas (1.5).

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
