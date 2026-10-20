-- Visitor numbers kept month by month for Full sites (Alex, 2026-10-20).
--
-- Every page view is counted in Cloudflare (Workers Analytics Engine, no cookies,
-- nothing personal), which keeps three months. Every site's backend home shows
-- those. A Full site also keeps its history for as long as it's on Full: once a
-- month ends, its totals are saved here. Only counts: no visitor details.
-- Rows stay if the site steps down from Full, so the history is there if it
-- moves back up.

create table site_visit_months (
  tenant_id uuid not null references tenants(id) on delete cascade,
  -- The first day of the month the totals are for.
  month date not null check (extract(day from month) = 1),
  -- Arrivals from outside the site (a visit), and every page shown.
  visits integer not null check (visits >= 0),
  page_views integer not null check (page_views >= 0),
  -- The most-viewed pages ([{ "path": "/", "views": 12 }, ...]) and where visits
  -- came from ([{ "source": "facebook", "visits": 4 }, ...]), each the top ten.
  top_pages jsonb not null default '[]'::jsonb check (jsonb_typeof(top_pages) = 'array'),
  sources jsonb not null default '[]'::jsonb check (jsonb_typeof(sources) = 'array'),
  saved_at timestamptz not null default now(),
  primary key (tenant_id, month)
);

-- The maker reads their own; only the server writes (the monthly save).
alter table site_visit_months enable row level security;
create policy site_visit_months_admin_select on site_visit_months
  for select to authenticated using (is_tenant_admin(tenant_id));
