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
