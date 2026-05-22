-- Uploads — every file uploaded or AI-generated. Polymorphic; other tables
-- reference media by id from their own media_ids columns.
-- Spec: project-docs/Tech-Arch-Spec.md §18

create table uploads (
  id                      uuid primary key default gen_random_uuid(),
  tenant_id               uuid references tenants(id) on delete cascade,
  uploaded_by_user_id     uuid references auth.users(id) on delete set null,
  storage_bucket          text not null,
  storage_path            text not null,
  public_url              text,
  file_name               text not null,
  mime_type               text not null,
  size_bytes              bigint not null check (size_bytes >= 0),
  width_px                integer,
  height_px               integer,
  duration_seconds        numeric,
  alt_text                text,
  caption                 text,
  source                  text not null check (source in (
                            'user_upload', 'ai_generated', 'imported',
                            'system', 'customer_review'
                          )),
  ai_generation_metadata  jsonb,
  hash_sha256             text,
  status                  text not null default 'active' check (status in (
                            'active', 'processing', 'archived', 'failed'
                          )),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  deleted_at              timestamptz
);

create unique index uploads_storage_path_unique
  on uploads (storage_bucket, storage_path);

create index uploads_tenant_idx on uploads (tenant_id) where deleted_at is null;
create index uploads_tenant_source_idx on uploads (tenant_id, source) where deleted_at is null;
create index uploads_hash_idx on uploads (tenant_id, hash_sha256) where hash_sha256 is not null;

create trigger uploads_set_updated_at
  before update on uploads
  for each row execute function set_updated_at();

alter table uploads enable row level security;

comment on table uploads is
  'Polymorphic media storage. Other tables hold uuid[] media_ids referencing rows here. Spec: Tech-Arch-Spec.md §18.';
