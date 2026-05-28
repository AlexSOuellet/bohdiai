# Session Brief — BohdiAI

**Last updated:** 2026-05-27 (Session 8 — control audit, style sheets, low-control test, events bug, agent framing)

**Update at the end of every session.**

---

## Action at session start

**Rotate the Supabase key.** Pull a fresh service-role key from the Supabase dashboard and update `.env.local` before doing anything else. The current key needs to be replaced.

Once rotated: strip the secret-containing permission lines from `.claude/settings.local.json` (lines that contain `sb_secret_` in any of the recorded Bash/curl permissions), recommit on top of local commit `35040f8`, then `git push origin main`. Two commits will go up together (the session 8 work + the secret strip).

---

## How Claude works with Alex (operating rules for the assistant)

These are throughline rules for every session, not just session 8. New sessions should treat these as binding.

**Don't prescribe. Propose.** The same "WHAT vs HOW" principle that applies to AI generation applies to Claude in chat. Hand over raw materials and trade-offs; let Alex make the call. "My judgment call on what fits" is the wrong framing — it closes doors instead of opening them. The fix is to propose options with honest trade-offs, mark a recommendation if asked, and wait for Alex to choose.

**Push back on overengineering, including your own.** Alex flagged repeatedly this session that Claude over-engineers and over-controls. The reflex to add infrastructure, write generators for things that could be done by hand, build documentation for the documentation — all real and recurring. When Claude catches itself proposing a new generator, a new abstraction, or a new validation layer, the question to ask is "is this required to ship, or am I doing it because it's interesting?" If the answer is the second, stop.

**Plain English in chat. No structured documentation reflex.** No bullet lists when 2–3 sentences would work. No section headings, bold labels, decision IDs, or jargon Alex didn't use first. No "per the Master Spec §6.3" style references. Conversational prose lands. The structured-list reflex is documentation; documentation belongs in `.md` files, not chat.

**One question at a time when walking decisions.** Multi-part questions ("should we do X, and if so, how, and when, and what's the cost?") overwhelm and produce surface answers. Sequential one-at-a-time produces real answers.

**Don't invent under pushback.** When Alex pushes back, acknowledge and wait. Don't fill the gap with a new guess — that compounds the original mistake. The right move when a proposal doesn't land is "got it, what's the right read?" not "OK here's another five options."

**Don't give time estimates.** Claude is not calibrated on Alex's velocity. Past estimates have been off by ~7x. Frame work by dependency order, not by weeks or sessions.

**Push back on scope drift.** If Alex asks for something out of the current phase, name it as scope drift and surface the trade-off before silently absorbing it. He's explicitly asked Claude to keep him in check, not to comply quietly.

---

## State of the build

Onboarding still produces the same multi-page storefront as session 7 — home, /shop, /contact, /about, optional /collections + /subscriptions, /cart, /terms, /privacy, /listings/[slug]. The plumbing for generating sites hasn't changed shape. What changed this session is **how much control we exert on the AI during generation**.

A new pattern is in place for one niche × mood pair as a working test: **leatherworker × dark-and-stormy**. For that combination only, the generation prompts have been stripped of design prescription — the AI gets raw materials (a niche style sheet + a mood style sheet) and the freedom to decide which hue plays which role, which font plays heading vs body, which blocks make up the page, how the images should look. Every other niche × mood combination still runs the original prescriptive pipeline. This is a deliberate scoping decision while we work out the kinks.

Three leatherworker × dark-and-stormy sites were generated end-to-end across the session (larrys-leather, lavendar-leather, unbridled-leather). The tokens shifted significantly after style sheets came in — colors and fonts are now drawn directly from the mood sheet by name (Obsidian, Soot, Blood, Bone, Cormorant Unicase). The visual gestalt of the rendered sites still converges, because images and block selection still have prescription that we haven't fully unwound, and because the underlying block library is small enough that the AI lands on the same hero/about/products variants regardless of prompt changes.

