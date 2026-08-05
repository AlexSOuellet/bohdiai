# Listings in the Walk — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (inline). Steps use `- [ ]` tracking.

**Goal:** The walk's goods step becomes a simple product editor — the maker uploads a real photo, adds name/price/short/long copy (typed or Bohdi-assisted), and their real products replace the made-up placeholders so the walk can finish and the store can honestly go live.

**Architecture:** Products live in the `listings` table (the renderer already reads it directly for live + preview). New server actions do ownership-gated CRUD via `supabaseAdmin`; the first real save clears placeholders and marks `goods` made-yours on the draft envelope. Real photos upload to a new public `tenant-media` bucket, record an `uploads` row, and are referenced by `media_ids`; a shared catalog projection resolves `media_ids` → upload URL (falling back to the legacy `metadata.image_url`). A new `ProductsEditor` client component renders as the `goods` branch of `SectionEditor`.

**Tech Stack:** Next.js server actions, Supabase (Postgres + Storage), Vitest, React client components, Tailwind.

---

## File map

- Create `supabase/migrations/20260805000001_storage_tenant_media.sql` — the maker-media bucket.
- Create `lib/storefront/catalog.ts` (+ `.test.ts`) — `listingToProductView`, `loadCatalog`, `resolveMediaMap`.
- Create `lib/listings/price.ts` (+ `.test.ts`) — `parsePriceToCents`.
- Create `lib/listings/product-queries.ts` (+ `.test.ts`) — `hasPlaceholderProducts`, `hasRealProducts`, `clearPlaceholderProducts`, `loadWalkProducts`, `insertRealProduct`, `updateRealProduct`, `softDeleteProduct` (thin DB helpers over `supabaseAdmin`).
- Modify `app/dashboard/website/actions.ts` (+ `.test.ts`) — `uploadProductPhoto`, `saveWalkProduct`, `updateWalkProduct`, `removeWalkProduct`, `draftProductCopy`; strengthen `publishStore` with a placeholder check.
- Create `lib/listings/product-copy.ts` (+ `.test.ts`) — `draftProductCopy` core (niche-grounded), separated from the action for testability.
- Modify `app/storefront/_components/StorefrontPage.tsx` — use `loadCatalog`.
- Create `app/dashboard/website/_components/ProductsEditor.tsx` (+ `.test.tsx`).
- Modify `app/dashboard/website/_components/SectionEditor.tsx` — `goods` branch → `ProductsEditor`; accept `initialProducts`.
- Modify `app/dashboard/website/_components/MakeItYours.tsx` + `app/make-it-yours/page.tsx` — thread the maker's real products to the goods step.
- Modify `lib/editor/publish-gate.ts` comment (behavior stays; DB check lives in the action).

---

### Task 1: The maker-media storage bucket

**Files:** Create `supabase/migrations/20260805000001_storage_tenant_media.sql`

- [ ] **Step 1: Write the migration** — mirror `20260525000001_storage_placeholder_images.sql`:
  bucket id `tenant-media`, public `true`, `file_size_limit` 10485760 (10MB),
  `allowed_mime_types` `['image/jpeg','image/webp','image/png']`; `service_role` full
  access policy + public read policy on `storage.objects` for `bucket_id = 'tenant-media'`.
- [ ] **Step 2: Apply** — `node scripts/db-migrate.mjs`. Expected: migration applies clean.
- [ ] **Step 3: Commit** — `feat(listings): tenant-media storage bucket for maker photos`.

---

### Task 2: Catalog projection helper

**Files:** Create `lib/storefront/catalog.ts`, `lib/storefront/catalog.test.ts`

Types (reuse `ProductView`, `CatalogMedia` from `lib/archetypes/content`). A `ListingRow`
is the selected columns: `slug, name, base_price_cents, short_description, description,
metadata, primary_collection_id, media_ids`. `resolveMediaMap(uploadRows)` →
`Map<string,{url:string;alt:string}>`. `listingToProductView(row, mediaMap)` builds a
`ProductView`, taking the photo from the FIRST `media_ids` entry present in `mediaMap`, else
`metadata.image_url`, else no media. Price formats from `base_price_cents`. `loadCatalog(db,
tenantId)` loads active product listings + batch-loads referenced uploads, returns
`ProductView[]` (order by `created_at`).

- [ ] **Step 1: Write failing tests** — `listingToProductView`: resolves media_ids→url;
  falls back to metadata.image_url; empty media when neither; price `$24` from 2400 cents;
  alt = name. `resolveMediaMap`: maps id→{url,alt}.
