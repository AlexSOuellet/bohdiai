-- ─── Phase 0.3 — schema cleanup ───────────────────────────────────────────────
-- Drop four dead tables from the retired layout-engine renderer, and enable RLS
-- on notify_interest which was created without a policy (audit CRITICAL #2).
--
-- Rationale for each drop:
--   • page_blocks — the retired layout-engine's per-page assembly rows. Zero
--     code references (grep .from('page_blocks') returns nothing). Legacy
--     write RPCs already dropped in 20260610000001.
--   • design_tokens — the retired token-per-tenant table. Replaced by the
--     archetype envelope stored in content_pages.layout_tree.
--   • style_sheets — the retired per-tenant style-sheet table. The archetype
--     paints entirely from its skin; no style_sheet is written on any current
--     code path (verified in write-archetype-storefront.ts).
--   • editor_history — history table for the retired block-editor. FK from
--     page_blocks; dropped after page_blocks.
--
-- Cascading policies and indexes drop with the tables.
--
-- notify_interest RLS: table stores customer emails collected from tenant
-- storefronts' "Get Notified" forms. Every other tenant-scoped table has RLS
-- enabled. This one did not — anon reads could leak customer PII. Enable RLS
-- with no policies so only service-role code (server-side admin actions and
-- the maker dashboard's future admin views) can read/write.

-- ─── Drop dead tables ─────────────────────────────────────────────────────────
drop table if exists public.page_blocks cascade;
drop table if exists public.editor_history cascade;
drop table if exists public.design_tokens cascade;
drop table if exists public.style_sheets cascade;

-- ─── Lock notify_interest ─────────────────────────────────────────────────────
alter table public.notify_interest enable row level security;

comment on table public.notify_interest is
  'Email captures from sample-subscription "Get Notified" forms. RLS enabled with no policies — only service-role code reads/writes. The maker will see their list through admin dashboard endpoints (built later), never through direct client queries.';
