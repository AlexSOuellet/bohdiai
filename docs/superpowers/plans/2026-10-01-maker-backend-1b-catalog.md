# Maker Backend 1b — Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A signed-in shop owner keeps their products and collections current in the backend (photos, options with their own prices and stock, digital files where switched on, several collections per product, draft / live / archived), and what they save is what shoppers see on the live shop.

**Architecture:** Two Postgres functions (`save_product`, `save_collection`) write each save in one transaction, running as the signed-in user so row-level security still applies. Small pure modules hold the rules (one price function, option combinations, stock / sold-out, form validation) and are shared by the backend forms, the server actions and the storefront projection. The storefront projection (`lib/storefront/catalog.ts`) is rewritten to read every photo, the options, each combination's price and stock, and collection membership from `listing_collections`. The Main Street product page gets a small client picker for options.

**Tech Stack:** Next.js 16 App Router (server actions, `'use client'` islands), Supabase Postgres (plpgsql functions, RLS, private Storage bucket), Cloudflare Images binding (`lib/images/shrink.ts`), zod-free hand validation (plain TS, matching `lib/backend/*`), Vitest + Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-30-maker-backend-piece-1-design.md` sections 3 (catalog card + Needs attention), 4 (products, minus video), 5 (collections), 7 (storefront), 8, 9. Parent: `2026-09-30-maker-backend-overview.md`. Video is plan 1c; custom domains are plan 1d.

**Blueprint note (read before UI tasks):** Penny's admin has no product editor — a product there is a row inside a collection, edited inline. The screens here therefore take her **look** (palette, type, outline/solid buttons, status pills, bordered sections, inline error notice, in-page two-step confirm) and the **shape of her bundles editor** (a list table → one editor form with one Save that validates everything and shows readable messages). Nothing is copied from her code; her site is not touched.

**Branch:** work on `backend-catalog` (create it from `main` before Task 1; merge and delete it in Task 17).

**Rules that apply to every task:** read the relevant guide in `node_modules/next/dist/docs/` before using a Next API (this Next has breaking changes); TypeScript strictest (`Project-Docs/Engineering-Standards.md`); no inline styles (classes + CSS variables); storefront strings only through `lib/archetypes/main-street/defaults.ts`; every failure shows the person a message (handle the `{ ok: false }` branch and thrown errors); invoke the `frontend-design` skill before the UI tasks (9, 10, 11, 12) and design inside Penny's look; run `npm run typecheck` and `npx eslint <changed files>` before each commit; never run the full test suite while a dev server is running; run migrations with `node scripts/db-migrate.mjs` and regenerate types with `npm run gen:types` (never hand-edit `lib/database.types.ts`).

**Decisions made in this plan (lead developer, within the spec):**

1. **Where a downloadable file attaches.** Spec §4 says kind is set *per choice* ("print or download" is one option whose choices differ in kind). So the kind and file live on `variation_options` (new columns `kind`, `file_upload_id`). A product with no options carries its kind as `listings.listing_type` (`product` / `digital_product`, both already allowed) and its file in a new `listings.file_upload_id`.
2. **Digital files are private.** New private bucket `tenant-files` (50MB, PDF/PNG/JPEG/WebP/SVG/ZIP). The public read rule on `uploads` is narrowed so rows for that bucket are never readable by shoppers.
3. **One transaction per save.** A product save touches up to five tables; a half-written product would be visible on the live shop. `save_product` / `save_collection` are plpgsql functions with `security invoker`, so RLS (`is_tenant_admin`) still guards every row, plus an explicit admin check at the top.
4. **Combinations are never deleted.** A combination the maker removes is set to `archived` (orders in piece 2 point at `listing_variants.id`, `on delete set null` would lose history). Re-adding it brings the same row back.
5. **Blank means "not set".** A combination's blank price uses the product price; blank stock means made to order (not tracked). Stock `0` means sold out. Product stock applies only to products without options.
6. **Limits.** Up to 3 options, 30 choices per option, 100 combinations per product, 12 photos per product. These keep the editor usable and the combinations table readable.
7. **Sold out is derived, not stored.** The storefront computes it from stock (`0`) — the `sold_out` status values in the schema stay unused, so piece 2's stock counting is the only thing that changes it.
8. **Prices on cards.** A product whose combinations differ in price shows "from $X" (minimum available price); a sold-out product shows "Sold out" where the price would be. Both through one helper, `priceLabel`, so all eleven price spots in Main Street change together.
9. **Archive, not delete.** Products and collections are archived (hidden, kept). No hard delete in this plan.
10. **Slugs.** Made from the name when a product or collection is first saved, made unique per shop, then never changed (so shared links keep working).

---

## File map

| File | Responsibility |
|---|---|
| `supabase/migrations/20261001000001_catalog_backend.sql` | New columns, private bucket, narrowed uploads read rule, `listing_collections` backfill |
| `supabase/migrations/20261001000002_catalog_save_functions.sql` | `save_product`, `save_collection`, `order_collections` |
| `lib/catalog/price.ts` | The one price function + price range |
| `lib/catalog/combinations.ts` | Combinations of options, keys, limits |
| `lib/catalog/stock.ts` | Sold-out rules for a product and a combination |
| `lib/catalog/slug.ts` | Slug from a name; unique slug among taken ones |
| `lib/backend/catalog/product-form.ts` | Product form types, dollar parsing, variant sync, validation → payload |
| `lib/backend/catalog/collection-form.ts` | Collection form types and validation → payload |
| `lib/backend/catalog/queries.ts` | Backend reads: product list, one product, collection list, one collection, counts |
| `lib/backend/catalog/actions.ts` | Server actions: save / duplicate product, upload photo, upload file, save / create / order collections |
| `lib/backend/catalog/home.ts` | Catalog's home tiles + Needs attention lines |
| `lib/backend/modules.ts`, `lib/backend/home.ts` | Register the Catalog nav section and home contributor |
| `app/manage/backend.css` | Table, pills, sections, quiet/danger buttons, notices, photo strip |
| `app/manage/_components/ConfirmButton.tsx` | In-page two-step confirm (Penny's newer pattern) |
| `app/manage/products/page.tsx` + `ProductTable.tsx` | Products list |
| `app/manage/products/new/page.tsx`, `app/manage/products/[id]/page.tsx` | Editor pages |
| `app/manage/products/_components/{ProductEditor,PhotosField,OptionsField,FileField}.tsx` | Product editor |
| `app/manage/collections/page.tsx` + `CollectionList.tsx` | Collections list (add, order) |
| `app/manage/collections/[id]/page.tsx` + `CollectionEditor.tsx` | Collection editor |
| `lib/archetypes/content.ts` | `ProductOffer`, `ProductView.offers` / `priceFrom` |
| `lib/storefront/catalog.ts` | Storefront projection rewritten (all photos, options, offers, sold out, collections) |
| `app/storefront/_components/StorefrontPage.tsx` | Use the new collections projection |
| `app/storefront/listings/[slug]/page.tsx` | Use `loadProduct`; sold out in structured data; real photo for sharing |
| `lib/archetypes/main-street/defaults.ts`, `price-label.ts`, `ProductOptions.tsx`, `MainStreetProduct.tsx`, 9 goods/page files | Price label everywhere; option picker on the product page |
| `e2e/backend.spec.ts` | Catalog pages refuse a signed-out visitor |

---

## Task 1: Database — columns, private bucket, read rule, backfill

**Files:**
- Create: `supabase/migrations/20261001000001_catalog_backend.sql`
- Modify (generated): `lib/database.types.ts`

- [ ] **Step 1: Write the migration**

```sql
-- Maker backend 1b — catalog (spec piece 1 §4, §5).
-- 1. Kind and download file per choice (spec §4: "the kind is set per choice").
alter table variation_options
  add column kind text not null default 'physical' check (kind in ('physical', 'digital')),
  add column file_upload_id uuid references uploads(id) on delete set null;

-- A product with no options keeps its kind in listings.listing_type
-- ('product' | 'digital_product') and its download file here.
alter table listings
  add column file_upload_id uuid references uploads(id) on delete set null;

-- 2. Private bucket for downloadable files. Never public: delivery (piece 2) hands
-- buyers short-lived signed links. Writes go through server actions (service role).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tenant-files',
  'tenant-files',
  false,
  52428800, -- 50MB
  array['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'application/zip']
)
on conflict (id) do nothing;

create policy "service role full access on tenant-files"
  on storage.objects
  for all
  to service_role
  using (bucket_id = 'tenant-files')
  with check (bucket_id = 'tenant-files');

-- 3. Shoppers may read upload rows for photos, never for private files.
drop policy uploads_public_select on uploads;
create policy uploads_public_select on uploads
  for select to anon, authenticated
  using (status = 'active' and deleted_at is null and storage_bucket <> 'tenant-files');

-- 4. Collections move from listings.primary_collection_id to listing_collections
-- (spec §5). Copy every existing assignment so nothing drops out of a collection.
insert into listing_collections (tenant_id, listing_id, collection_id, position)
select l.tenant_id,
       l.id,
       l.primary_collection_id,
       (row_number() over (partition by l.primary_collection_id order by l.created_at)) - 1
from listings l
join collections c on c.id = l.primary_collection_id and c.tenant_id = l.tenant_id
where l.primary_collection_id is not null
  and l.deleted_at is null
on conflict (listing_id, collection_id) do nothing;
```

- [ ] **Step 2: Apply it**

Run: `node scripts/db-migrate.mjs`
Expected: the new migration listed as applied, no error.

- [ ] **Step 3: Check the backfill**

Run (postgres MCP `mcp__postgres-bohdiai__query`, read-only):
```sql
select
  (select count(*) from listings where primary_collection_id is not null and deleted_at is null) as assigned,
  (select count(*) from listing_collections) as memberships;
```
Expected: `memberships` ≥ `assigned` (equal on a fresh copy).

- [ ] **Step 4: Regenerate types**

Run: `npm run gen:types`
Expected: `lib/database.types.ts` now has `variation_options.kind`, `variation_options.file_upload_id`, `listings.file_upload_id`.

- [ ] **Step 5: Typecheck and commit**

```bash
npm run typecheck
git add supabase/migrations/20261001000001_catalog_backend.sql lib/database.types.ts
git commit -m "feat(catalog): per-choice kind and files, private file bucket, collection backfill"
```

---

## Task 2: Database — save functions

**Files:**
- Create: `supabase/migrations/20261001000002_catalog_save_functions.sql`
- Modify (generated): `lib/database.types.ts`

The payload shapes below are produced by Task 4 (`ProductPayload`) and Task 5 (`CollectionPayload`); keep the keys identical.

- [ ] **Step 1: Write the migration**

```sql
-- One transaction per catalog save (plan 1b decision 3). security invoker: every
-- statement runs as the signed-in user, so the tables' RLS (is_tenant_admin) applies.

create or replace function public.save_product(p_tenant_id uuid, p jsonb, p_listing_id uuid default null)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id uuid;
  v_attr uuid;
  v_option jsonb;
  v_choice jsonb;
  v_variant jsonb;
  v_media uuid[] := coalesce(array(select jsonb_array_elements_text(p->'media_ids'))::uuid[], '{}');
  v_collections uuid[] := coalesce(array(select jsonb_array_elements_text(p->'collection_ids'))::uuid[], '{}');
  v_files uuid[];
  i int;
  j int;
begin
  if not public.is_tenant_admin(p_tenant_id) then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  -- Every photo must be this shop's live upload in the public media bucket.
  if exists (
    select 1 from unnest(v_media) m
    where not exists (
      select 1 from uploads u
      where u.id = m and u.tenant_id = p_tenant_id and u.deleted_at is null and u.storage_bucket = 'tenant-media'
    )
  ) then
    raise exception 'unknown photo' using errcode = 'P0001';
  end if;

  -- Every download file must be this shop's upload in the private bucket.
  v_files := array(
    select (p->>'file_upload_id')::uuid where p->>'file_upload_id' is not null
    union all
    select (c->>'file_upload_id')::uuid
    from jsonb_array_elements(coalesce(p->'options', '[]'::jsonb)) o,
         jsonb_array_elements(o->'choices') c
    where c->>'file_upload_id' is not null
  );
  if exists (
    select 1 from unnest(v_files) f
    where not exists (
      select 1 from uploads u
      where u.id = f and u.tenant_id = p_tenant_id and u.deleted_at is null and u.storage_bucket = 'tenant-files'
    )
  ) then
    raise exception 'unknown file' using errcode = 'P0001';
  end if;

  if p_listing_id is null then
    insert into listings (
      tenant_id, listing_type, slug, name, short_description, description, base_price_cents,
      status, inventory_tracked, inventory_count, media_ids, file_upload_id, requires_shipping, published_at
    ) values (
      p_tenant_id, p->>'listing_type', p->>'slug', p->>'name', p->>'short_description', p->>'description',
      (p->>'base_price_cents')::int, p->>'status',
      p->>'inventory_count' is not null, (p->>'inventory_count')::int,
      v_media, (p->>'file_upload_id')::uuid, p->>'listing_type' = 'product',
      case when p->>'status' = 'active' then now() end
    )
    returning id into v_id;
  else
    update listings set
      listing_type = p->>'listing_type',
      name = p->>'name',
      short_description = p->>'short_description',
      description = p->>'description',
      base_price_cents = (p->>'base_price_cents')::int,
      status = p->>'status',
      inventory_tracked = p->>'inventory_count' is not null,
      inventory_count = (p->>'inventory_count')::int,
      media_ids = v_media,
      file_upload_id = (p->>'file_upload_id')::uuid,
      requires_shipping = p->>'listing_type' = 'product',
      published_at = case when p->>'status' = 'active' then coalesce(published_at, now()) else published_at end
    where id = p_listing_id and tenant_id = p_tenant_id and deleted_at is null
    returning id into v_id;
    if v_id is null then
      raise exception 'product not found' using errcode = 'P0002';
    end if;
  end if;

  -- Options and their choices: replaced wholesale (choices are identified by value,
  -- and combinations reference names/values, not ids).
  delete from variation_attributes where listing_id = v_id;
  for i in 0 .. coalesce(jsonb_array_length(p->'options'), 0) - 1 loop
    v_option := p->'options'->i;
    insert into variation_attributes (tenant_id, listing_id, name, position)
    values (p_tenant_id, v_id, v_option->>'name', i)
    returning id into v_attr;
    for j in 0 .. jsonb_array_length(v_option->'choices') - 1 loop
      v_choice := v_option->'choices'->j;
      insert into variation_options (tenant_id, attribute_id, value, position, kind, file_upload_id)
      values (p_tenant_id, v_attr, v_choice->>'value', j, v_choice->>'kind', (v_choice->>'file_upload_id')::uuid);
    end loop;
  end loop;

  -- Combinations: never deleted (decision 4). Absent ones are archived; present ones upserted.
  update listing_variants lv set status = 'archived'
  where lv.listing_id = v_id
    and not exists (
      select 1 from jsonb_array_elements(coalesce(p->'variants', '[]'::jsonb)) x
      where x->'combination' = lv.option_combination
    );
  for v_variant in select value from jsonb_array_elements(coalesce(p->'variants', '[]'::jsonb)) loop
    insert into listing_variants (tenant_id, listing_id, option_combination, price_cents, inventory_count, status)
    values (
      p_tenant_id, v_id, v_variant->'combination',
      (v_variant->>'price_cents')::int, (v_variant->>'inventory_count')::int,
      case when (v_variant->>'available')::boolean then 'active' else 'archived' end
    )
    on conflict (listing_id, option_combination) do update set
      price_cents = excluded.price_cents,
      inventory_count = excluded.inventory_count,
      status = excluded.status;
  end loop;

  -- Collections: drop memberships no longer chosen; append new ones at the end.
  delete from listing_collections where listing_id = v_id and collection_id <> all(v_collections);
  insert into listing_collections (tenant_id, listing_id, collection_id, position)
  select p_tenant_id, v_id, cid,
         coalesce((select max(lc.position) + 1 from listing_collections lc where lc.collection_id = cid), 0)
  from unnest(v_collections) as cid
  where exists (select 1 from collections c where c.id = cid and c.tenant_id = p_tenant_id and c.deleted_at is null)
    and not exists (select 1 from listing_collections lc where lc.listing_id = v_id and lc.collection_id = cid);

  return v_id;
end;
$$;

create or replace function public.save_collection(p_tenant_id uuid, p jsonb, p_collection_id uuid default null)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id uuid;
  v_listings uuid[] := coalesce(array(select jsonb_array_elements_text(p->'listing_ids'))::uuid[], '{}');
begin
  if not public.is_tenant_admin(p_tenant_id) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if p->>'featured_image_id' is not null and not exists (
    select 1 from uploads u
    where u.id = (p->>'featured_image_id')::uuid and u.tenant_id = p_tenant_id
      and u.deleted_at is null and u.storage_bucket = 'tenant-media'
  ) then
    raise exception 'unknown photo' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from unnest(v_listings) l
    where not exists (select 1 from listings x where x.id = l and x.tenant_id = p_tenant_id and x.deleted_at is null)
  ) then
    raise exception 'unknown product' using errcode = 'P0001';
  end if;

  if p_collection_id is null then
    insert into collections (tenant_id, slug, name, description, status, featured_image_id, position)
    values (
      p_tenant_id, p->>'slug', p->>'name', p->>'description', p->>'status', (p->>'featured_image_id')::uuid,
      coalesce((select max(position) + 1 from collections where tenant_id = p_tenant_id and deleted_at is null), 0)
    )
    returning id into v_id;
  else
    update collections set
      name = p->>'name',
      description = p->>'description',
      status = p->>'status',
      featured_image_id = (p->>'featured_image_id')::uuid
    where id = p_collection_id and tenant_id = p_tenant_id and deleted_at is null
    returning id into v_id;
    if v_id is null then
      raise exception 'collection not found' using errcode = 'P0002';
    end if;
  end if;

  -- Membership and order inside the collection = the order of listing_ids.
  delete from listing_collections where collection_id = v_id and listing_id <> all(v_listings);
  insert into listing_collections (tenant_id, listing_id, collection_id, position)
  select p_tenant_id, x.id, v_id, (x.ord - 1)::int
  from unnest(v_listings) with ordinality as x(id, ord)
  on conflict (listing_id, collection_id) do update set position = excluded.position;

  return v_id;
end;
$$;

create or replace function public.order_collections(p_tenant_id uuid, p_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not public.is_tenant_admin(p_tenant_id) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  update collections c set position = (x.ord - 1)::int
  from unnest(p_ids) with ordinality as x(id, ord)
  where c.id = x.id and c.tenant_id = p_tenant_id and c.deleted_at is null;
end;
$$;

revoke all on function public.save_product(uuid, jsonb, uuid) from public, anon;
revoke all on function public.save_collection(uuid, jsonb, uuid) from public, anon;
revoke all on function public.order_collections(uuid, uuid[]) from public, anon;
grant execute on function public.save_product(uuid, jsonb, uuid) to authenticated;
grant execute on function public.save_collection(uuid, jsonb, uuid) to authenticated;
grant execute on function public.order_collections(uuid, uuid[]) to authenticated;
```

- [ ] **Step 2: Apply and regenerate types**

Run: `node scripts/db-migrate.mjs` then `npm run gen:types`
Expected: no error; `lib/database.types.ts` lists `save_product`, `save_collection`, `order_collections` under `Functions`, with `p_listing_id` / `p_collection_id` optional.

- [ ] **Step 3: Smoke-test the refusal path (read-only, no data written)**

Run (postgres MCP — it connects as a privileged role with no `auth.uid()`, so the admin check must refuse):
```sql
select public.save_product('00000000-0000-0000-0000-000000000000', '{}'::jsonb);
```
Expected: `ERROR: not allowed` (SQLSTATE 42501). This proves the guard runs before any write.

- [ ] **Step 4: Typecheck and commit**

```bash
npm run typecheck
git add supabase/migrations/20261001000002_catalog_save_functions.sql lib/database.types.ts
git commit -m "feat(catalog): transactional save_product, save_collection, order_collections"
```

---

## Task 3: The rules — price, combinations, stock, slugs

**Files:**
- Create: `lib/catalog/price.ts`, `lib/catalog/combinations.ts`, `lib/catalog/stock.ts`, `lib/catalog/slug.ts`
- Test: `lib/catalog/price.test.ts`, `lib/catalog/combinations.test.ts`, `lib/catalog/stock.test.ts`, `lib/catalog/slug.test.ts`

- [ ] **Step 1: Write the failing tests**

`lib/catalog/price.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { effectivePriceCents, priceRange } from './price';

describe('effectivePriceCents', () => {
  it('is the product price when there is no combination', () => {
    expect(effectivePriceCents({ basePriceCents: 2400 })).toBe(2400);
  });
  it('is the combination price when it has one', () => {
    expect(effectivePriceCents({ basePriceCents: 2400 }, { priceCents: 3000 })).toBe(3000);
  });
  it('falls back to the product price when the combination price is blank', () => {
    expect(effectivePriceCents({ basePriceCents: 2400 }, { priceCents: null })).toBe(2400);
  });
});

describe('priceRange', () => {
  it('is the product price when there are no combinations', () => {
    expect(priceRange({ basePriceCents: 2400 }, [])).toEqual({ min: 2400, max: 2400 });
  });
  it('spans the combinations, using the product price for blanks', () => {
    expect(priceRange({ basePriceCents: 2400 }, [{ priceCents: 3000 }, { priceCents: null }, { priceCents: 1800 }])).toEqual({ min: 1800, max: 3000 });
  });
});
```

`lib/catalog/combinations.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { combinationsOf, combinationKey, MAX_COMBINATIONS, MAX_OPTIONS, MAX_CHOICES } from './combinations';

describe('combinationsOf', () => {
  it('is empty when there are no options', () => {
    expect(combinationsOf([])).toEqual([]);
  });
  it('lists one combination per choice for a single option', () => {
    expect(combinationsOf([{ name: 'Size', choices: ['S', 'M'] }])).toEqual([{ Size: 'S' }, { Size: 'M' }]);
  });
  it('crosses every option, first option slowest', () => {
    expect(combinationsOf([{ name: 'Size', choices: ['S', 'M'] }, { name: 'Scent', choices: ['Fig', 'Pine'] }])).toEqual([
      { Size: 'S', Scent: 'Fig' },
      { Size: 'S', Scent: 'Pine' },
      { Size: 'M', Scent: 'Fig' },
      { Size: 'M', Scent: 'Pine' },
    ]);
  });
  it('is empty when any option has no choices yet', () => {
    expect(combinationsOf([{ name: 'Size', choices: ['S'] }, { name: 'Scent', choices: [] }])).toEqual([]);
  });
});

describe('combinationKey', () => {
  it('is the same whatever order the keys were written in', () => {
    expect(combinationKey({ Size: 'S', Scent: 'Fig' })).toBe(combinationKey({ Scent: 'Fig', Size: 'S' }));
  });
  it('differs for different choices', () => {
    expect(combinationKey({ Size: 'S' })).not.toBe(combinationKey({ Size: 'M' }));
  });
});

describe('limits', () => {
  it('are the plan’s numbers', () => {
    expect([MAX_OPTIONS, MAX_CHOICES, MAX_COMBINATIONS]).toEqual([3, 30, 100]);
  });
});
```

`lib/catalog/stock.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { isStockSoldOut, isProductSoldOut } from './stock';

describe('isStockSoldOut', () => {
  it('is sold out only at exactly zero', () => {
    expect(isStockSoldOut(0)).toBe(true);
    expect(isStockSoldOut(3)).toBe(false);
  });
  it('is never sold out when stock is not tracked', () => {
    expect(isStockSoldOut(null)).toBe(false);
  });
});

describe('isProductSoldOut', () => {
  it('uses the product stock when there are no combinations', () => {
    expect(isProductSoldOut({ inventoryCount: 0, hasOptions: false, combinations: [] })).toBe(true);
    expect(isProductSoldOut({ inventoryCount: null, hasOptions: false, combinations: [] })).toBe(false);
  });
  it('is sold out when every available combination is', () => {
    expect(isProductSoldOut({ inventoryCount: null, hasOptions: true, combinations: [{ inventoryCount: 0 }, { inventoryCount: 0 }] })).toBe(true);
    expect(isProductSoldOut({ inventoryCount: null, hasOptions: true, combinations: [{ inventoryCount: 0 }, { inventoryCount: null }] })).toBe(false);
  });
  it('counts a product with options but no available combination as sold out', () => {
    expect(isProductSoldOut({ inventoryCount: 5, hasOptions: true, combinations: [] })).toBe(true);
  });
});
```

`lib/catalog/slug.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { slugify, uniqueSlug } from './slug';

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Fig & Cedar Candle')).toBe('fig-cedar-candle');
  });
  it('drops accents and stray punctuation', () => {
    expect(slugify('  Crème Brûlée!! ')).toBe('creme-brulee');
  });
  it('never returns an empty slug', () => {
    expect(slugify('!!!')).toBe('item');
  });
  it('caps the length without a trailing hyphen', () => {
    const s = slugify('a'.repeat(50) + ' ' + 'b'.repeat(50));
    expect(s.length).toBeLessThanOrEqual(60);
    expect(s.endsWith('-')).toBe(false);
  });
});

