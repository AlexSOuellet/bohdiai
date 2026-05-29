# Session Brief — BohdiAI

**Last updated:** 2026-05-28 (Session 9 — Bohdi the agent, WOW positioning, mood rename, motion primitives, block catalog expansion)

**Update at the end of every session.**

---

## Action at session start

**Vercel env sync resolved 2026-05-29.** Preview builds had been failing since commit `41bf8cb` because `SITE_URL`, `BOHDIAI_ANTHROPIC_KEY`, `FAL_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_ANON_KEY` were never pushed to Vercel after being added to `lib/env.ts`. Production was serving a stale build from before those keys existed. All 11 non-empty vars from `.env.local` are now synced to both Production and Preview. Sentry and PostHog vars left untouched (blank locally, existing Vercel values preserved).

GitHub Actions still fails on the `lib/**` 90% coverage gate — Phase 1 generation code shipped without unit tests. Separate problem from the Vercel deploy. See `vitest.config.ts` for the threshold.

Session 9 work is on branch `session-9/strip-directional-wording`. Redeploy the failed Vercel build to confirm green, then merge.

---

## How Claude works with Alex (operating rules for the assistant)

These are throughline rules for every session, not just session 9. New sessions should treat these as binding.

**Don't prescribe. Propose.** Hand over raw materials and trade-offs; let Alex make the call. "My judgment call on what fits" closes doors instead of opening them. Propose options with honest trade-offs, mark a recommendation if asked, wait for Alex to choose.

**Push back on overengineering, including your own.** Claude over-engineers and over-controls by default. The reflex to add infrastructure, write generators for things that could be done by hand, build documentation for the documentation — all recurring. When proposing a new generator, abstraction, or validation layer, the question to ask is "is this required to ship, or am I doing it because it's interesting?" If the second, stop.

**Plain English in chat. No structured documentation reflex.** No bullet lists when 2-3 sentences would work. No section headings, bold labels, decision IDs, or jargon Alex didn't use first. Conversational prose lands. Documentation belongs in `.md` files, not chat.

**One question at a time when walking decisions.** Multi-part questions overwhelm and produce surface answers. Sequential one-at-a-time produces real answers.

**Don't invent under pushback.** When Alex pushes back, acknowledge and wait. Don't fill the gap with a new guess — that compounds the original mistake. The right move when a proposal doesn't land is "got it, what's the right read?" not "OK here's another five options."

**Don't give time estimates.** Claude is not calibrated on Alex's velocity. Past estimates have been off by ~7x. Frame work by dependency order, not by weeks or sessions.

**Push back on scope drift.** If Alex asks for something out of the current phase, name it as scope drift and surface the trade-off before silently absorbing it.

**Never start preview/dev servers unless explicitly asked.** Alex manages his own dev environment. Auto-spawning leaves zombie processes holding ports and burns time on cleanup. The hook reminders about preview verification should be acknowledged and ignored unless Alex specifically asks for a server.

**Tell Bohdi how to think. Don't tell him what to choose.** A quality bar (WOW is the job) and a mental model (mood is the visual world, niche is the material vocabulary inside it) are how-to-think. "Pick the boldest variant," "safe choices are the failure mode," naming specific blocks as favored — all what-to-choose. Quality bar = OK. Variant selection = not OK.

**Stop prompt-tuning to test cases.** When a generation comes out wrong, the reflex is to add a paragraph to Bohdi's system prompt. That's whack-a-mole — LLMs rationalize anything. The real levers are (a) materials Bohdi reads, (b) deliberation mechanics, (c) output review. Edit those before touching the prompt.

**Don't play safe directing the safe AI.** Claude's safe-mode shows up as hedging, fallbacks, "let me ask which to start with" when told to just go, building "competent but not aggressive" implementations of bold-named features. Bohdi inherits the timidity through the catalog Claude builds and the prompts Claude writes. Watch for the pattern.

---

## State of the build

Bohdi is alive. The leatherworker niche routes through the agent loop for any mood; other niches still use the legacy one-shot pipeline. Bohdi reads niche + mood style sheets, deliberates 2+ candidates with reasoning per meaningful choice, logs every decision to the `design_choices` table, briefs his own images, composes pages, and commits via finalize. A run takes 3-4 minutes and costs ~$0.50-0.80 in Claude tokens plus ~$0.25 in fal image generation.

