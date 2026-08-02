# Session 82 — 2026-08-02

**Split the Moment out of the hero into its own Cozy-only walk step, widened the intro to a once/always/off play mode, and fixed the two things that made it confusing to use. Five commits, all test-first, tsc + lint clean. Alex approved the result and called it for the night.**

## What happened

Picked up Session 81's carried-forward direction (split the Moment and the Hero into two walk steps; explain the section by the mood; rewrite the too-generic language). Ran a proper brainstorm with Alex before touching code, and the design tightened as we went:

- The Moment step gets **two independent controls**: keep-or-reword the fading lines, and — separately — **how often it plays**. Alex widened the old on/off toggle into three choices: **once per visitor (cookie), every visit, or off**. "Keep the moment as designed at onboarding" is one axis; "how often it plays" is a separate config.
- **The Moment belongs to the story hero, not to Cozy per se.** Verified in code: only the `story` hero (`MomentHero`) runs the fade-in timeline; the other five feels open on a static hero that plays nothing. Cozy is simply the only feeling whose hero default is `story` today. So the honest rule is "Moment if your hero plays a Moment," which equals Cozy now and stays correct once section-swap lets any feel adopt the story hero.
- **The walk stays dead simple** (Alex's call): for the walk it's just Cozy, because the walk is a one-time first-run pass that finishes *before* the maker ever reaches try-it-on. Section-swap never enters the walk's world.
- **The editor handles post-walk Cozy adoption.** A maker who picks a non-Cozy feel and later switches to Cozy in the try-it-on editor never saw a Moment step, so the editor must surface a Moment control (keyed off the current hero) and **always give a heads-up** when a change gives their store a Moment. Its default stays `once` with the onboarding-authored lines, so nothing breaks unset. **Alex also stated the broader intention: makers will be able to swap individual sections in the editor** (a Rustic maker choosing a Cozy hero, Moment included) — a separate later build; this session just keyed the Moment logic off the hero so it slots in cleanly.

Alex then said "stop asking and just build it," so the rest was execution + two rounds of live-found fixes.

## Built (5 commits, test-first)

1. `07507bd` — **Play-mode foundation.** `moment.playMode` (once/always/off) added to the schema; `resolveMomentPlayMode` reads it and falls back to the legacy `playIntro` boolean; the gate and the live `MomentHero` render honor the mode. Backward-compatible (old envelopes keep playing).
2. `06f71a7` — **Family-aware step list + `setMomentPlayMode` action.** `walkUiSteps(mood)` splits the hero step into a Moment step (the fading lines) + a Hero step (the resting words) when the hero plays a Moment; every other feel keeps one hero step. Both split steps carry `section:'hero'`, so the completeness gate is untouched. `heroPlaysMoment` / `MOMENT_HERO_VARIANT` centralise which hero owns the Moment. `setMomentPlayMode` persists the choice and resolves the Moment step.
3. `cae241f` — **The split UI.** `page.tsx` resolves the feeling from the envelope and hands `MakeItYours` the family-aware steps + play-mode seed + public feeling label. `SectionEditor` gains the Moment branch (mood-named explanation + three plain play choices) and drops the old toggle. Conversation writes are scoped to the **step's own fields** so the Moment and Hero steps can't clobber each other. Retired `setHeroIntro`. Plainer titles ("The top of your store", not "hero").
4. `d8c6d36` — **Fix (Alex live-found): the lines vanish + no replay.** The Moment plays once and settles, so the fading lines left nothing to read/decide against. The Moment step now shows the current lines in the panel ("Right now it opens with…"), always readable; the preview gains a **"Play it again"** control on the Moment step (reloads the iframe to replay from the top).
5. `f3e1b36` — **Fix (Alex live-found): the Moment kept playing in the preview + no direction.** The maker's play-frequency is for LIVE visitors but was leaking into the editor preview — a cold iframe load with "always" replayed the intro on the Hero step, hiding the resting hero. The gate now takes a `preview` flag (set from `previewStill=1`) under which the intro **never auto-plays** — only an explicit force (the Moment step's `intro=1`) plays. So every non-Moment step rests, in the walk and the main editor alike. Also fixed a Next hint that promised "turn it off" on keep-or-change steps, and rewrote the Moment/Hero step copy to lead with clear direction ("most makers keep it, reword if it doesn't sound like you, then pick how often it plays"; the Hero step plainly says it's the part that stays and what to do).

All green throughout: 1118 tests pass, tsc + lint clean per commit.

## Decisions to draft into the log next session (Claude drafts, Alex reviews)

Carried from Session 81, still owed:
- The walk-is-a-conversation model.
- Walk scope = words + images (Listings included; generated image alternatives a later feature; the look stays its own editor area).
- The founder story writes both surfaces (home snippet + full About).
- The hero first-run intro is a maker keep/modify/turn-off toggle (now widened, see below).

New this session:
- **The Moment belongs to the story hero, not to Cozy.** Cozy is today's only door to it; the walk gates the Moment step on the maker's hero being the story hero (Cozy now). Refines D54.
- **The intro is a once/always/off play mode**, not on/off. `once` = first cold visit per visitor (cookie), `always` = every cold visit, `off` = never. Supersedes the Session-81 on/off `playIntro`.
- **The maker's play-frequency governs live visitors only — never the editor preview.** In preview the intro rests and plays only where the walk forces it.
- **Post-walk Cozy adoption is the editor's job**, with a heads-up whenever a change gives a store a Moment. (Depends on the editor content area, still to build.)
- **Section-swap in the editor is a stated future direction** (any feel adopting the story hero, Moment included) — separate later build.

## Next actions (Session 83)

- **Rest-of-walk language sweep.** The clearer, more-directive tone landed on the Moment/Hero steps; carry it across the other steps (goods, collections, marquee, reviews, contact, close) — their openers still read as before. Alex's eyes gate the copy.
- **Editor content area** — the free-navigation "pick any section and edit it" area in `Editor.tsx`, reusing `SectionEditor`. This is where the post-walk Moment control + the switch-to-Cozy heads-up live.
- **Find-us dates editor** — additive `FindUsRow` fields (event name / address / link), a `setFindUsRows` action, the standalone dates editor in the find-us step + the content area.
- **Finish screen** + a full manual run (Alex's eyes gate it).
- **Listings** — the piece that actually completes the walk. The walk is NOT done until Listings is in it (Alex's standing call).
- Draft the decision-log entries above (Claude drafts in chat, Alex reviews).

## Process notes

- Brainstormed the design with Alex before building (per the guardrail), and it paid off — the "Moment belongs to the story hero" reframe and the "walk stays simple, editor handles adoption" split both came out of the conversation, not the code.
- Verified Alex's "only Cozy has the Moment" claim against the actual hero catalog rather than taking it on faith; it held, and grounded the whole gating decision.
- Both live-found fixes were things tests were green on but the maker experience was wrong — Alex's eyes caught what the suite couldn't (lines vanishing, the preview hijacked by the maker's own frequency choice). The eyes-gate earned its keep again.
