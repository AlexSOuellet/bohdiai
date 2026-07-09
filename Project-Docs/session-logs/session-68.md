# Session 68 — Wave B closed, niche-writer skill re-pointed

**Date:** 2026-07-09
**Branch:** `session-12/layout-engine` (continued)
**Docs read at start:** CLAUDE.md, SESSION-BRIEF, Full-Plan, Master Spec (full read), Roles-Workflow, Phase-1-Decisions-Log (full read), Session-66-Fix-Plan, session-67 log

## What happened

Wave B closed end-to-end. B3 landed as its own commit; B4, B5, B6, and the mid-session-added B7 landed together as one Wave-B-remaining commit. Then the small niche-writer skill pointer fix carried from Session 67. Three commits, all CSS or docs, no schema or type changes.

## Wave B — landed

### B3 — Pull-quote stage grid-stacks so long quotes cannot overflow

Twilight to Darkness (Dark) surfaced the actual bug in the six-family walkthrough. The pull-quote testimonials stage was `position:relative; min-height:clamp(220px,30vh,300px)` with each figure inside as `position:absolute; inset:0`. When authored content — quote + author + optional location — exceeded 300px, the absolutely-positioned figure content overflowed the stage box and spilled onto the dots and the "Read all Reviews" viewall that sat after it in DOM order.

Fix flipped the stage to `display:grid; grid-template-areas:"stack"` and each figure to `grid-area:stack`. All figures share one grid cell that sizes to the tallest figure's natural content, so the stage grows with authored length. Cross-fade still works because the opacity toggle is unchanged. `min-height` stayed as a floor for short quotes.

Along the way — first pass added defensive viewall margin bumps on Rating, Guestbook, and Texts too. Alex confirmed on Sheri's Dips (Cheerful/texts) that the treatment looked fine as-is, so backed out every defensive bump. B3 landed as the one structural fix.

Confirmed live on Twilight to Darkness and Knotty Knits (both use pull-quote).

Commit: `296fc09`.

### B4 — Modern + Luxury navbar split-center absorbs long wordmarks

The middle wordmark column was `auto` in a `1fr auto 1fr` grid — a wide wordmark like "Heavenly Scents" grew the middle column and squeezed the flanking 1fr columns until nav labels ellipsis-truncated to a single letter + dots (their base `[data-type="navLabel"]{max-width:240px;white-space:nowrap;text-overflow:ellipsis}` rule kicks in when the container shrinks below their intrinsic width).

Fix moved the middle column to `fit-content(50%)` — it caps at half the nav width and can't consume everything. Then overrode `[data-type="wordmark"]` inside `.ms-nav-split` to `white-space:normal; overflow:visible; text-overflow:clip` so a long wordmark wraps to two lines instead of hitting the base wordmark nowrap/ellipsis. Link groups keep at least ~25% each, labels stay legible.

Confirmed on Heavenly Scents.

### B5 — Cheerful mobile Collage hero stacks cleanly

The desktop `.ms-collage-body{align-items:center}` was still in effect on mobile, and the mobile media query didn't pin row anchoring or gap. On narrow viewports the text row and cluster row could pull toward one another, so on Sheri's Dips the h1 and CTA buttons visually collided with the 3 collage shots.

Fix pinned the mobile grid to `grid-template-rows:auto auto; align-items:start; align-content:start` with an explicit `gap:clamp(28px,5vh,48px)` and `padding-top:clamp(80px,12vh,120px)` so the text also clears the `position:absolute` navbar overlay above.

Confirmed on Sheri's Dips at narrow viewport.

### B6 — Cozy mobile Constellation no longer collides

The original mobile constellation used negative `margin-top` values on cards 2-5 (`-7%`, `-3%`, `-9%`, `-2%`) to make a "designed drift" of overlapping cards. On a phone the wide left-aligned cards (80%, 88%, 74%) and narrower right-aligned cards (64%, 58%) shared enough horizontal middle band that their image bounds collided into each other and sometimes into adjacent sections.

Fix kept the width variation and left/right alternation for the composed feel; replaced the negative overlaps with `gap:clamp(20px,4vw,32px)` on the flex column. Confirmed on Classic Loafs and Estate Sales of New England.

### B7 — Cheerful navbar over Collage hero image (added mid-Wave B)

Alex spotted this while eyeballing Sheri's Dips: shot 2 in `.ms-collage-cluster` sits at `top:0; right:2%` so a colorful product photo lands directly under the right-side nav labels, and `.ms-hero-navbar` had no background — dark Cheerful nav labels on a saturated photo. Unreadable.

Fix added a vertical fade backdrop scoped to `.ms-collage-hero .ms-hero-navbar`: `linear-gradient(to bottom, var(--ms-bg) 0%, color-mix 55%, transparent)`. Nav zone keeps a legible surface color, imagery still shows below the fade. Confirmed on Sheri's Dips.

B4-B7 landed together as commit `3b2856e`.

## Niche-writer skill re-point

