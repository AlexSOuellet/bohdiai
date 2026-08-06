# Session 85 — Listings in the walk: real products, then real collections

**2026-08-05.** The big Listings build, done inside the "Make It Yours" walk. Started from
the spec/plan, built the products half end-to-end, live-tested with Alex (which surfaced a
string of real bugs, each fixed at the root), then — after Alex corrected a mistaken
deferral — built the collections half the same way. 1230 tests pass, tsc + lint clean.
Twenty commits. Alex live-tested throughout on `classic-loafs`.

## Scope, settled with Alex up front

Brainstormed the whole of "Listings" and narrowed hard. The key architectural find that
shaped everything: **the storefront already paints products straight from the `listings`
table** (StorefrontPage's `renderStore`), not from the saved envelope — so product/collection
management is ordinary DB CRUD and the store follows along, for both the live store and the
walk's preview iframe. Alex's calls: **build the simple editor for the walk first** (a
product with the same elements the placeholders carry), the richer standalone Listings admin
(options, several photos + video, stock, digital) is a later build, **both need an AI chat**,
and — mid-build — **collections must be in the walk too** (I had deferred it; that was wrong).
Spec: `docs/superpowers/specs/2026-08-05-listings-walk-goods-design.md`. Plan:
`docs/superpowers/plans/2026-08-05-listings-walk-goods.md`.

## Products half

- **`tenant-media` storage bucket** (public read, service-role write) for maker photos.
- **Shared catalog projection** `lib/storefront/catalog.ts` — the ONE place a `listings` row
  becomes a `ProductView`, resolving the photo from `media_ids` → `uploads.public_url` with a
  fallback to the legacy `metadata.image_url` (placeholders). Consolidated the inline mapping
  out of StorefrontPage and the product-detail page so every read site resolves a maker's real
  photo the same way. `loadCatalog` / `loadMediaMap` batch the uploads lookup.
- **`lib/listings/`**: `price.ts` (parse maker-typed prices → cents), `product-queries.ts`
  (real vs placeholder, insert/update/soft-delete, unique slug, `loadWalkProducts`),
  `product-copy.ts` (Bohdi drafts the short line + description — a thin wrapper over the
  existing content agent, honesty rules carried).
- **Server actions** (`app/dashboard/website/actions.ts`): `uploadProductPhoto`,
  `saveWalkProduct` (the **first real product clears the placeholders** and marks `goods`
  made-yours), `updateWalkProduct`, `removeWalkProduct` (last one un-marks goods),
  `draftProductCopyAction`; `publishStore` gained a direct placeholder-product block.
- **`ProductsEditor`** client component (the `goods` branch of `SectionEditor`): add/edit/
  remove products, photo upload with thumbnail, "Ask Bohdi to write the words," write-it-
  yourself. Seeded server-side with the maker's real products via the walk page.

## Live-test bugs (all root-caused, from the DB not from guessing)

1. **setState-in-render crash** — `onResolved` was called inside a `setProducts` updater
   (runs during render → "update MakeItYours while rendering ProductsEditor"). Moved it out.
2. **Dead "Add product" button, no reason** — added a "what's still missing" hint (name /
   price / photo) beside the disabled button.
3. **Second photo failed silently** — checked the DB (product 1 uploaded fine, 2.68MB, real,
   placeholders cleared; product 2 left **no** `uploads` row) → the upload rejected and the
   code swallowed it. The real cause: **the 10MB cap** (Alex: "10mb is a pretty small file").
   Fix: **accept up to 30MB and downscale + convert to WebP server-side with sharp**
   (EXIF-aware, 2400px longest edge) so a raw phone photo just works and the stored file stays
   small — plus surfaced every upload failure (red error under the Photo field) and reset the
   file picker between products.
4. **Standing rule from Alex: "we always need to display errors, no silent failures."**
   Wrapped every product/collection server call in try/catch so an unexpected throw shows a
   message, not a dead button. Saved as memory `feedback_no_silent_failures`.

## Collections half (after Alex's correction)

Diagnosed live: the 3 collections on the store (Classic Loaves / Weekend Bakes / Gift &
Subscription) were **onboarding placeholders** pointing at the now-cleared fake products, and
the old collections step only reworded the heading — naming 3 collections did nothing. Alex:
"if you deferred it you did so mistakenly. This needs to be done in the walk." Built it:

- **`collections.is_preview`** migration (+ backfill existing to true; `persistCollections`
  now seeds `is_preview: true`) so seeded collections clear like placeholder products but a
  maker-made one never does.
- **`lib/listings/collection-queries.ts`** — create/update/delete, product assignment via
  `listings.primary_collection_id` (what the render reads; the band cover derives from the
  first assigned product's photo), `hasReal`/`hasPlaceholder`/`clear`, `loadWalkCollections`.
- **Server actions** — `createWalkCollection` (marks `collections` made; clears placeholders),
  `updateWalkCollection`, `removeWalkCollection`; `saveWalkProduct` now **also clears seeded
  collections on the first real product**; `publishStore` blocks on placeholder collections;
  and **turning collections off clears the placeholders too** (the `/collections` pages read
  the table directly, so hiding the band isn't enough).
- **`CollectionsEditor`** client component (the `collections` branch) — name a collection,
  tick which real products go in it, edit/remove; empty-products guard; same error discipline.
- **Walkthrough** — collections is now **real-or-off** (keepable false, like reviews/find-us);
  intro copy rewritten. Walk page seeds both products + real collections.

## State + next

The walk is functional end to end for products and collections. **NOT yet gate-verified by
Alex's eyes on collections** — he was going to reload and run the collections step; pick that
up first next session. The full standalone **Listings admin** (options/scent/size, several
photos + video, stock, digital products, basic photo touch-ups D65, the post-onboarding logo)
is the next build. `classic-loafs` still has its 3 seeded collections until the maker makes a
real one or turns the section off (they predate the clearing code).

**Commits (20):** spec + plan → tenant-media bucket → catalog projection → price → product
queries → product copy → product actions → ProductsEditor → wire ProductsEditor → fix
setState-updater → missing-fields hint → upload error surfacing → WebP + error guards →
collections is_preview → collection helpers → collection actions → CollectionsEditor →
collections wiring → collections turn-off cleanup.