- [ ] **Step 2: Run — FAIL** (`npx vitest run lib/storefront/catalog.test.ts`).
- [ ] **Step 3: Implement** `catalog.ts` (pure `listingToProductView`/`resolveMediaMap`;
  `loadCatalog` takes an injected `db` client so it's testable). Reuse the existing
  `imageUrlFromMetadata` logic (copy into this module; StorefrontPage's inline copy is
  removed in Task 8).
- [ ] **Step 4: Run — PASS.**
- [ ] **Step 5: Commit** — `feat(catalog): shared listing→ProductView projection resolving media_ids`.

---

### Task 3: Price parsing

**Files:** Create `lib/listings/price.ts`, `lib/listings/price.test.ts`

`parsePriceToCents(input:string): number | null` — strips `$`, whitespace; parses a
decimal; returns cents (round), or `null` for blank/NaN/≤0. `formatCents(cents,currency?)`
→ `"$24"` / `"$24.50"` (drop `.00`). (The onboarding `priceToCents` can later call this;
not required here.)

- [ ] **Step 1: Failing tests** — `$24`→2400, `24`→2400, `24.50`→2450, `$1,200`→120000,
  ``→null, `$0`→null, `abc`→null; `formatCents(2400)`→`$24`, `formatCents(2450)`→`$24.50`.
- [ ] **Step 2: Run — FAIL.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run — PASS.**
- [ ] **Step 5: Commit** — `feat(listings): price parsing + formatting`.

---

### Task 4: Product DB query helpers

**Files:** Create `lib/listings/product-queries.ts`, `lib/listings/product-queries.test.ts`

Thin helpers over an injected `db` (SupabaseClient) so tests pass a fake:
- `hasRealProducts(db,tenantId)` — count of `listings` type=product, `is_preview=false`,
  `deleted_at is null` > 0.
- `hasPlaceholderProducts(db,tenantId)` — count where `metadata->>placeholder = 'true'` OR
  `is_preview = true`, `deleted_at is null` > 0.
- `clearPlaceholderProducts(db,tenantId)` — `update … set deleted_at=now()` on those rows.
- `insertRealProduct(db,tenantId,input)` — insert one real product row (from
  `WalkProductInput`), return the new id + slug. Slug = slugify(name) with a numeric suffix
  on collision (retry once with `-2`, `-3`… by checking the unique index error, or
  pre-check existing slugs).
- `updateRealProduct(db,tenantId,id,input)` / `softDeleteProduct(db,tenantId,id)`.
- `loadWalkProducts(db,tenantId)` — the maker's real products (id, name, price cents,
  short, description, first media url) for the editor list.

`WalkProductInput = { name; priceCents; shortDescription?; description?; uploadId? }`.

- [ ] **Step 1: Failing tests** with a fake `db` (chainable stub returning canned data;
  follow the supabase mock shape used in `lib/generation/write-archetype-storefront.test.ts`).
  Cover: hasReal true/false; hasPlaceholder true/false; clearPlaceholder issues the update;
  insertRealProduct sets `is_preview:false`, type product, media_ids from uploadId, no
  placeholder metadata; slug slugified.
- [ ] **Step 2: Run — FAIL.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run — PASS.**
- [ ] **Step 5: Commit** — `feat(listings): product DB query helpers`.

---

### Task 5: Product copy assist (AI)

**Files:** Create `lib/listings/product-copy.ts`, `lib/listings/product-copy.test.ts`

`draftProductCopy({ name, hint, niche })` → `{ shortDescription, description }`. Reuses the
content-agent path (or the niche-voice loader + a focused prompt). Keep it a pure-ish
function taking an injected writer so the test mocks the model. Never returns/edits price
or photo.

- [ ] **Step 1: Failing test** — with a mocked writer, returns copy for both fields; empty
  hint still produces something from name+niche; writer error surfaces as a thrown/typed
  error the action maps to a friendly message.
- [ ] **Step 2: Run — FAIL.**
- [ ] **Step 3: Implement** (mirror `content-agent` usage; ground in niche voice).
- [ ] **Step 4: Run — PASS.**
- [ ] **Step 5: Commit** — `feat(listings): Bohdi product-copy assist`.

---

### Task 6: Server actions — upload + product CRUD + publish gate

**Files:** Modify `app/dashboard/website/actions.ts`, `app/dashboard/website/actions.test.ts`

Add (all `getCurrentShop`-gated, `supabaseAdmin`):
- `uploadProductPhoto(formData)` — reads `file`; validates mime/size; writes to
  `tenant/{tenantId}/products/{uuid}.{ext}` in `tenant-media`; inserts an `uploads` row
  (`source:'user_upload'`, `public_url`); returns `{ ok:true, uploadId, url }`.