Mood lineup is now seven plain category labels: **DARK · RUSTIC · COZY · BOTANICAL · SUNSET · SIMPLE · MODERN**. Old keys (dark-and-stormy, warm-and-cozy, wild-meadow, summer-afternoon, sunday-morning) migrated. bright-bazaar cut. MODERN added. Every mood has a style sheet at `tmp/style-sheets/mood-*.json` — palette (15 named colors), fonts (14 named with structural taxonomy categories, no feel words), textures (13 named). The niche-leatherworker.json style sheet exists; the other 17 niches don't yet.

Block catalog expanded from 19 to 30 (one marked draft). New variants: hero-bento, hero-super-type, hero-lava, about-founders-note, about-manifest, products-bento-grid, products-in-the-wild, testimonials-featured (now with cross-fade rotation through multiple testimonials, pauses on hover), testimonials-carousel, nav-centered-wordmark. hero-split-gallery marked draft (visually too close to hero-split-screen).

Motion primitives library under `components/storefront/motion/`: SmoothScroll (Lenis-driven momentum scroll, mounted in storefront layout — every storefront now scrolls premium), ParallaxImage (vertical drift against scroll), Marquee (auto-scrolling row), SplitReveal (character or word reveal with stagger; fixed mid-word wrapping bug). All respect prefers-reduced-motion. Used inside blocks where structure calls for them (hero-cinematic bg parallaxes, hero-super-type headline char-reveals, about-manifest body word-reveals, products-in-the-wild images parallax per scene).

Bohdi's system prompt was rewritten multiple times this session. Final shape: WOW IS the job framed as a quality bar; WOW happens within the constraints of the mood the maker picked (mood is the customer's choice, not negotiable). Mood = visual world, niche = material vocabulary inside that world. Collapse diagnostic: if two moods in the same niche produce the same visual identity, the axes have flipped. No "pick the bold variant" or "name the new blocks" direction. Deliberation method, physics constraints, batching mechanics retained.

---

## What was built this session

### Block-variant builder skill stripped

`.claude/skills/block-variant-builder/SKILL.md` had heavy directional prescription throughout (mood descriptions, "godly level means [list]", specific atmosphere/motion instructions, prescriptive deliverable counts). All directional verbiage removed. The skill now is: brand positioning frame (visibly not AI slop), technical constraints (tokens, file structure), integration steps (registry + manifest), and a pointer to the roadmap doc. No "build N variants of type X, prefer scroll reveals, add grain." The builder's call.

### Mood lineup overhaul

`lib/moods.ts` reduced from 132 lines of prescription to a clean 7-mood interface with label + audience description only. `tokenHints` and `blockAssemblyHint` fields removed from the Mood interface entirely. Mood keys renamed to plain category labels:
- dark-and-stormy → dark
- warm-and-cozy → cozy
- wild-meadow → botanical
- summer-afternoon → sunset (retargeted from "bright midday" to golden-hour)
- sunday-morning → simple
- bright-bazaar → REMOVED (off-fit for makers)
- (new) → modern

Migration `20260528000002_mood_keys_renamed.sql` updates existing tenants and design_choices rows.

`StepMood.tsx` picker updated with new visual swatches per mood.

### Mood style sheets for all 7 moods

`tmp/style-sheets/` now has mood sheets for all seven moods, each with 15 named colors, 14 named fonts (structural taxonomy categories only — no feel words), 13 named textures. The non-leatherworker niches still fall back to label + description because no other niche has a style sheet yet — that's the next-session work.

