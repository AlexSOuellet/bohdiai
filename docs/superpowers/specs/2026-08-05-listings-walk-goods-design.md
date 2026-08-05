# Listings in the walk — the goods step gets real products

**Written 2026-08-05 (Session 85). Design spec.** Scope narrowed with Alex: build the
**simple product editor for the walk only**. The full Listings Admin (maker-defined
options, several photos + video, stock, digital products, sorting into collections,
touch-ups, the logo) is its own later build. This build **finishes the walk**: the goods
step becomes a place the maker adds their real products, so the walk can be completed with
real work and the store can honestly go live.

Governed by the walk model (D69/D70) and seller-defined-listings direction (D4, deferred
here). Prior walk spec: `2026-07-31-make-it-yours-onboarding-walk-design.md`.

---

## 1. What the code already gives us (grounding)

- **The storefront paints products straight from the `listings` table**, not from the
  saved envelope. `renderStore` in `StorefrontPage.tsx` queries `listings` (type
  `product`, active, not deleted) → `ProductView[]` and hands them to the renderer. The
  goods beat, `/shop`, and collection pages all read that same catalog. **So product CRUD
  is direct DB work — the store follows along on its own, for both the live store and the
  walk's preview iframe (they read the same table).**
- **Placeholder products** are real `listings` rows flagged `is_preview = true` and
  `metadata.placeholder = true`, with their image URL in `metadata.image_url` (an AI/stock
  URL). The renderer reads that metadata URL for the photo.
- **Media is designed properly already**: an `uploads` table (polymorphic, `source`,
  `public_url`, etc.) plus `media_ids uuid[]` on `listings`. The placeholder path skips it
  with the `metadata.image_url` shortcut; real maker photos will use the proper path.
- **The walk** is a full-screen gated sequence (`MakeItYours.tsx`) of `SectionEditor`
  steps. Reviews and find-us already render a **rows editor** branch instead of the Bohdi
  conversation — the goods step follows that precedent with a **products editor** branch.
- **Resolution + gates** live on the draft envelope: `markSectionMade(env,'goods')` makes
  `walkComplete` and `publishBlockers` pass. Products aren't in the envelope, so the
  goods **flag** rides the envelope while the products themselves live in the table.

## 2. The core product (same elements as the placeholders)

A walk product carries exactly what a placeholder carries, no more:

- **name** (required)
- **price** (required; maker types `$24` / `24` / `24.50` → stored as `base_price_cents`)
- **one photo** — the maker's own upload (required for the product to count as real)
- **short description** (the card line)
- **description** (the longer body)

Stored as a `listings` row: `listing_type = 'product'`, `status = 'active'`,
`is_preview = false`, no `placeholder` metadata, `media_ids = [uploadId]`,
`requires_shipping = true`, `currency = 'USD'`, slug slugified from the name (uniqued per
tenant). **No** stock, options, digital, multiple photos, video — those are the Admin build.

## 3. Real photos — the one new piece of plumbing

- A new **public-read storage bucket** for maker media (`tenant-media`), service-role
  write, mirroring the existing `placeholder-images` bucket's policies.
- **Upload server action**: validates the maker owns the tenant (`getCurrentShop`), checks
  mime + size, writes the file to `tenant/{tenantId}/products/{uuid}.{ext}`, inserts an
  `uploads` row (`source: 'user_upload'`, `public_url`), returns `{ uploadId, publicUrl }`.
  The client shows the thumbnail from `publicUrl`.
- The product's photo is referenced the **proper** way: the saved listing sets
  `media_ids = [uploadId]`. **The renderer's listing→ProductView projection resolves
  `media_ids` → `uploads.public_url` first, falling back to `metadata.image_url`** so
  legacy placeholders keep rendering. This projection is consolidated into one shared
  helper (`lib/storefront/catalog.ts`) used by every read site (home, `/shop`, product
  detail, collection detail), removing the duplicated inline mapping.

## 4. The goods walk step

`SectionEditor` gains a `goods` branch rendering a new **`ProductsEditor`** client
component (parallel to the reviews/find-us rows branch). It shows:

- **Bohdi's intro** for the step (already written) — reframed: *these stand-ins we made up
  will step aside as soon as you add your own.*
