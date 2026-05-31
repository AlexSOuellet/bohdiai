# Storefront Engine Audit

**Date:** 2026-05-31
**Purpose:** A cold, critical read of the whole storefront build engine — not a fix list. The goal is to understand the actual shape of the system and where it is structurally broken, so we stop patching one test site at a time and can make real decisions (including the Claude-vs-Gemini question).
**Scope:** The layout-engine path (candles). No code was changed to produce this. It is analysis only.

---

## The one-sentence diagnosis

**Bohdi is allowed to build with more than the engine knows how to deliver.**

The engine is made of four stages that hand work to each other:

1. **Compose** — Bohdi designs the page (fonts, colors, nav, products, layout).
2. **Save** — his design is written to the database.
3. **Fetch** — when a visitor loads the page, the engine looks up the live data (products, nav, images).
4. **Draw** — the page is rendered to the screen.

Each stage was built to a slightly different idea of what the others would provide. Nobody ever reconciled the seams between them. So Bohdi regularly uses something legitimate — a font assignment, a nav, a collection image — and it quietly falls on the floor between two stages because the receiving end was never wired to catch it.

**That is why it feels like whack-a-mole.** You are not fixing Brian's site. Each test is *discovering*, one at a time, another thing that was authored but never connected. Until the engine guarantees that everything Bohdi can express, the pipeline can actually deliver, every new maker will surface a fresh version of the same class of failure.

There is also a second, deeper problem that is *not* about wiring. It's covered at the end.

---

## The wiring failures (each one hits every maker, not just Brian)

### 1. The navigation is empty for everyone

Bohdi builds a complete navigation bar on every page — wordmark, links, cart. When he does, he drops in a "fill this with the site's nav" marker and expects the engine to populate it.

The fetch stage only returns pages that are flagged "show in navigation." The save stage **never sets that flag** — it marks every page as *not* in the nav. So the fetch always comes back empty.

Two halves of the engine were written to opposite rules: one only shows flagged pages, the other never flags any. The result is a guaranteed-empty nav on every site. Bohdi did his part correctly; the engine drops it.

**Severity: high. Systemic. Affects every tenant.**

### 2. The fonts Bohdi picks are thrown away

This is the most likely cause of "bad fonts."

Bohdi chooses a specific typeface for each piece of text — a display serif for headlines, a clean sans for body, a script for accents. For Brian he picked a genuinely good set (Fraunces, Outfit, Sacramento). He assigns each one through a field on every text element.

The font *files* load correctly. But the renderer **never reads the per-element font assignment** — that field appears to be dead code. So all of Bohdi's careful typeface choices are ignored and the text falls back to a single default. The page looks generic and "off" even though the design specified otherwise.

**Severity: high. Systemic. (One detail I still want to confirm directly before calling it 100% certain — but it is the strongest explanation and it is structural, not a Brian quirk.)**

### 3. Collection images never show

The database has a slot for a collection's image. The fetch stage never asks for it. So a collection's image is *always* missing, and collections always render as plain text cards — no matter what Bohdi or the maker does.

**Severity: medium. Systemic.**

### 4. Social links and cart are placeholders

Bohdi can place social icons and a cart. The fetch stage returns nothing for both, on purpose — there's no real data source connected yet. These are known stubs, lower stakes, but they're part of the same pattern: Bohdi can author things the back end doesn't yet serve.

**Severity: low–medium. Known.**

---

## Two honesty notes

- **The page addresses are fine.** I suspected earlier that the page web addresses (`/shop`, `/about`) might not match between save and lookup. They do match. Not a bug.
- **The flat product thumbnails on the home page are NOT yet explained.** Product images do save and do render in general, so this one needs a focused look at the home page specifically. I'm flagging it as open rather than guessing.

---

## The deeper problem: "it still looks stacked"

This one is a different animal. It is **not** a wiring seam, and fixing all of the above will not touch it.

The engine has no review loop. Bohdi composes the page, it gets saved, and that's the end. He never sees what he rendered, never judges whether it looks ordinary, never revises. He builds blind and one-shots it. That is the root cause of the "monotonous stack" look we diagnosed two sessions ago — and it's the harder problem, because it isn't a missing connection you can solder. It's a missing capability: make → see → judge → fix.

So the system has two distinct kinds of broken:

- **Unsewn seams** (nav, fonts, collection images) — fixable by reconciling the contract between stages.
- **A missing feedback loop** (the stacked, safe, ordinary feel) — requires the engine to let Bohdi see and revise his own work.

These should not be conflated. They have different fixes and different difficulty.

---

## What is actually solid

So this reads as an honest audit and not a hit piece — real parts of the engine are sound:

- The design rules Bohdi composes against are rigorous and well-validated.
- Products are fetched and shown correctly.
- Nothing Bohdi authors is lost at save — it all persists.
- The font files themselves load correctly (the problem is they're not *applied*).
- Page addressing is consistent end to end.

The engine isn't rotten. It's **unsewn at the seams, and missing the feedback loop that was supposed to stop the slop.**

---

## What this means for the Claude-vs-Gemini question

We cannot fairly test Gemini against Claude yet. Most of what looked like "the model built a broken site" is actually our engine dropping the model's correct work. If we hand the same broken pipeline to Gemini, we'd be comparing two sites broken in the same places by our own code — no real signal.

The engine has to reliably produce a *complete, correct* site first. Then a Claude-vs-Gemini race on speed, cost, and quality means something.

---

## Appendix — where each problem lives (for engineering)

- **Nav flag never set:** finalize writes `content_pages.is_in_nav = false` (RPC `write_tenant_storefront_layout`); resolver `fetchNavLinks` requires `is_in_nav = true` (`lib/layout/resolver-supabase.ts`).
- **Fonts dropped:** Bohdi assigns font via `intent.type` on nodes; renderer intent handling appears not to consume `intent.type` (`lib/layout/intent.ts` schema vs `components/storefront/layout/` render). Needs direct confirmation.
- **Collection images:** `fetchCollections`/`fetchCollection` never select `featured_image_id` (`lib/layout/resolver-supabase.ts`).
- **Social/cart stubs:** `fetchSocialLinks` returns `[]`, `fetchCart` returns empty (`lib/layout/resolver-supabase.ts`).
- **Home thumbnails:** unexplained — needs a focused look at the home `layout_tree` + product image rendering.
- **No review loop:** there is no render → vision → revise step anywhere in `lib/bohdi/run.ts`.
