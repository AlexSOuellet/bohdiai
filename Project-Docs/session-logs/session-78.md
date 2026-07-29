# Session 78 — 2026-07-29

**Headline:** Shipped the editor preview's staged navigation (verified live), closed the `PREVIEW_TOKEN_SECRET` deploy-env gap on production, added a real staging *environment* to the Beta plan, fixed a naming collision (the editor's "staging engine" → "draft-and-publish"), and fully planned + phased the next editor build — the "Make It Yours" first-run walk. No build started on the walk; it begins Session 79.

---

## What shipped: editor preview staged navigation

The gap Alex hit at the end of Session 77: inside the editor preview, clicking any in-store link (the footer Intro link, nav, wordmark, a product) dropped the preview context and landed on the **live** published store instead of the staged draft — the deferred D64 "staged navigation" limitation.

Built to the ready plan (`plans/2026-07-28-editor-preview-staged-navigation.md`), test-first:

- **`app/storefront/_components/PreviewLinkForwarder.tsx`** — a preview-only client component. A capture-phase document click listener re-attaches the current page's preview params (`previewToken`, `previewLook`, `previewMood`, `previewTexture`, `previewTextureOpacity`, `previewStill`) onto same-origin in-store links and does a full navigation, so the staged draft survives every hop. Reads params from `location.search` at click time (not mount), so multi-hop stays correct. Ignores external / modified / `_blank` / same-page-hash clicks. Renders a hidden `data-preview-nav` marker. Chose param-forwarding over a cookie deliberately — a cookie on the storefront origin would leak the unpublished draft into the maker's live-store tab.
- **`StorefrontPage.tsx`** — `withStillReveal` became `withPreviewChrome(node, { still, preview })`: in preview mode (any `previewToken` present) it mounts the forwarder; the still-reveal override still rides along when `previewStill` is set. Public renders (no token) are untouched.

9 forwarder tests + 2 StorefrontPage tests. A jsdom "Not implemented: navigation" console warning in the forwarder test was silenced with a bubble-phase preventDefault guard in the test harness (a pre-existing identical warning lives in another test file — not ours). **1018 tests pass, tsc + lint clean.** Alex verified it live ("i tested it, it looks good"). Plan marked complete. Commits `30b77c6` → `df34ea0`.

## PREVIEW_TOKEN_SECRET — production

The editor mints/verifies a preview token signed with `PREVIEW_TOKEN_SECRET` (`lib/editor/preview-token.ts`, read straight from `process.env`, no fallback, throws if unset). It was only in local `.env.local`. Generated a random 32-byte base64url value and set it on Vercel **production** via `vercel env add` (confirmed encrypted with `vercel env ls`). Not yet on the `preview` environment — only needed there if a staging deployment is stood up (see D66). Takes effect on the next `vercel --prod`; that deploy was **not** run (held for Alex).

## Staging environment → Beta prerequisite (D66)

A long thread clarified that "staging" had been overloaded. Alex meant a real staging **environment** (a place to test deploys safely), which does **not** exist. Recorded **D66**: a staging environment is a Beta prerequisite (not a Go Live nicety) — because Beta means real founding stores with real money, and one bad deploy hits every tenant at once; the mocked test suite can't catch the failures that bite (migrations, RLS, webhooks, routing, the payments path). Minimum shape: separate Vercel + separate Supabase, test-mode Stripe/Square, a Cloudflare-routed staging subdomain, full env incl. the preview-token secret. Added a **Staging** subsection to the Full Plan's Beta phase.

## Naming fix: "staging engine" → "draft-and-publish"

The editor's draft/preview/publish machinery (built Session 77) had been named "the staging engine" in the docs, which collides head-on with the real staging environment above. Renamed it to **draft-and-publish** across the forward docs (Full Plan, Session Brief, the Make-It-Yours design, the staged-nav plan) with a naming note. "Staging" now means the test environment only; "stage a change" survives as the verb for saving into the draft. The code was already clean (it uses `draft`/`store_drafts`), so this was docs-only. Historical artifacts (the completed Plan-1 file, session logs) keep the old name as a dated record.

## Planned + phased: the "Make It Yours" walk

Designed and wrote the plan for the next editor build, then reshaped it twice under Alex's direction:

1. **First cut:** Bohdi content editing (words) as an agent, with a hand-picked "safe subset" allowlist, walkthrough as the face. I initially proposed a minimal chat box first — Alex pushed back: the walkthrough is the first-run face, chat is the later tool; build the walkthrough first.
2. **Correction — the maker can rewrite ANYTHING we generated.** My "safe subset" framing was backwards. Broadened the editable set to *all* generated text (small labels included). Exclusions are principled, not locks: the maker's own inputs (shop name — it came from them, changed by renaming), images (upload), structure/treatments (the family's).
3. **Correction — the walk replaces ALL placeholders, not just words.** Alex: the walk was always meant to replace the photos too. Widened to include **photo replacement** — the maker uploads their own hero image and founder photo (mapped the real Storage path: `generated-images` bucket, set `.url` on the `moment.media`/`founder.photo` slot, mirroring `applyMedia`). Products (the whole listings side) stay the next big build; the photo touch-up editor (D65) stays later.
4. **Phased.** Alex: build it in phases, outline them in a doc. Wrote **`Editor-Make-It-Yours-Phases.md`** (scope-of-record): **Words → Photos → Sections on/off → Products → later editor deepening.** Updated the design doc's word-only scope, added a phasing map to the plan, recorded **D67** (the rewrite-anything principle + the walk-replaces-all-placeholders scope + the phase order).

**Detailed plan:** `plans/2026-07-29-make-it-yours-walkthrough.md` — 12 tasks, test-first, grounded in the real code (two Explore agents mapped the draft engine + crew copywriter + envelope fields, and the image upload/Storage path). Phase 1 (Words) = the editable-field registry, the content agent (reuses `copywriter.ts`'s forced-tool loop, `claude-sonnet-4-6`), the niche voice loader, the `editContent` action, the walkthrough word steps + host.

## Also

- `/fewer-permission-prompts`: added `Bash(npm run typecheck)`, `Bash(npm run lint)`, `Bash(npm test)`, `Bash(npm test *)`, `mcp__…__show_generations` to `.claude/settings.json`. Deliberately did NOT allowlist `npx vitest`/`npx tsc`/`npx eslint` despite high counts — `npx` is a package runner (arbitrary-execution category).

## Open for Session 79

- **Build approach undecided:** fresh helper per task with review between (Claude's recommendation) vs. inline with checkpoints. Alex picks at the start.
- Start Phase 1 (Words) from the plan. Nothing built on the walk yet.

## Commits

`30b77c6` forwarder + tests · `d6545a6` render forwarder in preview · `c7e1596` tick plan · `becb0a7` D66 staging · `df34ea0` plan complete · `50c90f2` rename staging→draft-and-publish · plus the Make-It-Yours plan commits (`ccc0f10` phases + D67, `4b973f1` photos, `8e66d3b` broaden editable set, earlier plan write) and `chore` permission allowlist. Branch `beta/founder-admin`; no push (deploys are `vercel --prod`, not git push).
