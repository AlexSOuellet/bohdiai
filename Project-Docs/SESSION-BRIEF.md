# Session Brief — BohdiAI

**Last updated:** 2026-05-29 (Session 11 — "5-28 session 2" — streaming build progress, voice questions step, gender-aware image briefs, punctuation sanitizer, font curation standard, plus a major architectural conversation about replacing the catalog with a composition language)

**Update at the end of every session.**

---

## Action at session start

**Read this whole brief before the first response.** Session 11 shipped real polish to the existing pipeline and walked a significant architecture pivot in conversation. The polish work is real and survives the transition; the architecture work is documented but not started. The next session's primary work is **starting the layout engine in code**, not more polish on the catalog. The catalog is the structural problem and was named as such — every site generated against it today is sunk cost when the engine lands.

Session 11 work is committed on branch `session-11/build-streaming` and pushed. Three commits on top of main:

- `b2acde3 feat(session-10): wordmark treatments, logo upload + Vision colors, photo magnet maker niche, /about as stored page, nav order rule` — yesterday's work, committed at session 11 start
- `cb59b1b docs(session-11): layout language draft — primitives and style intent` — the architecture doc
- (final session 11 commit hash to be added after this brief is written) — the streaming + four polish items + the rest of the layout language doc + this brief

The database is still empty as of end of session 11. No tenants. No design choices. No storage files. Clean slate to test against next session.

The dev server was NOT started in this session — Alex manages his own per `feedback_no_preview_unless_asked`. He will run it tomorrow.

---

## How Claude works with Alex (operating rules for the assistant)

These are throughline rules for every session, not just session 11. New sessions should treat these as binding. The new rule for session 11 sits at the top.

**Don't narrow scope on approval.** New as of session 11, banked in memory at `feedback_dont_narrow_scope_on_approval.md`. When Alex approves with an ambiguous referent ("let's add that," "do it," "go") in a conversation that has covered multiple items, do not silently latch onto the easiest sub-item and treat it as the full scope. Confirm what's in scope before executing. The failure mode this session: a long conversation about fixing the broken catalog design pointed at streaming (small), four polish items (small), and the layout engine (big — the actual fix). Alex said "let's add that then... see if it works" referring to streaming, and Claude executed streaming + the four polish items, reported done, and the layout engine never got started. Alex's words: "if I had started testing I would have been pissed it all still looked the same."

**Respect the rules — never overlook one because it doesn't fit your plan.** Carried from session 10, at `feedback_respect_rules_no_justifying.md`. When caught breaking a rule, acknowledge and fix, never justify.

**When Alex says something is wrong, that is NOT permission to fix it.** Carried from session 10. Diagnose and surface, then wait for direction. Observations are not requests.

**Don't prescribe. Propose.** Hand over raw materials and trade-offs; let Alex make the call.

**Push back on overengineering, including your own.** When proposing a new abstraction or validation layer, ask "is this required to ship, or am I doing it because it's interesting?" If the second, stop.

**Plain English in chat. No structured documentation reflex.** No bullet lists when 2-3 sentences would work. No section headings, bold labels, decision IDs, or jargon Alex didn't use first. Documentation reflex is fine in `.md` files; in chat it loses Alex. Session 11 hit this multiple times — Alex called out "your documentation is tough to read. my mind goes fuzzy" mid-session.

**One question at a time when walking decisions.** Multi-part questions overwhelm.

**Don't invent under pushback.** Acknowledge and wait. Don't fill the gap with a new guess.

**Don't give time estimates.** Frame work by dependency, not weeks or sessions.

**Push back on scope drift.** Name it and surface the trade-off, don't absorb it silently.

**Never start preview/dev servers unless explicitly asked.** Alex manages his own dev environment.

**Tell Bohdi how to think. Don't tell him what to choose.** Quality bar = OK. Variant selection = not OK. From D28.

**Stop prompt-tuning to test cases.** When a generation comes out wrong, the reflex is to add a paragraph to Bohdi's system prompt. That's whack-a-mole — LLMs rationalize anything. The real levers are materials, deliberation mechanics, and output review.

**Don't play safe directing the safe AI.** Claude's safe-mode shows up as hedging, fallbacks, building competent-but-not-aggressive implementations of bold-named features. Session 11 hit this directly — the four polish items shipped instead of the layout engine. Bohdi inherits the timidity through the catalog and prompts Claude builds.

**No hardcoded pages.** Set in session 10. Every storefront route corresponds to a `content_pages` row. Carried forward — the layout engine has to honor this too.

**Nav order rule (hard).** Set in session 10. Shop first, conditional items in the middle, About second-to-last, Contact last. Shop, About, and Contact are baseline. Carried forward.