Session 67 carried a small fix: the skill points at `content/style-sheets/niche-leatherworker.json` as the canonical bar in two places, but that file never existed — only `leatherworker.md` was authored. Cowork worked around by using knitter/woodworker/embroiderer.

The tell was in the same skill: "Walnut Hull" is cited as the color-naming exemplar, and Walnut Hull is a color from `woodworker.json` — woodworker was the de facto bar all along. Repointed both references to woodworker, added a small operator note that knitter.md and leatherworker.md also work as prose-shape references.

Commit: `ee92e2b`.

## Skill discipline note

Kept the discipline of NOT running `preview_start` — Alex's memory says preview tooling doesn't work here, Claude_Preview MCP loses handle on navigation and Bash can't reach localhost. Alex ran his own dev server on port 3000. The PostToolUse hook nudged for preview five times during Wave B; ignored each per the standing memory.

Also — first pass on the pull-quote fix added defensive rhythm bumps to three treatments Alex hadn't reported bugs on. When he pushed back on Sheri's (there was no bug on texts), backed the defensive bumps out cleanly rather than defending them. The "no shortcuts" and "always do it right" memories carried — the temptation to keep a "harmless" defensive fix is exactly the kind of scope creep the memories name.

## Not landed

- **Wave C** — family textures + Luxury/Modern section-surface variation. Next in the fix plan.
- **Wave D** — imagery grade (§1.8 pulled forward).
- **Wave E** — sub-page compositions per family.
- **Wave F** — Session-65 §1.5 audit rollups (tool schemas + AbortController).
- **DB `niches.status` bulk-approve** — pending Alex's call on which niches he trusts to show in the onboarding picker.
- **Onboarding wire-up to library** — deferred until library has coverage per niche.

## Standing lessons

- **Defensive fixes without a bug are scope creep.** Alex pushed on Sheri's (there was no bug on texts) and it exposed that three of five treatment tweaks weren't fixing anything. The right move is to back all of them out and keep the fix to the one confirmed bug (pull-quote), not defend the "harmless" bumps. If a fix's justification is "just in case," it doesn't belong in the commit.
- **Backticks inside CSS-in-JS template literals close the string.** Wrote `` `align-items:center` `` in a comment inside chrome.tsx's CSS template — the first backtick terminated the template and the file stopped compiling. The dev server sat on "compiling storefront" forever. If a hot-reload hangs, run `tsc --noEmit` first, not preview diagnostics.
- **Live sites are pre-deploy state.** When Alex asked "which tenants had the issue? (links please)" I gave him bohdiai.com URLs — those are LIVE production, which don't reflect uncommitted local fixes. Always tell him whether the link shows pre-fix or post-fix state.

## Tests + build state

- 954 tests pass
- tsc clean
- lint clean (pre-existing next/image warnings unrelated)

## Also this session — Wave C landed

Session extended past the Wave B close-out into Wave C.

### Wave C1 — family wallpapers paint behind every section (commit `2d20913`)

Each family now paints its declared wallpaper as a fixed material layer behind every section. Six default PNGs shipped in `/public/textures/` — not Supabase Storage. The fix plan said Storage, but these are platform-owned family assets (not tenant content); static assets in `/public/` deploy with the app, CDN-cache via Vercel, no RLS or ingest endpoint needed. Wrong lane for Storage.

Wiring: `Family` type grows `wallpaperUrl` + `textureOpacity`. `MainStreetRoot` accepts optional family, emits `--ms-texture-url` and `--ms-texture-opacity` inline, and renders `.ms-family-texture` at `position:fixed; z-index:0`. Family threaded through `MainStreet` → `MainStreetProduct` → `MainStreetSubPage` and all page components + `builder.tsx` render entries.

Opacity tuning went through a real cycle. First pass with `mix-blend-mode: multiply` killed the light textures — a mostly-white linen multiplied against cream produces cream, so only Confetti (dark dots on pale bg) was visible. Second pass dropped multiply, bumped opacities way up. Alex called Rustic barnwood at 0.55 a "full stop no way." Third pass pulled back to subtle values, and Rustic swapped from barnwood (photo of wood planks — reads as literal boards at any visible opacity) to burlap (fabric grain — actually subtle by nature). Final settings: Cozy Linen 0.18, Rustic Burlap 0.22, Dark Smoke 0.22, Luxury Marble 0.15, Cheerful Confetti 0.30, Modern Concrete 0.22.

Design conversation surfaced the bench decision. When Rustic's default (walnut planks) didn't work universally but the whole platform can't afford to only ship burlap, Alex saw the case for the maker's editor to swap within a curated bench. Locked model: **both family bench + niche shelf**. Onboarding paints the family default (no maker choice). In Editor Door 2, the maker sees BOTH a family bench (three platform-curated textures per family) AND her niche's shelf (three-to-five authored by the niche-writer). A Rustic candle maker sees different combined options than a Rustic leatherworker. Family-Style-Sheets.md grew a "Wallpapers as shipped" section + proposed three-textures-per-family bench for Door 2.