A real bug was found and fixed in passing: the events-list block was being placed on the home page by the AI even when no events exist, leaving a dead nav link and an empty section. Fixed for all niches/moods — block now excluded from the AI's onboarding menu, nav helper now counts actual upcoming events instead of block presence.

---

## What was built this session

### Visual style-sheet infographics (discussion artifacts)

- `tmp/leatherworker-snapshot.html` — niche raw materials: 15 colors with shade ramps, 9 fonts grouped by letterform category, 12 texture swatches
- `tmp/mood-dark-and-moody-snapshot.html` (mood-dark-and-stormy) — 15 colors with shade ramps, 14 fonts spanning blackletter / Roman caps / Didone / industrial / script, 13 textures including smoke, wax drip, brushed iron, burned paper

The infographics drove a long conversation about what a style sheet actually is — raw materials, no role assignments, no how-to-design rules — and produced the principle that the niche × mood intersection is what the AI works from.

### Style sheet data files (shortcut location)

- `tmp/style-sheets/niche-leatherworker.json` — palette + fonts + textures, named only, no roles
- `tmp/style-sheets/mood-dark-and-stormy.json` — same shape

Eventually these live in the DB. Shortcut location for now while we iterate.

### Low-control generation pipeline (gated to leatherworker × dark-and-stormy)

**`lib/generation/generate-tokens.ts`**
- Loads niche + mood JSON sheets from `tmp/style-sheets/` when both exist (gating is implicit — only this one pair has files)
- Hands the sheets to the AI as raw materials with one instruction: prefer the overlap, lean mood, stay in niche
- Dropped: the four mood `tokenHints` sentences, the font menu in parentheses, the "tells you which color goes on which role — follow precisely" prescription, the "do not swap colors across roles" rule, the example sentences ("a rustic shop should read rustic")
- Kept: the JSON output schema (renderer reads from fixed keys) and the existing `enforceTokenContrast` post-processing