- **The maker's real products so far** — a simple list (thumbnail, name, price) with edit
  and remove. Empty at first (the made-up ones are **not** shown here — they're not the
  maker's; they only appear in the preview until cleared).
- **Add / edit a product** — the fields in §2, with:
  - a **photo uploader** (drag/pick → the upload action → thumbnail),
  - the **AI assist / chat**: the maker tells Bohdi about the piece and he drafts the
    short description + description into the fields (grounded in the shop's niche voice);
    the maker edits freely or asks again. Photo and price are always the maker's own —
    Bohdi only ever helps with the words. ("Both need an AI chat" — this is it for the
    walk; it rides into the Admin later.)
  - **write-it-myself** is the default first-class path; the assist is opt-in.

**Saving the first real product** (server action `saveWalkProduct`): inserts the real
listing, and — because it's the first real one — **soft-deletes every placeholder listing**
for the tenant (`deleted_at`), then **marks `goods` made-yours** on the draft envelope so
`walkComplete`/`publishBlockers` pass. Later saves just insert. **Removing** a product
soft-deletes it; if it was the last real one, the goods made-yours flag is cleared so the
step un-resolves honestly.

**The step resolves** when at least one real product exists. One is enough to finish the
walk; the maker can add as many as they like here, and manages/enriches them in the Admin
later.

## 5. The publish honesty gate

`publishStore` already blocks on unresolved honesty sections. It gains a **direct
placeholder check**: block publish while any placeholder product row still exists for the
tenant (independent of the envelope flag), naming "your products". Since the first real
save clears placeholders, this passes naturally — it's the belt-and-suspenders that keeps
a fabricated product from ever going live even if the envelope flag drifts.

## 6. What is NOT in this build

The dashboard **Listings Admin** and its richer product (maker-defined options, several
photos + video, stock/inventory, digital products, assigning products to collections, the
D65 photo touch-ups, the post-onboarding logo). The Listings nav item stays "Soon". The
walk's **collections** step stays as it is today (keep as built or skip). Products are
managed only through the walk in this increment; the Admin is the next build and reuses the
`ProductsEditor` + AI assist as its foundation.

## 7. Architecture

- **Storage + upload:** one migration creates the `tenant-media` bucket (public read,
  service-role write). `uploadProductPhoto(formData)` in the website actions writes the
  file, inserts the `uploads` row, returns the id + public URL.
- **Catalog projection:** new `lib/storefront/catalog.ts` — `listingToProductView(row,
  mediaMap)` and `loadCatalog(tenantId)` (loads listings + resolves referenced uploads in
  one batch). `StorefrontPage.tsx` and the product-detail path use it. Fallback to
  `metadata.image_url` preserved for placeholders.
- **Product write actions** (website `actions.ts`): `saveWalkProduct(input)`,
  `updateWalkProduct(id, input)`, `removeWalkProduct(id)`. All ownership-gated via
  `getCurrentShop`; all use `supabaseAdmin`. First real save clears placeholders +
  `markSectionMade('goods')`; last removal clears the flag. A small
  `hasPlaceholderProducts(tenantId)` / `hasRealProducts(tenantId)` helper backs the gate
  and the flag.
- **Price parsing:** `parsePriceToCents(input)` (shared with the existing
  onboarding `priceToCents`), rejecting an unparseable/zero price with a friendly error.
- **AI assist:** `draftProductCopy({ name, hint })` → grounds in niche voice, returns
  `{ shortDescription, description }`. Reuses the content-agent / niche-voice plumbing;
  never touches the photo or price.
- **`ProductsEditor` component:** the products branch of `SectionEditor`; receives the
  maker's current real products (loaded server-side in the walk page) + the tenant's
  preview refresh hook (`onChanged` bumps the preview nonce so added products show).
- **Walk page** (`app/make-it-yours/page.tsx`): loads the maker's real products
  server-side and threads them to the goods step; unchanged elsewhere.
- **Unchanged:** the renderer/goods treatments (they already read the catalog), the draft/
  publish plumbing, every other walk step.

## 8. Testing (part of done)

- **Catalog projection:** `media_ids` resolves to the upload's URL; falls back to
  `metadata.image_url`; empty when neither; alt text set.
- **Price parsing:** `$24` / `24` / `24.50` → cents; blank/`$0`/junk rejected.
- **saveWalkProduct:** inserts a real listing; the FIRST real save soft-deletes
  placeholders and marks goods made-yours; a later save does neither; ownership enforced.
- **removeWalkProduct:** soft-deletes; clearing the last real product un-marks goods.
- **Publish gate:** blocked while placeholder products remain; passes once they're cleared.
- **Upload action:** rejects bad mime/oversize; inserts an `uploads` row; returns the URL.
- **draftProductCopy:** returns copy for the fields; leaves photo/price untouched;
  ownership enforced.
- **ProductsEditor:** empty state → add flow; add appends to the list; remove drops it;
  the assist fills the word fields; write-it-myself saves verbatim; Next gates on ≥1 real
  product.

## 9. Definition of done

A maker in the walk reaches the goods step, uploads a photo of their real product, types
(or has Bohdi draft) its words and a price, saves it — the made-up products vanish from the
store, their real product shows in the preview, the step resolves, the walk finishes, and
Publish is no longer blocked on products. Tests green, tsc + lint clean, and Alex has seen
it work on a real store before it's called done (his eyes gate visible output).