describe('uniqueSlug', () => {
  it('keeps the slug when it is free', () => {
    expect(uniqueSlug('candle', new Set())).toBe('candle');
  });
  it('adds the first free number, ignoring case', () => {
    expect(uniqueSlug('candle', new Set(['Candle', 'candle-2']))).toBe('candle-3');
  });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run lib/catalog`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement**

`lib/catalog/price.ts`:
```ts
/**
 * The ONE place a price is worked out (spec piece 1 §4: "every price the app shows
 * or charges comes from a single function"). Today: a combination's own price, else
 * the product's. Standard pricing, promos and bundles later change only this file
 * plus additive data.
 */
export type PricedProduct = { basePriceCents: number };
export type PricedCombination = { priceCents: number | null };

export function effectivePriceCents(product: PricedProduct, combination?: PricedCombination | null): number {
  return combination?.priceCents ?? product.basePriceCents;
}

/** Lowest and highest price a shopper can pay, over the given (available) combinations. */
export function priceRange(product: PricedProduct, combinations: readonly PricedCombination[]): { min: number; max: number } {
  if (combinations.length === 0) return { min: product.basePriceCents, max: product.basePriceCents };
  const prices = combinations.map((c) => effectivePriceCents(product, c));
  return { min: Math.min(...prices), max: Math.max(...prices) };
}
```

`lib/catalog/combinations.ts`:
```ts
/** Option combinations (Etsy-style, decided in D4): every choice of every option crossed. */
export const MAX_OPTIONS = 3;
export const MAX_CHOICES = 30;
export const MAX_COMBINATIONS = 100;

export type Combination = Record<string, string>;

export function combinationsOf(options: readonly { name: string; choices: readonly string[] }[]): Combination[] {
  if (options.length === 0) return [];
  let result: Combination[] = [{}];
  for (const option of options) {
    const next: Combination[] = [];
    for (const partial of result) for (const choice of option.choices) next.push({ ...partial, [option.name]: choice });
    result = next;
  }
  return result;
}

/** A stable key for a combination, whatever order its keys were written in. */
export function combinationKey(combination: Combination): string {
  return JSON.stringify(Object.keys(combination).sort().map((k) => [k, combination[k]]));
}
```

`lib/catalog/stock.ts`:
```ts
/** Stock rules (plan 1b decision 5): blank = made to order, 0 = sold out. */
export function isStockSoldOut(count: number | null): boolean {
  return count === 0;
}

/** A product is sold out when nothing about it can be bought. `combinations` are the
 *  AVAILABLE ones; a product with options and none available can't be bought either. */
export function isProductSoldOut(input: {
  inventoryCount: number | null;
  hasOptions: boolean;
  combinations: readonly { inventoryCount: number | null }[];
}): boolean {
  if (!input.hasOptions) return isStockSoldOut(input.inventoryCount);
  return input.combinations.every((c) => isStockSoldOut(c.inventoryCount));
}
```
(`[].every(...)` is `true`, which is the "no available combination" rule.)

`lib/catalog/slug.ts`:
```ts
/** Web addresses for products and collections (plan 1b decision 10). */
const MAX_SLUG = 60;

export function slugify(name: string): string {
  const slug = name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SLUG)
    .replace(/-+$/, '');
  return slug === '' ? 'item' : slug;
}

export function uniqueSlug(base: string, taken: ReadonlySet<string>): string {
  const lower = new Set([...taken].map((t) => t.toLowerCase()));
  if (!lower.has(base)) return base;
  for (let n = 2; ; n++) if (!lower.has(`${base}-${n}`)) return `${base}-${n}`;
}
```

- [ ] **Step 4: Run them to see them pass**

Run: `npx vitest run lib/catalog`
Expected: PASS (all four files).

- [ ] **Step 5: Commit**

```bash
npx eslint lib/catalog
git add lib/catalog
git commit -m "feat(catalog): one price function, combinations, stock and slug rules"
```

---
## Task 4: Product form — types, parsing, validation

**Files:**
- Create: `lib/backend/catalog/product-form.ts`
- Test: `lib/backend/catalog/product-form.test.ts`

The editor (Task 11) holds a `ProductForm`; the server action (Task 7) re-validates it with the same `buildProductPayload` before anything is written. Prices and stock are typed as text in the form so a half-typed value never turns into a wrong number.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect } from 'vitest';
import {
  emptyProductForm,
  parseDollars,
  parseStock,
  formatCents,
  syncVariants,
  buildProductPayload,
  MAX_PHOTOS,
  type ProductForm,
  type OptionForm,
} from './product-form';

const base = (over: Partial<ProductForm> = {}): ProductForm => ({ ...emptyProductForm(), name: 'Fig Candle', price: '24', ...over });
const size: OptionForm = {
  name: 'Size',
  choices: [
    { value: 'Small', kind: 'physical', fileUploadId: null, fileName: null },
    { value: 'Large', kind: 'physical', fileUploadId: null, fileName: null },
  ],
};

describe('parseDollars', () => {
  it('reads whole dollars, cents and a leading $', () => {
    expect(parseDollars('24')).toEqual({ ok: true, cents: 2400 });
    expect(parseDollars('$24.5')).toEqual({ ok: true, cents: 2450 });
    expect(parseDollars(' 0.99 ')).toEqual({ ok: true, cents: 99 });
  });
  it('treats blank as not set', () => {
    expect(parseDollars('  ')).toEqual({ ok: true, cents: null });
  });
  it('refuses anything else', () => {
    for (const bad of ['-1', '1.234', 'abc', '1,000', '12345678']) expect(parseDollars(bad)).toEqual({ ok: false });
  });
});

describe('parseStock', () => {
  it('reads whole numbers and blank', () => {
    expect(parseStock('0')).toEqual({ ok: true, count: 0 });
    expect(parseStock('12')).toEqual({ ok: true, count: 12 });
    expect(parseStock('')).toEqual({ ok: true, count: null });
  });
  it('refuses fractions and negatives', () => {
    expect(parseStock('1.5')).toEqual({ ok: false });
    expect(parseStock('-2')).toEqual({ ok: false });
  });
});

describe('formatCents', () => {
  it('shows dollars the way the maker would type them', () => {
    expect(formatCents(2400)).toBe('24');
    expect(formatCents(2450)).toBe('24.50');
    expect(formatCents(null)).toBe('');
  });
});

describe('syncVariants', () => {
  it('lists one row per combination and keeps what was typed', () => {
    const first = syncVariants([size], []);
    expect(first.map((v) => v.choices)).toEqual([{ Size: 'Small' }, { Size: 'Large' }]);
    const typed = first.map((v, i) => (i === 1 ? { ...v, price: '30', stock: '2' } : v));
    const again = syncVariants([size], typed);
    expect(again[1]).toEqual({ choices: { Size: 'Large' }, price: '30', stock: '2', available: true });
  });
  it('ignores options or choices that are still blank', () => {
    expect(syncVariants([{ name: ' ', choices: size.choices }], [])).toEqual([]);
    expect(syncVariants([{ name: 'Size', choices: [{ ...size.choices[0]!, value: ' ' }] }], [])).toEqual([]);
  });
});

describe('buildProductPayload', () => {
  it('builds a simple product', () => {
    const r = buildProductPayload(base({ shortDescription: ' Smells of figs ', stock: '3', collectionIds: ['c1'] }), { digital: false });
    expect(r).toEqual({
      ok: true,
      payload: {
        listing_type: 'product',
        name: 'Fig Candle',
        short_description: 'Smells of figs',
        description: null,
        base_price_cents: 2400,
        status: 'draft',
        inventory_count: 3,
        media_ids: [],
        file_upload_id: null,
        collection_ids: ['c1'],
        options: [],
        variants: [],
      },
    });
  });
  it('needs a name and a price', () => {
    expect(buildProductPayload(base({ name: ' ' }), { digital: false })).toEqual({ ok: false, error: 'Give the product a name.' });
    expect(buildProductPayload(base({ price: '' }), { digital: false })).toEqual({ ok: false, error: 'Enter a price, like 24 or 24.50.' });
    expect(buildProductPayload(base({ price: 'ten' }), { digital: false })).toEqual({ ok: false, error: 'Enter a price, like 24 or 24.50.' });
  });
  it('checks stock', () => {
    expect(buildProductPayload(base({ stock: '2.5' }), { digital: false })).toEqual({ ok: false, error: 'Stock must be a whole number, 0 or more. Leave it blank if you make to order.' });
  });
  it('caps photos', () => {
    const photos = Array.from({ length: MAX_PHOTOS + 1 }, (_, i) => ({ uploadId: `p${i}`, url: `u${i}` }));
    expect(buildProductPayload(base({ photos }), { digital: false })).toEqual({ ok: false, error: `A product can have up to ${MAX_PHOTOS} photos.` });
  });
  it('builds options and combinations; product stock is ignored once there are options', () => {
    const variants = syncVariants([size], []).map((v, i) => (i === 0 ? { ...v, price: '', stock: '0' } : { ...v, price: '30', stock: '' }));
    const r = buildProductPayload(base({ stock: '9', options: [size], variants }), { digital: false });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.payload.inventory_count).toBeNull();
    expect(r.payload.options).toEqual([
      { name: 'Size', choices: [{ value: 'Small', kind: 'physical', file_upload_id: null }, { value: 'Large', kind: 'physical', file_upload_id: null }] },
    ]);
    expect(r.payload.variants).toEqual([
      { combination: { Size: 'Small' }, price_cents: null, inventory_count: 0, available: true },
      { combination: { Size: 'Large' }, price_cents: 3000, inventory_count: null, available: true },
    ]);
  });
  it('explains option mistakes', () => {
    const blankName = { ...size, name: '' };
    expect(buildProductPayload(base({ options: [blankName] }), { digital: false })).toEqual({ ok: false, error: 'Name every option (like Size or Scent).' });
    expect(buildProductPayload(base({ options: [size, { ...size }] }), { digital: false })).toEqual({ ok: false, error: 'Two options can’t share a name.' });
    expect(buildProductPayload(base({ options: [{ ...size, choices: [] }] }), { digital: false })).toEqual({ ok: false, error: 'Give Size at least one choice.' });
    const twice = { ...size, choices: [size.choices[0]!, { ...size.choices[0]!, value: 'small' }] };
    expect(buildProductPayload(base({ options: [twice] }), { digital: false })).toEqual({ ok: false, error: 'Size lists small twice.' });
    const four = [1, 2, 3, 4].map((n) => ({ ...size, name: `O${n}` }));
    expect(buildProductPayload(base({ options: four }), { digital: false })).toEqual({ ok: false, error: 'A product can have up to 3 options.' });
  });
  it('refuses too many combinations', () => {
    const many = (name: string) => ({ name, choices: Array.from({ length: 11 }, (_, i) => ({ value: `${name}${i}`, kind: 'physical' as const, fileUploadId: null, fileName: null })) });
    expect(buildProductPayload(base({ options: [many('A'), many('B')] }), { digital: false })).toEqual({
      ok: false,
      error: 'That makes 121 combinations — the most is 100. Remove some choices.',
    });
  });
  it('checks combination prices and stock, naming the combination', () => {
    const variants = syncVariants([size], []).map((v) => ({ ...v, price: 'x' }));
    expect(buildProductPayload(base({ options: [size], variants }), { digital: false })).toEqual({ ok: false, error: 'Check the price for Small.' });
    const stock = syncVariants([size], []).map((v) => ({ ...v, stock: '-1' }));
    expect(buildProductPayload(base({ options: [size], variants: stock }), { digital: false })).toEqual({ ok: false, error: 'Check the stock for Small.' });
  });
  it('needs one available combination to go live', () => {
    const variants = syncVariants([size], []).map((v) => ({ ...v, available: false }));
    expect(buildProductPayload(base({ status: 'active', options: [size], variants }), { digital: false })).toEqual({
      ok: false,
      error: 'Turn on at least one combination before making this live.',
    });
  });
  it('refuses downloads when the site doesn’t have them', () => {
    expect(buildProductPayload(base({ kind: 'digital' }), { digital: false })).toEqual({ ok: false, error: 'Downloads aren’t switched on for this site.' });
    const dl = { ...size, choices: [{ ...size.choices[0]!, kind: 'digital' as const }] };
    expect(buildProductPayload(base({ options: [dl] }), { digital: false })).toEqual({ ok: false, error: 'Downloads aren’t switched on for this site.' });
  });
  it('builds a download product and needs its file to go live', () => {
    expect(buildProductPayload(base({ kind: 'digital', status: 'active' }), { digital: true })).toEqual({ ok: false, error: 'Add the download file before making this live.' });
    const r = buildProductPayload(base({ kind: 'digital', fileUploadId: 'f1', fileName: 'sheet.pdf', stock: '4' }), { digital: true });
    expect(r.ok && r.payload.listing_type).toBe('digital_product');
    expect(r.ok && r.payload.file_upload_id).toBe('f1');
    expect(r.ok && r.payload.inventory_count).toBeNull();
  });
  it('needs each download choice’s file to go live', () => {
    const mixed: OptionForm = { name: 'Format', choices: [{ value: 'Print', kind: 'physical', fileUploadId: null, fileName: null }, { value: 'Download', kind: 'digital', fileUploadId: null, fileName: null }] };
    const variants = syncVariants([mixed], []);
    expect(buildProductPayload(base({ status: 'active', options: [mixed], variants }), { digital: true })).toEqual({
      ok: false,
      error: 'Add the download file for Download before making this live.',
    });
    const withFile = { ...mixed, choices: [mixed.choices[0]!, { ...mixed.choices[1]!, fileUploadId: 'f9', fileName: 'x.pdf' }] };
    const r = buildProductPayload(base({ status: 'active', options: [withFile], variants }), { digital: true });
    expect(r.ok && r.payload.listing_type).toBe('product');
    expect(r.ok && r.payload.options[0]!.choices[1]).toEqual({ value: 'Download', kind: 'digital', file_upload_id: 'f9' });
  });
  it('drops a choice’s file when the choice is physical', () => {
    const stray = { ...size, choices: [{ ...size.choices[0]!, fileUploadId: 'f1', fileName: 'x.pdf' }] };
    const r = buildProductPayload(base({ options: [stray], variants: syncVariants([stray], []) }), { digital: true });
    expect(r.ok && r.payload.options[0]!.choices[0]!.file_upload_id).toBeNull();
  });
});
```

- [ ] **Step 2: Run to see it fail**

Run: `npx vitest run lib/backend/catalog/product-form.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
/**
 * The product editor's form and its validation (spec piece 1 §4). Shared by the
 * editor (instant messages) and the save action (which re-checks before writing),
 * so the rules can't drift. Prices and stock stay text until validated.
 */
import { combinationsOf, combinationKey, MAX_OPTIONS, MAX_CHOICES, MAX_COMBINATIONS, type Combination } from '@/lib/catalog/combinations';

export type Kind = 'physical' | 'digital';
export type ItemStatus = 'draft' | 'active' | 'archived';
export type ChoiceForm = { value: string; kind: Kind; fileUploadId: string | null; fileName: string | null };
export type OptionForm = { name: string; choices: ChoiceForm[] };
export type VariantForm = { choices: Combination; price: string; stock: string; available: boolean };
export type PhotoForm = { uploadId: string; url: string };

export type ProductForm = {
  id: string | null;
  slug: string | null;
  name: string;
  shortDescription: string;
  description: string;
  price: string;
  stock: string;
  status: ItemStatus;
  kind: Kind;
  fileUploadId: string | null;
  fileName: string | null;
  photos: PhotoForm[];
  collectionIds: string[];
  options: OptionForm[];
  variants: VariantForm[];
};

export type ProductPayload = {
  listing_type: 'product' | 'digital_product';
  name: string;
  short_description: string | null;
  description: string | null;
  base_price_cents: number;
  status: ItemStatus;
  inventory_count: number | null;
  media_ids: string[];
  file_upload_id: string | null;
  collection_ids: string[];
  options: { name: string; choices: { value: string; kind: Kind; file_upload_id: string | null }[] }[];
  variants: { combination: Combination; price_cents: number | null; inventory_count: number | null; available: boolean }[];
};

export type BuildResult = { ok: true; payload: ProductPayload } | { ok: false; error: string };

export const MAX_PHOTOS = 12;
const MAX_NAME = 120;
const MAX_SHORT = 300;
const MAX_LONG = 5000;

export function emptyProductForm(): ProductForm {
  return {
    id: null,
    slug: null,
    name: '',
    shortDescription: '',
    description: '',
    price: '',
    stock: '',
    status: 'draft',
    kind: 'physical',
    fileUploadId: null,
    fileName: null,
    photos: [],
    collectionIds: [],
    options: [],
    variants: [],
  };
}

export function parseDollars(text: string): { ok: true; cents: number | null } | { ok: false } {
  const t = text.trim();
  if (t === '') return { ok: true, cents: null };
  const m = /^\$?\s*(\d{1,6})(?:\.(\d{1,2}))?$/.exec(t);
  if (m === null) return { ok: false };
  return { ok: true, cents: Number(m[1]) * 100 + Number((m[2] ?? '').padEnd(2, '0')) };
}

export function parseStock(text: string): { ok: true; count: number | null } | { ok: false } {
  const t = text.trim();
  if (t === '') return { ok: true, count: null };
  return /^\d{1,6}$/.test(t) ? { ok: true, count: Number(t) } : { ok: false };
}

export function formatCents(cents: number | null): string {
  if (cents === null) return '';
  return cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2);
}

/** The options with blank names/choices dropped — what combinations are built from. */
function filledOptions(options: readonly OptionForm[]): { name: string; choices: string[] }[] {
  return options
    .map((o) => ({ name: o.name.trim(), choices: o.choices.map((c) => c.value.trim()).filter((v) => v !== '') }))
    .filter((o) => o.name !== '');
}

/** One row per combination of the current options, keeping what was already typed. */
export function syncVariants(options: readonly OptionForm[], existing: readonly VariantForm[]): VariantForm[] {
  const byKey = new Map(existing.map((v) => [combinationKey(v.choices), v]));
  return combinationsOf(filledOptions(options)).map(
    (choices) => byKey.get(combinationKey(choices)) ?? { choices, price: '', stock: '', available: true },
  );
}

const label = (c: Combination): string => Object.values(c).join(' / ');
const fail = (error: string): BuildResult => ({ ok: false, error });

export function buildProductPayload(form: ProductForm, site: { digital: boolean }): BuildResult {
  const name = form.name.trim();
  if (name === '') return fail('Give the product a name.');
  if (name.length > MAX_NAME) return fail(`Keep the name under ${MAX_NAME} characters.`);
  const short = form.shortDescription.trim();
  if (short.length > MAX_SHORT) return fail(`Keep the short description under ${MAX_SHORT} characters.`);
  const long = form.description.trim();
  if (long.length > MAX_LONG) return fail(`Keep the description under ${MAX_LONG} characters.`);

  const price = parseDollars(form.price);
  if (!price.ok || price.cents === null) return fail('Enter a price, like 24 or 24.50.');
  if (form.photos.length > MAX_PHOTOS) return fail(`A product can have up to ${MAX_PHOTOS} photos.`);

  const hasOptions = form.options.length > 0;
  const usesDigital = hasOptions ? form.options.some((o) => o.choices.some((c) => c.kind === 'digital')) : form.kind === 'digital';
  if (usesDigital && !site.digital) return fail('Downloads aren’t switched on for this site.');
  const live = form.status === 'active';

  if (form.options.length > MAX_OPTIONS) return fail(`A product can have up to ${MAX_OPTIONS} options.`);
  const names = new Set<string>();
  const options: ProductPayload['options'] = [];
  for (const o of form.options) {
    const oname = o.name.trim();
    if (oname === '') return fail('Name every option (like Size or Scent).');
    if (names.has(oname.toLowerCase())) return fail('Two options can’t share a name.');
    names.add(oname.toLowerCase());
    if (o.choices.length === 0) return fail(`Give ${oname} at least one choice.`);
    if (o.choices.length > MAX_CHOICES) return fail(`${oname} can have up to ${MAX_CHOICES} choices.`);
    const seen = new Set<string>();
    const choices: ProductPayload['options'][number]['choices'] = [];
    for (const c of o.choices) {
      const value = c.value.trim();
      if (value === '') return fail(`Fill in every choice for ${oname}.`);
      if (seen.has(value.toLowerCase())) return fail(`${oname} lists ${value} twice.`);
      seen.add(value.toLowerCase());
      if (live && c.kind === 'digital' && c.fileUploadId === null) return fail(`Add the download file for ${value} before making this live.`);
      choices.push({ value, kind: c.kind, file_upload_id: c.kind === 'digital' ? c.fileUploadId : null });
    }
    options.push({ name: oname, choices });
  }

  const combos = combinationsOf(options.map((o) => ({ name: o.name, choices: o.choices.map((c) => c.value) })));
  if (combos.length > MAX_COMBINATIONS) return fail(`That makes ${combos.length} combinations — the most is ${MAX_COMBINATIONS}. Remove some choices.`);
  const typed = new Map(form.variants.map((v) => [combinationKey(v.choices), v]));
  const variants: ProductPayload['variants'] = [];
  for (const combination of combos) {
    const v = typed.get(combinationKey(combination)) ?? { choices: combination, price: '', stock: '', available: true };
    const vp = parseDollars(v.price);
    if (!vp.ok) return fail(`Check the price for ${label(combination)}.`);
    const vs = parseStock(v.stock);
    if (!vs.ok) return fail(`Check the stock for ${label(combination)}.`);
    variants.push({ combination, price_cents: vp.cents, inventory_count: vs.count, available: v.available });
  }
  if (live && hasOptions && !variants.some((v) => v.available)) return fail('Turn on at least one combination before making this live.');

  // Product-level stock and file apply only without options (plan decision 5).
  let inventory: number | null = null;
  if (!hasOptions && form.kind === 'physical') {
    const s = parseStock(form.stock);
    if (!s.ok) return fail('Stock must be a whole number, 0 or more. Leave it blank if you make to order.');
    inventory = s.count;
  }
  const digitalProduct = !hasOptions && form.kind === 'digital';
  if (live && digitalProduct && form.fileUploadId === null) return fail('Add the download file before making this live.');

  return {
    ok: true,
    payload: {
      listing_type: digitalProduct ? 'digital_product' : 'product',
      name,
      short_description: short === '' ? null : short,
      description: long === '' ? null : long,
      base_price_cents: price.cents,
      status: form.status,
      inventory_count: inventory,
      media_ids: form.photos.map((p) => p.uploadId),
      file_upload_id: digitalProduct ? form.fileUploadId : null,
      collection_ids: form.collectionIds,
      options,
      variants,
    },
  };
}
```

(The duplicate-choice message names the choice as the maker typed the second one — the test uses `small` to pin that.)

- [ ] **Step 4: Run to see it pass**

Run: `npx vitest run lib/backend/catalog/product-form.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
npx eslint lib/backend/catalog
git add lib/backend/catalog/product-form.ts lib/backend/catalog/product-form.test.ts
git commit -m "feat(catalog): product form validation shared by editor and save"
```

---

## Task 5: Collection form

**Files:**
- Create: `lib/backend/catalog/collection-form.ts`
- Test: `lib/backend/catalog/collection-form.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect } from 'vitest';
import { buildCollectionPayload, moveItem, type CollectionForm } from './collection-form';

const form = (over: Partial<CollectionForm> = {}): CollectionForm => ({
  id: null,
  name: 'Autumn',
  description: '',
  status: 'draft',
  featuredImageId: null,
  productIds: ['a', 'b'],
  ...over,
});

describe('buildCollectionPayload', () => {
  it('builds the payload in the maker’s product order', () => {
    expect(buildCollectionPayload(form({ description: ' Warm things ' }))).toEqual({
      ok: true,
      payload: { name: 'Autumn', description: 'Warm things', status: 'draft', featured_image_id: null, listing_ids: ['a', 'b'] },
    });
  });
  it('needs a name', () => {
    expect(buildCollectionPayload(form({ name: '  ' }))).toEqual({ ok: false, error: 'Give the collection a name.' });
  });
  it('refuses a product listed twice', () => {
    expect(buildCollectionPayload(form({ productIds: ['a', 'a'] }))).toEqual({ ok: false, error: 'A product is in this collection twice. Remove one.' });
  });
});

describe('moveItem', () => {
  it('moves an item up or down', () => {
    expect(moveItem(['a', 'b', 'c'], 2, -1)).toEqual(['a', 'c', 'b']);
    expect(moveItem(['a', 'b', 'c'], 0, 1)).toEqual(['b', 'a', 'c']);
  });
  it('leaves the list alone at the ends', () => {
    expect(moveItem(['a', 'b'], 0, -1)).toEqual(['a', 'b']);
    expect(moveItem(['a', 'b'], 1, 1)).toEqual(['a', 'b']);
  });
});
```

- [ ] **Step 2: Run to see it fail**

Run: `npx vitest run lib/backend/catalog/collection-form.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
/** The collection editor's form and validation (spec piece 1 §5). */
import type { ItemStatus } from './product-form';

export type CollectionForm = {
  id: string | null;
  name: string;
  description: string;
  status: ItemStatus;
  featuredImageId: string | null;
  productIds: string[];
};

export type CollectionPayload = {
  name: string;
  description: string | null;
  status: ItemStatus;
  featured_image_id: string | null;
  listing_ids: string[];
};

const MAX_NAME = 80;
const MAX_DESCRIPTION = 500;

export function buildCollectionPayload(form: CollectionForm): { ok: true; payload: CollectionPayload } | { ok: false; error: string } {
  const name = form.name.trim();
  if (name === '') return { ok: false, error: 'Give the collection a name.' };
  if (name.length > MAX_NAME) return { ok: false, error: `Keep the name under ${MAX_NAME} characters.` };
  const description = form.description.trim();
  if (description.length > MAX_DESCRIPTION) return { ok: false, error: `Keep the description under ${MAX_DESCRIPTION} characters.` };
  if (new Set(form.productIds).size !== form.productIds.length) return { ok: false, error: 'A product is in this collection twice. Remove one.' };
  return {
    ok: true,
    payload: { name, description: description === '' ? null : description, status: form.status, featured_image_id: form.featuredImageId, listing_ids: form.productIds },
  };
}

/** The list with item `index` moved one step (`delta` −1 up, +1 down); unchanged at the ends. */
export function moveItem<T>(list: readonly T[], index: number, delta: -1 | 1): T[] {
  const to = index + delta;
  if (to < 0 || to >= list.length) return [...list];
  const next = [...list];
  const [item] = next.splice(index, 1);
  next.splice(to, 0, item as T);
  return next;
}
```

- [ ] **Step 4: Run to see it pass**

Run: `npx vitest run lib/backend/catalog/collection-form.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
npx eslint lib/backend/catalog
git add lib/backend/catalog/collection-form.ts lib/backend/catalog/collection-form.test.ts
git commit -m "feat(catalog): collection form validation and reorder helper"
```

---
## Task 6: Backend reads

**Files:**
- Create: `lib/backend/catalog/queries.ts`
- Test: `lib/backend/catalog/queries.test.ts`

All reads take the request's Supabase client (`createSupabaseServerClient()`, so RLS limits them to shops the person administers) and filter by tenant explicitly as well.

- [ ] **Step 1: Write the failing tests**

The tests drive a tiny fake of the Supabase query builder that returns canned rows per table.

```ts
import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { listProducts, getProduct, listCollections, getCollection, stockLabel, priceRangeLabel } from './queries';

type Rows = Record<string, unknown[]>;
function fakeDb(rows: Rows): SupabaseClient<Database> {
  const from = (table: string) => {
    let data: unknown[] = rows[table] ?? [];
    const q = {
      select: () => q,
      eq: (col: string, val: unknown) => {
        data = data.filter((r) => {
          const v = (r as Record<string, unknown>)[col];
          return v === undefined || v === val;
        });
        return q;
      },
      in: () => q,
      is: () => q,
      order: () => q,
      maybeSingle: async () => ({ data: data[0] ?? null, error: null }),
      then: (resolve: (v: { data: unknown[]; error: null }) => unknown) => resolve({ data, error: null }),
    };
    return q;
  };
  return { from } as unknown as SupabaseClient<Database>;
}

const listing = {
  id: 'l1',
  tenant_id: 't1',
  slug: 'fig',
  name: 'Fig Candle',
  status: 'active',
  listing_type: 'product',
  base_price_cents: 2400,
  inventory_count: 0,
  short_description: 'Figs',
  description: null,
  media_ids: ['u1'],
  file_upload_id: null,
  variation_attributes: [],
  listing_variants: [],
  listing_collections: [{ collection_id: 'c1' }],
};

describe('labels', () => {
  it('describes stock in plain words', () => {
    expect(stockLabel({ inventoryCount: null, hasOptions: false, combinations: [] })).toBe('Made to order');
    expect(stockLabel({ inventoryCount: 0, hasOptions: false, combinations: [] })).toBe('Sold out');
    expect(stockLabel({ inventoryCount: 4, hasOptions: false, combinations: [] })).toBe('4 in stock');
    expect(stockLabel({ inventoryCount: null, hasOptions: true, combinations: [{ inventoryCount: 2 }, { inventoryCount: null }, { inventoryCount: 3 }] })).toBe('5 in stock');
  });
  it('shows a price range only when prices differ', () => {
    expect(priceRangeLabel(2400, [])).toBe('$24');
    expect(priceRangeLabel(2400, [{ priceCents: 1800 }, { priceCents: null }])).toBe('$18–$24');
  });
});

describe('listProducts', () => {
  it('lists the shop’s products with photo, price, stock and status', async () => {
    const db = fakeDb({ listings: [listing], uploads: [{ id: 'u1', public_url: 'https://x/u1.webp', alt_text: null }] });
    expect(await listProducts(db, 't1')).toEqual([
      {
        id: 'l1',
        name: 'Fig Candle',
        status: 'active',
        priceLabel: '$24',
        stockLabel: 'Sold out',
        soldOut: true,
        photoUrl: 'https://x/u1.webp',
        photoUploadId: 'u1',
        collectionIds: ['c1'],
      },
    ]);
  });
});

describe('getProduct', () => {
  it('turns the rows back into the editor’s form', async () => {
    const withOptions = {
      ...listing,
      inventory_count: null,
      variation_attributes: [
        {
          name: 'Size',
          position: 0,
          variation_options: [
            { value: 'Large', position: 1, kind: 'physical', file_upload_id: null },
            { value: 'Small', position: 0, kind: 'physical', file_upload_id: null },
          ],
        },
      ],
      listing_variants: [
        { option_combination: { Size: 'Small' }, price_cents: null, inventory_count: 2, status: 'active' },
        { option_combination: { Size: 'Large' }, price_cents: 3000, inventory_count: null, status: 'archived' },
      ],
    };
    const db = fakeDb({ listings: [withOptions], uploads: [{ id: 'u1', public_url: 'https://x/u1.webp', alt_text: null, file_name: 'a.webp' }] });
    const form = await getProduct(db, 't1', 'l1');
    expect(form).toMatchObject({
      id: 'l1',
      slug: 'fig',
      name: 'Fig Candle',
      price: '24',
      stock: '',
      status: 'active',
      kind: 'physical',
      photos: [{ uploadId: 'u1', url: 'https://x/u1.webp' }],
      collectionIds: ['c1'],
      options: [{ name: 'Size', choices: [{ value: 'Small' }, { value: 'Large' }] }],
      variants: [
        { choices: { Size: 'Small' }, price: '', stock: '2', available: true },
        { choices: { Size: 'Large' }, price: '30', stock: '', available: false },
      ],
    });
  });
  it('is null for a product that isn’t there', async () => {
    expect(await getProduct(fakeDb({ listings: [] }), 't1', 'nope')).toBeNull();
  });
});

describe('collections', () => {
  const rows = {
    collections: [
      { id: 'c1', tenant_id: 't1', name: 'Autumn', status: 'draft', description: 'Warm', featured_image_id: null, listing_collections: [{ listing_id: 'l2', position: 1 }, { listing_id: 'l1', position: 0 }] },
    ],
  };
  it('lists them with their product counts', async () => {
    expect(await listCollections(fakeDb(rows), 't1')).toEqual([{ id: 'c1', name: 'Autumn', status: 'draft', productCount: 2 }]);
  });
  it('loads one as the editor’s form, products in the maker’s order', async () => {
    expect(await getCollection(fakeDb(rows), 't1', 'c1')).toEqual({
      id: 'c1',
      name: 'Autumn',
      description: 'Warm',
      status: 'draft',
      featuredImageId: null,
      productIds: ['l1', 'l2'],
    });
  });
});
```

- [ ] **Step 2: Run to see it fail**

Run: `npx vitest run lib/backend/catalog/queries.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
/**
 * Backend catalog reads (spec piece 1 §4–5). Every read is scoped to the acting
 * site's tenant and runs through the person's own Supabase client, so RLS applies.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/lib/database.types';
import { formatPrice, loadMediaMap } from '@/lib/storefront/catalog';
import { priceRange } from '@/lib/catalog/price';
import { isProductSoldOut } from '@/lib/catalog/stock';
import { syncVariants, formatCents, type ProductForm, type OptionForm, type VariantForm, type ItemStatus, type Kind } from './product-form';
import type { CollectionForm } from './collection-form';

type Db = SupabaseClient<Database>;

export type ProductRowView = {
  id: string;
  name: string;
  status: ItemStatus;
  priceLabel: string;
  stockLabel: string;
  soldOut: boolean;
  photoUrl: string | null;
  photoUploadId: string | null;
  collectionIds: string[];
};

export type CollectionRowView = { id: string; name: string; status: ItemStatus; productCount: number };

type VariantRow = { option_combination: Json; price_cents: number | null; inventory_count: number | null; status: string };

const PRODUCT_TYPES = ['product', 'digital_product'];

const asStatus = (s: string): ItemStatus => (s === 'active' || s === 'archived' ? s : 'draft');

export function priceRangeLabel(baseCents: number, combinations: readonly { priceCents: number | null }[]): string {
  const { min, max } = priceRange({ basePriceCents: baseCents }, combinations);
  return min === max ? formatPrice(min) : `${formatPrice(min)}–${formatPrice(max)}`;
}

export function stockLabel(input: { inventoryCount: number | null; hasOptions: boolean; combinations: readonly { inventoryCount: number | null }[] }): string {
  if (isProductSoldOut(input)) return 'Sold out';
  const counts = input.hasOptions ? input.combinations.map((c) => c.inventoryCount) : [input.inventoryCount];
  const tracked = counts.filter((c): c is number => c !== null);
  return tracked.length === 0 ? 'Made to order' : `${tracked.reduce((a, b) => a + b, 0)} in stock`;
}

function combination(json: Json): Record<string, string> {
  if (json === null || typeof json !== 'object' || Array.isArray(json)) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(json)) if (typeof v === 'string') out[k] = v;
  return out;
}

export async function listProducts(db: Db, tenantId: string): Promise<ProductRowView[]> {
  const { data, error } = await db
    .from('listings')
    .select('id, name, status, base_price_cents, inventory_count, media_ids, variation_attributes(id), listing_variants(price_cents, inventory_count, status), listing_collections(collection_id)')
    .eq('tenant_id', tenantId)
    .in('listing_type', PRODUCT_TYPES)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  if (error !== null) throw new Error(`Could not load products: ${error.message}`);
  const rows = data ?? [];
  const media = await loadMediaMap(db, rows.flatMap((r) => r.media_ids.slice(0, 1)));
  return rows.map((r) => {
    const available = r.listing_variants
      .filter((v) => v.status === 'active')
      .map((v) => ({ priceCents: v.price_cents, inventoryCount: v.inventory_count }));
    const hasOptions = r.variation_attributes.length > 0;
    const stock = { inventoryCount: r.inventory_count, hasOptions, combinations: available };
    const first = r.media_ids[0];
    const hit = first === undefined ? undefined : media.get(first);
    return {
      id: r.id,
      name: r.name,
      status: asStatus(r.status),
      priceLabel: priceRangeLabel(r.base_price_cents, hasOptions ? available : []),
      stockLabel: stockLabel(stock),
      soldOut: isProductSoldOut(stock),
      photoUrl: hit?.url ?? null,
      photoUploadId: hit === undefined ? null : (first ?? null),
      collectionIds: r.listing_collections.map((c) => c.collection_id),
    };
  });
}

export async function getProduct(db: Db, tenantId: string, id: string): Promise<ProductForm | null> {
  const { data: r, error } = await db
    .from('listings')
    .select(
      'id, slug, name, short_description, description, status, listing_type, base_price_cents, inventory_count, media_ids, file_upload_id, variation_attributes(name, position, variation_options(value, position, kind, file_upload_id)), listing_variants(option_combination, price_cents, inventory_count, status), listing_collections(collection_id)',
    )
    .eq('tenant_id', tenantId)
    .eq('id', id)
    .in('listing_type', PRODUCT_TYPES)
    .is('deleted_at', null)
    .maybeSingle();
  if (error !== null) throw new Error(`Could not load the product: ${error.message}`);
  if (r === null) return null;

  const attrs = [...r.variation_attributes].sort((a, b) => a.position - b.position);
  const fileIds = [r.file_upload_id, ...attrs.flatMap((a) => a.variation_options.map((o) => o.file_upload_id))].filter((x): x is string => x !== null);
  const names = await fileNames(db, fileIds);
  const media = await loadMediaMap(db, r.media_ids);

  const options: OptionForm[] = attrs.map((a) => ({
    name: a.name,
    choices: [...a.variation_options]
      .sort((x, y) => x.position - y.position)
      .map((o) => ({
        value: o.value,
        kind: (o.kind === 'digital' ? 'digital' : 'physical') as Kind,
        fileUploadId: o.file_upload_id,
        fileName: o.file_upload_id === null ? null : (names.get(o.file_upload_id) ?? null),
      })),
  }));
  const stored: VariantForm[] = (r.listing_variants as VariantRow[]).map((v) => ({
    choices: combination(v.option_combination),
    price: formatCents(v.price_cents),
    stock: v.inventory_count === null ? '' : String(v.inventory_count),
    available: v.status === 'active',
  }));

  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    shortDescription: r.short_description ?? '',
    description: r.description ?? '',
    price: formatCents(r.base_price_cents),
    stock: r.inventory_count === null ? '' : String(r.inventory_count),
    status: asStatus(r.status),
    kind: r.listing_type === 'digital_product' ? 'digital' : 'physical',
    fileUploadId: r.file_upload_id,
    fileName: r.file_upload_id === null ? null : (names.get(r.file_upload_id) ?? null),
    photos: r.media_ids.flatMap((uploadId) => {
      const hit = media.get(uploadId);
      return hit === undefined ? [] : [{ uploadId, url: hit.url }];
    }),
    collectionIds: r.listing_collections.map((c) => c.collection_id),
    options,
    variants: syncVariants(options, stored),
  };
}

async function fileNames(db: Db, ids: readonly string[]): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();
  const { data, error } = await db.from('uploads').select('id, file_name').in('id', [...new Set(ids)]);
  if (error !== null) throw new Error(`Could not load file names: ${error.message}`);
  return new Map((data ?? []).map((u) => [u.id, u.file_name]));
}

export async function listCollections(db: Db, tenantId: string): Promise<CollectionRowView[]> {
  const { data, error } = await db
    .from('collections')
    .select('id, name, status, listing_collections(listing_id)')
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .order('position', { ascending: true });
  if (error !== null) throw new Error(`Could not load collections: ${error.message}`);
  return (data ?? []).map((c) => ({ id: c.id, name: c.name, status: asStatus(c.status), productCount: c.listing_collections.length }));
}

export async function getCollection(db: Db, tenantId: string, id: string): Promise<CollectionForm | null> {
  const { data: c, error } = await db
    .from('collections')
    .select('id, name, description, status, featured_image_id, listing_collections(listing_id, position)')
    .eq('tenant_id', tenantId)
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();
  if (error !== null) throw new Error(`Could not load the collection: ${error.message}`);
  if (c === null) return null;
  return {
    id: c.id,
    name: c.name,
    description: c.description ?? '',
    status: asStatus(c.status),
    featuredImageId: c.featured_image_id,
    productIds: [...c.listing_collections].sort((a, b) => a.position - b.position).map((m) => m.listing_id),
  };
}
```

Note on `loadMediaMap`: it reads `uploads` with `public_url` — with the person's own client the `uploads_admin_all` policy lets an admin read their shop's rows, so photos resolve. Note on nested relations: `listing_variants`, `variation_attributes`, `variation_options` and `listing_collections` reference their parent without a unique foreign key, so Supabase types them as arrays. If typecheck disagrees, read the `Relationships` for that table in `lib/database.types.ts` and fix the select; do not cast around a real mismatch.

- [ ] **Step 4: Run to see it pass**

Run: `npx vitest run lib/backend/catalog/queries.test.ts`
Expected: PASS.

- [ ] **Step 5: Typecheck and commit**

```bash
npm run typecheck
npx eslint lib/backend/catalog
git add lib/backend/catalog/queries.ts lib/backend/catalog/queries.test.ts
git commit -m "feat(catalog): backend reads for products and collections"
```

---

## Task 7: Server actions

**Files:**
- Create: `lib/backend/catalog/actions.ts`
- Test: `lib/backend/catalog/actions.test.ts`

Every action re-checks the signed-in admin and acting site (`requireActingSite`), re-checks the feature switch on the server, re-validates the input, and writes through the person's own client (RLS). Storage uploads use the service role exactly like the existing photo upload (`app/dashboard/website/actions.ts:489`), because the buckets are written server-side only.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { emptyProductForm, type ProductForm } from './product-form';

const { rpc, slugRows, upload, insertUpload, shrinkImage, features, revalidatePath } = vi.hoisted(() => ({
  rpc: vi.fn(),
  slugRows: vi.fn(),
  upload: vi.fn(),
  insertUpload: vi.fn(),
  shrinkImage: vi.fn(),
  features: { on: new Set<string>(['catalog']) },
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/backend/current-site', () => ({
  requireActingSite: async () => ({ user: { id: 'u1' }, site: { tenantId: 't1', subdomain: 'shop', businessName: 'Shop' }, sites: [] }),
}));
vi.mock('@/lib/backend/site-features', () => ({ getSiteFeatures: async () => features.on }));
vi.mock('@/lib/supabase-server', () => ({
  createSupabaseServerClient: async () => ({
    rpc,
    from: () => ({ select: () => ({ eq: () => ({ is: () => ({ ilike: slugRows }) }) }) }),
  }),
}));
vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: () => ({
    storage: { from: () => ({ upload, getPublicUrl: () => ({ data: { publicUrl: 'https://cdn/x.webp' } }) }) },
    from: () => ({ insert: () => ({ select: () => ({ single: insertUpload }) }) }),
  }),
}));
vi.mock('@/lib/images/shrink', () => ({ shrinkImage }));
vi.mock('next/cache', () => ({ revalidatePath }));

