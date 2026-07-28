# Editor Preview — Staged Navigation

> **Status:** planned, not started. Authored 2026-07-28 (Session 77) to build next session.
> **Depends on:** the staging engine (`2026-07-27-editor-staging-engine.md`, complete). Builds directly on it.
> **For agentic workers:** use `superpowers:executing-plans` (or `subagent-driven-development`). Test-first. Alex's eyes gate the final visual check — this has visible output.

---

## The problem (what Alex hit)

In the editor, the preview shows the **staged draft** for the page it opens on (the home). But the moment you click any link *inside* the preview — the footer **Intro** link, a nav item, the wordmark, "shop" — you land on the **live published** store, not your staged version.

**Why:** the entire preview context lives in the iframe's URL query string —
`?previewToken=…&previewLook=…&previewMood=…&previewTexture=…&previewTextureOpacity=…&previewStill=1`.
Every in-store link points at a bare path (`/?intro=1`, `/shop`, `/about`, `/`), carrying **none** of those params. So `StorefrontPage` renders the published envelope, no draft, no still-reveal, no look override → the live look.

The **Intro** link is the clearest case: `IntroReplayLink` is a `<Link href="/?intro=1">` (see `lib/archetypes/main-street/IntroReplayLink.tsx`), so clicking it navigates to the bare home and drops everything.

This is the limitation we deliberately deferred in **D64** ("Preview shows the staged HOME page; navigating within the preview to a sub-page shows the currently-published look… A full staged-navigation preview is a later job."). This plan is that job.

---

## Goal

While inside the editor preview, **every** in-store navigation keeps the preview context, so the maker sees their staged draft on every page (home, shop, product, about, collections, events, contact, legal) until they leave the editor. The live published store, and the maker's normal browsing of it, are untouched.

---

## Approach: client-side param-forwarding (no cookie)

When the storefront renders in preview mode, inject one small client component that intercepts same-origin link clicks and **forwards the current preview params onto the destination**, then does a full navigation. Every page the maker clicks to keeps `previewToken` (+ look + still), so it renders the draft.

Concretely, a capture-phase document click listener:

```
on click (capture phase, so it runs BEFORE Next's <Link> handler):
  a = event.target.closest('a[href]')
  if no a → return
  if modified click (ctrl/meta/shift/alt) or target=_blank → return (let it open normally)
  dest = new URL(a.href, location.href)
  if dest.origin !== location.origin → return (external link)
  if dest.pathname === location.pathname && dest.hash → return (same-page anchor: let it scroll)
  carry forward every preview param present on THIS page's URL:
    for k of [previewToken, previewLook, previewMood, previewTexture, previewTextureOpacity, previewStill]:
      v = current location.search.get(k); if present → dest.searchParams.set(k, v)
  event.preventDefault(); event.stopPropagation();   // stop Next's client router
  location.assign(dest.toString());                  // full navigation, params take effect server-side
```

Capture phase + `stopPropagation` reliably beats Next `<Link>`'s bubble-phase `onClick`, so it works for both `<Link>` and plain `<a>` (both render `<a>`). Reading params from `location.search` at click time (not render time) means it always forwards the *current* page's context, so it stays correct across multiple hops.

### Why not a cookie

The obvious alternative — set a "previewing" cookie so every request renders the draft — leaks: a cookie on the storefront origin (`<sub>.bohdiai.com`) applies to **all** tabs on that origin, so the maker viewing their real live store in another tab would also see unpublished edits. Path-scoping the cookie would need routing changes. Param-forwarding keeps the context in the iframe's URL only — no cross-tab leak, nothing to clear.

---

## File structure

**Create:**
- `app/storefront/_components/PreviewLinkForwarder.tsx` — `'use client'`; a `useEffect` that attaches/removes the capture-phase listener. Renders nothing.
- `app/storefront/_components/PreviewLinkForwarder.test.tsx` — unit tests (jsdom).

**Modify:**
- `app/storefront/_components/StorefrontPage.tsx` — render `<PreviewLinkForwarder />` when in preview mode (any `previewToken` present). Fold it into the existing `withStillReveal` wrapper, or add a sibling wrapper `withPreviewChrome` that adds both the still-CSS and the forwarder.

**No change needed** to the editor, the proxy, or the token — the editor already puts the params on the iframe URL; we just keep them alive across clicks.

---

