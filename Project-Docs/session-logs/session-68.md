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

## Next session

- Wave C: family textures + Luxury/Modern section-surface variation. Wave C1 needs the six wallpaper PNGs uploaded to Storage and wired via `--ms-texture-url` CSS variables; C2 audits Luxury and Modern for contrast-surface flips on 2 sections each.
- Cowork continues niche-writer batches (38 remaining in the Session-45 batch).
- DB `niches.status` bulk-approve when Alex is ready.
