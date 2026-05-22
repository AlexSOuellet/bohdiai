-- Content pages — the pages on a tenant's storefront. Metadata only;
-- visible content lives in page_blocks.
-- Spec: project-docs/Tech-Arch-Spec.md §9

create table content_pages (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid not null references tenants(id) on delete cascade,
  slug              text not null,
  page_type         text not null,
  title             text not null,
  meta_description  text,
  meta_keywords     text,
  status            text not null default 'draft' check (status in ('draft', 'published', 'unlisted')),
  is_system_page    boolean not null default false,
  is_in_nav         boolean not null default false,
  nav_position      integer,
  nav_label         text,
  parent_page_id    uuid references content_pages(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  published_at      timestamptz,
  deleted_at        timestamptz
);

create unique index content_pages_tenant_slug_unique
  on content_pages (tenant_id, lower(slug))
  where deleted_at is null;

create index content_pages_tenant_status_idx
  on content_pages (tenant_id, status) where deleted_at is null;

create index content_pages_tenant_nav_idx
  on content_pages (tenant_id, is_in_nav, nav_position)
  where deleted_at is null and status = 'published';

create trigger content_pages_set_updated_at
  before update on content_pages
  for each row execute function set_updated_at();

alter table content_pages enable row level security;

comment on table content_pages is
  'Storefront pages (metadata only). Visible content composed by page_blocks rows. Spec: Tech-Arch-Spec.md §9.';
