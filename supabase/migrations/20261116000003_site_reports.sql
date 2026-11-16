-- "Report this site" (go-live step 3, Alex 2026-11-16): a link in every site's
-- footer opens a short page on bohdiai.com. One row per report: which site, why,
-- the details, an optional email for a reply, and when. Alex reads them in his
-- admin's Reports tab. A site's reports go with it if the site is removed.
create table site_reports (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  reason text not null check (reason in ('illegal', 'hateful', 'scam', 'mine', 'other')),
  details text not null default '' check (char_length(details) <= 2000),
  email text not null default '' check (char_length(email) <= 200),
  created_at timestamptz not null default now()
);
create index site_reports_created on site_reports (created_at desc);
create index site_reports_tenant on site_reports (tenant_id);

-- Nobody reads or writes it from the browser: the report page's server saves it and
-- Alex's admin reads it, both with the service role.
alter table site_reports enable row level security;

comment on table site_reports is 'Reports from the "Report this site" link in every site footer. Spec: Project-Docs/Safety-Checks-Plan.md.';