---

## State of the build

Bohdi is alive. Leatherworker and photo_magnet_maker route through the agent loop for any mood. Other niches use the legacy one-shot pipeline. Both paths now stream real progress events to the build screen via SSE.

**Onboarding is now 7 steps:** Name (shop name + maker name on one screen) → Niche → Logo (optional) → Mood → Voice (booth pitch + negative space, both optional) → Trial → Build. The voice step is new. The maker name field is new on step 1.

Storefront output is structurally the same as session 10. Same 7-color schema. Same frozen block catalog. Same nav/footer auto-injection from Bohdi's finalize. The streaming work changed what the maker SEES during the build (truthful real-time status + rotating tips + elapsed counter + final build time) but it did not change what gets built. **The cage is intact.**

The four small fixes that landed this session are all polish on the existing catalog architecture — they improve quality within the cage but do not change the cage.

Bohdi's compose path: he reads niche + mood + maker voice + brand colors, deliberates with at least 2 candidates per choice via `log_decision`, picks blocks from the catalog (`list_blocks`), threads widgets into slot openings (`list_widgets` — one widget actually exists, `cta-button`), sets tokens for the 7-color schema, composes the home page block-by-block, writes secondary page copy, writes the long /about article, briefs images for fal, commits via `finalize`. Finalize sanitizes all text fields through the new punctuation sanitizer, hardcodes nav-centered-wordmark + footer-classic blocks, hardcodes the shop/about/contact page block compositions, and writes everything atomically via `writeStorefront`.

Mood lineup stays at seven: Dark, Rustic, Cozy, Botanical, Sunset, Simple, Modern.

Block catalog: 32 active blocks (same as end of session 10).

Database is empty.

---

## What got built this session (session 11)

### Streaming build progress (SSE end-to-end)

The cosmetic 5-step animation on the build screen is gone. Replaced with a real Server-Sent Events stream from a new route at `/api/onboarding/generate`.

`lib/progress.ts` — progress event types (`status`, `tip`, `done`, `error`), labelFor() with personalization, stepForTool() mapping. 17 named steps cover the meaningful moments of generation. Labels personalize with the maker's name when present.

`lib/bohdi/run.ts` and `lib/bohdi/tools.ts` — Bohdi's run loop accepts an `onProgress` emitter. Emits a status event before each tool call. Tools that need sub-events (generate_image — kind isn't known at dispatch time) emit their own kind-specific events from inside the handler.

`lib/onboarding/run-storefront.ts` — new dispatcher module. Houses both the Bohdi gate and the legacy pipeline. Both accept the optional `onProgress`. The legacy pipeline emits coarser events at each stage (starting → choosing palette → composing home → generating product images → generating hero image → finalizing). Moves the entire legacy `runGeneration` out of `app/onboarding/actions.ts` and into a non-server-action module so the SSE route can call it directly.

`app/onboarding/actions.ts` — slimmed to the subdomain check + a non-streaming `generateStorefront` server action as fallback.

`app/api/onboarding/generate/route.ts` — new SSE route. Accepts the same input as the server action plus `voiceBoothPitch`, `voiceNegativeSpace`, `makerName`. Runs the dispatcher, pipes progress events to the stream, runs a tip-emit timer at 8-second intervals from a tip pool (encouragement + niche-extracted facts), emits a final `done` event with subdomain + tenantId + totalMs when generation completes.

`lib/onboarding/ticker-content.ts` — pulls maker-relevant tips from the niche `body_markdown` (sentence extraction with length filter) and assembles encouragement lines personalized with the maker's name.

`app/onboarding/_components/BuildTicker.tsx` — new ticker component. Cross-fades status and tip changes with opacity transitions. Elapsed counter visible always with a pulsing dot.

`app/onboarding/_components/StepBuild.tsx` — rewired from server action to `fetch` + EventSource parsing. Reads each SSE event, dispatches to state. Removes the cosmetic animation entirely. Removes the "watch your site build" wording. Shows total build time on the success card ("Built in 3:24").

The streaming infrastructure passes `makerName`, `voiceBoothPitch`, `voiceNegativeSpace`, `logoUrl`, `brandColors` through to the dispatcher and through to Bohdi's brief.

### Maker name field on onboarding screen 1

`app/onboarding/_components/types.ts` — `OnboardingData` gains `makerName` field. INITIAL_DATA default empty string.

`app/onboarding/_components/StepName.tsx` — paired-field layout. Shop name and first name on one screen. Both required to continue. Headline changed to "First things first." The maker's first name flows through the rest of the pipeline.

### Voice/grounding questions step

