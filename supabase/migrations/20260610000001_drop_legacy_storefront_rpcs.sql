-- Drop the legacy layout-engine storefront-write RPCs.
--
-- These were the old generation path's database functions. The active path
-- (lib/generation/write-archetype-storefront.ts) does plain typed inserts and
-- calls neither RPC. After the layout engine was removed in code, these two
-- functions lingered in the database with zero code references and zero
-- database dependents (verified against pg_depend). Removing them so the schema
-- — and the generated types — stop carrying dead weight.
--
-- Safe to drop: no views, triggers, or other functions depend on them.

drop function if exists public.write_tenant_storefront(jsonb);
drop function if exists public.write_tenant_storefront_layout(jsonb);