- `saveWalkProduct(input)` — parse price (`parsePriceToCents`; reject null); `insertRealProduct`;
  if this made `hasRealProducts` newly true (i.e. it's the first), `clearPlaceholderProducts`
  and stage `markSectionMade(baseTree,'goods')` onto the draft; `revalidatePath`. Return the
  new product for the list.
- `updateWalkProduct(id,input)` / `removeWalkProduct(id)` — update/soft-delete; after a
  remove, if `hasRealProducts` is now false, stage removal of `goods` from `madeYours`
  (new `unmarkSectionMade` helper in section-state, or `removeFrom(...,'madeYours')`).
- `draftProductCopyAction({name,hint})` — loads niche voice, calls `draftProductCopy`,
  returns the copy (no persistence).
- Strengthen `publishStore`: after the envelope `publishBlockers` check, also block if
  `hasPlaceholderProducts` — append "your products" to the message.

- [ ] **Step 1: Failing tests** (extend `actions.test.ts`; mock `@/lib/supabase`
  `supabaseAdmin` + the new `lib/listings/*` helpers): saveWalkProduct first-save clears
  placeholders + marks goods made; second save does neither; rejects bad price; ownership
  (null shop) → error; removeWalkProduct last-real un-marks goods; publishStore blocked
  while placeholders exist; uploadProductPhoto rejects bad mime.
- [ ] **Step 2: Run — FAIL.**
- [ ] **Step 3: Implement.** Add a `section-state` helper `unmarkSectionMade` (removeFrom
  madeYours) with its own unit test in `section-state.test.ts`.
- [ ] **Step 4: Run — PASS** (`npx vitest run app/dashboard/website/actions.test.ts lib/editor/section-state.test.ts`).
- [ ] **Step 5: Commit** — `feat(listings): walk product actions + upload + publish placeholder gate`.

---

### Task 7: ProductsEditor component

**Files:** Create `app/dashboard/website/_components/ProductsEditor.tsx`, `…/ProductsEditor.test.tsx`

Props: `initialProducts`, `onSave`/`onUpdate`/`onRemove`/`onUpload`/`onDraftCopy` action
props (typed like RowsEditor's `onSave`), `onResolved(bool)`, `onChanged()`. State: the
product list + an editing form (name, price, photo, short, description). Photo picker calls
`onUpload` → shows thumbnail. "Ask Bohdi to help with the words" → `onDraftCopy` fills the
two copy fields. Save calls `onSave`/`onUpdate`, appends/updates the list, calls
`onResolved(true)` + `onChanged()`. Remove calls `onRemove`, and `onResolved(list.length>1)`.
A product needs a name, a parseable price, and an uploaded photo before Save enables.

- [ ] **Step 1: Failing tests** (Testing Library, mirror `RowsEditor`/`SectionEditor`
  tests): empty state shows the add form; filling name+price+photo enables save; save
  appends + resolves; the assist fills copy fields; remove drops a row; save disabled
  without a photo.
- [ ] **Step 2: Run — FAIL.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run — PASS.**
- [ ] **Step 5: Commit** — `feat(listings): ProductsEditor walk component`.

---

### Task 8: Wire into the walk + storefront projection

**Files:** Modify `SectionEditor.tsx`, `MakeItYours.tsx`, `app/make-it-yours/page.tsx`, `StorefrontPage.tsx`

- [ ] **Step 1:** In `SectionEditor`, add a `goods` branch that renders `<ProductsEditor>`
  wired to the new actions, seeded with `initialProducts` (new optional prop). Add
  `initialProducts` to `SectionEditorProps` and thread it from `MakeItYours` (new prop) and
  the walk page (load via `loadWalkProducts` server-side).
- [ ] **Step 2:** In `StorefrontPage.tsx`, replace the inline `listings` query + mapping in
  `renderStore` (and the product-detail/collection paths) with `loadCatalog(...)`; delete
  the now-duplicated `imageUrlFromMetadata` inline use.
- [ ] **Step 3: Run the storefront + walk tests** (`npx vitest run app/storefront lib/archetypes/main-street/pages.test.tsx app/dashboard/website`). Expected: PASS (update any snapshot/expectation that assumed metadata-only media).
- [ ] **Step 4:** Full suite `npx vitest run`; then `npx tsc --noEmit` and `npm run lint`.
- [ ] **Step 5: Commit** — `feat(listings): wire ProductsEditor into the goods step + shared catalog projection`.

---

### Task 9: Live verification (Alex's eyes gate the commit)

- [ ] Hand Alex the walk URL on a real test store; he uploads a photo, adds a product,
  confirms placeholders vanish, the preview shows the real product, the step resolves, the
  walk finishes, and Publish is no longer blocked on products. Fix anything he flags, then
  finalize.

---

## Self-review notes
- Spec §3 photo plumbing → Tasks 1, 2, 6. §2 product fields → Tasks 4, 6, 7. §4 goods step
  + placeholder clearing + goods flag → Tasks 6, 7, 8. §5 publish gate → Task 6. §7
  projection consolidation → Tasks 2, 8. AI assist ("both need a chat") → Tasks 5, 6, 7.
- No placeholders; every helper is defined in a task before it's used by a later task.
- `unmarkSectionMade` added in Task 6 to keep the goods flag honest on last-product removal.
