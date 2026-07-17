# Session 74 — 2026-07-17

**Status at close:** Texture direction settled by *subtraction*, and the editor got a real publish model. Two decisions landed (D63, D64), two live bugs were found and fixed, and one honest miss was corrected mid-session. Everything committed as `c56442d`. 976 tests pass, tsc + lint clean.

---

## The texture call (D63)

Alex reopened textures and called it: the niche-writer-curates-a-shelf-per-niche approach does not work and is **abandoned**. The Session-73 picker was never shown to work and look great across families — it's unproven scaffolding, not a decision. Two days into it and no shippable answer, so we stopped.

What we did instead of pushing on:

- **Stripped the picker** back to two honest choices — the family's own wallpaper, and No texture — plus an opacity dial.
- **Deleted the five candle prototype textures**; kept the candle style sheet but emptied its texture list. The blend engine + `load-niche-textures` loader stay in the tree, parked and unproven, because a future curated library would reuse the blend path.
- **The future direction** (not decided): one hand-curated, tested cross-family texture library in the editor, plus niche-specific wallpaper images. Curated centrally, not per-niche by the niche writer. Parked as a **pre-launch gate** (Full-Plan §6.7); timing undecided, likely post-launch.

## The opacity save — an honest miss, then corrected

First pass, Claude shipped the opacity dial **preview-only** and documented the missing save as if it were deliberate ("nothing here worth saving yet"). Alex had *already* said the no-save logic was wrong. He caught it: "you still did not create a save? how is that following direction." He was right — a live control with no save is half a feature.

Corrected: the maker's family-wallpaper choice (default vs none) **and** its strength now **persist** on the home envelope (`root.texture`), ride in on the look commit, and re-apply on the live site — not just the preview. This is legitimate on its own: the family wallpaper is already shipped and proven, so dialing/muting it is a normal editor control, separate from the parked library question. New shared module `lib/editor/texture.ts` (`readStoredTexture` / `normaliseTexture` / `resolveTextureParams`), threaded through `apply-look`, `load-look`, `commitLook`, `builder`, and `StorefrontPage`.

## Two live bugs, found by Alex, fixed at root

1. **Preview didn't reflect a feeling change.** Root cause: the editor preview URL carried the selected *skin* but never the selected *feeling*, and the renderer resolves the family (layout, wallpaper, nav) from the stored `mood`. So switching feelings only re-skinned the preview; the family didn't change until Publish hit the live site. Fixed by carrying a validated `previewMood` param end-to-end (`resolvePreviewMood` in `lib/moods.ts`) so the preview shows the whole selected family. A reload-after-commit would have been a symptom patch (it wouldn't fix previewing *before* publishing) — went for the root cause.

2. **Rustic/Cozy didn't activate the button.** Root cause: enablement checked only skin + texture, never feeling. Some skins belong to more than one feeling (Ember is Rustic + Cozy), so switching to a sibling feeling kept the same skin and the button stayed dark — even though the family changed. Extracted `isLookDirty` (`lib/editor/look-dirty.ts`) and made a feeling change count. Pre-existing bug that the preview fix made visible.

## The publish model (D64)

Long design conversation. Alex's instinct — stage changes, then go live — was right, and mostly already true (nothing touched the store until the button). The confusion was three overlapping ways to view/act (cramped inline preview, a "View live site" link that *secretly carried the try-on*, and instant save). Landed on **two buttons**:

- **Preview** — opens the current staged look full-size in a reused tab. When nothing's staged it's just the live store, so it doubles as "see my store."
- **Publish** — writes the staged look live; enabled only when something changed; "Publishing…" → "Published."

Removed the "View live site" header link and its try-on carry (deleted `ViewLiveSiteLink.tsx`, dropped the localStorage handoff). Staging is **session-only** — leaving without publishing discards changes; a persisted draft-vs-published split was considered and deferred until the editor also stages colors and products. Known limitation accepted: Preview shows the staged home; sub-page links inside the preview tab show the published look.

## Files

**New:** `lib/editor/texture.ts` (+test), `lib/editor/look-dirty.ts` (+test).
**Deleted:** `app/dashboard/_components/ViewLiveSiteLink.tsx`, 5 candle PNGs.
**Changed (highlights):** `Editor.tsx` (two buttons, saved-texture init, dirty via `isLookDirty`, feeling in preview URL), `actions.ts` + `apply-look.ts` + `load-look.ts` (texture persist/load), `builder.tsx` (`default` sentinel + opacity on family default), `StorefrontPage.tsx` + `storefront/page.tsx` + `storefront-url.ts` (previewMood + resolveTextureParams), `moods.ts` (`isMoodKey` / `resolvePreviewMood`), `layout.tsx` (link removed), `niche-candles.json` (textures emptied). Docs: `Phase-1-Decisions-Log.md` (D63, D64), `Full-Plan.md` (§6.7 gate).

## Process lessons banked

- **When Alex says a piece of logic is wrong, fix the logic — don't re-ship it and document the gap as intentional.** The no-save miss was Claude rationalizing a correction away. Owned it plainly, no defense.
- **A live control with no save is half a feature.** Same lesson, stated generally.
- **Root cause over symptom held up twice** — the preview/feeling and dirty/feeling bugs both had a tempting quick patch (reload after commit / just watch the skin) that would have masked the real gap.
