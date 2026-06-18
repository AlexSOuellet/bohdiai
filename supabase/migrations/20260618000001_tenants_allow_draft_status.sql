-- Allow tenants.status = 'draft'.
--
-- Session 45's transactional storefront write (A2) inserts a tenant as
-- 'draft', writes content_pages + listings, then flips to 'active' so a
-- half-built store never resolves. But the original tenants constraint only
-- permitted ('active','suspended','closed'), so the draft insert violated the
-- check and every transactional build failed at the tenant insert. The code
-- shipped with tests but was never run live until now, so the gap went unseen.
--
-- Add 'draft' to the allowed set. The resolver matches status='active', so a
-- draft tenant stays invisible to visitors exactly as the A2 design intends.

alter table tenants drop constraint tenants_status_check;

alter table tenants add constraint tenants_status_check
  check (status in ('draft', 'active', 'suspended', 'closed'));