New step at position 5 (between Mood and Trial). `app/onboarding/_components/StepVoice.tsx` — two open text areas. Booth pitch ("If someone walked up to your booth at a craft fair, what would you tell them?") and negative space ("Anything you don't want your site to feel like?"). Both optional. Personalized headline opens with the maker's first name when present.

`OnboardingData.voiceBoothPitch` and `voiceNegativeSpace` carry the answers through.

`OnboardingFlow.tsx` — TOTAL_STEPS = 7. Step ordering: Name → Niche → Logo → Mood → Voice → Trial → Build.

The voice material flows through to Bohdi's initial user message under a "MAKER'S OWN VOICE" section. Bohdi is instructed to use the answers as raw material — not paraphrase into generic copy. When empty, the section is omitted entirely (graceful absence, not awkward placeholders).

### Gender default for image briefs

`lib/name-gender.ts` — new file. First-name → likely gender lookup table. ~200 common female names, ~200 common male names. Unisex (in both sets) or unknown (in neither) falls back to female — 60%+ of the maker audience. `personPhrase()` returns noun/possessive/subject pronouns for the inferred gender.

`lib/fal.ts` — image prompt builders rewritten. Previously instructed "no people" and "no identifiable faces" — but FLUX ignores negation and included people anyway. Now the prompts EXPLICITLY include a person of the inferred gender. Hero is a lifestyle shot of the maker working in their craft. About portrait is the maker focused on the work in their studio. Product photography stays object-only.

The gender flows from `BohdiBrief.makerName` → `inferGenderFromName()` → `moodSignal.gender` → `fal` prompt builders. Same path in the legacy pipeline.

### Punctuation sanitizer

`lib/copy-sanitize.ts` — new file. `sanitizeCopy()` strips em-dashes, en-dashes, semicolons, and parenthetical asides from a single string, replacing em/en/semicolons with period + capitalized next word so the result is two clean sentences instead of a punctuation-heavy run-on. `sanitizeDeep()` recursively applies the same transform to every string value in an object or array.

Applied at finalize time in BOTH paths:
- Bohdi: `lib/bohdi/tools.ts` finalize handler walks the accumulator (homePage, shopPageCopy, contactPageCopy, aboutPageContent, collections, listings, subscriptions) before writing.
- Legacy: `lib/onboarding/run-storefront.ts` wraps pages, collections, listings, subscriptions in `sanitizeDeep` before calling `writeStorefront`.

Bohdi's system prompt also got the punctuation rule under TECHNICAL CONSTRAINTS plus an "AI-TELLS TO AVOID" section listing platitudes ("crafted with care," "every piece tells a story," "where modern meets timeless," etc.) so he avoids them in the first place. The sanitizer is the floor in case he doesn't.

### Font curation standard in niche-writer skill

`.claude/skills/niche-writer/SKILL.md` — added a "Display and heading fonts have to earn their place" paragraph to the fonts curation section. Names Inter, Lato, Source Sans, Open Sans, Roboto, Nunito, Work Sans, Karla, DM Sans, PT Sans as body-only fonts (utilitarian sans-serifs that read as template-default in heading positions). Requires at least one character-forward display option and one character-forward heading option in every style sheet. Self-check list updated with a corresponding line.

### Layout Language doc

Major addition. The architecture pivot was the conversation, not the build. `Project-Docs/Layout-Language.md` carries the design:

- Section 1 — primitives (band, stack, row, split, grid, overlap, bleed, pane, marquee, gutter) with stated mobile collapse behavior per primitive. Mobile is first-class with per-node overrides.
- Section 2 — style intent. Palette and font roster are vocabulary with character, not pre-assigned roles. Bohdi assigns roles per composition. Roles emerge from usage rather than declaration. Contrast is enforced as the floor.
- Section 3 — content layer. Two flavors (authored + bound). Widget concept collapses into content node types.
- Section 4 — what still has to be designed. Patterns library, the Bohdi compose tool, the renderer, the tenant DesignTokens replacement, reference exemplars (`study_references`), the art director output-review pass, the iterative process (3 candidate compositions per page), Bohdi reading his own past work (`recent_sites`).

This is the architecture record. The next session loads it at start.

---

## What did NOT get built (the structural fix)

Named explicitly so the next session does not lose this thread:

- The seven-color DesignTokens schema is still in `lib/tokens.ts` and still the only thing Bohdi can set.
- The frozen block catalog is still in `blocks/`. 32 active blocks. Bohdi still picks from a list.
- Nav and footer are still hardcoded by finalize. Bohdi does not compose them.
- Shop/about/contact secondary pages are still hardcoded block compositions in finalize. Bohdi does not compose them.
- The widget concept is still a separate registered idea with one entry (`cta-button`).
- No layout primitives exist in code. No renderer exists. No `set_layout` tool exists.
- No reference exemplars tool. No art director. No iterative process. No `recent_sites`.
- Patterns library has no shape.

