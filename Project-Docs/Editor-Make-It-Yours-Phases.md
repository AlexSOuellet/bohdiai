# "Make It Yours" — the phased build

**Written 2026-07-29, Session 78. Updated 2026-07-31, Session 80 (D69, D70).** The "Make It Yours" walk is how a maker turns the store we generated into their own. It's a big piece, so we build it in **phases** — each one ships on its own and adds one more thing the maker can make theirs. The detailed, test-first tasks for the first phases live in `plans/2026-07-29-make-it-yours-walkthrough.md`.

This document is the scope-of-record for the walk. Where the older `Editor-Make-It-Yours-Design.md` says "words only," this supersedes it (that spec was written before we decided the walk also replaces photos).

**The walk is the second half of onboarding, not a feature inside the editor (D69).** It loads full-screen the first time the maker logs into their dashboard — not behind a prompt, not opt-in — and it is mandatory: the maker cannot reach the real editor until they finish it. The phases below are the *build order*; the maker-facing experience is one unified section-by-section pass described under "How the walk works."

---

## The promise

We build the maker a polished, unique store. Then Bohdi walks them through replacing everything in it that's *ours* with *theirs* — their words, their photos, and (later) their real products — one section at a time, watching each change land in the preview. Nothing goes live until they Publish.

## The principle that governs every phase

**The maker can rewrite ANYTHING we generated.** When in doubt, the thing is editable. The only things off-limits are the ones that aren't ours to change: the maker's own inputs (their shop name — changed by renaming, not by Bohdi), the store's structure and look (the family's job, not Bohdi's), and photos we handle by *upload* rather than reword. We never ship a walk that leaves the maker stuck with our placeholder.

---

## How the walk works (the maker-facing model — D69, D70)

The store is built with **every section on and populated** — nothing is hidden or off by default. The walk shows the maker the whole store and lets them *subtract* (skip → off) or *make-real*, one section at a time. Watching each change land in a **live preview** beside the controls is the point — it's what makes this different from dropping the maker into a bare editor. The walk reuses the draft-preview plumbing already built (live draft render, HMAC preview token, staged navigation — Sessions 77–78).

**Per section**, the maker resolves it one of three ways: **keep it as built**, **change it**, or **skip it** (which turns the section off). The gate to the editor is that every section has been resolved.

Each section opens with plain-English guidance: what this section is, what the maker **must** replace before they can publish, and what's optional. Below that, the section's pieces show as **edit boxes** with their current content. "Leave as is" appears only on optional pieces; on must-replace pieces the only path is Edit (or, for a whole optional section, skip it off). Choosing Edit steps the maker through that piece — light for brand-voice copy (type your own, or ask Bohdi), deeper for personal content (the About questions, D68).

**Required vs. optional:**
- **About** and **Listings (real products)** are the only sections that require the maker's own real input before finishing — no "leave as is," no skip.
- **Collections** and **Reviews** can be skipped off.
- Everything else can be kept as built.

**Reviews (D70):** shown on with AI placeholder quotes, same as placeholder products. The maker replaces them with real ones or skips the section off. Fabricated reviews are draft-only scaffolding — the **publish gate** blocks going live while any AI review still shows.

**Publishing is gated on honesty:** the store can't go live while the About is still ours, while products are still placeholders, or while any review is still fabricated.

**Not one-and-done.** The walk is a one-time pass to make the site **legitimate** — real words, real products, no leftover fill-from-us. The maker is told plainly that once it's done the editor is always there and they can rework anything whenever they want. The walk makes the store real; the editor is where they keep refining it.

*Open (D69):* whether any structurally load-bearing section (the hero especially) is exempt from "skip → off," or whether everything except About and Listings is genuinely skippable. Not settled.

---

## Phase 1 — Words

Bohdi rewrites the store's words. The walk steps the maker through each section. For **personal content** (About, story, founder line) it asks in plain language for their real information and arranges it — there is no "write it from a feeling" shortcut (D68). For **brand-voice content** (headlines, hero lines, taglines, CTAs, product copy, the marquee) Bohdi can write from a direction, a feeling, or just the niche. Either way it lands in the draft, apply-then-see — keep it, ask for another take, tweak it, or type exactly what they want (a first-class path on every field).

**Done when:** a maker walks through a fresh store and comes out with every word theirs, and Publish takes it live.

## Phase 2 — Photos

The maker uploads their own photo in place of the AI hero image and the founder photo, right inside the same walk.

**Done when:** a maker replaces both photos with their own in the walk, and Publish takes them live.

## Phase 3 — Sections on/off

The optional sections (kind words, where-to-find-you, the scrolling line, collections) can be switched on or off — in the walk ("make it yours, or switch it off") and as a normal control afterward. Off keeps the content, so turning it back on restores it.

**Done when:** a maker turns an optional section off and back on, publishes, and the content is intact.

## Phase 4 — Products (the next big build)

Replace the five placeholder products with the maker's real ones — name, price, photo, options. This is the whole **listings** side, a large build of its own, and product photos ride with it. The walk gains a products step that turns on once listings exist.

**Done when:** a maker replaces the fake products with their real ones through the walk.

## Later — deepening the editor

Once the walk delivers a real first run, the editor keeps growing, each its own build on the same draft-and-publish:

- The photo **touch-up** editor — background removal, crop, brightness, warmth (the basic side is included; the generative side is a $5/month add-on, D65).
- **Free-form chat** — the maker-led "change this, reword that" tool, the same writer as the walk, a different face.
- **Click straight on a headline** to edit it, and **highlight-and-rewrite** a paragraph.
- **Reordering** sections.
- **"Use my own colors"** (Growth).

---

## How the phases map to the plan

The detailed tasks for Phases 1–3 are in `plans/2026-07-29-make-it-yours-walkthrough.md`, and each phase ends at a shippable, eyes-checked checkpoint:

- **Phase 1 (Words):** the editable-field registry, the content-editing agent, the niche voice loader, the `editContent` action, and the walkthrough's word steps. *(Host note — D69: the walkthrough panel built in Session 79 lived inside the editor. It moves to a full-screen onboarding-continuation surface that gates the editor. Reworking the host is part of finishing Phase 1.)*
- **Phase 2 (Photos):** the image slots + setter, the `uploadStoreImage` action, the image picker, and the photo step in the walk.
- **Phase 3 (Sections on/off):** the hidden flag, the renderer skip, `toggleSection`, and the "switch it off" control in the optional-section steps.

Phase 4 (products) and the later items each get their own plan when we reach them.