**`lib/generation/generate-page.ts`**
- New `nicheSlug` parameter
- Low-control branch when `nicheSlug === 'leatherworker' && mood.key === 'dark-and-stormy'`:
  - Drops `mood.blockAssemblyHint` from the prompt
  - Drops the MANDATORY RULES block (first block must be hero, products must appear, 4–6 blocks total, moodFit constraint)
  - Drops the COPY RULES and banned phrases list
  - Keeps the technical href allowlist (routes that don't exist would 404)

**`lib/fal.ts` (image generation)**
- All three image functions (`generateHeroImage`, `generateAboutImage`, `generateProductImage`) accept a `moodSignal` parameter
- Low-control branch when gated: prompt is the niche + mood label + mood description + only the technical constraints (no text, landscape/portrait, no people on hero, no faces on about)
- Dropped when gated: "editorial," "cinematic," "rich depth," "warm natural light," "commercial quality," "soft natural light," and other aesthetic prescriptions

**`lib/generation/generate-listings.ts`**
- Accepts `moodSignal`, threads it through to product image calls

**`lib/contrast.ts`**
- `enforceTokenContrast` accepts `{ skipAccent: true }` option
- `generateTokens` passes it when both style sheets load — keeps the AI's accent pick from being shifted off-hue for contrast

**`app/onboarding/actions.ts`**
- Builds `moodSignal` once at the top of the action and threads it to all image generators + generatePage

### Events bug fix (universal, not gated)

- `lib/generation/generate-page.ts` — `buildBlocksContext` excludes `events-list` from the AI's home-page menu. A brand-new tenant has no events; the block returns null when empty; the AI never should have been offered it.
- `app/storefront/_components/storefront-chrome.ts` — events nav section now counts actual upcoming events in the `events` table instead of block presence. No events = no nav link.

### Tooling

- `scripts/render-niche-infographic.mts` — runs `generateTokens` + `generatePage` for a niche × mood and emits an HTML infographic. Used early in the session before the style-sheet pattern landed; superseded by the snapshot HTML files for discussion purposes.
- `tmp/build-niche-doc.mjs` — built a DOCX combining a niche file with a canonical style sheet. Wasn't the right shape for what Alex wanted but stays in tmp/ as reference.
- `tmp/compare-tokens.mjs` + `tmp/check-images.mjs` — db queries to compare generated tokens across tenants and verify image URLs exist on storage.

---

## Principles articulated this session (carry forward to next session)

These are the throughline of the conversation — every fix above sits on top of them.

**1. We say WHAT, the AI says HOW.** We hand the AI raw materials (niche, mood, available blocks, available fonts, available textures) and the role it plays. The AI decides which colors play which role, which fonts pair, which blocks compose the page, how the images frame themselves. Anywhere we encode HOW, we've stolen design from the model.

**2. The niche × mood intersection is what the AI works from, not prose hints.** The niche file carries the prose context but a structured style sheet (palette + fonts + textures, named only, no role assignments) is what the AI actually pulls choices from. Same shape for moods. The AI prefers overlap first, leans mood second, stays in the niche as guardrail.

**3. Block definitions should be pure shape, not feel.** Strip `moodFit`, `tenantTypeFit`, `tier`, and any "feel" language from block descriptions. Describe what the block IS structurally — two-column split, full-bleed photograph with overlay card, etc. The AI judges fit by reading the structural description against the design context.

**4. Frame the AI as an agent, not a prompt.** The control surface collapses to one thing: how well we wrote the agent's role. A clear role, a good toolkit, raw materials, and an objective — then trust the agent to design.

**5. Stateless agents are sufficient for Phase 1.** Each generation is a fresh agent that reads current DB state, does its work, persists results, disposes. Memory across sessions can be added later as a structured decision log if specific gaps emerge.

**6. Self-deliberation improves quality.** Agents that generate 2+ candidates with reasoning before committing produce better outputs than single-pass. Same model, more tokens spent on judgment, measurably better choices.

**7. Only structural HOWs survive.** "No text in images" (image models can't render text legibly), "valid hex codes" (renderer requires them), "/contact must exist" (route physics). Anything that isn't physics is design opinion and should go to the AI.

**Promoted to formal decisions D20–D25 in `Phase-1-Decisions-Log.md` at the start of the next session.** The seven principles above map to the six log entries roughly as follows: principles 1 + 7 → D20 (WHAT vs HOW + structural HOWs); principle 2 → D21 (style-sheet intersection); principle 3 → D22 (block definitions are shape); principle 4 + 5 → D23 (stateless agents, two-agent architecture); principle 6 → D24 (min-2 self-deliberation). D25 covers the design_choices table. Read those entries in the log for the binding wording.

---

## Agent architecture — specifics decided (read before asking Alex about agent design)

These were discussed in detail at the end of session 8. A new session should NOT re-ask Alex about any of them.

**Agent count and roles.** Two agents. **Lead Designer** + **Image Agent**. The Lead Designer picks tokens (palette role assignments, font pairings), composes the page (block selection + order), writes copy, and briefs the Image Agent. The Image Agent receives the brief, generates the images via fal, reviews them against the brief, asks for revisions if needed, returns them. Copy is part of design, not a separate Copy Agent — splitting copy off creates the same disconnect we just fixed between images and design. Fewer agents with more autonomy beats more agents with narrower scopes.

**Self-deliberation shape.** Variable candidates with a floor. **Minimum 2** for any meaningful decision (block selection, palette role assignment, font pairing, copy direction). **No upper cap** — agent decides when a choice deserves more deliberation. The floor of 2 prevents single-pass defaulting; the no-cap trusts the agent to know when more is warranted. If deliberation quality needs validation, A/B test min-2 against single-pass and look at maker satisfaction. Do not pin a fixed N (e.g. "always 3") — that invites theater (agent generates 3 to satisfy the rule when only 1 made sense) and wastes tokens on trivial choices.

**Reasoning storage.** Build the `design_choices` table this phase. Lightweight version — columns for `tenant_id`, `decision_type` (block-pick, palette-role-assignment, font-pairing, copy-headline, image-brief, etc), `candidates` JSONB, `picked` JSONB, `reasoning` text, `niche_slug`, `mood_key`, `created_at`. One helper called from each agent decision point. No dashboards yet, just log. The reason to build now and not later: data only accumulates from the moment the table exists, and the value (spotting agent bias, dead inventory, success patterns, eventual training material for our own model) is too high to lose six months of decisions.

**Stateless still applies.** The agents above are still ephemeral per-onboarding/per-edit. Each session loads current DB state, does the work, persists results, disposes. `design_choices` rows persist (they're the log), but no agent conversation history is kept between sessions. Persistent agent memory remains a carry-forward item for later.

---

## Top priority for next session

Alex's words: "We need to look at the moods we have and change them. We need to rebuild the niche schemas for the niches we have and change the skill to build them correctly. We also need to change the block definitions to eliminate unnecessary mood verbiage etc."

In dependency order:

**1. Rework the moods.** Strip the prescription from `lib/moods.ts`. Each mood becomes label + description + a style sheet (palette + fonts + textures, named only). Drop `tokenHints` and `blockAssemblyHint`. The mood definition is raw materials, not instructions.

**2. Rebuild niche schemas.** 18 niches currently in DB. Each gets a structured style sheet attached — palette, fonts, textures — in addition to the prose body. Decide where this lives: extend the niches table with a JSONB column, or attach to a sibling table. Once schemas have the new shape, the JSON file shortcut in `tmp/style-sheets/` can be retired and the low-control pipeline can be ungated.

**3. Update the niche-writer skill.** The skill at `.claude/skills/niche-writer/SKILL.md` currently produces prose-heavy niche files with "Visual direction range" sections that dictate ranges. Rewrite the skill to produce niche files with the new shape — prose body for context, structured style sheet as data — and to anchor against exemplars without dictating outcomes.

**4. Strip block definitions.** For every block in `blocks/**/meta.ts`, remove `moodFit`, `tenantTypeFit`, `tier`, and rewrite the `description` to be purely structural. Keep `key`, `sectionType` (or rename to something purely structural), `contentSchema`, `slots`.

Once all four are done, the gating on leatherworker × dark-and-stormy can be removed and the low-control pipeline applies platform-wide.

---

## Carry-forward items (deferred, discussed but not built)

- **Agent layer.** Design Agent + Image Agent collaboration with shared brief. Discussed in depth. Not built. Would replace the current one-shot generator-per-step pipeline. The work above (style sheets, low-control prompts) is the necessary cleanup that has to happen before the agent layer is worth building on top of.
- **Self-deliberation pattern.** Agent generates 2+ candidates per decision with reasoning, picks one with reasoning, logs both. Discussed, not implemented.
- **`design_choices` logging table.** Every palette role, font, block, layout decision logged with niche + mood context. Gives platform-level visibility into what the agent gravitates toward and surfaces bias, dead inventory, success patterns. Not built.
- **Per-tenant agent persistence.** Future-state pattern for an agent that lives in code + DB and accumulates memory across sessions. Worth designing for but not Phase 1.
- **Schema bottleneck.** Even with style sheets, the DesignTokens schema forces seven fixed color roles, one heading font, one body font, tight enums on shape/spacing/layout. Real ceiling on AI expression. Renderer reads from these exact keys, so loosening means rewriting the renderer too. Not addressed this session.

---

## Open items (still carried from previous sessions)

These are unchanged from session 7. Re-listed only in compressed form — see session 7 brief for full detail if needed.

1. Streaming build progress (real SSE instead of cosmetic timer)
2. Doer storefront rendering pattern
3. Master Spec touch-up to reflect D1–D20+ and recent sessions
4. StepTrial copy — confirm exact price before wiring Stripe
5. Per-tenant AI usage caps (Phase 2 dashboard)
6. Etsy/Shopify import (Phase 2)
7. Marketing copy update — drop "live in minutes"
8. Rate limit reset before launch (MAX_PER_WINDOW back to 3)
9. Sentry + PostHog signup
10. `hero-editorial` cross-mood/niche testing
11. Inspiration URL / site reference — needs proper spec before rebuilding
12. Block swap in dashboard
13. Per-IP rate limit on `/api/contact` and `/api/notify-interest`
14. Stripe Subscriptions integration
15. Page-options dashboard
16. Collection thumbnails
17. `collections-row` forcing on home when collections exist
18. Subscription image error handling

New item added this session:

19. **First-load image timing.** Race between onboarding landing the maker on the storefront and storage propagation finishing on freshly uploaded images. Maker sees missing images for a few seconds and assumes failure. A "still finishing up — refresh in a moment" hint on first storefront load after onboarding would prevent the "did it break?" moment.

---

## Critical env var note

(Unchanged from session 7.) Claude Code injects its own `ANTHROPIC_API_KEY` and `ANTHROPIC_BASE_URL` into all child processes. `.env.local` cannot override these. Fix: use `BOHDIAI_ANTHROPIC_KEY` in `.env.local` with explicit `baseURL: 'https://api.anthropic.com'` in `lib/anthropic.ts`. Do not rename this back.

`.env.local` must also have `FAL_API_KEY` from fal.ai dashboard.

---

## Required reading at session start

1. `CLAUDE.md` at the project root
2. `project-docs/SESSION-BRIEF.md` — this file
3. `project-docs/BohdiAI-Master-Spec.md` — full product spec (read in full, every session)
4. `project-docs/BohdiAI-Roles-Workflow.md`
5. `project-docs/Phase-1-Decisions-Log.md` — D1–D19 (D20+ to be drafted from session 8 principles)
6. `project-docs/Tech-Arch-Spec.md` — database design
7. `project-docs/Phase-1-Spec.md` — current phase spec

---

## What's in the DB

40+ tables. 18 niches (status=approved). Multiple test tenant rows including `larrys-leather`, `lavendar-leather`, `unbridled-leather` from this session. All migrations applied through `20260527000008`.

No new migrations this session. The events bug fix changes runtime query logic but no schema change.

Migration runner: `node scripts/db-migrate.mjs`

Storage buckets: `placeholder-images` (legacy, unused), `generated-images` (active — fal.ai output for products, hero, about, subscriptions).

---

## Lessons banked this session

**The control was layered.** Every place we touch the AI is a place we either give it raw materials or tell it what to do. We were doing the latter at every layer — prompt instructions, mood definitions, block metadata, post-processing, schema constraints, downstream coupling. Stripping one layer (mood hints from tokens) isn't enough because the next layer (block descriptions with moodFit, MANDATORY RULES on page assembly, image prompts ignoring mood entirely, schema enums forcing a fixed shape) re-imposes control. The fix is layered too — work down through each one.

**"My judgment call" is the wrong framing in chat.** Alex flagged early in the session that "my judgment call on what the niche commits to" is exactly the wrong language — it shuts the door instead of opening one. Same pattern as Claude's behavior with the AI: dressing prescription as expertise. The fix is to hand over raw materials and frame choices as proposals to discuss, not as deliverables finalized.

**The infographic was the wedge.** Showing Alex a visual style sheet ("here's what raw materials look like") opened the conversation that the niche files don't carry style sheets, that the moods are prescription, that block descriptions encode feel. None of that was visible in code. The infographic made it visible.

**Variance doesn't show up where you look first.** Three leatherworker × dark-and-stormy sites with very different tokens (Cormorant Garamond vs Unicase, Crimson Pro vs Playfair Display vs Bodoni Moda, primary tan vs primary blood-red) still looked the same to the eye, because images and block selection — the loudest visual elements — were unchanged. Token diversity matters less than the layers above it when judging "does this site feel different from the last one."

**Build the page, don't suppress the link — except when there's no content at all.** The events-list bug surfaced a refinement of the principle. When AI generates a CTA pointing at a future feature, build a stub page. When the AI is offered a block that depends on tenant data the tenant doesn't have, don't show the block — there's no content to build a page around.