The streaming, voice, gender, punctuation, font work all survives the transition — they're inputs to the new system. The catalog itself is what's being replaced. Nothing this session moved that work forward.

---

## Open decisions (need to be made before more building)

### 1. Start the layout engine — when and in what sequence

Alex's call. Locked in conversation: the layout engine is the next real work and should be next session's focus, not more polish. The build sequence I proposed earlier:

1. Layout primitives in TypeScript — the schema for each primitive (band, stack, row, split, etc.), nesting rules, mobile collapse behavior, style intent slots.
2. Renderer — recursive React component that walks a tree of primitives and emits HTML/CSS.
3. Hand-author 5 sample trees for niche × mood combos and render them to prove the language works.
4. New tokens model — named palette + font roster + texture set as JSONB on the tenant. Migration plus a token loader that emits CSS variables for every named color.
5. New Bohdi compose tool — `set_layout` accepts a layout tree per page. Replace `set_home_page`, `set_tokens`, `set_about_page` with the unified compose.
6. Wire Bohdi to compose end-to-end against the new tools. First run is intentionally rough — iterate from there.
7. Expand patterns library — partial trees Bohdi can study before composing.
8. Build the art director — second-pass review.
9. Build `study_references` and `recent_sites` tools.
10. Migrate or delete the existing 32-block catalog as the new system covers the same surface.

Open: do we keep the legacy pipeline alive during the transition or wipe it once Bohdi can compose? Keeping it adds complexity. Wiping it means no fallback for the 17 non-Bohdi niches until they have style sheets.

### 2. Niche for testing

Alex asked for a third Bohdi niche that fits any mood. Recommendation: **candles**. Universal across all 7 moods. Niche file already exists at `content/niches/candles.md` in the old shape and would need to be stripped + style sheet authored.

Alternative: stick with leatherworker (the most universal of the two existing Bohdi niches) for the layout-engine build. Add candles later when the engine is real.

### 3. Hardcoded pages refactor

Carried from session 10. Cart, collections, collections/[slug], listings/[slug], subscriptions, legal — all still hardcoded layouts. The layout engine will resolve this naturally once it ships; the question is whether to interim-fix or wait.

### 4. Photo magnet maker niche revision

Still biased toward Rhody Strong's product line. Needs revision before more makers in that category onboard.

### 5. Commit + push — DONE this session

This session's work was committed and pushed to `session-11/build-streaming`. Next session opens with the question of whether to merge to main, continue on the branch, or branch fresh for the engine work.

---

## Open items (carried from earlier sessions, still applicable)

1. Streaming build progress — DONE this session. Remove from carried list.
2. Doer storefront rendering pattern
3. Master Spec touch-up to reflect D1–D31 and recent sessions
4. StepTrial copy — confirm exact price before wiring Stripe
5. Per-tenant AI usage caps (Phase 2 dashboard)
6. Etsy/Shopify import (Phase 2)
7. Marketing copy update — drop "live in minutes"
8. Rate limit reset before launch (MAX_PER_WINDOW back to 3)
9. Sentry + PostHog signup
10. Inspiration URL / site reference — needs proper spec before rebuilding
11. Block swap in dashboard
12. Per-IP rate limit on `/api/contact` and `/api/notify-interest`
13. Stripe Subscriptions integration
14. Page-options dashboard
15. Collection thumbnails
16. `collections-row` forcing on home when collections exist
17. Subscription image error handling
18. First-load image timing race
19. Vercel main-branch deploy failure (carried — needs verification once session-11 merges)
20. Strip the other 17 niche files (carried from session 9 — still pending)
21. Build niche style sheets for the other 17 niches (carried from session 9)
22. Run Bohdi across multiple niches × moods to verify variety (carried from session 9)
23. Drop the BOHDI_NICHES gate entirely once all niches have style sheets and Bohdi handles wide range well.

---

## Future features banked (post-Phase-1 / launch wave)

Unchanged from session 10. Tenant-side mood regeneration, preview-before-save, mood samples in the picker, sample gallery on bohdiai.com, mood slider in the editor, Vision review on images, per-tenant agent persistence, live-storefront-preview during build (the bigger version of the streaming work).

---

## Lessons banked this session (carry forward)