Distinctive curatorial calls per mood (Alex's "do NOT play it safe" instruction): dark uses gothic blackletter and didone; rustic uses workshop pigments (woad indigo, madder red, iron oxide) and western/slab display; cozy uses warm domestic interiors (sourdough crust, dried lavender, marsala); botanical uses lush undergrowth (foxglove, deep moss, foraged berry) with botanical-illustration scripts; sunset uses golden-hour amber/coral/dusky-violet with warm contrast serifs; simple uses Japanese-Scandi precision (plaster, bone china, tatami) with refined sans; modern uses Bauhaus primary (red, electric blue, Mondrian yellow, hot pink) with heavy geometric display.

### Bohdi the agent

`lib/bohdi/` directory with four files:
- `types.ts` — BohdiBrief, BohdiResult, BohdiAccumulator
- `tools.ts` — 16 tools with handlers (read_niche, read_mood, list_blocks, list_widgets, log_decision, generate_image, set_tokens with contrast enforcement, set_home_page with explicit slot schema, set_secondary_pages_copy, add_collection, add_listing, add_subscription, set_hero_image, set_about_image, finalize). Shuffles hero/products variants in list_blocks output to prevent alphabetical bias.
- `system-prompt.ts` — final shape described above
- `run.ts` — Anthropic tool-use loop with prompt caching (system prompt + tools cached, ~70-80% cost reduction after turn 1), batching nudge, cost logging, 80-turn safety cap

`design_choices` table migration `20260528000001_design_choices.sql` — columns for tenant_id, decision_type, candidates JSONB, picked JSONB, reasoning, niche_slug, mood_key, created_at.

`app/onboarding/actions.ts` routes leatherworker × any-mood through `runBohdi`; everything else stays on the legacy pipeline.

### Block catalog expansion

11 new blocks (10 active, 1 hero-centered-wordmark nav). All in `blocks/{key}/` with meta.ts + index.tsx. Registered in `lib/block-registry.tsx`. Manifests regenerated.

`blocks/hero-split-gallery/meta.ts` marked `status: 'draft'` (visually too similar to hero-split-screen).

Stripped `moodFit`, `tenantTypeFit`, `tier` fields from every block meta. BlockMeta and WidgetMeta interfaces in `lib/blocks.ts` updated.

### Motion primitives

`components/storefront/motion/` — SmoothScroll (Lenis), ParallaxImage, Marquee, SplitReveal. Wired into storefront layout (smooth scroll site-wide) and into specific blocks where structure naturally calls for motion.

### Onboarding UI

`StepBuild.tsx` now shows an elapsed-time counter while Bohdi works ("Elapsed 1:42") so the maker isn't staring at a silent spinner.

### Bohdi report tool

`tmp/bohdi-report.mjs <subdomain>` prints a readable design-decisions report for any tenant — final block structure plus every logged decision with candidates, picked option, and reasoning. Used heavily this session to debug Bohdi's choices.

### Renderer fixes

- cta-banner uses `bg-s-surface` instead of `bg-s-primary` (architectural mismatch — primary is brand color, surface is THE section-background token)
- `/about` page now finds whichever about-section block the home picked (about-maker, about-founders-note, or about-manifest) via the manifest, instead of hardcoding `about-maker` and 404ing
- Block registry slot rendering accepts both `widgetKey` and legacy `key` field so existing tenants with the wrong shape still get CTAs
- Mid-word line breaks in SplitReveal fixed — characters now wrap inside per-word nowrap spans so words can only break at spaces
- `enforceTokenContrast` is now called inside set_tokens (it was lost when Bohdi was introduced)

---

## Principles articulated this session (carry forward)

**1. Tell Bohdi how to think. Don't tell him what to choose.** Quality bars and mental models are how-to-think. Variant selection rules ("pick the boldest," "prefer the new blocks") are what-to-choose. The first is fair to put in the prompt; the second is not.

**2. WOW is the job, within the mood's constraints.** Bohdi optimizes for stop-them-mid-scroll, but the mood is the maker's choice and not negotiable. A WOW simple shop is the most distinctive SIMPLE shop. A WOW dark shop is the most distinctive DARK shop. He can't redefine the mood to be bolder.

**3. Mood is the visual world. Niche is the material vocabulary inside that world.** If two shops in the same niche but different moods produce the same visual identity, the axes have collapsed — the niche has eaten the mood.

**4. The block model produces stacks. WOW comes from catalog variety, not better composition.** Block-based assembly inherently makes vertical stacks of rectangles. Different visual character per site comes from having genuinely different block geometries in the catalog (asymmetric, overlapping, scroll-driven, image-bleed). More variants → more variance.

**5. Visibly not AI slop is the brand position.** Every catalog choice should make BohdiAI sites harder to confuse with a Wix/Squarespace AI-built site, not easier. Adding a sixth slightly-different products grid is competitive death.

**6. Deliberation is not proof.** Bohdi's reasoning is fluency, not judgment. He can defend any pick. The output is the proof. Prompt-tuning his reasoning quality is whack-a-mole — change inputs and review outputs instead.

**7. Real materials beat prescriptive prompts.** Mood and niche style sheets with named raw materials and no role assignments outperform prescriptive "dark backgrounds for moody" instructions. The materials constrain structurally.

**8. Motion primitives, not motion direction.** Build the primitives (parallax, smooth scroll, reveal). Apply them inside blocks where the block's own structure calls for motion. Don't tell the AI "this maker needs scroll-triggered reveals" — that's mood/niche-based motion direction.

---

## Top priority for next session

In dependency order:

**1. Vercel deploy fix.** Get main building on Vercel before anything else. Likely env-var configuration on Vercel side. Without this, no shipping.

**2. Strip the other 17 niche files.** Same stripping pattern as leatherworker — remove "Visual direction range," "What tends to surface on the storefront," "What to avoid," and visual descriptors leaking into Brand exemplars. Sync to the niches table. The niche-writer skill should be updated to produce the new shape too.

**3. Build niche style sheets for the other 17 niches.** Each gets palette (15 named colors) + fonts (14 named with structural taxonomy categories) + textures (13 named). Without these, Bohdi only has the niche prose to work from for non-leatherworker shops.

**4. Run Bohdi across the other 17 niches × all 7 moods.** That's 119 combinations. Won't actually run all of them — pick 8-12 representative pairs (candle × cozy, jeweler × modern, baker × sunset, etc) and verify Bohdi produces visually distinct sites that respect mood boundaries.

**5. Drop the leatherworker gate.** Once non-leatherworker niches have style sheets and Bohdi handles a wide range of niche × mood combos well, retire the legacy generation pipeline entirely. All onboardings route through Bohdi.

---

## Future features banked (post-Phase-1 / launch wave)

These are real product asks Alex named near end of session 9. They're not Phase 1 build-time; they're launch wave features. Capture them so they don't get lost.

**Tenant-side mood regeneration.** Once a maker is in the dashboard, they should be able to regenerate their storefront under a different mood without redoing onboarding. "Try this same shop in COZY" or "show me what SUNSET would look like."

**Preview-before-save.** When the maker first generates (or regenerates with a different mood), they see a preview of the result and choose to save it or try again. Today the generated storefront goes straight to live — no decision point. Adding preview is a real UX improvement and de-risks regen.

**Mood samples in the onboarding picker.** Right now the mood step is colored swatches with a one-line description. Makers don't really know what they're picking. The picker should let them click a mood and see actual sample storefronts in that mood. Helps them choose the right look for their shop.

**Sample gallery on bohdiai.com.** Marketing site needs a gallery of representative sites across niches and moods. Build 12-20 sample storefronts (or repurpose dev-generated ones), store them, render them in a gallery page. The gallery itself becomes a credibility asset and feeds the mood picker.

---

## Carry-forward items (deferred, discussed but not built)

- **Vision review on images.** Image Agent looks at the fal output and decides whether it matches the brief, regenerates if not. Discussed at length, deliberately not built. Decision was: first run, no iteration. The cost/quality trade-off favors trust at onboarding because the maker swaps placeholder images anyway. Worth reconsidering for the Phase 2 AI Image Studio.

- **Schema bottleneck.** The DesignTokens schema still forces 7 fixed color roles, one heading font, one body font, tight enums on shape/spacing/layout. Even with great style sheets, Bohdi pours 15 colors into 7 slots. Real ceiling on AI expression. Loosening means rewriting the renderer.

- **Per-tenant agent persistence.** Future-state pattern for an agent that lives in code + DB and accumulates memory across sessions. Worth designing for but not Phase 1.

---

## Open items (carried from earlier sessions, still applicable)

1. Streaming build progress (real SSE instead of cosmetic timer + elapsed counter)
2. Doer storefront rendering pattern
3. Master Spec touch-up to reflect D1–D25+ and recent sessions
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
19. **Vercel main-branch deploy failure** (new — needs root-cause from Vercel logs)

---

## Critical env var note

(Unchanged from session 8.) Claude Code injects its own `ANTHROPIC_API_KEY` and `ANTHROPIC_BASE_URL` into all child processes. `.env.local` cannot override these. Fix: use `BOHDIAI_ANTHROPIC_KEY` in `.env.local` with explicit `baseURL: 'https://api.anthropic.com'` in `lib/anthropic.ts`. Do not rename this back.

`.env.local` must also have `FAL_API_KEY` from fal.ai dashboard.

Vercel needs both env vars set in the dashboard for the deploy to work in production.

---

## Required reading at session start

1. `CLAUDE.md` at the project root
2. `project-docs/SESSION-BRIEF.md` — this file
3. `project-docs/BohdiAI-Master-Spec.md` — full product spec
4. `project-docs/BohdiAI-Roles-Workflow.md`
5. `project-docs/Phase-1-Decisions-Log.md` — D1–D31 (D26-D31 added this session)
6. `project-docs/Tech-Arch-Spec.md` — database design
7. `project-docs/Phase-1-Spec.md` — current phase spec
8. `project-docs/Block-Variants-Roadmap.md` — block catalog plans

---

## What's in the DB

40+ tables. 18 niches (status=approved). Tenants from session 9 testing: lous-leather-craft, lucys-leather, legacy-leather, larrys-leather, lavendar-leather, unbridled-leather, leather-utopia, absolute-leather, yamley-leather, test-leather — all leatherworker, various moods. design_choices table populated with Bohdi's deliberation logs for every leatherworker run.

Migrations applied through `20260528000002`:
- `20260528000001_design_choices.sql` — Bohdi's decision log
- `20260528000002_mood_keys_renamed.sql` — mood key rename for tenants + design_choices

Migration runner: `node scripts/db-migrate.mjs`

Storage buckets: `placeholder-images` (legacy, unused), `generated-images` (active — fal.ai output for products, hero, about, subscriptions).

---

## Lessons banked this session

**Bohdi inherits the developer's timidity.** Claude's safe-mode patterns (hedging, fallbacks, "let me ask first," building competent-but-conventional implementations of bold-named blocks) show up in Bohdi's behavior because they're in Bohdi's catalog and Bohdi's prompts. Safe directing safe. The fix isn't a smarter prompt — it's a less timid developer.

**LLMs rationalize anything.** Bohdi's logged reasoning is fluency, not proof. He can defend any pick with smart-sounding prose. So output evaluation matters more than reasoning evaluation, and prompt-tuning to test cases is whack-a-mole. The signal he can't argue with is structural — materials, physics, mechanics.

**The block model produces stacks by definition.** No matter how distinct individual blocks are, every page is a vertical stack of full-width horizontal slabs. To stop reading as "AI-builder slop" requires either block variants with genuinely non-rectangular geometry (which we started building) OR a different composition model (which we ruled out because makers need editability).

**Visibly NOT AI slop is the moat.** Every catalog choice has to make BohdiAI sites harder to confuse with Wix/Squarespace AI sites. Adding "competent but conventional" variants is competitive death. The roadmap of weird-shaped variants (hero-lava, products-in-the-wild done right, about-manifest) is strategic, not stylistic.

**The materials are the real lever, not the prompt.** Every time Bohdi disappointed this session, Claude reached for the prompt. The actual fix was always upstream — style sheet curation, block variant builds, niche prose stripping. Touching the prompt to fix output is fighting LLM rationalization with more prose.

**Prompt caching matters.** Bohdi's first turn writes ~10k input tokens (system prompt + tools list). Without caching, every subsequent turn re-pays for those. With caching, they cost 10% after turn 1. ~70-80% input-token cost cut for free. Should be baked into any tool-use loop pattern.

**Mood character must come first.** When Bohdi found "one bold move" for leatherworker (dark inversion), he started applying it to every mood by rationalizing the mood's accent color as a base. The mood is the customer's choice; the niche is the content. Flipping the axes collapses the lineup.
