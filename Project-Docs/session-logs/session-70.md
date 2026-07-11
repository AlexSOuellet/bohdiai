# Session 70 — Wallpaper z-index fix + retired-code cleanup sweep

**Date:** 2026-07-11
**Branch:** `session-12/layout-engine` (continued)
**Docs read at start:** CLAUDE.md, SESSION-BRIEF, Full-Plan, Master Spec (full read), Roles-Workflow, Phase-1-Decisions-Log (full read)

## What happened

Session 70 was two threads, in this order.

First: diagnose the reviews-cards fade-out on Cheerful × Living Beauty that Session 69 left open. Root cause turned out to be broader than reviews cards — the family wallpaper layer was painting ABOVE section content on every family, not behind it. Alex noticed and reported it as buttons and backgrounds dimming after they loaded on a couple of families. One CSS change fixed the whole class of symptoms.

Second: Alex asked for an audit of what old-system code the onboarding pipeline still runs before we start Wave E. That surfaced the Try-On feature as a whole retired concept (built for a multi-archetype world that hasn't existed since Session 31, when Gallery was deleted and Main Street became the only archetype). He said go, and the rest of the session was a systematic cleanup — Try-On end-to-end, the orphan streaming endpoint, retired vocabulary in comments and test fixtures, the legacy nav field on the Bohdi schema, and doc scrubs.

Two commits. All tests still pass.

## Wallpaper z-index — the fix and why

`.ms-family-texture` was a `position:fixed` layer at `z-index:0` inside `.arch-main-street`'s `isolation:isolate` stacking context. The author's comment claimed z-index:0 sat BELOW every section (via document flow); it didn't. A positioned element with z-index:0 stacks ABOVE non-positioned in-flow children in the same stacking context. So the wallpaper — Cheerful's confetti at 0.30 opacity, Rustic's burlap at 0.22, Dark's smoke at 0.22, Modern's concrete at 0.22, Cozy's linen at 0.18, Luxury's marble at 0.15 — was washing over every button and section background on every family.

Why it FADED after load: opacity was applied instantly at render, but the wallpaper PNG had to download before that opacity had anything to apply to. Empty PNG × 0.30 opacity = nothing visible. Downloaded PNG × 0.30 opacity = a visible wash that suddenly appears. That's the "dimmed after they loaded" moment Alex saw.

Fix: change to `z-index:-1`. Because `.arch-main-street` has `isolation:isolate`, negative z-index gets clamped to the bottom of THAT stacking context — so the wallpaper sits above the container's surface color (`var(--ms-bg)`) but below every section. Comment rewritten to describe actual behavior. One-line change, killed both the reviews-cards Cheerful fade AND the broader dimming Alex saw on multiple families. Alex confirmed "much better" across every family.

Commit `afd0f6d` bundled the fix with three doc updates: closed Wave B item B2 (shop-teaser CTA truncation — shipped Session 67 in commit `93c53c3` but the checkbox was never flipped), closed Wave C's "contrast pair reads samey" item (verified every skin now declares a family-appropriate contrast pair — the doc entry was written before those landed), and dropped the reviews-cards fade + Saltgrass "residual" from the SESSION-BRIEF carry-forward. The Saltgrass observation was a Session-69 Claude-inserted note that Alex never actually reported — corrected to drop and flagged as a memory lesson.

## The audit

Alex asked: before Wave E, where is the onboarding pipeline still using old-system patterns. A general-purpose agent walked the whole pipeline end-to-end and returned findings grouped by category (retired concepts, retired values, discipline violations, redundancy). Then Alex made a bigger correction that reframed the whole audit — "archetypes are totally dead."

That correction mattered. Session 31 collapsed the archetype catalog to Main Street only (D36). Every "archetype" reference in the codebase since has been a single-item collection with a lot of surface area preserved for a world that no longer exists. The Try-On feature was the biggest surface — its whole job was converting a store from one archetype to another. The Try-On page's own comment said: "runs a Gallery→Main Street conversion in place." Gallery is deleted. So Try-On has no job.

Also worth recording: I confused Alex earlier when I said "the Try-On tool still runs old Bohdi." Editor Door 1 (the mood swap at `/dashboard/website`) and the Try-On tool (the admin thing at `/admin/tryon`) are TOTALLY different code paths. Editor Door 1 uses `applyLookToEnvelope` — pure renderer re-skin. Try-On uses `authorFromPortable` → the pre-crew Bohdi one-shot prompt. What Alex tested in Session 69 was Editor Door 1, which IS the new work. The Try-On tool nobody's tested with the new model because its whole reason to exist retired three months ago.

My prior memory said "Try-On is in launch scope." That was written when archetypes were still a concept. It's stale. Not carrying it forward.

## Cleanup scope executed

**Deleted whole feature — Try-On:**
- `app/admin/tryon/page.tsx`, `app/admin/tryon/TryOnButton.tsx`
- `app/api/admin/tryon/route.ts`
- `lib/tryon/` — all six files (author-from-portable, convert, write-version, plus tests)
- `scripts/run-tryon.ts` — CLI harness
- `lib/archetypes/portable.ts` — the `PortableStore` type (only Try-On consumed it)
- `lib/archetypes/handoff.test.ts` — tested the `handOff` method used only by Try-On
- `lib/archetypes/main-street/builder.niche.test.ts` — tested the retired `authoringSpec` prompt
- `store_versions` database table (drop migration `20260711000001_drop_store_versions.sql` applied; types regenerated)
- Try-On preview branch inside `app/storefront/_components/StorefrontPage.tsx` (the `?v=<label>` reader)
- `authoringSpec` function (~50 lines of retired prompt) from `lib/archetypes/main-street/builder.tsx`
- `authoringSpec` requirement from `ArchetypeBuildSpec` interface in `lib/archetypes/builder.ts`
- `handOff` function and interface method (Try-On's data-hand-off)

**Deleted other truly-dead:**
- `app/api/onboarding/generate/route.ts` — orphan SSE endpoint, no caller in the UI. Was an unauthenticated POST that could burn crew tokens.
- `generateStorefront` non-streaming fallback in `app/onboarding/actions.ts` — no caller
- `app/storefront/gallery/page.tsx` — retired Gallery route (mapped to nothing; would fall through to home)
- `tmp/style-sheets/mood-botanical.json`, `mood-simple.json`, `mood-sunset.json` — retired moods

**Scrubbed retired vocabulary:**
- Six skins in `skins.ts` had `'industrial'` mood tags — industrial retired Session 69, tags never fired. Removed.
- Main Street `index.tsx` had `moods: ['cozy', 'rustic', 'simple', 'modern']` — simple retired. Now lists all six current moods.
- `cinematographer.ts` doc comment referenced retired `SpotlightStage`. Updated.
- `log-choices.ts` comment referenced retired 'image' kind + 'spotlight'. Updated.
- `copywriter.ts` comment mentioned "treatment bodies" — copywriter no longer picks treatments (families own them). Updated.
- Multiple crew test files (cinematographer.test.ts, director.test.ts, log-choices.test.ts, pipeline.test.ts, trajectory.test.ts, copywriter.test.ts, normalize-copy.test.ts) had `spotlight`, `sunset`, `image`, `.treatment`, `identity.nav` references — cleaned. Variables named `spotlightTrajectory` renamed to `stillTrajectory`, etc.
- `schemas.test.ts` had three `identity.nav`-testing tests — deleted the two that no longer applied, rewrote the third to assert the schema now silently strips a legacy `nav` field from old envelopes.

**Removed legacy schema fields:**
- `NavItem`, `NavEntry`, and `identity.nav` in `lib/archetypes/main-street/schemas.ts`. The crew doesn't author nav (§1.7); the renderer builds nav from the fixed page list. These were kept "for backward parsing" but silently. Now genuinely gone; Zod strips a legacy `nav` field on an old envelope by default.
- Six other renderer test fixtures had `identity: { wordmark, nav: [...] }` — cleaned.

**Doc scrub:**
- `Family-Style-Sheets.md` — `Playful` → `Cheerful` throughout (rename landed in D58/Session 44, the doc lagged). Also renamed the two mockup files `playful-stylesheet.html` → `cheerful-stylesheet.html` and `playful.html` → `cheerful.html`.
- `Family-Layout-Model.md` — "single-section try-on" → "single-section preview" (the try-on tool is gone; the sentence meant plain-English trying-on-a-look).
- `Editor-Design.md` — dropped "Industrial" example (retired mood), softened "magic of a try-on" to "magic of trying it on".
- `Editor-Design-Notes.md` — the "structure lever" bullet said "the try-on, D35" as if that concept were still real. Rewrote to point at Editor Door 1 as the mechanism.
- `Full-Plan.md` §6.1 — the two admin-try-on gating items (Audit #1) are closed as retired, not deferred.

**Deliberately NOT touched:**
- `lib/archetypes/*` shared contract (types like `ArchetypeBuildSpec`, `AuthoringBrief`, `MediaJob`). Main Street uses this abstraction. Collapsing it into just Main Street would be a bigger refactor. Recorded as out of scope; revisit only if it's getting in the way.
- Graphic Artist stage still picks a skin the pipeline throws away. Not fully dead — the pick still feeds the Director's Cut prompt as context. Removing it means updating the Director's Cut too. Separate change.
- `StepMood.tsx` at onboarding still hardcodes each mood's palette hex and font inline (a discipline violation flagged in the audit). Real bug in live code but not "unused code" — separate job.
- `MainStreetTreatments` and `resolveTreatments` in `builder.tsx`. The audit called these "stranded" but they're live — Editor Door 1 uses them for preview URL overrides. Not dead.
- Master Spec inline references to retired concepts — the three superseded sections already carry SUPERSEDED banners; scattered inline references left as-is since the sections are marked at the heading.

## Verification

- tsc clean.
- lint clean (0 errors, 4 pre-existing `<img>` warnings unrelated to this work).
- Full test suite: 925 pass (down from 940 because the retired-feature tests came with the deletions — expected).
- Alex ran onboarding, opened an existing store, and tried the mood swap on `/dashboard/website`. All three worked.

## Two things Alex owes going into Session 71

1. Kill the running dev server and delete `.next/` clean. I ran `rm -rf .next` mid-session to clear a stale Next.js route validator; the dev server had files open and only some deleted. Turbopack cache now points at SST files that don't exist. Corruption is fixable by killing the server, deleting the folder clean, and restarting.
2. Nothing else.

## Standing lessons from this session

- **When the renderer distorts what the crew produced, you can end up "fixing" the crew for problems the renderer is causing.** The wallpaper wash was invisible in the sense that "there's a fullscreen overlay dimming everything" wasn't on anyone's list of suspects. It colored perception of Cheerful reads muddy, Dark looks generic, contrast surfaces read as "white and charcoal." Before adding another guardrail to a crew stage, verify the renderer isn't the source.
- **`z-index:0` on a positioned element paints ABOVE non-positioned in-flow siblings in the same stacking context. `z-index:-1` inside an `isolation:isolate` container clamps to the bottom of the context.** The old comment claimed the opposite — physically wrong, and it survived because the wallpaper only became visible after the PNG loaded, so "the code says it works" and "the render looks right at first paint" both held for months.
- **A retired concept can leave a whole live feature behind if nobody sweeps.** Try-On existed because archetypes existed. Archetypes retired in Session 31; Try-On stayed live for over three months, wired to a database table, an admin page, a CLI script, a rendering branch, and a pre-crew prompt. My earlier memory even said Try-On was launch scope. It wasn't. Ambient concepts don't self-clean.
- **When Claude "carries forward" observations into SESSION-BRIEF that Alex didn't actually report, they become invented open items in the next session.** The Saltgrass "residual" was mine. Alex didn't recognize it because he hadn't said it. Do not put unreported observations in the brief as if they were owed follow-ups.
- **Don't drop mid-conversation into task-tracker mode.** The system prompt kept asking about TaskCreate. Use it for real multi-step work like this cleanup, but don't create pretend tasks to satisfy a reminder.
- **Every "you're 10000% sure?" from Alex is real. Verify against actual code, not memory or agent report.** The Try-On/Editor Door 1 confusion was mine because I let one paragraph read as if he'd tested Try-On when he tested Editor Door 1. Different code paths, similar English word.
