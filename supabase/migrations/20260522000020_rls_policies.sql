-- Row-level security policies for every public-schema table.
--
-- Audience model:
--   - service_role: bypasses RLS (Supabase default). Used by server-side code,
--     webhooks, admin scripts. All sensitive writes go through this.
--   - authenticated: a logged-in Supabase Auth user. Their tenant relationships
--     come from tenant_members rows.
--   - anon: anonymous storefront visitors. Read-only access to published content.
--
-- The two helpers below resolve "is the current user an admin/customer of
-- tenant X?" via tenant_members. SECURITY DEFINER avoids policies on
-- tenant_members triggering recursion.

create or replace function public.is_tenant_admin(target_tenant_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists(
    select 1 from public.tenant_members
    where user_id = auth.uid()
      and tenant_id = target_tenant_id
      and role = 'admin'
      and status = 'active'
  );
$$;

create or replace function public.is_tenant_customer(target_tenant_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists(
    select 1 from public.tenant_members
    where user_id = auth.uid()
      and tenant_id = target_tenant_id
      and role = 'customer'
      and status = 'active'
  );
$$;

grant execute on function public.is_tenant_admin(uuid) to anon, authenticated;
grant execute on function public.is_tenant_customer(uuid) to anon, authenticated;

-- =====================================================================
-- tenants — spec §1.4
-- =====================================================================

create policy tenants_admin_select on tenants
  for select to authenticated
  using (is_tenant_admin(id));

create policy tenants_anon_select_active on tenants
  for select to anon, authenticated
  using (status = 'active' and deleted_at is null);

create policy tenants_admin_update on tenants
  for update to authenticated
  using (is_tenant_admin(id))
  with check (is_tenant_admin(id));

-- INSERT/DELETE: service role only (no policy = denied for non-service).

-- =====================================================================
-- tenant_members — spec §2.4
-- =====================================================================

-- A user always sees their own membership rows. An admin sees all members
-- of tenants they admin.

create policy tenant_members_self_select on tenant_members
  for select to authenticated
  using (user_id = auth.uid());

create policy tenant_members_admin_select on tenant_members
  for select to authenticated
  using (is_tenant_admin(tenant_id));

create policy tenant_members_admin_write on tenant_members
  for all to authenticated
  using (is_tenant_admin(tenant_id))
  with check (is_tenant_admin(tenant_id));

-- =====================================================================
-- subscriptions — spec §3.4
-- =====================================================================

create policy subscriptions_admin_select on subscriptions
  for select to authenticated
  using (is_tenant_admin(tenant_id));

-- All writes service-role only (Stripe webhook handler, upgrade/cancel API).

-- =====================================================================
-- design_tokens — spec §4.5
-- =====================================================================

create policy design_tokens_admin_select on design_tokens
  for select to authenticated
  using (is_tenant_admin(tenant_id));

create policy design_tokens_public_select_active on design_tokens
  for select to anon, authenticated
  using (is_active = true);

-- Writes service-role only (editor, onboarding generator, admin scripts).

-- =====================================================================
-- editor_history — spec §5.4
-- =====================================================================

create policy editor_history_admin_select on editor_history
  for select to authenticated
  using (is_tenant_admin(tenant_id));

-- Writes service-role only.

-- =====================================================================
-- niches — spec §6.4
-- =====================================================================
-- Platform-wide content. Anonymous reads restricted to approved rows.
-- Writes restricted to service role until a staff role mechanism exists.

create policy niches_public_select_approved on niches
  for select to anon, authenticated
  using (status = 'approved');

-- niche_versions: service role only (no policies = denied for non-service).

-- =====================================================================
-- content_pages — spec §9.4
-- =====================================================================

create policy content_pages_admin_all on content_pages
  for all to authenticated
  using (is_tenant_admin(tenant_id))
  with check (is_tenant_admin(tenant_id));

create policy content_pages_public_select_published on content_pages
  for select to anon, authenticated
  using (status = 'published' and deleted_at is null);

-- =====================================================================
-- page_blocks — spec §8.4
-- =====================================================================

create policy page_blocks_admin_all on page_blocks
  for all to authenticated
  using (is_tenant_admin(tenant_id))
  with check (is_tenant_admin(tenant_id));

create policy page_blocks_public_select_visible on page_blocks
  for select to anon, authenticated
  using (
    is_visible = true
    and exists (
      select 1 from content_pages cp
      where cp.id = page_blocks.page_id
        and cp.status = 'published'
        and cp.deleted_at is null
    )
  );

-- =====================================================================
-- listings — spec §10.4
-- =====================================================================

create policy listings_admin_all on listings
  for all to authenticated
  using (is_tenant_admin(tenant_id))
  with check (is_tenant_admin(tenant_id));

create policy listings_public_select_active on listings
  for select to anon, authenticated
  using (status = 'active' and deleted_at is null);

-- =====================================================================
-- variation_attributes / variation_options / listing_variants — spec §11.4
-- =====================================================================

create policy variation_attributes_admin_all on variation_attributes
  for all to authenticated
  using (is_tenant_admin(tenant_id))
  with check (is_tenant_admin(tenant_id));

create policy variation_attributes_public_select on variation_attributes
  for select to anon, authenticated
  using (
    exists (
      select 1 from listings l
      where l.id = variation_attributes.listing_id
        and l.status = 'active'
        and l.deleted_at is null
    )
  );

create policy variation_options_admin_all on variation_options
  for all to authenticated
  using (is_tenant_admin(tenant_id))
  with check (is_tenant_admin(tenant_id));

create policy variation_options_public_select on variation_options
  for select to anon, authenticated
  using (
    exists (
      select 1 from variation_attributes va
      join listings l on l.id = va.listing_id
      where va.id = variation_options.attribute_id
        and l.status = 'active'
        and l.deleted_at is null
    )
  );

create policy listing_variants_admin_all on listing_variants
  for all to authenticated
  using (is_tenant_admin(tenant_id))
  with check (is_tenant_admin(tenant_id));

create policy listing_variants_public_select on listing_variants
  for select to anon, authenticated
  using (
    status = 'active'
    and exists (
      select 1 from listings l
      where l.id = listing_variants.listing_id
        and l.status = 'active'
        and l.deleted_at is null
    )
  );

-- =====================================================================
-- collections / listing_collections — spec §12.4
-- =====================================================================

create policy collections_admin_all on collections
  for all to authenticated
  using (is_tenant_admin(tenant_id))
  with check (is_tenant_admin(tenant_id));

create policy collections_public_select_active on collections
  for select to anon, authenticated
  using (status = 'active' and deleted_at is null);

create policy listing_collections_admin_all on listing_collections
  for all to authenticated
  using (is_tenant_admin(tenant_id))
  with check (is_tenant_admin(tenant_id));

create policy listing_collections_public_select on listing_collections
  for select to anon, authenticated
  using (
    exists (
      select 1 from collections c
      where c.id = listing_collections.collection_id
        and c.status = 'active'
        and c.deleted_at is null
    )
  );

-- =====================================================================
-- customer_profiles / customer_addresses / wishlist_items — spec §13.4
-- =====================================================================

create policy customer_profiles_self_all on customer_profiles
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy customer_profiles_admin_select on customer_profiles
  for select to authenticated
  using (is_tenant_admin(tenant_id));

create policy customer_profiles_admin_update_notes on customer_profiles
  for update to authenticated
  using (is_tenant_admin(tenant_id))
  with check (is_tenant_admin(tenant_id));

create policy customer_addresses_self_all on customer_addresses
  for all to authenticated
  using (
    exists (
      select 1 from customer_profiles cp
      where cp.id = customer_addresses.customer_profile_id
        and cp.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from customer_profiles cp
      where cp.id = customer_addresses.customer_profile_id
        and cp.user_id = auth.uid()
    )
  );

create policy customer_addresses_admin_select on customer_addresses
  for select to authenticated
  using (is_tenant_admin(tenant_id));

create policy wishlist_items_self_all on wishlist_items
  for all to authenticated
  using (
    exists (
      select 1 from customer_profiles cp
      where cp.id = wishlist_items.customer_profile_id
        and cp.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from customer_profiles cp
      where cp.id = wishlist_items.customer_profile_id
        and cp.user_id = auth.uid()
    )
  );

-- =====================================================================
-- orders / order_items / payments / shipments / shipment_items — spec §14.4
-- =====================================================================

create policy orders_admin_select on orders
  for select to authenticated
  using (is_tenant_admin(tenant_id));

create policy orders_customer_select on orders
  for select to authenticated
  using (
    customer_profile_id is not null
    and exists (
      select 1 from customer_profiles cp
      where cp.id = orders.customer_profile_id
        and cp.user_id = auth.uid()
    )
  );

-- Order writes are service-role only (checkout API + webhooks).

create policy order_items_admin_select on order_items
  for select to authenticated
  using (is_tenant_admin(tenant_id));

create policy order_items_customer_select on order_items
  for select to authenticated
  using (
    exists (
      select 1 from orders o
      join customer_profiles cp on cp.id = o.customer_profile_id
      where o.id = order_items.order_id
        and cp.user_id = auth.uid()
    )
  );

create policy payments_admin_select on payments
  for select to authenticated
  using (is_tenant_admin(tenant_id));

create policy shipments_admin_all on shipments
  for all to authenticated
  using (is_tenant_admin(tenant_id))
  with check (is_tenant_admin(tenant_id));

create policy shipments_customer_select on shipments
  for select to authenticated
  using (
    exists (
      select 1 from orders o
      join customer_profiles cp on cp.id = o.customer_profile_id
      where o.id = shipments.order_id
        and cp.user_id = auth.uid()
    )
  );

create policy shipment_items_admin_select on shipment_items
  for select to authenticated
  using (is_tenant_admin(tenant_id));

create policy shipment_items_customer_select on shipment_items
  for select to authenticated
  using (
    exists (
      select 1 from shipments s
      join orders o on o.id = s.order_id
      join customer_profiles cp on cp.id = o.customer_profile_id
      where s.id = shipment_items.shipment_id
        and cp.user_id = auth.uid()
    )
  );

-- =====================================================================
-- carts / cart_items — spec §15.4
-- =====================================================================
-- Authenticated customers read/write their own active cart. Anonymous carts
-- (session_token based) must go through server-side endpoints; RLS cannot
-- validate a session token, so no anon policies here — service role handles.

create policy carts_customer_all on carts
  for all to authenticated
  using (
    customer_profile_id is not null
    and exists (
      select 1 from customer_profiles cp
      where cp.id = carts.customer_profile_id
        and cp.user_id = auth.uid()
    )
  )
  with check (
    customer_profile_id is not null
    and exists (
      select 1 from customer_profiles cp
      where cp.id = carts.customer_profile_id
        and cp.user_id = auth.uid()
    )
  );

create policy carts_admin_select on carts
  for select to authenticated
  using (is_tenant_admin(tenant_id));

create policy cart_items_customer_all on cart_items
  for all to authenticated
  using (
    exists (
      select 1 from carts c
      join customer_profiles cp on cp.id = c.customer_profile_id
      where c.id = cart_items.cart_id
        and cp.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from carts c
      join customer_profiles cp on cp.id = c.customer_profile_id
      where c.id = cart_items.cart_id
        and cp.user_id = auth.uid()
    )
  );

create policy cart_items_admin_select on cart_items
  for select to authenticated
  using (is_tenant_admin(tenant_id));

-- =====================================================================
-- reviews — spec §16.4
-- =====================================================================

create policy reviews_public_select_published on reviews
  for select to anon, authenticated
  using (status = 'published');

create policy reviews_customer_select_own on reviews
  for select to authenticated
  using (
    customer_profile_id is not null
    and exists (
      select 1 from customer_profiles cp
      where cp.id = reviews.customer_profile_id
        and cp.user_id = auth.uid()
    )
  );

create policy reviews_customer_write_own on reviews
  for insert to authenticated
  with check (
    customer_profile_id is not null
    and exists (
      select 1 from customer_profiles cp
      where cp.id = reviews.customer_profile_id
        and cp.user_id = auth.uid()
    )
  );

create policy reviews_customer_update_own on reviews
  for update to authenticated
  using (
    customer_profile_id is not null
    and exists (
      select 1 from customer_profiles cp
      where cp.id = reviews.customer_profile_id
        and cp.user_id = auth.uid()
    )
  )
  with check (
    customer_profile_id is not null
    and exists (
      select 1 from customer_profiles cp
      where cp.id = reviews.customer_profile_id
        and cp.user_id = auth.uid()
    )
  );

create policy reviews_admin_all on reviews
  for all to authenticated
  using (is_tenant_admin(tenant_id))
  with check (is_tenant_admin(tenant_id));

-- =====================================================================
-- gift_cards / gift_card_transactions — spec §17.4
-- =====================================================================
-- Anonymous balance-check by code goes through a server endpoint (service role).

create policy gift_cards_admin_all on gift_cards
  for all to authenticated
  using (is_tenant_admin(tenant_id))
  with check (is_tenant_admin(tenant_id));

create policy gift_cards_customer_select_purchased on gift_cards
  for select to authenticated
  using (
    purchased_by_profile_id is not null
    and exists (
      select 1 from customer_profiles cp
      where cp.id = gift_cards.purchased_by_profile_id
        and cp.user_id = auth.uid()
    )
  );

create policy gift_card_transactions_admin_select on gift_card_transactions
  for select to authenticated
  using (is_tenant_admin(tenant_id));

create policy gift_card_transactions_customer_select on gift_card_transactions
  for select to authenticated
  using (
    exists (
      select 1 from gift_cards gc
      join customer_profiles cp on cp.id = gc.purchased_by_profile_id
      where gc.id = gift_card_transactions.gift_card_id
        and cp.user_id = auth.uid()
    )
  );

-- =====================================================================
-- uploads — spec §18.4
-- =====================================================================
-- Public reads are permissive (active, not-deleted, tenant-scoped). Storage
-- security is enforced primarily by Supabase Storage bucket policies and
-- signed URLs; row-level public access here only exposes the metadata row.

create policy uploads_admin_all on uploads
  for all to authenticated
  using (tenant_id is not null and is_tenant_admin(tenant_id))
  with check (tenant_id is not null and is_tenant_admin(tenant_id));

create policy uploads_public_select on uploads
  for select to anon, authenticated
  using (status = 'active' and deleted_at is null);

-- =====================================================================
-- promos / promo_redemptions — spec §19.4
-- =====================================================================

create policy promos_admin_all on promos
  for all to authenticated
  using (is_tenant_admin(tenant_id))
  with check (is_tenant_admin(tenant_id));

create policy promos_public_select_active_sales on promos
  for select to anon, authenticated
  using (promo_type = 'sale' and status = 'active');

create policy promo_redemptions_admin_select on promo_redemptions
  for select to authenticated
  using (is_tenant_admin(tenant_id));

-- =====================================================================
-- niche_versions / waitlist / _migrations — service role only (no policies)
-- =====================================================================
-- These tables have RLS enabled by their own migrations or by Supabase
-- defaults. Without an explicit policy, only service_role can access them,
-- which is the intent.