## Task 1: `PreviewLinkForwarder` component + tests

**Files:** create `PreviewLinkForwarder.tsx`, `PreviewLinkForwarder.test.tsx`.

- [ ] **Step 1: Write failing tests** (jsdom). Mock navigation by spying on a passed-in navigate fn OR `window.location.assign` (jsdom: define a configurable `assign` mock). Cases:
  - Renders the component (returns null), attaches a listener; clicking an internal `<a href="/shop">` while the page URL has `?previewToken=T&previewStill=1` → navigates to `/shop?previewToken=T&previewStill=1`.
  - Forwards **all** present params (`previewLook`, `previewMood`, `previewTexture`, `previewTextureOpacity`) and omits absent ones.
  - External link (`https://other.com`) → NOT intercepted.
  - Modified click (metaKey/ctrlKey) or `target="_blank"` → NOT intercepted.
  - Same-page hash link (`#reviews` when already on that path) → NOT intercepted (let it scroll).
  - The Intro case: `<a href="/?intro=1">` → navigates to `/?intro=1&previewToken=T&…` (params merged, `intro=1` preserved).

  > Tip: make the navigation side-effect injectable (e.g., an internal `navigate = (url) => window.location.assign(url)` you can stub) so the test asserts the computed URL without fighting jsdom's read-only `location`.

- [ ] **Step 2: Implement** the component per the Approach pseudocode. Read the forwarded-key list from a single `const PREVIEW_PARAM_KEYS = [...]`. Attach on mount, remove on unmount. Guard `typeof window !== 'undefined'`.

- [ ] **Step 3: Run tests** → PASS. Typecheck + lint.

- [ ] **Step 4: Commit** — `feat(editor): forward preview params across in-store navigation`.

---

## Task 2: Render the forwarder in preview mode

**Files:** modify `StorefrontPage.tsx`.

- [ ] **Step 1:** Preview mode = `previewToken !== undefined` (only the editor mints a token; covers both the inline iframe and the full-size Preview tab). Render `<PreviewLinkForwarder />` alongside the store output when in preview. Simplest: extend `withStillReveal` into a `withPreviewChrome(node, { still, preview })` that appends the forwarder (always in preview) and the still-CSS (when `still`). Keep the still-CSS placement AFTER the markup as now.

- [ ] **Step 2:** Add a test to `StorefrontPage.test.tsx`: preview render (token present) includes the forwarder; public render (no token) does not. (Assert via `renderToStaticMarkup` — the forwarder renders null, so assert on a wrapper marker, or assert the component is in the returned tree. Prefer a `data-preview-nav` marker element the forwarder renders, or test the branch by spying.)

- [ ] **Step 3:** Typecheck + lint + full suite.

- [ ] **Step 4: Commit** — `feat(editor): render preview-nav forwarder in the storefront preview`.

---

## Task 3: Full verification (Alex's eyes gate)

- [ ] Whole suite green; typecheck + lint clean.
- [ ] **Manual, on a real store with a staged draft:**
  1. In the editor, stage a feeling change (e.g., Cozy → something). Open the preview.
  2. Click **Intro** → it replays / stays on the **staged** home, not the live look.
  3. Click nav items (Shop, About, Events, Contact), the wordmark, a product, a collection → each shows the **staged** look, not the published one.
  4. Open your **live** store in a separate normal tab → still the **published** look (no leak).
  5. External links / new-tab clicks behave normally.

---

## Known caveats to note (not blockers)

- **Full reload per click in preview.** Forwarding via `location.assign` means preview navigation loses Next's client-side routing (each click reloads). Acceptable — correctness over speed in a preview. (A later optimisation could forward via the router instead, but that's not worth the complexity now.)
- **Token TTL (15 min).** If a maker previews for >15 min then navigates, the token expires and draft *content* falls back to published. Because the **look** params (`previewLook`/`Mood`/`Texture`) don't need the token, the look stays correct — only draft-authored content would fall back, which for door-1 (look only) is identical anyway. Revisit token refresh (or a longer TTL) when **content editing** lands and the draft carries edited words. Flag it there, not here.
- **Forms** (search, contact) aren't anchor navigations, so they aren't forwarded. Out of scope — the preview is for browsing the look, not submitting forms.
- Refines **D64**; no new product decision — this is the deferred "staged navigation" implementation. The approach (param-forwarding over a cookie) is a technical call recorded here.