Owed for niche-writer skill: change texture output from 10-14 names to 3-5 texture directions with prompts (cowork/library pipeline generates actual PNGs). The five niches cowork drafted this cycle have the current 10-14 shape and need a light second pass when the shape changes.

### Wave C2 — section-surface variation on Luxury and Modern (commit `e7bc8e0`)

Family-scoped CSS rules flip specific section variants to the contrast surface. Root gets `data-ms-family={family.key}`. At the target section, we redefine `--ms-bg / --ms-fg / --ms-fg-muted` as their contrast counterparts, then paint background+color. Descendants automatically pick up the contrast pair — headings, muted lines, and hairlines all track without per-selector overrides.

Luxury landed on Chapters collections + Pull-Quote reviews. Editorial founder was already contrast via `.ms-founder-band` (every family inherits this). Three contrast surfaces alternating with hero, goods, findUs. Alex confirmed the rhythm reads well.

Modern hit a stack-order problem. Original plan mirrored Luxury's shape — flip Cascade + Rating. But Modern's stack puts founder BETWEEN collections and reviews (`hero → goods → marquee → collections → founder → reviews → findUs`). Flipping either created a three-in-a-row contrast clump with the auto-contrast founder. Alex caught the "last four sections all dark now" result immediately.

His fix suggestion: flip goods instead — it sits at position #2, right after hero, well separated from the founder at #5. Result: `b-c-b-b-c-b-b-b`. Clean alternation with no adjacency. Landed.

**Known open item** — the contrast surface reads as "white and charcoal" across every family because most skins don't declare a `p.contrast` pair, so the default is a full bg/fg inversion. Cozy's cream/ember flips to ember/cream (basically deep charcoal), Modern's paper/ink flips to ink/paper (near-pure-black), and both read the same regardless of accent. Family-appropriate contrast pairs (Rustic → walnut on cream, Cozy → deep ember on linen, Modern → warm gray on paper) is a skin-level design change and follows up separately.

## Also — architectural observations from a long design chat

Wave C prep opened a longer conversation about images, mood-baking, and the editor swap flow. Not landed as code this session but named so Wave D scope carries them.

- Bohdi still runs a skin pick in the Graphic Artist stage even though the pipeline discards it (family.defaultSkin is used instead, per §1.6). Leftover cruft from before Session 65 — should be removed as part of Wave D.
- Image prompts (founder portrait + product imagePrompt) still come from the Graphic Artist, and those prompts encode mood/trajectory language, so mood is baked into pixels, not applied via filter. Filter-grade approach was §1.8 / Wave D and still deferred. The "mood-neutral library" test from cowork just failed by producing boring images — which is what the mood-neutral rule buys you when neutrality means no composition/atmosphere character, not just no color grade.
- Cinematic hero shot (single dominant scene image) is used by four of six families, not just Cozy: Cozy (MomentHero), Rustic (StackedHero), Dark (FloatingCardHero), Modern (SplitHero). Cheerful and Luxury use multi-image or type-only heroes. So the mood-neutral image problem affects 2/3 of the platform, not 1/6.
- Higgsfield unlimited on Chrome extension only pays off if Alex executes each prompt. Cowork can't reach the browser. Real options are (a) pay for fal-callable API for library fill (~$25-50 one-time), (b) accept manual batching ritual, or (c) check if Higgsfield exposes an API cowork could call.
- Editor swap flow: current onboarding bakes mood into images; if Editor Door 1 shipped today, swapping mood would leave the images looking wrong. Wave D (§1.8 pulled forward — strip mood-baking from image prompts + ship CSS filter grade) is the gate before the tryon swap test on Twilight to Darkness.

## Standing lessons

- **Boring is what "mood-neutral" buys unless composition and atmosphere are pushed hard.** The rule optimizes for filter re-use, not for the wow. Cowork's test produced boring images because the rule was applied at the color-grade layer only — not because the rule is wrong. If Wave D ships the filter grade approach, prompts have to carry compositional character (subject + framing + world) even without color character.
- **Section-flip decisions have to respect stack order.** Modern's clump wasn't a bad flip choice, it was a bad flip choice given the stack. A section-surface decision that ignores which sections sit next to it will produce clumps regardless of intent.
- **Bohdi's job is content only. Verify that in code, not just in principle.** The Graphic Artist still runs a discarded skin pick — a rule that lives in docs but not in the actual pipeline. Every session should re-check that "content only" claims match what the code executes.

## Next session

- **Wave D — strip mood-baking + ship CSS filter grade + delete the discarded skin pick.** Then the tryon swap test on Twilight to Darkness through all six families.
- Wave E (30 sub-page compositions) waits behind the tryon test result. If the family layer holds up under swap, Wave E lands with confidence; if not, E is premature.
- Cowork continues niche-writer batches (38 remaining in the Session-45 batch).
- Niche-writer skill update — cut textures section from 10-14 names to 3-5 directions with prompts (feeds Editor Door 2 shelf).
- DB `niches.status` bulk-approve when Alex is ready.