import { saveProduct, duplicateProduct, uploadProductPhoto, uploadProductFile, saveCollection, createCollection, orderCollections } from './actions';

const form = (over: Partial<ProductForm> = {}): ProductForm => ({ ...emptyProductForm(), name: 'Fig Candle', price: '24', ...over });
const file = (type: string, size = 10, name = 'a') => new File([new Uint8Array(size)], name, { type });
const fd = (f: File) => {
  const d = new FormData();
  d.set('file', f);
  return d;
};

beforeEach(() => {
  vi.clearAllMocks();
  features.on = new Set(['catalog']);
  slugRows.mockResolvedValue({ data: [], error: null });
  rpc.mockResolvedValue({ data: 'new-id', error: null });
  upload.mockResolvedValue({ error: null });
  insertUpload.mockResolvedValue({ data: { id: 'up1' }, error: null });
  shrinkImage.mockResolvedValue(new Uint8Array([1, 2, 3]));
});

describe('saveProduct', () => {
  it('refuses when the site has no catalog', async () => {
    features.on = new Set();
    expect(await saveProduct(form())).toEqual({ ok: false, error: 'Products aren’t switched on for this site.' });
    expect(rpc).not.toHaveBeenCalled();
  });
  it('returns the validation message without writing', async () => {
    expect(await saveProduct(form({ name: '' }))).toEqual({ ok: false, error: 'Give the product a name.' });
    expect(rpc).not.toHaveBeenCalled();
  });
  it('creates a product with a unique web address', async () => {
    slugRows.mockResolvedValue({ data: [{ slug: 'fig-candle' }], error: null });
    expect(await saveProduct(form())).toEqual({ ok: true, id: 'new-id' });
    expect(rpc).toHaveBeenCalledWith('save_product', expect.objectContaining({ p_tenant_id: 't1', p: expect.objectContaining({ slug: 'fig-candle-2', name: 'Fig Candle' }) }));
    expect(rpc.mock.calls[0]![1]).not.toHaveProperty('p_listing_id');
    expect(revalidatePath).toHaveBeenCalledWith('/manage/products');
  });
  it('updates an existing product without touching its web address', async () => {
    rpc.mockResolvedValue({ data: 'l1', error: null });
    expect(await saveProduct(form({ id: 'l1', slug: 'fig' }))).toEqual({ ok: true, id: 'l1' });
    expect(rpc.mock.calls[0]![1]).toMatchObject({ p_listing_id: 'l1' });
    expect(rpc.mock.calls[0]![1].p).not.toHaveProperty('slug');
    expect(slugRows).not.toHaveBeenCalled();
  });
  it('says so when the web address can’t be checked', async () => {
    slugRows.mockResolvedValue({ data: null, error: { message: 'down' } });
    expect(await saveProduct(form())).toEqual({ ok: false, error: 'The web address couldn’t be checked. Try again in a moment.' });
  });
  it('turns database errors into plain messages', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: '23505', message: 'dup' } });
    expect(await saveProduct(form())).toEqual({ ok: false, error: 'Another product already uses that web address. Change the name slightly and save again.' });
    rpc.mockResolvedValue({ data: null, error: { code: 'P0002', message: 'gone' } });
    expect(await saveProduct(form({ id: 'l1' }))).toEqual({ ok: false, error: 'That product no longer exists. Go back to Products.' });
    rpc.mockResolvedValue({ data: null, error: { code: 'P0001', message: 'unknown photo' } });
    expect(await saveProduct(form())).toEqual({ ok: false, error: 'A photo or file on this product couldn’t be found. Remove it, add it again and save.' });
    rpc.mockResolvedValue({ data: null, error: { code: '42501', message: 'not allowed' } });
    expect(await saveProduct(form())).toEqual({ ok: false, error: 'You don’t have access to change this site.' });
    rpc.mockResolvedValue({ data: null, error: { code: 'XX000', message: 'boom' } });
    expect(await saveProduct(form())).toEqual({ ok: false, error: 'The product couldn’t be saved. Try again in a moment.' });
  });
});

describe('duplicateProduct', () => {
  it('saves a draft copy under a new web address', async () => {
    await duplicateProduct(form({ id: 'l1', slug: 'fig', status: 'active' }));
    expect(rpc.mock.calls[0]![1]).not.toHaveProperty('p_listing_id');
    expect(rpc.mock.calls[0]![1].p).toMatchObject({ name: 'Fig Candle (copy)', status: 'draft', slug: 'fig-candle-copy' });
  });
});

describe('uploadProductPhoto', () => {
  it('shrinks, stores and records the photo', async () => {
    expect(await uploadProductPhoto(fd(file('image/jpeg')))).toEqual({ ok: true, uploadId: 'up1', url: 'https://cdn/x.webp' });
    expect(shrinkImage).toHaveBeenCalled();
    expect(upload.mock.calls[0]![0]).toMatch(/^tenant\/t1\/products\/.+\.webp$/);
  });
  it('explains a wrong type, an empty pick and an oversized photo', async () => {
    expect(await uploadProductPhoto(fd(file('image/gif')))).toEqual({ ok: false, error: 'Use a JPG, PNG or WebP photo.' });
    expect(await uploadProductPhoto(new FormData())).toEqual({ ok: false, error: 'Pick a photo to upload.' });
    expect(await uploadProductPhoto(fd(file('image/jpeg', 20 * 1024 * 1024 + 1)))).toEqual({ ok: false, error: 'That photo is over 20MB. Pick a smaller one.' });
  });
  it('says so when the photo can’t be read, stored or recorded', async () => {
    shrinkImage.mockRejectedValueOnce(new Error('bad'));
    expect(await uploadProductPhoto(fd(file('image/png')))).toEqual({ ok: false, error: 'That photo couldn’t be read. Try a different one.' });
    upload.mockResolvedValueOnce({ error: { message: 'down' } });
    expect(await uploadProductPhoto(fd(file('image/png')))).toEqual({ ok: false, error: 'The photo couldn’t be uploaded. Try again.' });
    insertUpload.mockResolvedValueOnce({ data: null, error: { message: 'down' } });
    expect(await uploadProductPhoto(fd(file('image/png')))).toEqual({ ok: false, error: 'The photo couldn’t be saved. Try again.' });
  });
});

describe('uploadProductFile', () => {
  it('needs downloads switched on', async () => {
    expect(await uploadProductFile(fd(file('application/pdf')))).toEqual({ ok: false, error: 'Downloads aren’t switched on for this site.' });
  });
  it('stores the file privately, keeping its name', async () => {
    features.on = new Set(['catalog', 'digital_products']);
    expect(await uploadProductFile(fd(file('application/pdf', 10, 'Sheet 1.pdf')))).toEqual({ ok: true, uploadId: 'up1', fileName: 'Sheet 1.pdf' });
    expect(upload.mock.calls[0]![0]).toMatch(/^tenant\/t1\/files\/.+\.pdf$/);
    expect(shrinkImage).not.toHaveBeenCalled();
  });
  it('refuses other types and files over 50MB', async () => {
    features.on = new Set(['catalog', 'digital_products']);
    expect(await uploadProductFile(fd(file('text/html')))).toEqual({ ok: false, error: 'Use a PDF, PNG, JPG, WebP, SVG or ZIP file.' });
    expect(await uploadProductFile(fd(file('application/zip', 50 * 1024 * 1024 + 1)))).toEqual({ ok: false, error: 'That file is over 50MB. Pick a smaller one.' });
  });
});

describe('collections', () => {
  it('creates a draft collection from a name', async () => {
    rpc.mockResolvedValue({ data: 'c1', error: null });
    expect(await createCollection('Autumn')).toEqual({ ok: true, id: 'c1' });
    expect(rpc).toHaveBeenCalledWith('save_collection', expect.objectContaining({ p: expect.objectContaining({ name: 'Autumn', status: 'draft', slug: 'autumn', listing_ids: [] }) }));
  });
  it('saves an existing collection', async () => {
    rpc.mockResolvedValue({ data: 'c1', error: null });
    expect(await saveCollection({ id: 'c1', name: 'Autumn', description: '', status: 'active', featuredImageId: null, productIds: ['l1'] })).toEqual({ ok: true, id: 'c1' });
    expect(rpc.mock.calls[0]![1]).toMatchObject({ p_collection_id: 'c1', p: { listing_ids: ['l1'] } });
  });
  it('orders collections', async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    expect(await orderCollections(['c2', 'c1'])).toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledWith('order_collections', { p_tenant_id: 't1', p_ids: ['c2', 'c1'] });
  });
  it('says so when the order can’t be saved', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'down' } });
    expect(await orderCollections(['c1'])).toEqual({ ok: false, error: 'The new order couldn’t be saved. Try again.' });
  });
  it('refuses when the site has no catalog', async () => {
    features.on = new Set();
    expect(await createCollection('Autumn')).toEqual({ ok: false, error: 'Products aren’t switched on for this site.' });
  });
});
```

- [ ] **Step 2: Run to see it fail**

Run: `npx vitest run lib/backend/catalog/actions.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

First put the result types in their own file, `lib/backend/catalog/results.ts`, so the `'use server'` file exports only async functions:

```ts
export type SaveResult = { ok: true; id: string } | { ok: false; error: string };
export type PhotoResult = { ok: true; uploadId: string; url: string } | { ok: false; error: string };
export type FileResult = { ok: true; uploadId: string; fileName: string } | { ok: false; error: string };
export type DoneResult = { ok: true } | { ok: false; error: string };
```

Then `lib/backend/catalog/actions.ts`:

```ts
'use server';

/**
 * Catalog server actions (spec piece 1 §4, §5, §8). Each one re-checks the signed-in
 * admin's acting site and the site's feature switches on the server, re-validates,
 * and writes through the person's own client so RLS applies. Every failure returns
 * a message the maker can act on.
 */
import { revalidatePath } from 'next/cache';
import type { Json } from '@/lib/database.types';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import type { FeatureKey } from '@/lib/backend/features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';
import { shrinkImage } from '@/lib/images/shrink';
import { logger } from '@/lib/logger';
import { slugify, uniqueSlug } from '@/lib/catalog/slug';
import { buildProductPayload, type ProductForm } from './product-form';
import { buildCollectionPayload, type CollectionForm } from './collection-form';
import type { SaveResult, PhotoResult, FileResult, DoneResult } from './results';

const CATALOG_OFF = 'Products aren’t switched on for this site.';
const DIGITAL_OFF = 'Downloads aren’t switched on for this site.';
const PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_PHOTO_BYTES = 20 * 1024 * 1024; // the most the Images binding reads
const MAX_PHOTO_EDGE = 2400;
const FILE_TYPES: Readonly<Record<string, string>> = {
  'application/pdf': 'pdf',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'application/zip': 'zip',
};
const MAX_FILE_BYTES = 50 * 1024 * 1024; // the tenant-files bucket limit

type DbError = { code?: string; message: string };
type CatalogSite = { tenantId: string; userId: string; on: Set<FeatureKey> };

function saveError(error: DbError, what: 'product' | 'collection', tenantId: string): string {
  if (error.code === '23505') return `Another ${what} already uses that web address. Change the name slightly and save again.`;
  if (error.code === 'P0002') return what === 'product' ? 'That product no longer exists. Go back to Products.' : 'That collection no longer exists. Go back to Collections.';
  if (error.code === 'P0001') return what === 'product' ? 'A photo or file on this product couldn’t be found. Remove it, add it again and save.' : 'A photo or product in this collection couldn’t be found. Remove it, add it again and save.';
  if (error.code === '42501') return 'You don’t have access to change this site.';
  logger.error(`catalog: ${what} save failed`, { tenantId, code: error.code, error: error.message });
  return `The ${what} couldn’t be saved. Try again in a moment.`;
}

async function catalogSite(): Promise<CatalogSite | null> {
  const { user, site } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  return on.has('catalog') ? { tenantId: site.tenantId, userId: user.id, on } : null;
}

async function freeSlug(table: 'listings' | 'collections', tenantId: string, name: string): Promise<string | null> {
  const base = slugify(name);
  const db = await createSupabaseServerClient();
  const { data, error } = await db.from(table).select('slug').eq('tenant_id', tenantId).is('deleted_at', null).ilike('slug', `${base}%`);
  if (error !== null) {
    logger.error('catalog: slug lookup failed', { tenantId, error: error.message });
    return null;
  }
  return uniqueSlug(base, new Set((data ?? []).map((r) => r.slug)));
}

const SLUG_FAILED = 'The web address couldn’t be checked. Try again in a moment.';

export async function saveProduct(form: ProductForm): Promise<SaveResult> {
  const site = await catalogSite();
  if (site === null) return { ok: false, error: CATALOG_OFF };
  const built = buildProductPayload(form, { digital: site.on.has('digital_products') });
  if (!built.ok) return built;

  let p: Record<string, unknown> = { ...built.payload };
  if (form.id === null) {
    const slug = await freeSlug('listings', site.tenantId, built.payload.name);
    if (slug === null) return { ok: false, error: SLUG_FAILED };
    p = { ...p, slug };
  }
  const db = await createSupabaseServerClient();
  const { data, error } = await db.rpc('save_product', {
    p_tenant_id: site.tenantId,
    p: p as Json,
    ...(form.id !== null ? { p_listing_id: form.id } : {}),
  });
  if (error !== null || data === null) return { ok: false, error: saveError(error ?? { message: 'no id returned' }, 'product', site.tenantId) };
  revalidatePath('/manage/products');
  revalidatePath('/manage');
  return { ok: true, id: data };
}

/** Copy a product (everything but its web address) as a new draft (spec §4). */
export async function duplicateProduct(form: ProductForm): Promise<SaveResult> {
  return saveProduct({ ...form, id: null, slug: null, name: `${form.name.trim()} (copy)`.slice(0, 120), status: 'draft' });
}

export async function uploadProductPhoto(formData: FormData): Promise<PhotoResult> {
  const site = await catalogSite();
  if (site === null) return { ok: false, error: CATALOG_OFF };
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: 'Pick a photo to upload.' };
  if (!PHOTO_TYPES.has(file.type)) return { ok: false, error: 'Use a JPG, PNG or WebP photo.' };
  if (file.size > MAX_PHOTO_BYTES) return { ok: false, error: 'That photo is over 20MB. Pick a smaller one.' };

  let bytes: Uint8Array;
  try {
    bytes = await shrinkImage(await file.arrayBuffer(), { maxEdge: MAX_PHOTO_EDGE, format: 'webp', quality: 82 });
  } catch (err) {
    logger.warn('catalog: photo shrink failed', { tenantId: site.tenantId, error: String(err) });
    return { ok: false, error: 'That photo couldn’t be read. Try a different one.' };
  }
  const admin = supabaseAdmin();
  const path = `tenant/${site.tenantId}/products/${crypto.randomUUID()}.webp`;
  const { error: upErr } = await admin.storage.from('tenant-media').upload(path, bytes, { contentType: 'image/webp', upsert: false });
  if (upErr !== null) {
    logger.warn('catalog: photo upload failed', { tenantId: site.tenantId, error: upErr.message });
    return { ok: false, error: 'The photo couldn’t be uploaded. Try again.' };
  }
  const url = admin.storage.from('tenant-media').getPublicUrl(path).data.publicUrl;
  const { data: row, error: insErr } = await admin
    .from('uploads')
    .insert({
      tenant_id: site.tenantId,
      uploaded_by_user_id: site.userId,
      storage_bucket: 'tenant-media',
      storage_path: path,
      public_url: url,
      file_name: file.name.slice(0, 200),
      mime_type: 'image/webp',
      size_bytes: bytes.length,
      source: 'user_upload',
      status: 'active',
    })
    .select('id')
    .single();
  if (insErr !== null || row === null) {
    logger.warn('catalog: photo record failed', { tenantId: site.tenantId, error: insErr?.message });
    return { ok: false, error: 'The photo couldn’t be saved. Try again.' };
  }
  return { ok: true, uploadId: row.id, url };
}

/** A download file, stored privately (plan 1b decision 2). Delivery is piece 2. */
export async function uploadProductFile(formData: FormData): Promise<FileResult> {
  const site = await catalogSite();
  if (site === null) return { ok: false, error: CATALOG_OFF };
  if (!site.on.has('digital_products')) return { ok: false, error: DIGITAL_OFF };
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: 'Pick a file to upload.' };
  const ext = FILE_TYPES[file.type];
  if (ext === undefined) return { ok: false, error: 'Use a PDF, PNG, JPG, WebP, SVG or ZIP file.' };
  if (file.size > MAX_FILE_BYTES) return { ok: false, error: 'That file is over 50MB. Pick a smaller one.' };

  const admin = supabaseAdmin();
  const path = `tenant/${site.tenantId}/files/${crypto.randomUUID()}.${ext}`;
  const { error: upErr } = await admin.storage.from('tenant-files').upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: false });
  if (upErr !== null) {
    logger.warn('catalog: file upload failed', { tenantId: site.tenantId, error: upErr.message });
    return { ok: false, error: 'The file couldn’t be uploaded. Try again.' };
  }
  const fileName = file.name.slice(0, 200);
  const { data: row, error: insErr } = await admin
    .from('uploads')
    .insert({
      tenant_id: site.tenantId,
      uploaded_by_user_id: site.userId,
      storage_bucket: 'tenant-files',
      storage_path: path,
      public_url: null,
      file_name: fileName,
      mime_type: file.type,
      size_bytes: file.size,
      source: 'user_upload',
      status: 'active',
    })
    .select('id')
    .single();
  if (insErr !== null || row === null) {
    logger.warn('catalog: file record failed', { tenantId: site.tenantId, error: insErr?.message });
    return { ok: false, error: 'The file couldn’t be saved. Try again.' };
  }
  return { ok: true, uploadId: row.id, fileName };
}

export async function saveCollection(form: CollectionForm): Promise<SaveResult> {
  const site = await catalogSite();
  if (site === null) return { ok: false, error: CATALOG_OFF };
  const built = buildCollectionPayload(form);
  if (!built.ok) return built;
  let p: Record<string, unknown> = { ...built.payload };
  if (form.id === null) {
    const slug = await freeSlug('collections', site.tenantId, built.payload.name);
    if (slug === null) return { ok: false, error: SLUG_FAILED };
    p = { ...p, slug };
  }
  const db = await createSupabaseServerClient();
  const { data, error } = await db.rpc('save_collection', {
    p_tenant_id: site.tenantId,
    p: p as Json,
    ...(form.id !== null ? { p_collection_id: form.id } : {}),
  });
  if (error !== null || data === null) return { ok: false, error: saveError(error ?? { message: 'no id returned' }, 'collection', site.tenantId) };
  revalidatePath('/manage/collections');
  revalidatePath('/manage');
  return { ok: true, id: data };
}

export async function createCollection(name: string): Promise<SaveResult> {
  return saveCollection({ id: null, name, description: '', status: 'draft', featuredImageId: null, productIds: [] });
}

export async function orderCollections(ids: string[]): Promise<DoneResult> {
  const site = await catalogSite();
  if (site === null) return { ok: false, error: CATALOG_OFF };
  const db = await createSupabaseServerClient();
  const { error } = await db.rpc('order_collections', { p_tenant_id: site.tenantId, p_ids: ids });
  if (error !== null) {
    logger.error('catalog: order collections failed', { tenantId: site.tenantId, error: error.message });
    return { ok: false, error: 'The new order couldn’t be saved. Try again.' };
  }
  revalidatePath('/manage/collections');
  return { ok: true };
}
```

- [ ] **Step 4: Run to see it pass**

Run: `npx vitest run lib/backend/catalog/actions.test.ts`
Expected: PASS.

- [ ] **Step 5: Typecheck and commit**

```bash
npm run typecheck
npx eslint lib/backend/catalog
git add lib/backend/catalog/actions.ts lib/backend/catalog/actions.test.ts lib/backend/catalog/results.ts
git commit -m "feat(catalog): server actions for products, photos, files and collections"
```

---

## Task 8: Catalog on the home screen and in the menu

**Files:**
- Create: `lib/backend/catalog/home.ts`
- Test: `lib/backend/catalog/home.test.ts`
- Modify: `lib/backend/modules.ts`, `lib/backend/home.ts`, `lib/backend/modules.test.ts`

- [ ] **Step 1: Write the failing tests**

`lib/backend/catalog/home.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest';

const { listProducts, listCollections } = vi.hoisted(() => ({ listProducts: vi.fn(), listCollections: vi.fn() }));
vi.mock('./queries', () => ({ listProducts, listCollections }));
vi.mock('@/lib/supabase-server', () => ({ createSupabaseServerClient: async () => ({}) }));

import { catalogHomeData, catalogHome } from './home';
import type { ProductRowView } from './queries';

const p = (status: ProductRowView['status'], over: Partial<ProductRowView> = {}): ProductRowView => ({
  id: status,
  name: status,
  status,
  priceLabel: '$1',
  stockLabel: '',
  soldOut: false,
  photoUrl: 'u',
  photoUploadId: 'x',
  collectionIds: [],
  ...over,
});

describe('catalogHomeData', () => {
  it('counts live and draft, leaving archived out', () => {
    const home = catalogHomeData([p('active'), p('active'), p('draft'), p('archived')], [{ id: 'c', name: 'C', status: 'active', productCount: 1 }]);
    expect(home.tiles).toEqual([
      { label: 'Products', value: '2', note: '1 draft' },
      { label: 'Collections', value: '1', note: '0 drafts' },
    ]);
  });
  it('lists what needs attention, in plain words', () => {
    const home = catalogHomeData(
      [p('active', { photoUrl: null }), p('draft', { photoUrl: null }), p('active', { soldOut: true }), p('archived', { photoUrl: null, soldOut: true })],
      [],
    );
    expect(home.attention).toEqual(['2 products have no photo.', '1 product is still a draft.', '1 live product is sold out.']);
  });
  it('is quiet when nothing needs attention', () => {
    expect(catalogHomeData([p('active')], []).attention).toEqual([]);
  });
});

describe('catalogHome', () => {
  it('is the catalog feature’s contributor', async () => {
    listProducts.mockResolvedValue([p('active')]);
    listCollections.mockResolvedValue([]);
    expect(catalogHome.feature).toBe('catalog');
    expect((await catalogHome.load('t1')).tiles[0]).toEqual({ label: 'Products', value: '1', note: '0 drafts' });
  });
});
```

