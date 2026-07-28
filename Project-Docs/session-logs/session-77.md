# Session 77 — 2026-07-28

**Headline:** the editor staging engine (Plan 1) is complete and verified live. Finished Tasks 5–9, fixed two bugs the live check surfaced, and wrote the plan for the next piece (preview staged navigation) that Alex wants built tomorrow.

## What landed

Picked up the staging-engine plan (`plans/2026-07-27-editor-staging-engine.md`) at Task 5. Tasks 1–4 were already committed (Session 76).

- **Task 5 — draft render under a preview token.** `StorefrontPage` now renders the staged draft when the request carries a `previewToken` that verifies (HMAC, unexpired) to the same tenant it resolved to; falls back to published when the draft is empty. Public visitors (no token / forged / another tenant) always get published. Home + sub-page + collection branches. Commit `3abb645`. Also fixed a pre-existing strict-tsc error in the Task 4 preview-token files (dot-access on `process.env`) — `9f53528`.
- **Task 6 — editor actions on the draft.** Added `stageLook` / `publishStore` / `resetStore` (additive; `commitLook` kept until Task 8 rewired the editor, to keep every commit green). `stageLook` seeds from the live envelope on first edit, else builds on the existing draft. Commit `590c5fb`.
- **Tasks 7–8 — page + editor rework.** The editor page loads any existing draft (opens on the staged look) and mints a preview token. `Editor.tsx` consolidated its four look states into one `Selection` object; every feeling/skin/texture change stages to the draft in the background; Publish/Reset/Undo act on the draft; `commitLook` removed. Commit `5ba63a1`.
- **Task 9 — verification.** 1007 tests, tsc + lint clean. Alex verified live on the candle stores: all six feelings preview correctly, products render on every family, Publish works.

## Two bugs fixed during the live check

1. **Preview lag.** The original Task 8 wiring only reloaded the preview iframe *after* the background stage write completed (token-only src + a nonce bumped on success). That put a server round-trip in front of every preview repaint — a visible lag, worst on Modern. **Fix:** the preview now shows the selection instantly via URL params (`previewLook`/`previewMood`/`previewTexture`), carrying the token so it still renders the maker's own draft content underneath; the stage write happens in the background. Dropped the nonce.

2. **Products invisible in the preview pane** (`4636404`). Reported as "Modern products don't load," then "cozy too." Investigated with the systematic-debugging skill; first hypothesis (below-fold scroll-reveal) was refuted by Alex (scrolling didn't help, cozy failed too). Fetched the exact preview URL via PowerShell and confirmed the products **are** in the SSR HTML (5 real module items) — held at `opacity:0` by the storefront's scroll-in reveal, which never fires in the static/embedded preview iframe. **Fix:** the inline preview sends `previewStill=1`; `StorefrontPage` wraps the render with a small override that lands every reveal (`.ms-reveal`, `.ms-const-card`, `.ms-module-item`, `.ms-table-item`) in its resolved state — mirrors the exact `.in` values, non-`!important` so responsive rules still win, placed after the markup so it wins cascade ties. The live published store keeps its scroll animation; the full-size Preview link keeps the animated URL. Saved the lesson to memory (`project_reveal_in_preview_gotcha`).

## Surfaced, planned for next session

Alex found that clicking any link inside the preview (the footer **Intro** link, nav items, the wordmark) drops the preview params and lands on the **live** site, not the staged draft. This is the deferred D64 "staged navigation" gap. He wants it built — "now, but not today." Wrote the full plan: **`plans/2026-07-28-editor-preview-staged-navigation.md`** — a client-side param-forwarder that carries the preview context across in-store clicks (chosen over a cookie, which would leak the draft into the maker's live-site tab). 3 tasks, test-first.

## Process notes

- Long infra detour: the preview/dev server I start via `preview_start` runs in a memory-starved cloud sandbox (`C:\Users\runneradmin`) that can't run Next dev and Alex can't reach anyway — Alex runs his own dev server; my Bash can't reach his localhost but **PowerShell can** (it manages his machine). Used PowerShell/`curl.exe --resolve` to fetch his running preview for evidence.
- Cleaned up a runaway: **2,333 orphaned Next `postcss.js` worker processes** (~27 GB) from stacked/crashed dev-server starts were crushing Alex's machine — killed only the postcss workers by command-line match. Lesson: don't stack dev servers; kill one fully before starting another.
- `.localhost` subdomains resolve in Chrome/Edge but not necessarily at the OS level — relevant to why Alex's storefront links sometimes "won't open."

## State

- Branch `beta/founder-admin`. Commits this session: `9f53528`, `3abb645`, `467dba8`, `590c5fb`, `a1bb817`, `4636404`, `5ba63a1`, `8f6e363` (+ this session's doc commit).
- 1007 tests pass. tsc + lint clean.
- Owed: `PREVIEW_TOKEN_SECRET` in the deploy env before the preview ships (local is set).