**Discussing a thing is not the same as building it.** The session 11 pattern Alex called out: a long architectural conversation, agreement on principles, then Claude builds the easy polish items and the structural fix never starts. The new memory rule `feedback_dont_narrow_scope_on_approval.md` codifies this — when approval comes with an ambiguous referent, confirm scope before executing.

**Polish on a broken structure is sunk cost.** Every site generated with the current catalog architecture is going to look the same as the last one when the layout engine lands. Quality-within-the-cage feels productive — tests pass, typecheck clean — but the visible problem doesn't move. The four polish items shipped this session do survive the transition as inputs to the new system, but they're not what was being asked for in the structural conversation.

**Telling Bohdi rules works less than enforcing them in code.** Three landings of this principle this session. The punctuation rule lives in BOTH the system prompt AND a server-side sanitizer because the prompt alone can't be trusted. The AI-tells platitude list is in the prompt but won't be enforced until the art director ships. The font curation standard is in the niche-writer skill — that's enforcement at authoring time, which is the right layer for it. The pattern generalizes: a constraint in the prompt is a hope; a constraint in code is a guarantee.

**FLUX ignores image-prompt negation.** Telling the model "no people" did not produce images without people. Same shape of failure as Bohdi rationalizing past prompt instructions. The fix: don't tell it what NOT to do; tell it what TO do, explicitly. The new image prompts include people deliberately with a default gender, instead of trying to suppress them.

**Maker name has rules.** Captured at onboarding. Used for chrome personalization ("Sarah, choosing your colors..."). Used as a signal for the about portrait's default human gender. Never tacked onto the shop name. Never used as the about-page signature unless the maker is explicitly personal-branding. Default signature is no signature, or shop name.

**Plain English in chat — still hitting this.** Alex explicitly said "your documentation is tough to read. my mind goes fuzzy" this session. The doc/spec reflex appears in chat as dense prose. Conversational delivery, short paragraphs, examples woven in. Docs are for record, chat is for processing.

---

## Required reading at session start

1. `CLAUDE.md` at the project root
2. `Project-Docs/SESSION-BRIEF.md` — this file
3. `Project-Docs/BohdiAI-Master-Spec.md` — full product spec (hard rule from CLAUDE.md)
4. `Project-Docs/BohdiAI-Roles-Workflow.md`
5. `Project-Docs/Phase-1-Decisions-Log.md` — D1–D31
6. `Project-Docs/Phase-1-Spec.md` — current phase spec
7. **`Project-Docs/Layout-Language.md`** — architecture record for the next big build (added session 11)
8. Memory at `~/.claude/projects/C--Projects-BohdiAI/memory/MEMORY.md` and the linked files — especially `feedback_dont_narrow_scope_on_approval.md` (new this session) and `feedback_respect_rules_no_justifying.md` (still active)

---

## What's in the DB

Database is empty (still — no test runs in session 11). All 43 prior test tenants wiped at end of session 10. design_choices empty. design_tokens empty. content_pages empty. Storage buckets empty.

Niches table: 19 niches at `status=approved` including `photo_magnet_maker` (session 10). The other 18 are pre-session-10 in the old shape. The 17 not-yet-stripped niches are still in the queue.

Migrations applied through `20260529000004`. No new migrations in session 11.

Migration runner: `node scripts/db-migrate.mjs`

Storage buckets: `placeholder-images` (legacy, unused), `generated-images` (active — fal.ai output), `tenant-logos` (active — uploaded logos, session 10). All empty.

---

## Critical env var note

(Unchanged.) Claude Code injects `ANTHROPIC_API_KEY` and `ANTHROPIC_BASE_URL` into child processes. `.env.local` cannot override these. Fix: use `BOHDIAI_ANTHROPIC_KEY` in `.env.local` with explicit `baseURL: 'https://api.anthropic.com'` in `lib/anthropic.ts`. Do not rename this back. `.env.local` must also have `FAL_API_KEY`. Vercel needs both env vars set in the dashboard for production deploys.

---

## Tasks at end of session 11

```
#1.  [completed] Add SSE route for streaming onboarding generation
#2.  [completed] Thread progress callback through Bohdi run loop
#3.  [completed] Thread progress callback through legacy generation
#4.  [completed] Build ticker content source from niche file
#5.  [completed] Build full-screen ticker component
#6.  [completed] Rewire StepBuild to use SSE and ticker
#7.  [completed] Show build time on success card
#8.  [completed] Add voice/grounding questions step to onboarding
#9.  [completed] Default image human gender from maker name
#10. [completed] Punctuation blacklist on generated copy
#11. [completed] Font curation standard in niche-writer skill
```

All polish work complete. Task list resets next session. New tasks at the start of session 12 should be drawn from the layout engine build sequence in Open Decisions #1.