Add to `lib/backend/modules.test.ts` (merge `BACKEND_MODULES` into the file's existing import from `./modules`):
```ts
describe('catalog in the menu', () => {
  it('shows Products and Collections only when the catalog is on', () => {
    expect(navFor(BACKEND_MODULES, new Set(['catalog']))).toContainEqual({
      section: 'Catalog',
      items: [
        { label: 'Products', href: '/manage/products' },
        { label: 'Collections', href: '/manage/collections' },
      ],
    });
    expect(navFor(BACKEND_MODULES, new Set()).map((s) => s.section)).not.toContain('Catalog');
  });
});
```

- [ ] **Step 2: Run to see them fail**

Run: `npx vitest run lib/backend/catalog/home.test.ts lib/backend/modules.test.ts`
Expected: FAIL — `./home` not found; Catalog section missing.

- [ ] **Step 3: Implement**

`lib/backend/catalog/home.ts`:
```ts
/** The catalog's part of the home screen (spec piece 1 §3): counts and Needs attention. */
import { createSupabaseServerClient } from '@/lib/supabase-server';
import type { HomeContributor, HomeData } from '../home';
import { listProducts, listCollections, type ProductRowView, type CollectionRowView } from './queries';

const n = (count: number, one: string, many: string): string => `${count} ${count === 1 ? one : many}`;

export function catalogHomeData(products: readonly ProductRowView[], collections: readonly CollectionRowView[]): HomeData {
  const current = products.filter((p) => p.status !== 'archived');
  const live = current.filter((p) => p.status === 'active');
  const drafts = current.filter((p) => p.status === 'draft');
  const liveCollections = collections.filter((c) => c.status === 'active').length;
  const draftCollections = collections.filter((c) => c.status === 'draft').length;

  const noPhoto = current.filter((p) => p.photoUrl === null).length;
  const soldOut = live.filter((p) => p.soldOut).length;
  const attention: string[] = [];
  if (noPhoto > 0) attention.push(`${n(noPhoto, 'product has', 'products have')} no photo.`);
  if (drafts.length > 0) attention.push(`${n(drafts.length, 'product is', 'products are')} still ${drafts.length === 1 ? 'a draft' : 'drafts'}.`);
  if (soldOut > 0) attention.push(`${n(soldOut, 'live product is', 'live products are')} sold out.`);

  return {
    tiles: [
      { label: 'Products', value: String(live.length), note: n(drafts.length, 'draft', 'drafts') },
      { label: 'Collections', value: String(liveCollections), note: n(draftCollections, 'draft', 'drafts') },
    ],
    attention,
  };
}

export const catalogHome: HomeContributor = {
  feature: 'catalog',
  load: async (tenantId) => {
    const db = await createSupabaseServerClient();
    const [products, collections] = await Promise.all([listProducts(db, tenantId), listCollections(db, tenantId)]);
    return catalogHomeData(products, collections);
  },
};
```

In `lib/backend/home.ts`, add `import { catalogHome } from './catalog/home';` with the other imports and replace `export const HOME_CONTRIBUTORS: HomeContributor[] = [];` with:
```ts
export const HOME_CONTRIBUTORS: HomeContributor[] = [catalogHome];
```
(`catalog/home.ts` imports only types from `../home`, so there is no runtime cycle.)

In `lib/backend/modules.ts`, replace the `BACKEND_MODULES` line with:
```ts
export const BACKEND_MODULES: BackendModule[] = [
  { feature: null, section: 'Site', items: [{ label: 'Home', href: '/manage' }] },
  {
    feature: 'catalog',
    section: 'Catalog',
    items: [
      { label: 'Products', href: '/manage/products' },
      { label: 'Collections', href: '/manage/collections' },
    ],
  },
];
```

- [ ] **Step 4: Run to see them pass, plus the rest of the backend tests**

Run: `npx vitest run lib/backend app/manage`
Expected: PASS. If an existing test asserted that `HOME_CONTRIBUTORS` is empty or that the menu holds only Home, update that assertion to the new registry — that is the intended change. If `app/manage/page.test.tsx` (or similar) now hits the real contributor, mock `@/lib/backend/catalog/home` there.

- [ ] **Step 5: Commit**

```bash
npm run typecheck
npx eslint lib/backend app/manage
git add lib/backend app/manage
git commit -m "feat(catalog): catalog counts, needs-attention and menu section"
```

---
## Task 9: Backend look for catalog screens

**Files:**
- Modify: `app/manage/backend.css` (append)
- Create: `app/manage/_components/ConfirmButton.tsx`
- Test: `app/manage/_components/ConfirmButton.test.tsx`

Invoke the `frontend-design` skill first. The palette, type and patterns are fixed by spec §2a (Penny's admin); design within them — the classes below are the starting point, adjust spacing and detail by eye, but don't introduce new colours or fonts.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmButton } from './ConfirmButton';

describe('ConfirmButton', () => {
  it('asks once more before acting, in the page', () => {
    const onConfirm = vi.fn();
    render(<ConfirmButton label="Archive" confirmLabel="Yes, archive it" onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole('button', { name: 'Archive' }));
    expect(onConfirm).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Yes, archive it' }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });
  it('can be backed out of', () => {
    const onConfirm = vi.fn();
    render(<ConfirmButton label="Archive" confirmLabel="Yes, archive it" onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole('button', { name: 'Archive' }));
    fireEvent.click(screen.getByRole('button', { name: 'Keep it' }));
    expect(screen.getByRole('button', { name: 'Archive' })).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to see it fail**

Run: `npx vitest run app/manage/_components/ConfirmButton.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

`app/manage/_components/ConfirmButton.tsx`:
```tsx
'use client';

import { useState } from 'react';

/** Penny's in-page two-step confirm (her newer screens): native confirm() is
 *  suppressed by embedded browsers, so the button swaps to "Yes / Keep it". */
export function ConfirmButton({
  label,
  confirmLabel,
  keepLabel = 'Keep it',
  onConfirm,
  disabled = false,
}: {
  label: string;
  confirmLabel: string;
  keepLabel?: string;
  onConfirm: () => void;
  disabled?: boolean;
}): React.ReactElement {
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return (
      <button type="button" className="bk-btn bk-btn-danger" disabled={disabled} onClick={() => setAsking(true)}>
        {label}
      </button>
    );
  }
  return (
    <span className="bk-row">
      <button
        type="button"
        className="bk-btn bk-btn-danger"
        onClick={() => {
          setAsking(false);
          onConfirm();
        }}
      >
        {confirmLabel}
      </button>
      <button type="button" className="bk-btn bk-btn-quiet" onClick={() => setAsking(false)}>
        {keepLabel}
      </button>
    </span>
  );
}
```

Append to `app/manage/backend.css`:
```css
/* Catalog screens (plan 1b) — Penny's admin patterns: outline buttons, status pills,
   bordered sections, the inline notice, the tile picker. */
.bk-head-actions { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; }
.bk-btn-quiet { background: transparent; color: var(--bk-oxblood); box-shadow: inset 0 0 0 1px var(--bk-oxblood); }
.bk-btn-danger { background: transparent; color: var(--bk-danger); box-shadow: inset 0 0 0 1px oklch(0.51 0.18 27 / 50%); }
.bk-btn-small { padding: 0.35rem 0.7rem; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; }
.bk-notice { margin: 0 0 1rem; padding: 0.5rem 0.75rem; border: 1px solid oklch(0.51 0.18 27 / 40%); background: oklch(0.51 0.18 27 / 10%); color: var(--bk-danger); font-size: 0.875rem; }
.bk-notice[data-tone='ok'] { border-color: oklch(0.5 0.08 130 / 40%); background: oklch(0.5 0.08 130 / 10%); color: oklch(0.38 0.07 130); }
.bk-section { margin-bottom: 1.25rem; padding: 1.25rem; border: 1px solid var(--bk-ink-15); background: var(--bk-paper-2); }
.bk-section-title { margin: 0 0 1rem; font-family: var(--bk-display); font-size: 1.5rem; font-weight: 600; font-style: italic; }
.bk-grid-2 { display: grid; gap: 1rem; }
@media (min-width: 768px) { .bk-grid-2 { grid-template-columns: 1fr 1fr; } }
.bk-textarea { min-height: 7rem; resize: vertical; }
.bk-input-sm { max-width: 9rem; }
.bk-row { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; }
.bk-check { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; }
.bk-checks { display: grid; gap: 0.4rem; }
.bk-filters { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: end; margin-bottom: 1rem; }
.bk-table-wrap { overflow-x: auto; }
.bk-table { width: 100%; min-width: 40rem; border-collapse: collapse; font-size: 0.875rem; }
.bk-table th { padding: 0.5rem 1rem 0.5rem 0; border-bottom: 1px solid var(--bk-ink-15); text-align: left; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.2em; color: var(--bk-ink-muted); }
.bk-table td { padding: 0.75rem 1rem 0.75rem 0; border-bottom: 1px solid oklch(0.205 0.019 52 / 10%); vertical-align: middle; }
.bk-thumb { display: block; width: 3rem; height: 3rem; object-fit: cover; border: 1px solid var(--bk-ink-15); background: var(--bk-paper); }
.bk-thumb-empty { display: grid; place-items: center; font-size: 9px; text-transform: uppercase; letter-spacing: 0.15em; color: var(--bk-ink-muted); }
.bk-pill { display: inline-block; padding: 0.15rem 0.6rem; border-radius: 999px; background: oklch(0.205 0.019 52 / 10%); color: var(--bk-ink-60); font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.15em; }
.bk-pill[data-status='active'] { background: oklch(0.5 0.08 130 / 15%); color: oklch(0.38 0.07 130); }
.bk-pill[data-status='draft'] { background: oklch(0.72 0.08 75 / 22%); color: oklch(0.42 0.06 70); }
.bk-photos { display: grid; gap: 0.75rem; grid-template-columns: repeat(auto-fill, minmax(8.5rem, 1fr)); }
.bk-photo { display: grid; gap: 0.4rem; padding: 0.4rem; border: 1px solid var(--bk-ink-15); background: var(--bk-paper); }
.bk-photo img { display: block; width: 100%; aspect-ratio: 1; object-fit: cover; }
.bk-tag { font-size: 10px; text-transform: uppercase; letter-spacing: 0.15em; color: var(--bk-oxblood); }
.bk-chips { display: flex; flex-wrap: wrap; gap: 0.4rem; margin: 0.5rem 0; }
.bk-chip { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.25rem 0.5rem; border: 1px solid var(--bk-ink-15); background: var(--bk-paper); font-size: 0.8125rem; }
.bk-chip-x { padding: 0 0.15rem; border: 0; background: none; color: var(--bk-ink-60); font: inherit; cursor: pointer; }
.bk-option { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--bk-ink-15); }
.bk-list { margin: 0; padding: 0; list-style: none; border-top: 1px solid var(--bk-ink-15); }
.bk-list-item { display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem; padding: 0.75rem 0; border-bottom: 1px solid var(--bk-ink-15); }
.bk-list-name { flex: 1; min-width: 12rem; font-family: var(--bk-display); font-size: 1.25rem; font-weight: 600; }
.bk-picker { display: grid; gap: 0.5rem; grid-template-columns: repeat(auto-fill, minmax(7rem, 1fr)); }
.bk-pick { display: grid; gap: 0.3rem; padding: 0.35rem; border: 1px solid var(--bk-ink-15); background: var(--bk-paper); font: inherit; font-size: 0.8125rem; text-align: left; cursor: pointer; }
.bk-pick[aria-pressed='true'] { border-color: var(--bk-oxblood); box-shadow: inset 0 0 0 1px var(--bk-oxblood); }
.bk-pick img { width: 100%; aspect-ratio: 1; object-fit: cover; }
.bk-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
```

- [ ] **Step 4: Run to see it pass**

Run: `npx vitest run app/manage/_components/ConfirmButton.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
npx eslint app/manage/_components/ConfirmButton.tsx
git add app/manage/backend.css app/manage/_components/ConfirmButton.tsx app/manage/_components/ConfirmButton.test.tsx
git commit -m "feat(catalog): backend styles for catalog screens and two-step confirm"
```

---

## Task 10: Products list

**Files:**
- Create: `app/manage/products/page.tsx`, `app/manage/products/ProductTable.tsx`
- Test: `app/manage/products/ProductTable.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ProductTable } from './ProductTable';
import type { ProductRowView } from '@/lib/backend/catalog/queries';

const row = (id: string, name: string, status: ProductRowView['status'], over: Partial<ProductRowView> = {}): ProductRowView => ({
  id, name, status, priceLabel: '$24', stockLabel: 'Made to order', soldOut: false, photoUrl: null, photoUploadId: null, collectionIds: [], ...over,
});
const rows = [row('1', 'Fig Candle', 'active', { photoUrl: 'https://x/1.webp' }), row('2', 'Pine Soap', 'draft'), row('3', 'Old Mug', 'archived')];

describe('ProductTable', () => {
  it('lists current products with a link to edit each, hiding archived ones', () => {
    render(<ProductTable products={rows} />);
    expect(screen.getByRole('link', { name: 'Fig Candle' })).toHaveAttribute('href', '/manage/products/1');
    expect(screen.getByRole('link', { name: 'Pine Soap' })).toBeInTheDocument();
    expect(screen.queryByText('Old Mug')).toBeNull();
    expect(within(screen.getByRole('row', { name: /Fig Candle/ })).getByText('Live')).toBeInTheDocument();
  });
  it('filters by name and by status', () => {
    render(<ProductTable products={rows} />);
    fireEvent.change(screen.getByLabelText('Find a product'), { target: { value: 'pine' } });
    expect(screen.queryByText('Fig Candle')).toBeNull();
    expect(screen.getByText('Pine Soap')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Find a product'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Show'), { target: { value: 'archived' } });
    expect(screen.getByText('Old Mug')).toBeInTheDocument();
    expect(screen.queryByText('Fig Candle')).toBeNull();
  });
  it('says when nothing matches, and when there is nothing yet', () => {
    const { rerender } = render(<ProductTable products={rows} />);
    fireEvent.change(screen.getByLabelText('Find a product'), { target: { value: 'zzz' } });
    expect(screen.getByText('No products match.')).toBeInTheDocument();
    rerender(<ProductTable products={[]} />);
    expect(screen.getByText('No products yet. Add your first one to get started.')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to see it fail**

Run: `npx vitest run app/manage/products/ProductTable.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

`app/manage/products/ProductTable.tsx`:
```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { ProductRowView } from '@/lib/backend/catalog/queries';

type Show = 'current' | 'active' | 'draft' | 'archived';
const STATUS_LABEL = { active: 'Live', draft: 'Draft', archived: 'Archived' } as const;

export function ProductTable({ products }: { products: ProductRowView[] }): React.ReactElement {
  const [find, setFind] = useState('');
  const [show, setShow] = useState<Show>('current');

  if (products.length === 0) return <p className="bk-note">No products yet. Add your first one to get started.</p>;

  const needle = find.trim().toLowerCase();
  const visible = products.filter(
    (p) => (show === 'current' ? p.status !== 'archived' : p.status === show) && (needle === '' || p.name.toLowerCase().includes(needle)),
  );

  return (
    <>
      <div className="bk-filters">
        <div className="bk-field">
          <label htmlFor="find" className="bk-label">Find a product</label>
          <input id="find" className="bk-input" value={find} onChange={(e) => setFind(e.target.value)} />
        </div>
        <div className="bk-field">
          <label htmlFor="show" className="bk-label">Show</label>
          <select id="show" className="bk-input" value={show} onChange={(e) => setShow(e.target.value as Show)}>
            <option value="current">Live and drafts</option>
            <option value="active">Live</option>
            <option value="draft">Drafts</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>
      {visible.length === 0 ? (
        <p className="bk-note">No products match.</p>
      ) : (
        <div className="bk-table-wrap">
          <table className="bk-table">
            <thead>
              <tr>
                <th scope="col"><span className="bk-sr">Photo</span></th>
                <th scope="col">Name</th>
                <th scope="col">Price</th>
                <th scope="col">Stock</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => (
                <tr key={p.id} aria-label={p.name}>
                  <td>
                    {p.photoUrl !== null ? (
                      <img src={p.photoUrl} alt="" className="bk-thumb" />
                    ) : (
                      <span className="bk-thumb bk-thumb-empty">No photo</span>
                    )}
                  </td>
                  <td>
                    <Link href={`/manage/products/${p.id}`} className="bk-link">{p.name}</Link>
                  </td>
                  <td>{p.priceLabel}</td>
                  <td>{p.stockLabel}</td>
                  <td>
                    <span className="bk-pill" data-status={p.status}>{STATUS_LABEL[p.status]}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
```

`app/manage/products/page.tsx`:
```tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { listProducts } from '@/lib/backend/catalog/queries';
import { ProductTable } from './ProductTable';

export const dynamic = 'force-dynamic';

export default async function ProductsPage(): Promise<React.ReactElement> {
  const { site } = await requireActingSite();
  if (!(await getSiteFeatures(site.tenantId)).has('catalog')) notFound();
  const products = await listProducts(await createSupabaseServerClient(), site.tenantId);
  return (
    <>
      <div className="bk-head">
        <h1 className="bk-title">Products</h1>
        <div className="bk-head-actions">
          <Link href="/manage/products/new" className="bk-btn">Add product</Link>
        </div>
      </div>
      <main id="main" className="bk-content">
        <ProductTable products={products} />
      </main>
    </>
  );
}
```
A failed load throws into `app/manage/error.tsx`, which already tells the person and offers a retry.

- [ ] **Step 4: Run to see it pass**

Run: `npx vitest run app/manage/products/ProductTable.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
npm run typecheck
npx eslint app/manage/products
git add app/manage/products
git commit -m "feat(catalog): products list in the backend"
```

---

## Task 11: Product editor

**Files:**
- Create: `app/manage/products/new/page.tsx`, `app/manage/products/[id]/page.tsx`
- Create: `app/manage/products/_components/ProductEditor.tsx`, `PhotosField.tsx`, `OptionsField.tsx`, `FileField.tsx`
- Test: `app/manage/products/_components/ProductEditor.test.tsx`, `PhotosField.test.tsx`, `OptionsField.test.tsx`

Invoke `frontend-design` before writing these. One form, one Save (Penny's bundles editor), sections in this order: the basics, photos, price and stock, options, collections, status. Every failure lands in the notice at the top of the form (`role="alert"`) and the page scrolls it into view.

- [ ] **Step 1: Write the failing tests**

`app/manage/products/_components/PhotosField.test.tsx`:
```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const { uploadProductPhoto } = vi.hoisted(() => ({ uploadProductPhoto: vi.fn() }));
vi.mock('@/lib/backend/catalog/actions', () => ({ uploadProductPhoto }));

import { PhotosField } from './PhotosField';

const photos = [{ uploadId: 'a', url: 'https://x/a.webp' }, { uploadId: 'b', url: 'https://x/b.webp' }];
const pick = (input: HTMLElement, names: string[]) =>
  fireEvent.change(input, { target: { files: names.map((n) => new File(['x'], n, { type: 'image/jpeg' })) } });

beforeEach(() => vi.clearAllMocks());

describe('PhotosField', () => {
  it('marks the first photo as the main one and reorders and removes', () => {
    const onChange = vi.fn();
    render(<PhotosField photos={photos} onAdd={vi.fn()} onChange={onChange} onError={vi.fn()} />);
    expect(screen.getAllByText('Main photo')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Move photo 2 earlier' }));
    expect(onChange).toHaveBeenLastCalledWith([photos[1], photos[0]]);
    fireEvent.click(screen.getByRole('button', { name: 'Remove photo 1' }));
    expect(onChange).toHaveBeenLastCalledWith([photos[1]]);
  });
  it('uploads each picked photo and reports the ones that failed by name', async () => {
    uploadProductPhoto.mockResolvedValueOnce({ ok: true, uploadId: 'c', url: 'https://x/c.webp' }).mockResolvedValueOnce({ ok: false, error: 'Use a JPG, PNG or WebP photo.' });
    const onAdd = vi.fn();
    const onError = vi.fn();
    render(<PhotosField photos={[]} onAdd={onAdd} onChange={vi.fn()} onError={onError} />);
    pick(screen.getByLabelText('Add photos'), ['one.jpg', 'two.gif']);
    await waitFor(() => expect(onError).toHaveBeenCalledWith('two.gif: Use a JPG, PNG or WebP photo.'));
    expect(onAdd).toHaveBeenCalledWith({ uploadId: 'c', url: 'https://x/c.webp' });
  });
  it('says so when an upload throws', async () => {
    uploadProductPhoto.mockRejectedValueOnce(new Error('offline'));
    const onError = vi.fn();
    render(<PhotosField photos={[]} onAdd={vi.fn()} onChange={vi.fn()} onError={onError} />);
    pick(screen.getByLabelText('Add photos'), ['one.jpg']);
    await waitFor(() => expect(onError).toHaveBeenCalledWith('one.jpg: The photo couldn’t be uploaded. Check your connection and try again.'));
  });
  it('stops at the photo limit and says so', async () => {
    const twelve = Array.from({ length: 12 }, (_, i) => ({ uploadId: `p${i}`, url: `https://x/${i}.webp` }));
    const onError = vi.fn();
    render(<PhotosField photos={twelve} onAdd={vi.fn()} onChange={vi.fn()} onError={onError} />);
    pick(screen.getByLabelText('Add photos'), ['one.jpg']);
    await waitFor(() => expect(onError).toHaveBeenCalledWith('A product can have up to 12 photos. Remove one to add another.'));
    expect(uploadProductPhoto).not.toHaveBeenCalled();
  });
});
```

`app/manage/products/_components/OptionsField.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/lib/backend/catalog/actions', () => ({ uploadProductFile: vi.fn() }));

import { OptionsField } from './OptionsField';
import type { OptionForm, VariantForm } from '@/lib/backend/catalog/product-form';

const size: OptionForm = { name: 'Size', choices: [{ value: 'Small', kind: 'physical', fileUploadId: null, fileName: null }] };
const variants: VariantForm[] = [{ choices: { Size: 'Small' }, price: '', stock: '', available: true }];

const setup = (over: Partial<React.ComponentProps<typeof OptionsField>> = {}) => {
  const props = { options: [size], variants, basePrice: '24', digital: false, onOptions: vi.fn(), onVariants: vi.fn(), onError: vi.fn(), ...over };
  render(<OptionsField {...props} />);
  return props;
};

describe('OptionsField', () => {
  it('adds an option and a choice', () => {
    const p = setup({ options: [], variants: [] });
    fireEvent.click(screen.getByRole('button', { name: 'Add an option' }));
    expect(p.onOptions).toHaveBeenCalledWith([{ name: '', choices: [] }]);
  });
  it('adds a typed choice on Enter and ignores a blank one', () => {
    const p = setup();
    const input = screen.getByLabelText('New choice for Size');
    fireEvent.change(input, { target: { value: 'Large' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(p.onOptions).toHaveBeenCalledWith([{ name: 'Size', choices: [size.choices[0], { value: 'Large', kind: 'physical', fileUploadId: null, fileName: null }] }]);
    p.onOptions.mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'Add choice to Size' }));
    expect(p.onOptions).not.toHaveBeenCalled();
  });
  it('removes a choice and an option', () => {
    const p = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Remove Small' }));
    expect(p.onOptions).toHaveBeenLastCalledWith([{ name: 'Size', choices: [] }]);
    fireEvent.click(screen.getByRole('button', { name: 'Remove the Size option' }));
    expect(p.onOptions).toHaveBeenLastCalledWith([]);
  });
  it('edits each combination’s price, stock and availability', () => {
    const p = setup();
    fireEvent.change(screen.getByLabelText('Price for Small'), { target: { value: '30' } });
    expect(p.onVariants).toHaveBeenLastCalledWith([{ ...variants[0], price: '30' }]);
    fireEvent.change(screen.getByLabelText('Stock for Small'), { target: { value: '2' } });
    expect(p.onVariants).toHaveBeenLastCalledWith([{ ...variants[0], stock: '2' }]);
    fireEvent.click(screen.getByLabelText('Small is available'));
    expect(p.onVariants).toHaveBeenLastCalledWith([{ ...variants[0], available: false }]);
    expect(screen.getByLabelText('Price for Small')).toHaveAttribute('placeholder', '24');
  });
  it('offers download choices only when the site has them', () => {
    setup();
    expect(screen.queryByLabelText('Small is sold as')).toBeNull();
  });
  it('lets a choice be a download when the site has them', () => {
    const p = setup({ digital: true });
    fireEvent.change(screen.getByLabelText('Small is sold as'), { target: { value: 'digital' } });
    expect(p.onOptions).toHaveBeenLastCalledWith([{ name: 'Size', choices: [{ ...size.choices[0], kind: 'digital' }] }]);
  });
  it('stops at three options', () => {
    setup({ options: [size, { ...size, name: 'B' }, { ...size, name: 'C' }] });
    expect(screen.getByRole('button', { name: 'Add an option' })).toBeDisabled();
  });
});
```

`app/manage/products/_components/ProductEditor.test.tsx`:
```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { emptyProductForm, type ProductForm } from '@/lib/backend/catalog/product-form';

const { saveProduct, duplicateProduct, replace, push, refresh } = vi.hoisted(() => ({
  saveProduct: vi.fn(),
  duplicateProduct: vi.fn(),
  replace: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock('@/lib/backend/catalog/actions', () => ({ saveProduct, duplicateProduct, uploadProductPhoto: vi.fn(), uploadProductFile: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace, push, refresh }), unstable_rethrow: vi.fn() }));

import { ProductEditor } from './ProductEditor';

const collections = [{ id: 'c1', name: 'Autumn' }];
const existing = (over: Partial<ProductForm> = {}): ProductForm => ({ ...emptyProductForm(), id: 'l1', slug: 'fig', name: 'Fig Candle', price: '24', ...over });
const renderEditor = (initial: ProductForm, digital = false) =>
  render(<ProductEditor initial={initial} collections={collections} digital={digital} shopUrl="https://shop.bohdiai.com" />);

beforeEach(() => vi.clearAllMocks());

describe('ProductEditor', () => {
  it('shows the validation message without calling the server', async () => {
    renderEditor(emptyProductForm());
    fireEvent.click(screen.getAllByRole('button', { name: 'Save' })[0]!);
    expect(await screen.findByRole('alert')).toHaveTextContent('Give the product a name.');
    expect(saveProduct).not.toHaveBeenCalled();
  });
  it('saves a new product and opens it', async () => {
    saveProduct.mockResolvedValue({ ok: true, id: 'new' });
    renderEditor(emptyProductForm());
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Fig Candle' } });
    fireEvent.change(screen.getByLabelText('Price'), { target: { value: '24' } });
    fireEvent.click(screen.getByLabelText('Autumn'));
    fireEvent.click(screen.getAllByRole('button', { name: 'Save' })[0]!);
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/manage/products/new'));
    expect(saveProduct.mock.calls[0]![0]).toMatchObject({ name: 'Fig Candle', price: '24', collectionIds: ['c1'] });
  });
  it('confirms a save of an existing product', async () => {
    saveProduct.mockResolvedValue({ ok: true, id: 'l1' });
    renderEditor(existing());
    fireEvent.click(screen.getAllByRole('button', { name: 'Save' })[0]!);
    expect(await screen.findByRole('status')).toHaveTextContent('Saved.');
    expect(refresh).toHaveBeenCalled();
  });
  it('shows the server’s message, and a plain one when the call throws', async () => {
    saveProduct.mockResolvedValueOnce({ ok: false, error: 'The product couldn’t be saved. Try again in a moment.' });
    renderEditor(existing());
    fireEvent.click(screen.getAllByRole('button', { name: 'Save' })[0]!);
    expect(await screen.findByRole('alert')).toHaveTextContent('The product couldn’t be saved. Try again in a moment.');
    saveProduct.mockRejectedValueOnce(new Error('offline'));
    fireEvent.click(screen.getAllByRole('button', { name: 'Save' })[0]!);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong. Check your connection and try again.'));
  });
  it('builds combinations as options are added', () => {
    renderEditor(existing());
    fireEvent.click(screen.getByRole('button', { name: 'Add an option' }));
    fireEvent.change(screen.getByLabelText('Option 1 name'), { target: { value: 'Size' } });
    const input = screen.getByLabelText('New choice for Size');
    fireEvent.change(input, { target: { value: 'Small' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByLabelText('Price for Small')).toBeInTheDocument();
    expect(screen.queryByLabelText('Stock')).toBeNull();
  });
  it('hides download choices unless the site has them', () => {
    renderEditor(existing());
    expect(screen.queryByLabelText('Download')).toBeNull();
  });
  it('offers download and its file when the site has them', () => {
    renderEditor(existing(), true);
    fireEvent.click(screen.getByLabelText('Download'));
    expect(screen.getByLabelText('Upload the download file')).toBeInTheDocument();
    expect(screen.queryByLabelText('Stock')).toBeNull();
  });
  it('duplicates an existing product and opens the copy', async () => {
    duplicateProduct.mockResolvedValue({ ok: true, id: 'copy' });
    renderEditor(existing());
    fireEvent.click(screen.getByRole('button', { name: 'Duplicate' }));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/manage/products/copy'));
  });
  it('archives after a second confirmation', async () => {
    saveProduct.mockResolvedValue({ ok: true, id: 'l1' });
    renderEditor(existing({ status: 'active' }));
    fireEvent.click(screen.getByRole('button', { name: 'Archive' }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes, archive it' }));
    await waitFor(() => expect(saveProduct.mock.calls[0]![0]).toMatchObject({ status: 'archived' }));
  });
  it('links to the live product on the shop', () => {
    renderEditor(existing({ status: 'active' }));
    expect(screen.getByRole('link', { name: 'View on your shop' })).toHaveAttribute('href', 'https://shop.bohdiai.com/listings/fig');
  });
});
```

- [ ] **Step 2: Run to see them fail**

Run: `npx vitest run app/manage/products/_components`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement the fields**

`app/manage/products/_components/FileField.tsx`:
```tsx
'use client';

import { useState } from 'react';
import { unstable_rethrow } from 'next/navigation';
import { uploadProductFile } from '@/lib/backend/catalog/actions';

const ACCEPT = '.pdf,.png,.jpg,.jpeg,.webp,.svg,.zip';

/** Upload (or replace) one private download file. The file is stored now; buyers get it in piece 2. */
export function FileField({
  fileName,
  label,
  onUploaded,
  onError,
}: {
  fileName: string | null;
  label: string;
  onUploaded: (uploadId: string, fileName: string) => void;
  onError: (message: string) => void;
}): React.ReactElement {
  const [busy, setBusy] = useState(false);

  async function pick(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file === undefined) return;
    setBusy(true);
    try {
      const data = new FormData();
      data.set('file', file);
      const r = await uploadProductFile(data);
      if (r.ok) onUploaded(r.uploadId, r.fileName);
      else onError(r.error);
    } catch (err) {
      unstable_rethrow(err);
      onError('The file couldn’t be uploaded. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bk-row">
      <span className="bk-note">{fileName ?? 'No file yet'}</span>
      <label className="bk-btn bk-btn-quiet bk-btn-small">
        {busy ? 'Uploading…' : fileName === null ? 'Upload file' : 'Replace file'}
        <input type="file" className="bk-sr" accept={ACCEPT} aria-label={label} disabled={busy} onChange={(e) => void pick(e)} />
      </label>
    </div>
  );
}
```

`app/manage/products/_components/PhotosField.tsx`:
```tsx
'use client';

import { useState } from 'react';
import { unstable_rethrow } from 'next/navigation';
import { uploadProductPhoto } from '@/lib/backend/catalog/actions';
import { MAX_PHOTOS, type PhotoForm } from '@/lib/backend/catalog/product-form';
import { moveItem } from '@/lib/backend/catalog/collection-form';

/** Several photos; the first is the main one; the maker reorders (spec §4). Photos
 *  upload one at a time and each failure is named. */
export function PhotosField({
  photos,
  onAdd,
  onChange,
  onError,
}: {
  photos: PhotoForm[];
  onAdd: (photo: PhotoForm) => void;
  onChange: (photos: PhotoForm[]) => void;
  onError: (message: string) => void;
}): React.ReactElement {
  const [uploading, setUploading] = useState(0);

  async function add(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const files = [...(e.target.files ?? [])];
    e.target.value = '';
    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) {
      onError(`A product can have up to ${MAX_PHOTOS} photos. Remove one to add another.`);
      return;
    }
    const failures: string[] = [];
    if (files.length > room) failures.push(`A product can have up to ${MAX_PHOTOS} photos, so only the first ${room} were added.`);
    for (const file of files.slice(0, room)) {
      setUploading((n) => n + 1);
      try {
        const data = new FormData();
        data.set('file', file);
        const r = await uploadProductPhoto(data);
        if (r.ok) onAdd({ uploadId: r.uploadId, url: r.url });
        else failures.push(`${file.name}: ${r.error}`);
      } catch (err) {
        unstable_rethrow(err);
        failures.push(`${file.name}: The photo couldn’t be uploaded. Check your connection and try again.`);
      } finally {
        setUploading((n) => n - 1);
      }
    }
    if (failures.length > 0) onError(failures.join(' '));
  }

  return (
    <div>
      {photos.length > 0 && (
        <ul className="bk-photos" aria-label="Photos">
          {photos.map((p, i) => (
            <li key={p.uploadId} className="bk-photo">
              <img src={p.url} alt={`Photo ${i + 1}`} />
              {i === 0 && <span className="bk-tag">Main photo</span>}
              <div className="bk-row">
                <button type="button" className="bk-btn bk-btn-quiet bk-btn-small" disabled={i === 0} aria-label={`Move photo ${i + 1} earlier`} onClick={() => onChange(moveItem(photos, i, -1))}>←</button>
                <button type="button" className="bk-btn bk-btn-quiet bk-btn-small" disabled={i === photos.length - 1} aria-label={`Move photo ${i + 1} later`} onClick={() => onChange(moveItem(photos, i, 1))}>→</button>
                <button type="button" className="bk-btn bk-btn-danger bk-btn-small" aria-label={`Remove photo ${i + 1}`} onClick={() => onChange(photos.filter((_, j) => j !== i))}>Remove</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="bk-row">
        <label className="bk-btn bk-btn-quiet">
          {uploading > 0 ? 'Uploading…' : 'Add photos'}
          <input type="file" className="bk-sr" accept="image/jpeg,image/png,image/webp" multiple aria-label="Add photos" disabled={uploading > 0} onChange={(e) => void add(e)} />
        </label>
        <span className="bk-note">JPG, PNG or WebP, up to 20MB each. Big photos are made smaller for you.</span>
      </p>
    </div>
  );
}
```

`app/manage/products/_components/OptionsField.tsx`:
```tsx
'use client';

import { useState } from 'react';
import { MAX_OPTIONS, MAX_CHOICES } from '@/lib/catalog/combinations';
import type { OptionForm, VariantForm, ChoiceForm, Kind } from '@/lib/backend/catalog/product-form';
import { FileField } from './FileField';

const label = (v: VariantForm): string => Object.values(v.choices).join(' / ');

/** The maker's own options and the combinations they make (spec §4; Etsy-style per D4). */
export function OptionsField({
  options,
  variants,
  basePrice,
  digital,
  onOptions,
  onVariants,
  onError,
}: {
  options: OptionForm[];
  variants: VariantForm[];
  basePrice: string;
  digital: boolean;
  onOptions: (options: OptionForm[]) => void;
  onVariants: (variants: VariantForm[]) => void;
  onError: (message: string) => void;
}): React.ReactElement {
  const [drafts, setDrafts] = useState<Record<number, string>>({});

  const setOption = (i: number, next: OptionForm) => onOptions(options.map((o, j) => (j === i ? next : o)));
  const setChoice = (i: number, c: number, next: ChoiceForm) => setOption(i, { ...options[i]!, choices: options[i]!.choices.map((x, k) => (k === c ? next : x)) });
  const addChoice = (i: number) => {
    const value = (drafts[i] ?? '').trim();
    if (value === '') return;
    setOption(i, { ...options[i]!, choices: [...options[i]!.choices, { value, kind: 'physical', fileUploadId: null, fileName: null }] });
    setDrafts((d) => ({ ...d, [i]: '' }));
  };
  const setVariant = (i: number, next: VariantForm) => onVariants(variants.map((v, j) => (j === i ? next : v)));

  return (
    <div>
      <p className="bk-note">Options are things a shopper picks, like size or scent. Each combination can have its own price and stock.</p>
      {options.map((o, i) => {
        const name = o.name.trim() === '' ? `option ${i + 1}` : o.name.trim();
        return (
          <div key={i} className="bk-option">
            <div className="bk-row">
              <div className="bk-field">
                <label htmlFor={`opt-${i}`} className="bk-label">{`Option ${i + 1} name`}</label>
                <input id={`opt-${i}`} className="bk-input" value={o.name} placeholder="Size, Scent, Colour…" onChange={(e) => setOption(i, { ...o, name: e.target.value })} />
              </div>
              <button type="button" className="bk-btn bk-btn-danger bk-btn-small" aria-label={`Remove the ${name} option`} onClick={() => onOptions(options.filter((_, j) => j !== i))}>Remove option</button>
            </div>
            <ul className="bk-chips" aria-label={`Choices for ${name}`}>
              {o.choices.map((c, k) => (
                <li key={`${k}-${c.value}`} className="bk-chip">
                  <span>{c.value}</span>
                  {digital && (
                    <select aria-label={`${c.value} is sold as`} className="bk-input bk-input-sm" value={c.kind} onChange={(e) => setChoice(i, k, { ...c, kind: e.target.value as Kind })}>
                      <option value="physical">Ships</option>
                      <option value="digital">Download</option>
                    </select>
                  )}
                  {digital && c.kind === 'digital' && (
                    <FileField fileName={c.fileName} label={`Upload the file for ${c.value}`} onUploaded={(id, fn) => setChoice(i, k, { ...c, fileUploadId: id, fileName: fn })} onError={onError} />
                  )}
                  <button type="button" className="bk-chip-x" aria-label={`Remove ${c.value}`} onClick={() => setOption(i, { ...o, choices: o.choices.filter((_, x) => x !== k) })}>×</button>
                </li>
              ))}
            </ul>
            <div className="bk-row">
              <input
                className="bk-input bk-input-sm"
                aria-label={`New choice for ${name}`}
                value={drafts[i] ?? ''}
                disabled={o.choices.length >= MAX_CHOICES}
                onChange={(e) => setDrafts((d) => ({ ...d, [i]: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addChoice(i);
                  }
                }}
              />
              <button type="button" className="bk-btn bk-btn-quiet bk-btn-small" aria-label={`Add choice to ${name}`} onClick={() => addChoice(i)}>Add</button>
            </div>
          </div>
        );
      })}
      <p className="bk-row">
        <button type="button" className="bk-btn bk-btn-quiet" disabled={options.length >= MAX_OPTIONS} onClick={() => onOptions([...options, { name: '', choices: [] }])}>
          Add an option
        </button>
        {options.length >= MAX_OPTIONS && <span className="bk-note">{`Up to ${MAX_OPTIONS} options.`}</span>}
      </p>
      {variants.length > 0 && (
        <div className="bk-table-wrap">
          <table className="bk-table">
            <thead>
              <tr>
                <th scope="col">Combination</th>
                <th scope="col">Price</th>
                <th scope="col">Stock</th>
                <th scope="col">Available</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((v, i) => (
                <tr key={label(v)}>
                  <td>{label(v)}</td>
                  <td>
                    <input className="bk-input bk-input-sm" inputMode="decimal" aria-label={`Price for ${label(v)}`} placeholder={basePrice} value={v.price} onChange={(e) => setVariant(i, { ...v, price: e.target.value })} />
                  </td>
                  <td>
                    <input className="bk-input bk-input-sm" inputMode="numeric" aria-label={`Stock for ${label(v)}`} placeholder="Made to order" value={v.stock} onChange={(e) => setVariant(i, { ...v, stock: e.target.value })} />
                  </td>
                  <td>
                    <input type="checkbox" aria-label={`${label(v)} is available`} checked={v.available} onChange={(e) => setVariant(i, { ...v, available: e.target.checked })} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="bk-note">A blank price uses the product price. A blank stock means made to order. Stock at 0 shows as sold out.</p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Implement the editor and its pages**

`app/manage/products/_components/ProductEditor.tsx`:
```tsx
'use client';

import { useRef, useState } from 'react';
import { useRouter, unstable_rethrow } from 'next/navigation';
import { saveProduct, duplicateProduct } from '@/lib/backend/catalog/actions';
import type { SaveResult } from '@/lib/backend/catalog/results';
import { buildProductPayload, syncVariants, type ProductForm, type OptionForm, type ItemStatus, type PhotoForm } from '@/lib/backend/catalog/product-form';
import { ConfirmButton } from '../../_components/ConfirmButton';
import { PhotosField } from './PhotosField';
import { OptionsField } from './OptionsField';
import { FileField } from './FileField';

const FAILED = 'Something went wrong. Check your connection and try again.';
const STATUSES: { value: ItemStatus; label: string }[] = [
  { value: 'draft', label: 'Draft — only you can see it' },
  { value: 'active', label: 'Live on your shop' },
  { value: 'archived', label: 'Archived — hidden from the shop, kept here' },
];

export function ProductEditor({
  initial,
  collections,
  digital,
  shopUrl,
}: {
  initial: ProductForm;
  collections: { id: string; name: string }[];
  digital: boolean;
  shopUrl: string;
}): React.ReactElement {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [busy, setBusy] = useState(false);
  const notice = useRef<HTMLDivElement>(null);

  const update = (patch: Partial<ProductForm>) => {
    setForm((f) => ({ ...f, ...patch }));
    setSaved('');
  };
  const setOptions = (options: OptionForm[]) => {
    setForm((f) => ({ ...f, options, variants: syncVariants(options, f.variants) }));
    setSaved('');
  };
  const addPhoto = (photo: PhotoForm) => setForm((f) => ({ ...f, photos: [...f.photos, photo] }));
  const showError = (message: string) => {
    setError(message);
    notice.current?.scrollIntoView({ block: 'nearest' });
  };

  async function run(action: () => Promise<SaveResult>, done: (id: string) => void): Promise<void> {
    setBusy(true);
    setError('');
    setSaved('');
    try {
      const r = await action();
      if (r.ok) done(r.id);
      else showError(r.error);
    } catch (err) {
      unstable_rethrow(err);
      showError(FAILED);
    } finally {
      setBusy(false);
    }
  }

  function save(next: ProductForm): void {
    const check = buildProductPayload(next, { digital });
    if (!check.ok) {
      showError(check.error);
      return;
    }
    void run(
      () => saveProduct(next),
      (id) => {
        if (next.id === null) {
          router.replace(`/manage/products/${id}`);
          return;
        }
        setForm(next);
        setSaved('Saved.');
        router.refresh();
      },
    );
  }

  const noOptions = form.options.length === 0;
  const isNew = form.id === null;

  return (
    <>
      <div className="bk-head">
        <h1 className="bk-title">{isNew ? 'New product' : initial.name}</h1>
        <div className="bk-head-actions">
          {!isNew && initial.status === 'active' && initial.slug !== null && (
            <a className="bk-btn bk-btn-quiet" href={`${shopUrl}/listings/${initial.slug}`} target="_blank" rel="noopener noreferrer">View on your shop</a>
          )}
          {!isNew && (
            <button type="button" className="bk-btn bk-btn-quiet" disabled={busy} onClick={() => void run(() => duplicateProduct(form), (id) => router.push(`/manage/products/${id}`))}>
              Duplicate
            </button>
          )}
          {!isNew && form.status !== 'archived' && <ConfirmButton label="Archive" confirmLabel="Yes, archive it" disabled={busy} onConfirm={() => save({ ...form, status: 'archived' })} />}
          <button type="button" className="bk-btn" disabled={busy} onClick={() => save(form)}>{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
      <main id="main" className="bk-content">
        <div ref={notice}>
          {error !== '' && <p role="alert" className="bk-notice">{error}</p>}
          {saved !== '' && <p role="status" className="bk-notice" data-tone="ok">{saved}</p>}
        </div>

        <section className="bk-section" aria-labelledby="s-basics">
          <h2 id="s-basics" className="bk-section-title">The basics</h2>
          <div className="bk-field">
            <label htmlFor="name" className="bk-label">Name</label>
            <input id="name" className="bk-input" value={form.name} onChange={(e) => update({ name: e.target.value })} />
          </div>
          <div className="bk-field">
            <label htmlFor="short" className="bk-label">Short description</label>
            <input id="short" className="bk-input" value={form.shortDescription} onChange={(e) => update({ shortDescription: e.target.value })} />
          </div>
          <div className="bk-field">
            <label htmlFor="long" className="bk-label">Description</label>
            <textarea id="long" className="bk-input bk-textarea" value={form.description} onChange={(e) => update({ description: e.target.value })} />
          </div>
        </section>

        <section className="bk-section" aria-labelledby="s-photos">
          <h2 id="s-photos" className="bk-section-title">Photos</h2>
          <PhotosField photos={form.photos} onAdd={addPhoto} onChange={(photos) => update({ photos })} onError={showError} />
        </section>

        <section className="bk-section" aria-labelledby="s-price">
          <h2 id="s-price" className="bk-section-title">Price and stock</h2>
          <div className="bk-grid-2">
            <div className="bk-field">
              <label htmlFor="price" className="bk-label">Price</label>
              <input id="price" className="bk-input" inputMode="decimal" placeholder="24 or 24.50" value={form.price} onChange={(e) => update({ price: e.target.value })} />
            </div>
            {noOptions && form.kind === 'physical' && (
              <div className="bk-field">
                <label htmlFor="stock" className="bk-label">Stock</label>
                <input id="stock" className="bk-input" inputMode="numeric" placeholder="Blank = made to order" value={form.stock} onChange={(e) => update({ stock: e.target.value })} />
              </div>
            )}
          </div>
          {digital && noOptions && (
            <fieldset className="bk-field">
              <legend className="bk-label">How it’s sold</legend>
              <div className="bk-row">
                <label className="bk-check">
                  <input type="radio" name="kind" checked={form.kind === 'physical'} onChange={() => update({ kind: 'physical' })} />
                  Ships
                </label>
                <label className="bk-check">
                  <input type="radio" name="kind" checked={form.kind === 'digital'} onChange={() => update({ kind: 'digital' })} />
                  Download
                </label>
              </div>
              {form.kind === 'digital' && (
                <FileField fileName={form.fileName} label="Upload the download file" onUploaded={(id, fileName) => update({ fileUploadId: id, fileName })} onError={showError} />
              )}
            </fieldset>
          )}
        </section>

        <section className="bk-section" aria-labelledby="s-options">
          <h2 id="s-options" className="bk-section-title">Options</h2>
          <OptionsField
            options={form.options}
            variants={form.variants}
            basePrice={form.price}
            digital={digital}
            onOptions={setOptions}
            onVariants={(variants) => update({ variants })}
            onError={showError}
          />
        </section>

        <section className="bk-section" aria-labelledby="s-collections">
          <h2 id="s-collections" className="bk-section-title">Collections</h2>
          {collections.length === 0 ? (
            <p className="bk-note">No collections yet. You can make them under Collections.</p>
          ) : (
            <div className="bk-checks">
              {collections.map((c) => (
                <label key={c.id} className="bk-check">
                  <input
                    type="checkbox"
                    checked={form.collectionIds.includes(c.id)}
                    onChange={(e) => update({ collectionIds: e.target.checked ? [...form.collectionIds, c.id] : form.collectionIds.filter((x) => x !== c.id) })}
                  />
                  {c.name}
                </label>
              ))}
            </div>
          )}
        </section>

        <section className="bk-section" aria-labelledby="s-status">
          <h2 id="s-status" className="bk-section-title">Status</h2>
          <div className="bk-checks">
            {STATUSES.map((s) => (
              <label key={s.value} className="bk-check">
                <input type="radio" name="status" checked={form.status === s.value} onChange={() => update({ status: s.value })} />
                {s.label}
              </label>
            ))}
          </div>
        </section>

        <p className="bk-row">
          <button type="button" className="bk-btn" disabled={busy} onClick={() => save(form)}>{busy ? 'Saving…' : 'Save'}</button>
        </p>
      </main>
    </>
  );
}
```

The "Download" radio's accessible name is "Download" and the per-choice select is labelled "{choice} is sold as", so the test `queryByLabelText('Download')` only finds the product-level radio.

`app/manage/products/new/page.tsx`:
```tsx
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { listCollections } from '@/lib/backend/catalog/queries';
import { emptyProductForm } from '@/lib/backend/catalog/product-form';
import { storefrontOrigin } from '@/lib/dashboard/storefront-url';
import { ProductEditor } from '../_components/ProductEditor';

export const dynamic = 'force-dynamic';

export default async function NewProductPage(): Promise<React.ReactElement> {
  const { site } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  if (!on.has('catalog')) notFound();
  const collections = await listCollections(await createSupabaseServerClient(), site.tenantId);
  return (
    <ProductEditor
      initial={emptyProductForm()}
      collections={collections.filter((c) => c.status !== 'archived').map((c) => ({ id: c.id, name: c.name }))}
      digital={on.has('digital_products')}
      shopUrl={storefrontOrigin(site.subdomain, (await headers()).get('host'))}
    />
  );
}
```

`app/manage/products/[id]/page.tsx`:
```tsx
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getProduct, listCollections } from '@/lib/backend/catalog/queries';
import { storefrontOrigin } from '@/lib/dashboard/storefront-url';
import { ProductEditor } from '../_components/ProductEditor';

export const dynamic = 'force-dynamic';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }): Promise<React.ReactElement> {
  const { id } = await params;
  const { site } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  if (!on.has('catalog')) notFound();
  const db = await createSupabaseServerClient();
  const [product, collections] = await Promise.all([getProduct(db, site.tenantId, id), listCollections(db, site.tenantId)]);
  if (product === null) notFound();
  return (
    <ProductEditor
      key={id}
      initial={product}
      collections={collections.filter((c) => c.status !== 'archived' || product.collectionIds.includes(c.id)).map((c) => ({ id: c.id, name: c.name }))}
      digital={on.has('digital_products')}
      shopUrl={storefrontOrigin(site.subdomain, (await headers()).get('host'))}
    />
  );
}
```
(`key={id}` resets the editor's state when Duplicate navigates to the copy.)

- [ ] **Step 5: Run the tests to see them pass**

Run: `npx vitest run app/manage/products`
Expected: PASS.

- [ ] **Step 6: Typecheck, lint, accessibility scan, commit**

The backend a11y scan in `e2e/a11y.spec.ts` covers signed-out pages only; the editor's labels are pinned by the tests above (every input is found by its label).

```bash
npm run typecheck
npx eslint app/manage/products
git add app/manage/products
git commit -m "feat(catalog): product editor — photos, options, stock, downloads, collections, status"
```

---

## Task 12: Collections list and editor

**Files:**
- Create: `app/manage/collections/page.tsx`, `app/manage/collections/CollectionList.tsx`
- Create: `app/manage/collections/[id]/page.tsx`, `app/manage/collections/[id]/CollectionEditor.tsx`
- Test: `app/manage/collections/CollectionList.test.tsx`, `app/manage/collections/[id]/CollectionEditor.test.tsx`

Invoke `frontend-design` first. Ordering uses ← / → style move buttons (accessible, and Penny's admin has no drag anywhere).

- [ ] **Step 1: Write the failing tests**

`app/manage/collections/CollectionList.test.tsx`:
```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const { createCollection, orderCollections, push } = vi.hoisted(() => ({ createCollection: vi.fn(), orderCollections: vi.fn(), push: vi.fn() }));
vi.mock('@/lib/backend/catalog/actions', () => ({ createCollection, orderCollections }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }), unstable_rethrow: vi.fn() }));

import { CollectionList } from './CollectionList';

const list = [
  { id: 'c1', name: 'Autumn', status: 'active' as const, productCount: 3 },
  { id: 'c2', name: 'Gifts', status: 'draft' as const, productCount: 1 },
];

beforeEach(() => vi.clearAllMocks());

describe('CollectionList', () => {
  it('lists collections with counts, status and an edit link', () => {
    render(<CollectionList collections={list} />);
    expect(screen.getByText('3 products')).toBeInTheDocument();
    expect(screen.getByText('1 product')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Edit Autumn' })).toHaveAttribute('href', '/manage/collections/c1');
  });
  it('adds a collection and opens it', async () => {
    createCollection.mockResolvedValue({ ok: true, id: 'c3' });
    render(<CollectionList collections={list} />);
    fireEvent.change(screen.getByLabelText('New collection name'), { target: { value: 'Spring' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add collection' }));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/manage/collections/c3'));
  });
  it('shows why a collection couldn’t be added', async () => {
    createCollection.mockResolvedValue({ ok: false, error: 'Give the collection a name.' });
    render(<CollectionList collections={list} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add collection' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Give the collection a name.');
  });
  it('moves a collection and saves the order, putting it back if saving fails', async () => {
    orderCollections.mockResolvedValueOnce({ ok: true }).mockResolvedValueOnce({ ok: false, error: 'The new order couldn’t be saved. Try again.' });
    render(<CollectionList collections={list} />);
    fireEvent.click(screen.getByRole('button', { name: 'Move Gifts up' }));
    await waitFor(() => expect(orderCollections).toHaveBeenCalledWith(['c2', 'c1']));
    fireEvent.click(screen.getByRole('button', { name: 'Move Gifts down' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('The new order couldn’t be saved. Try again.');
    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent('Gifts');
  });
  it('says when there are none yet', () => {
    render(<CollectionList collections={[]} />);
    expect(screen.getByText('No collections yet. Collections group products on your shop, like “Autumn” or “Gifts under $30”.')).toBeInTheDocument();
  });
});
```

`app/manage/collections/[id]/CollectionEditor.test.tsx`:
```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { ProductRowView } from '@/lib/backend/catalog/queries';

const { saveCollection, refresh } = vi.hoisted(() => ({ saveCollection: vi.fn(), refresh: vi.fn() }));
vi.mock('@/lib/backend/catalog/actions', () => ({ saveCollection }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }), unstable_rethrow: vi.fn() }));

import { CollectionEditor } from './CollectionEditor';

const product = (id: string, name: string, photo: string | null = null): ProductRowView => ({
  id, name, status: 'active', priceLabel: '$1', stockLabel: '', soldOut: false, photoUrl: photo === null ? null : `https://x/${photo}.webp`, photoUploadId: photo, collectionIds: [],
});
const products = [product('l1', 'Fig Candle', 'u1'), product('l2', 'Pine Soap', 'u2'), product('l3', 'Mug')];
const initial = { id: 'c1', name: 'Autumn', description: '', status: 'draft' as const, featuredImageId: null, productIds: ['l1'] };

beforeEach(() => vi.clearAllMocks());

describe('CollectionEditor', () => {
  it('adds, orders and removes products, then saves', async () => {
    saveCollection.mockResolvedValue({ ok: true, id: 'c1' });
    render(<CollectionEditor initial={initial} products={products} />);
    fireEvent.click(screen.getByRole('button', { name: 'Pine Soap' }));
    fireEvent.click(screen.getByRole('button', { name: 'Move Pine Soap up' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(saveCollection).toHaveBeenCalledWith(expect.objectContaining({ productIds: ['l2', 'l1'] })));
    expect(await screen.findByRole('status')).toHaveTextContent('Saved.');
    fireEvent.click(screen.getByRole('button', { name: 'Remove Fig Candle from this collection' }));
    expect(screen.queryByRole('button', { name: 'Move Fig Candle up' })).toBeNull();
  });
  it('chooses a cover from the products’ photos, or the automatic one', async () => {
    saveCollection.mockResolvedValue({ ok: true, id: 'c1' });
    render(<CollectionEditor initial={initial} products={products} />);
    expect(screen.getByLabelText('First product’s photo (automatic)')).toBeChecked();
    fireEvent.click(screen.getByLabelText('Fig Candle’s photo'));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(saveCollection).toHaveBeenCalledWith(expect.objectContaining({ featuredImageId: 'u1' })));
  });
  it('shows the validation message and the server’s', async () => {
    render(<CollectionEditor initial={{ ...initial, name: '' }} products={products} />);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Give the collection a name.');
    expect(saveCollection).not.toHaveBeenCalled();
  });
  it('archives after a second confirmation', async () => {
    saveCollection.mockResolvedValue({ ok: true, id: 'c1' });
    render(<CollectionEditor initial={{ ...initial, status: 'active' }} products={products} />);
    fireEvent.click(screen.getByRole('button', { name: 'Archive' }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes, archive it' }));
    await waitFor(() => expect(saveCollection).toHaveBeenCalledWith(expect.objectContaining({ status: 'archived' })));
  });
});
```

- [ ] **Step 2: Run to see them fail**

Run: `npx vitest run app/manage/collections`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement**

`app/manage/collections/CollectionList.tsx`:
```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, unstable_rethrow } from 'next/navigation';
import { createCollection, orderCollections } from '@/lib/backend/catalog/actions';
import { moveItem } from '@/lib/backend/catalog/collection-form';
import type { CollectionRowView } from '@/lib/backend/catalog/queries';

const STATUS_LABEL = { active: 'Live', draft: 'Draft', archived: 'Archived' } as const;
const FAILED = 'Something went wrong. Check your connection and try again.';

export function CollectionList({ collections }: { collections: CollectionRowView[] }): React.ReactElement {
  const router = useRouter();
  const [list, setList] = useState(collections);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function add(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const r = await createCollection(name);
      if (r.ok) router.push(`/manage/collections/${r.id}`);
      else setError(r.error);
    } catch (err) {
      unstable_rethrow(err);
      setError(FAILED);
    } finally {
      setBusy(false);
    }
  }

  async function move(index: number, delta: -1 | 1): Promise<void> {
    const before = list;
    const next = moveItem(list, index, delta);
    setList(next);
    setError('');
    try {
      const r = await orderCollections(next.map((c) => c.id));
      if (!r.ok) {
        setList(before);
        setError(r.error);
      }
    } catch (err) {
      unstable_rethrow(err);
      setList(before);
      setError(FAILED);
    }
  }

  return (
    <>
      {error !== '' && <p role="alert" className="bk-notice">{error}</p>}
      <form className="bk-section bk-row" onSubmit={(e) => void add(e)}>
        <div className="bk-field">
          <label htmlFor="new-collection" className="bk-label">New collection name</label>
          <input id="new-collection" className="bk-input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <button type="submit" className="bk-btn" disabled={busy}>Add collection</button>
      </form>
      {list.length === 0 ? (
        <p className="bk-note">No collections yet. Collections group products on your shop, like “Autumn” or “Gifts under $30”.</p>
      ) : (
        <ul className="bk-list">
          {list.map((c, i) => (
            <li key={c.id} className="bk-list-item">
              <span className="bk-list-name">{c.name}</span>
              <span className="bk-note">{`${c.productCount} ${c.productCount === 1 ? 'product' : 'products'}`}</span>
              <span className="bk-pill" data-status={c.status}>{STATUS_LABEL[c.status]}</span>
              <span className="bk-row">
                <button type="button" className="bk-btn bk-btn-quiet bk-btn-small" disabled={i === 0} aria-label={`Move ${c.name} up`} onClick={() => void move(i, -1)}>↑</button>
                <button type="button" className="bk-btn bk-btn-quiet bk-btn-small" disabled={i === list.length - 1} aria-label={`Move ${c.name} down`} onClick={() => void move(i, 1)}>↓</button>
                <Link href={`/manage/collections/${c.id}`} className="bk-btn bk-btn-quiet bk-btn-small" aria-label={`Edit ${c.name}`}>Edit</Link>
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
```

`app/manage/collections/page.tsx`:
```tsx
import { notFound } from 'next/navigation';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { listCollections } from '@/lib/backend/catalog/queries';
import { CollectionList } from './CollectionList';

export const dynamic = 'force-dynamic';

export default async function CollectionsPage(): Promise<React.ReactElement> {
  const { site } = await requireActingSite();
  if (!(await getSiteFeatures(site.tenantId)).has('catalog')) notFound();
  const collections = await listCollections(await createSupabaseServerClient(), site.tenantId);
  return (
    <>
      <div className="bk-head">
        <h1 className="bk-title">Collections</h1>
      </div>
      <main id="main" className="bk-content">
        <p className="bk-note">The order here is the order on your shop.</p>
        <CollectionList collections={collections} />
      </main>
    </>
  );
}
```

`app/manage/collections/[id]/CollectionEditor.tsx`:
```tsx
'use client';

import { useState } from 'react';
import { useRouter, unstable_rethrow } from 'next/navigation';
import { saveCollection } from '@/lib/backend/catalog/actions';
import { buildCollectionPayload, moveItem, type CollectionForm } from '@/lib/backend/catalog/collection-form';
import type { ItemStatus } from '@/lib/backend/catalog/product-form';
import type { ProductRowView } from '@/lib/backend/catalog/queries';
import { ConfirmButton } from '../../_components/ConfirmButton';

const FAILED = 'Something went wrong. Check your connection and try again.';
const STATUSES: { value: ItemStatus; label: string }[] = [
  { value: 'draft', label: 'Draft — only you can see it' },
  { value: 'active', label: 'Live on your shop' },
  { value: 'archived', label: 'Archived — hidden from the shop, kept here' },
];

export function CollectionEditor({ initial, products }: { initial: CollectionForm; products: ProductRowView[] }): React.ReactElement {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [busy, setBusy] = useState(false);

  const byId = new Map(products.map((p) => [p.id, p]));
  const inIt = form.productIds.map((id) => byId.get(id)).filter((p): p is ProductRowView => p !== undefined);
  const addable = products.filter((p) => p.status !== 'archived' && !form.productIds.includes(p.id));
  const covers = inIt.filter((p): p is ProductRowView & { photoUploadId: string; photoUrl: string } => p.photoUploadId !== null && p.photoUrl !== null);
  const update = (patch: Partial<CollectionForm>) => {
    setForm((f) => ({ ...f, ...patch }));
    setSaved('');
  };

  async function save(next: CollectionForm): Promise<void> {
    const check = buildCollectionPayload(next);
    if (!check.ok) {
      setError(check.error);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const r = await saveCollection(next);
      if (r.ok) {
        setForm(next);
        setSaved('Saved.');
        router.refresh();
      } else setError(r.error);
    } catch (err) {
      unstable_rethrow(err);
      setError(FAILED);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="bk-head">
        <h1 className="bk-title">{initial.name}</h1>
        <div className="bk-head-actions">
          {form.status !== 'archived' && <ConfirmButton label="Archive" confirmLabel="Yes, archive it" disabled={busy} onConfirm={() => void save({ ...form, status: 'archived' })} />}
          <button type="button" className="bk-btn" disabled={busy} onClick={() => void save(form)}>{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
      <main id="main" className="bk-content">
        {error !== '' && <p role="alert" className="bk-notice">{error}</p>}
        {saved !== '' && <p role="status" className="bk-notice" data-tone="ok">{saved}</p>}

        <section className="bk-section" aria-labelledby="c-basics">
          <h2 id="c-basics" className="bk-section-title">The basics</h2>
          <div className="bk-field">
            <label htmlFor="c-name" className="bk-label">Name</label>
            <input id="c-name" className="bk-input" value={form.name} onChange={(e) => update({ name: e.target.value })} />
          </div>
          <div className="bk-field">
            <label htmlFor="c-desc" className="bk-label">Short description</label>
            <textarea id="c-desc" className="bk-input bk-textarea" value={form.description} onChange={(e) => update({ description: e.target.value })} />
          </div>
        </section>

        <section className="bk-section" aria-labelledby="c-products">
          <h2 id="c-products" className="bk-section-title">Products in this collection</h2>
          {inIt.length === 0 ? (
            <p className="bk-note">No products yet. Add some below.</p>
          ) : (
            <ul className="bk-list">
              {inIt.map((p, i) => (
                <li key={p.id} className="bk-list-item">
                  {p.photoUrl !== null ? <img src={p.photoUrl} alt="" className="bk-thumb" /> : <span className="bk-thumb bk-thumb-empty">No photo</span>}
                  <span className="bk-list-name">{p.name}</span>
                  <span className="bk-row">
                    <button type="button" className="bk-btn bk-btn-quiet bk-btn-small" disabled={i === 0} aria-label={`Move ${p.name} up`} onClick={() => update({ productIds: moveItem(form.productIds, form.productIds.indexOf(p.id), -1) })}>↑</button>
                    <button type="button" className="bk-btn bk-btn-quiet bk-btn-small" disabled={i === inIt.length - 1} aria-label={`Move ${p.name} down`} onClick={() => update({ productIds: moveItem(form.productIds, form.productIds.indexOf(p.id), 1) })}>↓</button>
                    <button type="button" className="bk-btn bk-btn-danger bk-btn-small" aria-label={`Remove ${p.name} from this collection`} onClick={() => update({ productIds: form.productIds.filter((x) => x !== p.id) })}>Remove</button>
                  </span>
                </li>
              ))}
            </ul>
          )}
          {addable.length > 0 && (
            <>
              <p className="bk-label">Add products</p>
              <div className="bk-picker">
                {addable.map((p) => (
                  <button key={p.id} type="button" className="bk-pick" aria-pressed="false" onClick={() => update({ productIds: [...form.productIds, p.id] })}>
                    {p.photoUrl !== null ? <img src={p.photoUrl} alt="" /> : <span className="bk-thumb-empty">No photo</span>}
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </section>

        <section className="bk-section" aria-labelledby="c-cover">
          <h2 id="c-cover" className="bk-section-title">Cover photo</h2>
          <div className="bk-checks">
            <label className="bk-check">
              <input type="radio" name="cover" checked={form.featuredImageId === null} onChange={() => update({ featuredImageId: null })} />
              First product’s photo (automatic)
            </label>
            {covers.map((p) => (
              <label key={p.id} className="bk-check">
                <input type="radio" name="cover" checked={form.featuredImageId === p.photoUploadId} onChange={() => update({ featuredImageId: p.photoUploadId })} />
                <img src={p.photoUrl} alt="" className="bk-thumb" />
                {`${p.name}’s photo`}
              </label>
            ))}
            {form.featuredImageId !== null && !covers.some((p) => p.photoUploadId === form.featuredImageId) && (
              <label className="bk-check">
                <input type="radio" name="cover" checked readOnly />
                The cover photo chosen before
              </label>
            )}
          </div>
        </section>

        <section className="bk-section" aria-labelledby="c-status">
          <h2 id="c-status" className="bk-section-title">Status</h2>
          <div className="bk-checks">
            {STATUSES.map((s) => (
              <label key={s.value} className="bk-check">
                <input type="radio" name="c-status" checked={form.status === s.value} onChange={() => update({ status: s.value })} />
                {s.label}
              </label>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
```

`app/manage/collections/[id]/page.tsx`:
```tsx
import { notFound } from 'next/navigation';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getCollection, listProducts } from '@/lib/backend/catalog/queries';
import { CollectionEditor } from './CollectionEditor';

export const dynamic = 'force-dynamic';

export default async function EditCollectionPage({ params }: { params: Promise<{ id: string }> }): Promise<React.ReactElement> {
  const { id } = await params;
  const { site } = await requireActingSite();
  if (!(await getSiteFeatures(site.tenantId)).has('catalog')) notFound();
  const db = await createSupabaseServerClient();
  const [collection, products] = await Promise.all([getCollection(db, site.tenantId, id), listProducts(db, site.tenantId)]);
  if (collection === null) notFound();
  return <CollectionEditor key={id} initial={collection} products={products} />;
}
```

- [ ] **Step 4: Run to see them pass**

Run: `npx vitest run app/manage/collections`
Expected: PASS.

- [ ] **Step 5: Typecheck, lint, commit**

```bash
npm run typecheck
npx eslint app/manage/collections
git add app/manage/collections
git commit -m "feat(catalog): collections list (add, order) and editor (products, cover, status)"
```

---
## Task 13: Storefront projection — every photo, options, offers, sold out, collections

**Files:**
- Modify: `lib/archetypes/content.ts`
- Rewrite: `lib/storefront/catalog.ts`
- Rewrite: `lib/storefront/catalog.test.ts`

The shop reads with the service role (`supabaseAdmin()`) and filters explicitly, as today. Draft and archived products, combinations and collections never reach a shopper: listings and collections are filtered on `status = 'active'`, combinations on `status = 'active'`, and collection membership only resolves to products already in the active catalog. A failed read now throws (the Next error page) instead of silently showing an empty or wrongly-priced shop.

- [ ] **Step 1: Extend the renderer's product shape**

In `lib/archetypes/content.ts`, add above `ProductView`:
```ts
/** One buyable combination of a product's options, as the shop shows it. */
export interface ProductOffer {
  /** Option name → chosen value, e.g. { Size: 'Large', Scent: 'Fig' }. */
  choices: Record<string, string>;
  /** Formatted price for this combination. */
  price: string;
  soldOut: boolean;
}
```
and add two optional fields to `ProductView` (after `variations`):
```ts
  /** Buyable combinations, present when the product has options. */
  offers?: ProductOffer[];
  /** True when combinations differ in price; `price` is then the lowest. */
  priceFrom?: boolean;
```

- [ ] **Step 2: Write the failing tests**

Replace `lib/storefront/catalog.test.ts` with:
```ts
import { describe, it, expect, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import {
  formatPrice,
  imageUrlFromMetadata,
  resolveMediaMap,
  mediaForListing,
  toProductView,
  loadMediaMap,
  loadCatalog,
  loadCollections,
  loadProduct,
  type ListingRow,
  type AttributeRow,
  type VariantRow,
} from './catalog';

const row = (over: Partial<ListingRow> = {}): ListingRow => ({
  id: 'l1',
  slug: 'fig',
  name: 'Fig Candle',
  listing_type: 'product',
  base_price_cents: 2400,
  short_description: 'Figs',
  description: 'Long',
  metadata: {},
  media_ids: ['u1', 'u2'],
  inventory_count: null,
  is_preview: false,
  ...over,
});
const media = resolveMediaMap([
  { id: 'u1', public_url: 'https://x/1.webp', alt_text: null },
  { id: 'u2', public_url: 'https://x/2.webp', alt_text: 'Side' },
]);
const sizeAttr: AttributeRow = { listing_id: 'l1', name: 'Size', position: 0, variation_options: [{ value: 'Large', position: 1 }, { value: 'Small', position: 0 }] };
const variant = (choices: Record<string, string>, price: number | null, stock: number | null): VariantRow => ({ listing_id: 'l1', option_combination: choices, price_cents: price, inventory_count: stock });

describe('small helpers', () => {
  it('formats prices the long-standing way', () => {
    expect(formatPrice(2400)).toBe('$24');
    expect(formatPrice(2450)).toBe('$24.50');
  });
  it('reads the legacy metadata photo', () => {
    expect(imageUrlFromMetadata({ image_url: 'https://x/a.jpg' })).toBe('https://x/a.jpg');
    expect(imageUrlFromMetadata(null)).toBeUndefined();
    expect(imageUrlFromMetadata({ image_url: '' })).toBeUndefined();
  });
  it('skips uploads with no url', () => {
    expect(resolveMediaMap([{ id: 'a', public_url: null, alt_text: null }, { id: 'b', public_url: '', alt_text: null }]).size).toBe(0);
  });
});

describe('mediaForListing', () => {
  it('returns every uploaded photo in the maker’s order, alt falling back to the name', () => {
    expect(mediaForListing(row(), media)).toEqual([
      { kind: 'image', url: 'https://x/1.webp', alt: 'Fig Candle' },
      { kind: 'image', url: 'https://x/2.webp', alt: 'Side' },
    ]);
  });
  it('falls back to the legacy metadata photo, then to nothing', () => {
    expect(mediaForListing(row({ media_ids: [], metadata: { image_url: 'https://x/m.jpg' } }), media)).toEqual([{ kind: 'image', url: 'https://x/m.jpg', alt: 'Fig Candle' }]);
    expect(mediaForListing(row({ media_ids: null }), media)).toEqual([]);
  });
});

describe('toProductView', () => {
  it('projects a product without options', () => {
    expect(toProductView(row(), [], [], media)).toEqual({
      slug: 'fig',
      name: 'Fig Candle',
      price: '$24',
      shortDescription: 'Figs',
      description: 'Long',
      status: 'active',
      media: mediaForListing(row(), media),
      variations: [],
    });
  });
  it('is sold out when its stock is 0, not when it is blank', () => {
    expect(toProductView(row({ inventory_count: 0 }), [], [], media).status).toBe('sold_out');
    expect(toProductView(row({ inventory_count: null }), [], [], media).status).toBe('active');
  });
  it('lists options in order and each available combination with its own price', () => {
    const view = toProductView(row(), [sizeAttr], [variant({ Size: 'Large' }, 3000, null), variant({ Size: 'Small' }, null, 2)], media);
    expect(view.variations).toEqual([{ name: 'Size', options: ['Small', 'Large'] }]);
    expect(view.offers).toEqual([
      { choices: { Size: 'Small' }, price: '$24', soldOut: false },
      { choices: { Size: 'Large' }, price: '$30', soldOut: false },
    ]);
    expect(view.price).toBe('$24');
    expect(view.priceFrom).toBe(true);
    expect(view.status).toBe('active');
  });
  it('prices "from" the cheapest combination that can still be bought', () => {
    const view = toProductView(row(), [sizeAttr], [variant({ Size: 'Small' }, null, 0), variant({ Size: 'Large' }, 3000, null)], media);
    expect(view.price).toBe('$30');
    expect(view.priceFrom).toBeUndefined();
  });
  it('is sold out when every combination is, or none is available', () => {
    expect(toProductView(row(), [sizeAttr], [variant({ Size: 'Small' }, null, 0)], media).status).toBe('sold_out');
    expect(toProductView(row(), [sizeAttr], [], media)).toMatchObject({ status: 'sold_out', offers: [] });
  });
  it('ignores combinations that no longer match the options', () => {
    const view = toProductView(row(), [sizeAttr], [variant({ Colour: 'Red' }, 100, null), variant({ Size: 'Small' }, null, null)], media);
    expect(view.offers).toEqual([{ choices: { Size: 'Small' }, price: '$24', soldOut: false }]);
  });
});

/** A fake Supabase client: each table returns its canned rows, and every query records its calls. */
function fakeDb(tables: Record<string, unknown[]>, failing: string[] = []) {
  const calls: { table: string; method: string; args: unknown[] }[] = [];
  const from = vi.fn((table: string) => {
    const result = failing.includes(table) ? { data: null, error: { message: 'down' } } : { data: tables[table] ?? [], error: null };
    const q: Record<string, unknown> = {};
    for (const m of ['select', 'eq', 'in', 'is', 'order']) {
      q[m] = (...args: unknown[]) => {
        calls.push({ table, method: m, args });
        return q;
      };
    }
    q['maybeSingle'] = async () => ({ data: (result.data as unknown[] | null)?.[0] ?? null, error: result.error });
    q['then'] = (resolve: (v: unknown) => unknown) => resolve(result);
    return q;
  });
  return { db: { from } as unknown as SupabaseClient<Database>, calls, from };
}

describe('loadMediaMap', () => {
  it('does not query when there are no ids', async () => {
    const { db, from } = fakeDb({});
    expect((await loadMediaMap(db, [])).size).toBe(0);
    expect(from).not.toHaveBeenCalled();
  });
});

describe('loadCatalog', () => {
  it('loads live products of both kinds, with their options and live combinations', async () => {
    const { db, calls } = fakeDb({
      listings: [row()],
      uploads: [{ id: 'u1', public_url: 'https://x/1.webp', alt_text: null }],
      variation_attributes: [sizeAttr],
      listing_variants: [variant({ Size: 'Small' }, null, null)],
    });
    const catalog = await loadCatalog(db, 't1');
    expect(catalog.products.map((p) => p.slug)).toEqual(['fig']);
    expect(catalog.byId.get('l1')?.offers).toHaveLength(1);
    expect(calls).toContainEqual({ table: 'listings', method: 'in', args: ['listing_type', ['product', 'digital_product']] });
    expect(calls).toContainEqual({ table: 'listings', method: 'eq', args: ['status', 'active'] });
    expect(calls).toContainEqual({ table: 'listing_variants', method: 'eq', args: ['status', 'active'] });
  });
  it('skips the detail queries for an empty shop', async () => {
    const { db, from } = fakeDb({ listings: [] });
    expect((await loadCatalog(db, 't1')).products).toEqual([]);
    expect(from).toHaveBeenCalledTimes(1);
  });
  it('throws rather than show a wrong shop when a read fails', async () => {
    await expect(loadCatalog(fakeDb({ listings: [row()] }, ['listing_variants']).db, 't1')).rejects.toThrow('Could not load');
    await expect(loadCatalog(fakeDb({}, ['listings']).db, 't1')).rejects.toThrow('Could not load');
  });
});

describe('loadCollections', () => {
  it('orders products as the maker did, counts only live ones, and uses the chosen cover', async () => {
    const { db } = fakeDb({
      listings: [row(), row({ id: 'l2', slug: 'pine', name: 'Pine' })],
      uploads: [{ id: 'u1', public_url: 'https://x/1.webp', alt_text: null }, { id: 'cov', public_url: 'https://x/cover.webp', alt_text: null }],
      collections: [
        { id: 'c1', slug: 'autumn', name: 'Autumn', featured_image_id: 'cov', listing_collections: [{ listing_id: 'l2', position: 0 }, { listing_id: 'gone', position: 1 }, { listing_id: 'l1', position: 2 }] },
        { id: 'c2', slug: 'gifts', name: 'Gifts', featured_image_id: null, listing_collections: [{ listing_id: 'l1', position: 0 }] },
      ],
    });
    const catalog = await loadCatalog(db, 't1');
    const collections = await loadCollections(db, 't1', catalog);
    expect(collections[0]!.products.map((p) => p.slug)).toEqual(['pine', 'fig']);
    expect(collections[0]!.view).toEqual({ slug: 'autumn', name: 'Autumn', count: 2, cover: { kind: 'image', url: 'https://x/cover.webp', alt: 'Autumn' } });
    expect(collections[1]!.view.cover).toEqual({ kind: 'image', url: 'https://x/1.webp', alt: 'Fig Candle' });
  });
});

describe('loadProduct', () => {
  it('loads one live product with its lowest price and preview flag', async () => {
    const { db } = fakeDb({ listings: [row({ is_preview: true })], variation_attributes: [], listing_variants: [] });
    const result = await loadProduct(db, 't1', 'fig');
    expect(result).toMatchObject({ isPreview: true, priceCents: 2400, view: { slug: 'fig', price: '$24' } });
  });
  it('is null when there is no such live product', async () => {
    expect(await loadProduct(fakeDb({ listings: [] }).db, 't1', 'nope')).toBeNull();
  });
});
```

- [ ] **Step 3: Run to see it fail**

Run: `npx vitest run lib/storefront/catalog.test.ts`
Expected: FAIL — `toProductView`, `loadCollections`, `loadProduct` not exported.

- [ ] **Step 4: Rewrite `lib/storefront/catalog.ts`**

```ts
/**
 * Shared catalog projection — the ONE place catalog rows become what a shopper sees
 * (spec piece 1 §7). Every storefront read (home, /shop, collections, product page)
 * goes through here, so the rules can't drift:
 *   - only live products, live combinations and live collections render;
 *   - every photo in the maker's order (uploads), legacy metadata photo as fallback;
 *   - options and each buyable combination with its own price (lib/catalog/price);
 *   - sold out when stock is 0 (lib/catalog/stock);
 *   - collections read from listing_collections, in the maker's order.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/lib/database.types';
import type { ProductView, CatalogMedia, CollectionView, CatalogVariation, ProductOffer } from '@/lib/archetypes/content';
import { effectivePriceCents, priceRange } from '@/lib/catalog/price';
import { isStockSoldOut } from '@/lib/catalog/stock';
import { combinationsOf, combinationKey } from '@/lib/catalog/combinations';

type Db = SupabaseClient<Database>;

/** The listing columns the projection reads. */
export interface ListingRow {
  id: string;
  slug: string;
  name: string;
  listing_type: string;
  base_price_cents: number;
  short_description: string | null;
  description: string | null;
  metadata: Json;
  media_ids: string[] | null;
  inventory_count: number | null;
  is_preview: boolean;
}

export interface AttributeRow {
  listing_id: string;
  name: string;
  position: number;
  variation_options: { value: string; position: number }[];
}

export interface VariantRow {
  listing_id: string;
  option_combination: Json;
  price_cents: number | null;
  inventory_count: number | null;
}

/** An uploads row as the projection reads it. */
export interface UploadRow {
  id: string;
  public_url: string | null;
  alt_text: string | null;
}

/** id → the resolved media for that upload (url + optional alt). */
export type MediaMap = Map<string, { url: string; alt: string | null }>;

export interface Catalog {
  products: ProductView[];
  byId: Map<string, ProductView>;
}

export interface StoreCollection {
  id: string;
  slug: string;
  view: CollectionView;
  /** Live products in the maker's order. */
  products: ProductView[];
}

const LISTING_COLUMNS = 'id, slug, name, listing_type, base_price_cents, short_description, description, metadata, media_ids, inventory_count, is_preview';
const PRODUCT_TYPES = ['product', 'digital_product'];

/** Format cents to a display price ("$24", "$24.50"). */
export function formatPrice(cents: number): string {
  const dollars = cents / 100;
  return Number.isInteger(dollars) ? `$${dollars}` : `$${dollars.toFixed(2)}`;
}

/** Read `image_url` from a listings.metadata JSONB blob (the legacy placeholder path). */
export function imageUrlFromMetadata(m: Json): string | undefined {
  if (m === null || typeof m !== 'object' || Array.isArray(m)) return undefined;
  const url = (m as Record<string, unknown>)['image_url'];
  return typeof url === 'string' && url.length > 0 ? url : undefined;
}

/** Build the id → media lookup from a set of uploads rows (only those with a url). */
export function resolveMediaMap(uploads: readonly UploadRow[]): MediaMap {
  const map: MediaMap = new Map();
  for (const u of uploads) {
    if (typeof u.public_url === 'string' && u.public_url.length > 0) map.set(u.id, { url: u.public_url, alt: u.alt_text });
  }
  return map;
}

/** Every uploaded photo a listing references, in order; else the legacy metadata photo; else nothing. */
export function mediaForListing(row: Pick<ListingRow, 'name' | 'media_ids' | 'metadata'>, mediaMap: MediaMap): CatalogMedia[] {
  const resolved = (row.media_ids ?? []).flatMap((id): CatalogMedia[] => {
    const hit = mediaMap.get(id);
    return hit === undefined ? [] : [{ kind: 'image', url: hit.url, alt: hit.alt ?? row.name }];
  });
  if (resolved.length > 0) return resolved;
  const legacy = imageUrlFromMetadata(row.metadata);
  return legacy !== undefined ? [{ kind: 'image', url: legacy, alt: row.name }] : [];
}

function asCombination(json: Json): Record<string, string> | null {
  if (json === null || typeof json !== 'object' || Array.isArray(json)) return null;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(json)) {
    if (typeof v !== 'string') return null;
    out[k] = v;
  }
  return out;
}

const byPosition = <T extends { position: number }>(a: T, b: T): number => a.position - b.position;

/** Project one listing (+ its options and live combinations) to a ProductView, with its lowest price in cents. */
function buildProduct(row: ListingRow, attributes: readonly AttributeRow[], variants: readonly VariantRow[], mediaMap: MediaMap): { view: ProductView; minPriceCents: number } {
  const variations: CatalogVariation[] = [...attributes].sort(byPosition).map((a) => ({ name: a.name, options: [...a.variation_options].sort(byPosition).map((o) => o.value) }));
  const base = {
    slug: row.slug,
    name: row.name,
    ...(row.short_description ? { shortDescription: row.short_description } : {}),
    description: row.description ?? '',
    media: mediaForListing(row, mediaMap),
    variations,
  };
  const product = { basePriceCents: row.base_price_cents };

  if (variations.length === 0) {
    return {
      view: { ...base, price: formatPrice(row.base_price_cents), status: isStockSoldOut(row.inventory_count) ? 'sold_out' : 'active' },
      minPriceCents: row.base_price_cents,
    };
  }

  const byKey = new Map<string, VariantRow>();
  for (const v of variants) {
    const c = asCombination(v.option_combination);
    if (c !== null) byKey.set(combinationKey(c), v);
  }
  const offers: ProductOffer[] = [];
  const buyable: { priceCents: number | null }[] = [];
  const all: { priceCents: number | null }[] = [];
  for (const choices of combinationsOf(variations.map((v) => ({ name: v.name, choices: v.options })))) {
    const v = byKey.get(combinationKey(choices));
    if (v === undefined) continue;
    const soldOut = isStockSoldOut(v.inventory_count);
    offers.push({ choices, price: formatPrice(effectivePriceCents(product, { priceCents: v.price_cents })), soldOut });
    all.push({ priceCents: v.price_cents });
    if (!soldOut) buyable.push({ priceCents: v.price_cents });
  }
  const { min, max } = priceRange(product, buyable.length > 0 ? buyable : all);
  return {
    view: {
      ...base,
      price: formatPrice(min),
      ...(min !== max ? { priceFrom: true } : {}),
      status: buyable.length === 0 ? 'sold_out' : 'active',
      offers,
    },
    minPriceCents: min,
  };
}

export function toProductView(row: ListingRow, attributes: readonly AttributeRow[], variants: readonly VariantRow[], mediaMap: MediaMap): ProductView {
  return buildProduct(row, attributes, variants, mediaMap).view;
}

/** Batch-load the media map for a set of upload ids (empty when none). */
export async function loadMediaMap(db: Db, ids: readonly string[]): Promise<MediaMap> {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return new Map();
  const { data, error } = await db.from('uploads').select('id, public_url, alt_text').in('id', unique).is('deleted_at', null);
  if (error !== null) throw new Error(`Could not load photos: ${error.message}`);
  return resolveMediaMap((data ?? []) as UploadRow[]);
}

/** Options and live combinations for a set of listings, grouped by listing. */
async function loadDetails(db: Db, ids: readonly string[]): Promise<{ attributes: Map<string, AttributeRow[]>; variants: Map<string, VariantRow[]> }> {
  const attributes = new Map<string, AttributeRow[]>();
  const variants = new Map<string, VariantRow[]>();
  if (ids.length === 0) return { attributes, variants };
  const [a, v] = await Promise.all([
    db.from('variation_attributes').select('listing_id, name, position, variation_options(value, position)').in('listing_id', [...ids]),
    db.from('listing_variants').select('listing_id, option_combination, price_cents, inventory_count').in('listing_id', [...ids]).eq('status', 'active'),
  ]);
  if (a.error !== null) throw new Error(`Could not load product options: ${a.error.message}`);
  if (v.error !== null) throw new Error(`Could not load product combinations: ${v.error.message}`);
  for (const row of (a.data ?? []) as AttributeRow[]) attributes.set(row.listing_id, [...(attributes.get(row.listing_id) ?? []), row]);
  for (const row of (v.data ?? []) as VariantRow[]) variants.set(row.listing_id, [...(variants.get(row.listing_id) ?? []), row]);
  return { attributes, variants };
}

/** A shop's live catalog, oldest first (the order shoppers have always seen). */
export async function loadCatalog(db: Db, tenantId: string): Promise<Catalog> {
  const { data, error } = await db
    .from('listings')
    .select(LISTING_COLUMNS)
    .eq('tenant_id', tenantId)
    .in('listing_type', PRODUCT_TYPES)
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('created_at', { ascending: true });
  if (error !== null) throw new Error(`Could not load products: ${error.message}`);
  const rows = (data ?? []) as ListingRow[];
  if (rows.length === 0) return { products: [], byId: new Map() };

  const [mediaMap, details] = await Promise.all([loadMediaMap(db, rows.flatMap((r) => r.media_ids ?? [])), loadDetails(db, rows.map((r) => r.id))]);
  const byId = new Map<string, ProductView>();
  const products = rows.map((r) => {
    const view = toProductView(r, details.attributes.get(r.id) ?? [], details.variants.get(r.id) ?? [], mediaMap);
    byId.set(r.id, view);
    return view;
  });
  return { products, byId };
}

type CollectionRow = { id: string; slug: string; name: string; featured_image_id: string | null; listing_collections: { listing_id: string; position: number }[] };

/** A shop's live collections in the maker's order, each with its live products in order. */
export async function loadCollections(db: Db, tenantId: string, catalog: Catalog): Promise<StoreCollection[]> {
  const { data, error } = await db
    .from('collections')
    .select('id, slug, name, featured_image_id, listing_collections(listing_id, position)')
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('position', { ascending: true });
  if (error !== null) throw new Error(`Could not load collections: ${error.message}`);
  const rows = (data ?? []) as CollectionRow[];
  const covers = await loadMediaMap(db, rows.flatMap((c) => (c.featured_image_id === null ? [] : [c.featured_image_id])));
  return rows.map((c) => {
    const products = [...c.listing_collections]
      .sort(byPosition)
      .map((m) => catalog.byId.get(m.listing_id))
      .filter((p): p is ProductView => p !== undefined);
    const chosen = c.featured_image_id === null ? undefined : covers.get(c.featured_image_id);
    const cover: CatalogMedia | undefined = chosen !== undefined ? { kind: 'image', url: chosen.url, alt: chosen.alt ?? c.name } : products[0]?.media[0];
    return { id: c.id, slug: c.slug, view: { slug: c.slug, name: c.name, count: products.length, cover }, products };
  });
}

/** One live product by its web address, for the product page. */
export async function loadProduct(db: Db, tenantId: string, slug: string): Promise<{ view: ProductView; isPreview: boolean; priceCents: number } | null> {
  const { data, error } = await db
    .from('listings')
    .select(LISTING_COLUMNS)
    .eq('tenant_id', tenantId)
    .eq('slug', slug)
    .eq('status', 'active')
    .is('deleted_at', null)
    .maybeSingle();
  if (error !== null) throw new Error(`Could not load the product: ${error.message}`);
  if (data === null) return null;
  const row = data as ListingRow;
  const [mediaMap, details] = await Promise.all([loadMediaMap(db, row.media_ids ?? []), loadDetails(db, [row.id])]);
  const built = buildProduct(row, details.attributes.get(row.id) ?? [], details.variants.get(row.id) ?? [], mediaMap);
  return { view: built.view, isPreview: row.is_preview, priceCents: built.minPriceCents };
}
```

`loadProduct` keeps today's product page behaviour of not filtering on `listing_type` (the page has always shown any live listing by its address).

- [ ] **Step 5: Fix the one other user of the old exports**

`lib/listings/product-queries.ts` (the dormant walk) imports `resolveMediaMap`, `imageUrlFromMetadata`, `UploadRow` — all kept with the same signatures. Run:

Run: `npm run typecheck`
Expected: errors only in `app/storefront/_components/StorefrontPage.tsx` and `app/storefront/listings/[slug]/page.tsx` (fixed in Task 14). Nothing else.

- [ ] **Step 6: Run the projection tests**

Run: `npx vitest run lib/storefront/catalog.test.ts`
Expected: PASS.

Do not commit yet — the storefront doesn't compile until Task 14. Continue straight on.

---

## Task 14: Storefront pages use the new projection

**Files:**
- Modify: `app/storefront/_components/StorefrontPage.tsx`
- Modify: `app/storefront/listings/[slug]/page.tsx`
- Test: `app/storefront/listings/[slug]/page.test.tsx` (new), `app/storefront/_components/StorefrontPage.test.tsx` (extend)

- [ ] **Step 1: Write the failing tests**

`app/storefront/listings/[slug]/page.test.tsx`:
```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { loadProduct, renderArchetypeProductPage, tenantProductJsonLd, notFound } = vi.hoisted(() => ({
  loadProduct: vi.fn(),
  renderArchetypeProductPage: vi.fn(),
  tenantProductJsonLd: vi.fn(() => ({})),
  notFound: vi.fn(() => {
    throw new Error('NOT_FOUND');
  }),
}));
vi.mock('next/headers', () => ({ headers: async () => new Headers({ 'x-tenant-id': 't1' }) }));
vi.mock('next/navigation', () => ({ notFound }));
vi.mock('@/lib/supabase', () => ({ supabaseAdmin: () => ({}) }));
vi.mock('@/lib/storefront/catalog', () => ({ loadProduct }));
vi.mock('../../_components/StorefrontPage', () => ({ renderArchetypeProductPage }));
vi.mock('@/lib/storefront/metadata', () => ({ storefrontMetadata: vi.fn((m: unknown) => m), storefrontSeoFacts: async () => ({ shop: 'facts' }) }));
vi.mock('@/lib/storefront/seo', () => ({ tenantProductJsonLd }));

import StorefrontListingPage, { generateMetadata } from './page';

const view = { slug: 'fig', name: 'Fig Candle', price: '$24', description: 'Long', status: 'sold_out', media: [{ kind: 'image', url: 'https://x/1.webp', alt: 'Fig' }], variations: [] };
const props = { params: Promise.resolve({ slug: 'fig' }) };

beforeEach(() => {
  vi.clearAllMocks();
  renderArchetypeProductPage.mockResolvedValue('PAGE');
});

describe('product page', () => {
  it('renders the shop’s product and marks it out of stock for search engines when sold out', async () => {
    loadProduct.mockResolvedValue({ view, isPreview: false, priceCents: 2400 });
    await StorefrontListingPage(props);
    expect(renderArchetypeProductPage).toHaveBeenCalledWith('t1', view);
    expect(tenantProductJsonLd).toHaveBeenCalledWith({ shop: 'facts' }, expect.objectContaining({ priceCents: 2400, inStock: false, imageUrl: 'https://x/1.webp' }));
  });
  it('404s for a product that isn’t live', async () => {
    loadProduct.mockResolvedValue(null);
    await expect(StorefrontListingPage(props)).rejects.toThrow('NOT_FOUND');
  });
  it('shares the real photo', async () => {
    loadProduct.mockResolvedValue({ view, isPreview: false, priceCents: 2400 });
    expect(await generateMetadata(props)).toMatchObject({ pageName: 'Fig Candle', imageUrl: 'https://x/1.webp' });
  });
});
```

Add to `app/storefront/_components/StorefrontPage.test.tsx` a `describe('collections', …)` that mocks `@/lib/storefront/catalog` (`loadCatalog` → two products, `loadCollections` → one collection holding the second product) and asserts that rendering the `collection` page with that slug passes only that collection's products, in its order, to the archetype's `render`, and that an unknown slug calls `notFound`. Follow the file's existing mocking style for `archetypeSpec`/`render` (read the top of the file first; reuse its helpers rather than adding new ones).

- [ ] **Step 2: Run to see them fail**

Run: `npx vitest run app/storefront`
Expected: FAIL (`loadProduct` not used yet; collections not wired).

- [ ] **Step 3: Update `app/storefront/listings/[slug]/page.tsx`**

Replace the file with:
```tsx
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { renderArchetypeProductPage } from '../../_components/StorefrontPage';
import { storefrontMetadata, storefrontSeoFacts } from '@/lib/storefront/metadata';
import { tenantProductJsonLd } from '@/lib/storefront/seo';
import { loadProduct } from '@/lib/storefront/catalog';

interface ListingPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ListingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tenantId = (await headers()).get('x-tenant-id');
  if (tenantId === null) return {};
  const product = await loadProduct(supabaseAdmin(), tenantId, slug);
  if (product === null) return {};
  const desc = product.view.shortDescription ?? (product.view.description || undefined);
  const img = product.view.media[0]?.url;
  return storefrontMetadata({
    path: `/listings/${slug}`,
    pageName: product.view.name,
    ...(desc ? { description: desc } : {}),
    ...(img ? { imageUrl: img } : {}),
  });
}

export default async function StorefrontListingPage({ params }: ListingPageProps) {
  const { slug } = await params;
  const tenantId = (await headers()).get('x-tenant-id');
  if (tenantId === null) notFound();

  const product = await loadProduct(supabaseAdmin(), tenantId, slug);
  if (product === null) notFound();
  const { view } = product;

  // Product structured data, so search engines get rich-result data. A placeholder
  // or sold-out product is not in stock.
  const seoFacts = await storefrontSeoFacts();
  const productLd =
    seoFacts === null ? null : (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            tenantProductJsonLd(seoFacts, {
              name: view.name,
              slug: view.slug,
              description: view.shortDescription ?? (view.description || undefined),
              priceCents: product.priceCents,
              imageUrl: view.media[0]?.url,
              inStock: !product.isPreview && view.status !== 'sold_out',
            }),
          ),
        }}
      />
    );

  const page = await renderArchetypeProductPage(tenantId, view);
  if (page === null) notFound();
  return (
    <>
      {productLd}
      {page}
    </>
  );
}
```
Check `tenantProductJsonLd`'s parameter type in `lib/storefront/seo.ts`: if `imageUrl` / `description` are typed `string | undefined` under `exactOptionalPropertyTypes`, pass them as above; if they are optional properties, spread them conditionally the same way `generateMetadata` does.

- [ ] **Step 4: Update `app/storefront/_components/StorefrontPage.tsx`**

1. Replace the catalog import line with:
```ts
import { loadCatalog, loadCollections } from '@/lib/storefront/catalog';
```
2. Delete `buildCollectionViews` and the `CollectionRow` interface above it (their job moves to `loadCollections`). Keep `seedPreviewCollections`.
3. In `renderStore`, replace everything from `const { products, rows, mediaMap } = await loadCatalog(...)` down to the end of the collection-detail block with:
```ts
  // The live catalog through the shared projection (every photo, options, prices,
  // sold out), then the live collections in the maker's order (listing_collections).
  const catalog = await loadCatalog(supabaseAdmin(), tenantId);
  const products = catalog.products;
  const storeCollections = await loadCollections(supabaseAdmin(), tenantId, catalog);

  // Collections band data. When the store has none and ?collections= is set, seed
  // sample ones so every band is viewable. Absent → no Collections beat renders.
  let collections: CollectionView[] = storeCollections.map((c) => c.view);
  if (collections.length === 0 && previewCollections !== undefined && previewCollections !== '') {
    collections = seedPreviewCollections(products);
  }

  // Collection detail page: that collection's live products, in the maker's order.
  // If the slug names no live collection, 404.
  let effectiveProducts = products;
  if (page === 'collection' && collectionSlug !== undefined) {
    const collection = storeCollections.find((c) => c.slug === collectionSlug);
    if (collection === undefined) notFound();
    effectiveProducts = collection.products;
  }
```
4. Remove now-unused imports (`CatalogMedia`, `MediaMap`, `ListingRow`, `mediaForListing`) — `npx eslint` will name any left over. Keep `CollectionView` and `ProductView` imports used by `seedPreviewCollections`.

- [ ] **Step 5: Run the tests and typecheck**

Run: `npx vitest run app/storefront lib/storefront && npm run typecheck`
Expected: PASS, typecheck clean.

- [ ] **Step 6: Commit Tasks 13 and 14 together**

```bash
npx eslint lib/storefront app/storefront lib/archetypes/content.ts
git add lib/archetypes/content.ts lib/storefront app/storefront
git commit -m "feat(catalog): shop shows every photo, options, combination prices, sold out, and collections from listing_collections"
```

---

## Task 15: Main Street — price labels and the option picker

**Files:**
- Modify: `lib/archetypes/main-street/defaults.ts`
- Create: `lib/archetypes/main-street/price-label.ts`, `lib/archetypes/main-street/ProductOptions.tsx`
- Modify: `lib/archetypes/main-street/MainStreetProduct.tsx`, `lib/archetypes/main-street/chrome.tsx`
- Modify (price spots): `GoodsIndex.tsx:53`, `GoodsLookbook.tsx:55`, `GoodsModule.tsx:79`, `GoodsProcession.tsx:142`, `GoodsSlideshow.tsx:94`, `GoodsSwitcher.tsx:51` and `:72`, `GoodsTable.tsx:78`, `beats.tsx:110`, `pages.tsx:134` (all in `lib/archetypes/main-street/`)
- Test: `lib/archetypes/main-street/price-label.test.ts`, `lib/archetypes/main-street/ProductOptions.test.tsx`, extend `MainStreetProduct.test.tsx`

- [ ] **Step 1: Write the failing tests**

`lib/archetypes/main-street/price-label.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { priceLabel } from './price-label';
import { DEFAULT_COUNTS, DEFAULT_STRINGS } from './defaults';

describe('priceLabel', () => {
  it('is the price', () => {
    expect(priceLabel({ price: '$24', status: 'active' })).toBe('$24');
  });
  it('says "from" when combinations differ in price', () => {
    expect(priceLabel({ price: '$24', status: 'active', priceFrom: true })).toBe(DEFAULT_COUNTS.priceFrom('$24'));
    expect(DEFAULT_COUNTS.priceFrom('$24')).toBe('from $24');
  });
  it('says sold out instead of a price', () => {
    expect(priceLabel({ price: '$24', status: 'sold_out', priceFrom: true })).toBe(DEFAULT_STRINGS.productSoldOut);
  });
});
```

`lib/archetypes/main-street/ProductOptions.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductOptions, initialChoices } from './ProductOptions';
import { DEFAULT_STRINGS } from './defaults';
import type { CatalogVariation, ProductOffer } from '../content';

const variations: CatalogVariation[] = [{ name: 'Size', options: ['Small', 'Large'] }];
const offers: ProductOffer[] = [
  { choices: { Size: 'Small' }, price: '$24', soldOut: true },
  { choices: { Size: 'Large' }, price: '$30', soldOut: false },
];

describe('initialChoices', () => {
  it('starts on the first combination that can be bought', () => {
    expect(initialChoices(variations, offers)).toEqual({ Size: 'Large' });
  });
  it('falls back to the first choices when nothing is offered', () => {
    expect(initialChoices(variations, [])).toEqual({ Size: 'Small' });
  });
});

describe('ProductOptions', () => {
  it('shows the chosen combination’s price and whether it can be bought', () => {
    render(<ProductOptions variations={variations} offers={offers} fallbackPrice="$24" />);
    expect(screen.getByText('$30')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: DEFAULT_STRINGS.productAddToCart })).toBeEnabled();
    fireEvent.change(screen.getByLabelText('Size'), { target: { value: 'Small' } });
    expect(screen.getByText('$24')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: DEFAULT_STRINGS.productSoldOut })).toBeDisabled();
  });
  it('says a combination isn’t available when the maker turned it off', () => {
    render(<ProductOptions variations={[{ name: 'Size', options: ['Small', 'Large'] }]} offers={[offers[1]!]} fallbackPrice="$24" />);
    fireEvent.change(screen.getByLabelText('Size'), { target: { value: 'Small' } });
    expect(screen.getByRole('button', { name: DEFAULT_STRINGS.productUnavailable })).toBeDisabled();
    expect(screen.getByText('$24')).toBeInTheDocument();
  });
});
```

Add to `lib/archetypes/main-street/MainStreetProduct.test.tsx` (reuse the file's existing content/skin fixtures):
```tsx
it('shows the option picker for a product with options', () => {
  render(<MainStreetProduct content={content} skin={skin} product={{ ...product, variations: [{ name: 'Size', options: ['Small'] }], offers: [{ choices: { Size: 'Small' }, price: '$24', soldOut: false }] }} />);
  expect(screen.getByLabelText('Size')).toBeInTheDocument();
});
it('disables buying a sold-out product without options', () => {
  render(<MainStreetProduct content={content} skin={skin} product={{ ...product, status: 'sold_out', variations: [] }} />);
  expect(screen.getByRole('button', { name: DEFAULT_STRINGS.productSoldOut })).toBeDisabled();
});
```
(Use whatever names the file already gives its fixtures for `content`, `skin` and `product`.)

- [ ] **Step 2: Run to see them fail**

Run: `npx vitest run lib/archetypes/main-street/price-label.test.ts lib/archetypes/main-street/ProductOptions.test.tsx lib/archetypes/main-street/MainStreetProduct.test.tsx`
Expected: FAIL — modules/strings missing.

- [ ] **Step 3: Implement**

In `lib/archetypes/main-street/defaults.ts`:
- add to `DEFAULT_STRINGS` after `productSoldOut`: `productUnavailable: 'Not available',`
- add to `DEFAULT_COUNTS`:
```ts
  /** "from $24" — a product whose combinations differ in price. */
  priceFrom: (price: string): string => `from ${price}`,
```

`lib/archetypes/main-street/price-label.ts`:
```ts
/** What a card shows where the price goes (plan 1b decision 8): the price, "from"
 *  the lowest when combinations differ, or Sold out. One helper for every spot. */
import type { ProductView } from '../content';
import { DEFAULT_COUNTS, DEFAULT_STRINGS } from './defaults';

export function priceLabel(p: Pick<ProductView, 'price' | 'status' | 'priceFrom'>): string {
  if (p.status === 'sold_out') return DEFAULT_STRINGS.productSoldOut;
  return p.priceFrom === true ? DEFAULT_COUNTS.priceFrom(p.price) : p.price;
}
```

`lib/archetypes/main-street/ProductOptions.tsx`:
```tsx
'use client';

/**
 * The product page's option picker (spec piece 1 §7): one select per option, the
 * chosen combination's price, and a buy button that says Sold out / Not available
 * when it can't be bought. "Add to cart" itself stays unwired until piece 2.
 */
import { useState } from 'react';
import type { CatalogVariation, ProductOffer } from '../content';
import { combinationKey } from '@/lib/catalog/combinations';
import { Type } from './Type';
import { DEFAULT_STRINGS } from './defaults';

export function initialChoices(variations: readonly CatalogVariation[], offers: readonly ProductOffer[]): Record<string, string> {
  const start = offers.find((o) => !o.soldOut) ?? offers[0];
  if (start !== undefined) return { ...start.choices };
  return Object.fromEntries(variations.map((v) => [v.name, v.options[0] ?? '']));
}

export function ProductOptions({
  variations,
  offers,
  fallbackPrice,
}: {
  variations: CatalogVariation[];
  offers: ProductOffer[];
  fallbackPrice: string;
}) {
  const [choices, setChoices] = useState(() => initialChoices(variations, offers));
  const match = offers.find((o) => combinationKey(o.choices) === combinationKey(choices));
  const blocked = match === undefined || match.soldOut;
  const cta = match === undefined ? DEFAULT_STRINGS.productUnavailable : match.soldOut ? DEFAULT_STRINGS.productSoldOut : DEFAULT_STRINGS.productAddToCart;

  return (
    <>
      <Type as="div" role="title" className="ms-product-price">
        {match?.price ?? fallbackPrice}
      </Type>
      {variations.map((v, i) => (
        <div key={v.name} className="ms-product-var">
          <Type as="label" role="eyebrow" className="ms-product-var-lbl" htmlFor={`ms-opt-${i}`}>
            {v.name}
          </Type>
          <select
            id={`ms-opt-${i}`}
            className="ms-product-select"
            value={choices[v.name] ?? ''}
            onChange={(e) => setChoices((c) => ({ ...c, [v.name]: e.target.value }))}
          >
            {v.options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      ))}
      <div className="ms-product-buy">
        <Type as="button" role="navLabel" type="button" disabled={blocked} className="ms-product-cta" data-soldout={blocked ? 'true' : 'false'}>
          {cta}
        </Type>
      </div>
    </>
  );
}
```

In `lib/archetypes/main-street/MainStreetProduct.tsx`, replace the block from the `ms-product-price` `<Type>` through the closing `</div>` of `ms-product-buy` with:
```tsx
            {product.shortDescription && (
              <Type as="p" role="body" className="ms-product-desc">
                {product.shortDescription}
              </Type>
            )}
            {product.variations.length > 0 ? (
              <ProductOptions variations={product.variations} offers={product.offers ?? []} fallbackPrice={product.price} />
            ) : (
              <>
                <Type as="div" role="title" className="ms-product-price">
                  {product.price}
                </Type>
                <div className="ms-product-buy">
                  <Type
                    as="button"
                    role="navLabel"
                    type="button"
                    disabled={soldOut}
                    className="ms-product-cta"
                    data-soldout={soldOut ? 'true' : 'false'}
                  >
                    {soldOut ? DEFAULT_STRINGS.productSoldOut : DEFAULT_STRINGS.productAddToCart}
                  </Type>
                </div>
              </>
            )}
```
(the short description moves above the price/options so the picker sits with the button; the static option chips are gone) and add `import { ProductOptions } from './ProductOptions';`.

In `lib/archetypes/main-street/chrome.tsx`, directly after the `.ms-product-var-chip` rule (line ~1308), add:
```css
    .arch-main-street .ms-product-select{font:inherit;color:var(--ms-fg);background:var(--ms-bg);border:1px solid var(--ms-rule);border-radius:2px;padding:var(--ms-tight) var(--ms-base);min-width:12rem;max-width:100%}
```

The ten price spots — each `{x.price}` becomes `{priceLabel(x)}`, with `import { priceLabel } from './price-label';` added to each file:

| File:line | Before | After |
|---|---|---|
| `GoodsIndex.tsx:53` | `{p.price}` | `{priceLabel(p)}` |
| `GoodsLookbook.tsx:55` | `{p.price}` | `{priceLabel(p)}` |
| `GoodsModule.tsx:79` | `{p.price}` | `{priceLabel(p)}` |
| `GoodsProcession.tsx:142` | `{p.price}` | `{priceLabel(p)}` |
| `GoodsSlideshow.tsx:94` | `{current?.price}` | `{current !== undefined && priceLabel(current)}` |
| `GoodsSwitcher.tsx:51` | `{current.price}` | `{priceLabel(current)}` |
| `GoodsSwitcher.tsx:72` | `{p.price}` | `{priceLabel(p)}` |
| `GoodsTable.tsx:78` | `{p.price}` | `{priceLabel(p)}` |
| `beats.tsx:110` | `{p.price}` | `{priceLabel(p)}` |
| `pages.tsx:134` | `{p.price}` | `{priceLabel(p)}` |

Read each line before changing it — if the variable there is not a `ProductView` (or the line moved), adapt to the surrounding code; the rule is "every price a shopper sees on a card goes through `priceLabel`". Then confirm none are left:

Run: `grep -n "\.price}" lib/archetypes/main-street/*.tsx`
Expected: only `MainStreetProduct.tsx` (`product.price`, the fallback on the product page) and `ProductOptions.tsx`.

- [ ] **Step 4: Run the Main Street tests**

Run: `npx vitest run lib/archetypes`
Expected: PASS. If a goods test asserted a raw price string for a product fixture with no `status: 'sold_out'`/`priceFrom`, it still passes (priceLabel returns the price unchanged).

- [ ] **Step 5: Lint (the renderer's no-raw-strings rule) and commit**

```bash
npm run typecheck
npx eslint lib/archetypes/main-street
git add lib/archetypes
git commit -m "feat(catalog): from-prices and sold out on cards; option picker on the product page"
```

---

## Task 16: End-to-end guard

**Files:**
- Modify: `e2e/backend.spec.ts`

CI has no real Supabase, so the signed-in flows are proven by the live check in Task 17; here the routes' refusal is pinned.

- [ ] **Step 1: Add the tests**

Inside the existing `test.describe('Backend sign-in', …)` block:
```ts
  for (const path of ['/manage/products', '/manage/products/new', '/manage/collections']) {
    test(`${path} sends a signed-out visitor to sign-in`, async ({ page }) => {
      await page.goto(`${APP}${path}`);
      await expect(page).toHaveURL(`${APP}/signin`);
    });
  }
```

- [ ] **Step 2: Run them**

Run: `npx playwright test e2e/backend.spec.ts` (make sure no other dev server is on port 3100)
Expected: PASS on both projects.

- [ ] **Step 3: Commit**

```bash
git add e2e/backend.spec.ts
git commit -m "test(catalog): catalog pages refuse a signed-out visitor"
```

---

## Task 17: Verify, look, live check, ship

- [ ] **Step 1: Full checks (no dev server running)**

Run: `npm run typecheck && npm run lint && npx vitest run --coverage`
Expected: all clean; coverage gate holds (lib `.ts` ≥ 90%, `.tsx` ≥ 75%). The known flaky `SectionEditor.test.tsx` "Write it up…" may fail under full-suite load only — re-run it alone to confirm; any other failure is real.

- [ ] **Step 2: Local walk-through with Alex (his eyes gate visible work)**

Start the dev server with the preview tool (`BohdiAI Dev`). Alex signs in at `http://app.localhost:3000/signin` as the Classic Loafs admin. Then, together:
1. Home shows the Products and Collections tiles and any Needs attention lines.
2. Products lists Classic Loafs' five breads (photos, prices, Made to order, Live).
3. Add a product with two photos (reorder them), an option Size with two choices, a different price on one, stock 0 on the other; put it in two collections; make it Live; Save.
4. On `http://classic-loafs.localhost:3000`: the card shows "from $…"; the product page shows both photos and the Size picker; picking the stock-0 size shows Sold out and disables the button.
5. Collections: reorder two collections; open one, reorder its products, choose a cover; Save; the shop's collection page follows that order and cover.
6. Archive the test product; it disappears from the shop and stays in the backend under Archived.
7. Downloads: `npx tsx --env-file=.env.local scripts/set-feature.ts classic-loafs digital_products on`, reload the editor, confirm the Ships/Download choice and a file upload work (check `tenant-files` holds it privately: its URL must not open), then switch it back `off`.
Fix anything Alex flags before going on. Stop the dev server when done.

- [ ] **Step 3: Clean up test data**

Soft-delete the test product(s) and any test collections created in Step 2 (set `deleted_at = now()` through the postgres MCP, scoped by id) so Classic Loafs is back to its five breads. Leave Alex's real edits alone — ask if unsure which is which.

- [ ] **Step 4: Merge, deploy, live check**

```bash
git checkout main
git merge --ff-only backend-catalog
git push origin main
git branch -d backend-catalog
```
Wait for Workers Builds to deploy (poll a page that shows the change, e.g. a product page's option picker on a live shop with options, or the backend's Products page after sign-in). Then check live: `app.bohdiai.com/manage/products` redirects to sign-in when signed out; Classic Loafs and Cut-Pro home pages answer 200; a Classic Loafs product page renders. Ask Alex to sign in on the live backend and open Products.

- [ ] **Step 5: Docs**

- `Project-Docs/SESSION-BRIEF.md`: current state (1b Catalog live), next action (1c Video), keep under 100 lines; add the session index line.
- `Project-Docs/session-logs/session-NN.md`: what landed, what was checked, decisions 1–10 above.
- Memory `project_maker_backend.md`: 1b live; next 1c.
- Commit the docs on `main` and push.
