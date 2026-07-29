# "Make It Yours" — the phased build

**Written 2026-07-29, Session 78.** The "Make It Yours" walk is how a maker turns the store we generated into their own. It's a big piece, so we build it in **phases** — each one ships on its own and adds one more thing the maker can make theirs. The detailed, test-first tasks for the first phases live in `plans/2026-07-29-make-it-yours-walkthrough.md`.

This document is the scope-of-record for the walk. Where the older `Editor-Make-It-Yours-Design.md` says "words only," this supersedes it (that spec was written before we decided the walk also replaces photos).

---

## The promise

We build the maker a polished, unique store. Then Bohdi walks them through replacing everything in it that's *ours* with *theirs* — their words, their photos, and (later) their real products — one section at a time, watching each change land in the preview. Nothing goes live until they Publish.

## The principle that governs every phase

**The maker can rewrite ANYTHING we generated.** When in doubt, the thing is editable. The only things off-limits are the ones that aren't ours to change: the maker's own inputs (their shop name — changed by renaming, not by Bohdi), the store's structure and look (the family's job, not Bohdi's), and photos we handle by *upload* rather than reword. We never ship a walk that leaves the maker stuck with our placeholder.

---

## Phase 1 — Words

Bohdi rewrites the store's words. The walk steps the maker through each section, asks in plain language for their real information (or offers to write it from a feeling), and writes it in their voice into the draft. Apply-then-see — keep it, ask for another take, or tweak it.

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

- **Phase 1 (Words):** the editable-field registry, the content-editing agent, the niche voice loader, the `editContent` action, and the walkthrough's word steps + host in the editor.
- **Phase 2 (Photos):** the image slots + setter, the `uploadStoreImage` action, the image picker, and the photo step in the walk.
- **Phase 3 (Sections on/off):** the hidden flag, the renderer skip, `toggleSection`, and the "switch it off" control in the optional-section steps.

Phase 4 (products) and the later items each get their own plan when we reach them.
