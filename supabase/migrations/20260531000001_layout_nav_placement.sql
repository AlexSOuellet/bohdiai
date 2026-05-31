-- Navbar placement for layout-engine tenants.
-- Prior version hardcoded content_pages.is_in_nav = false for every page, so the
-- resolver (fetchNavLinks, which only returns is_in_nav = true pages) always came
-- back empty and every storefront rendered with no navigation.
-- This replaces the function so the content_pages insert reads the per-page
-- placement the save layer now sends (isInNav / navLabel / navPosition), computed
-- by lib/generation/nav-placement.ts per the page-architecture policy
-- (project-docs/Page-Architecture-Policy-2026-05-31.md).
-- Only the content_pages insert changed; everything else is identical to
-- 20260530000003_write_tenant_storefront_layout.sql.

create or replace function write_tenant_storefront_layout(p_data jsonb)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_tenant_id     uuid;
  v_page          jsonb;
  v_listing       jsonb;
  v_collection    jsonb;
  v_subscription  jsonb;
  v_position      int := 0;
  v_collection_id uuid;
begin
  -- 1. Tenant
  insert into tenants (
    subdomain, business_name, tier, types,
    primary_niche, mood_key, niche_from_list, status, logo_url
  )
  values (
    p_data->>'subdomain',
    p_data->>'shopName',
    'basic',
    (select array_agg(v) from jsonb_array_elements_text(p_data->'tenantTypes') as t(v)),
    p_data->>'nicheSlug',
    p_data->>'moodKey',
    true,
    'active',
    nullif(p_data->>'logoUrl', '')
  )
  returning id into v_tenant_id;

  -- 2. Style sheet
  insert into style_sheets (tenant_id, sheet, label, source, is_active)
  values (
    v_tenant_id,
    p_data->'styleSheet',
    'Onboarding generation',
    'onboarding',
    true
  );

  -- 3. Pages with layout_tree (no page_blocks). Navbar placement read from each page.
  for v_page in select value from jsonb_array_elements(p_data->'pages')
  loop
    insert into content_pages (
      tenant_id, slug, page_type, title, meta_description, status,
      is_system_page, is_in_nav, nav_label, nav_position, layout_tree
    )
    values (
      v_tenant_id,
      v_page->>'slug',
      v_page->>'pageType',
      v_page->>'title',
      v_page->>'metaDescription',
      'published',
      true,
      coalesce((v_page->>'isInNav')::boolean, false),
      v_page->>'navLabel',
      (v_page->>'navPosition')::int,
      v_page->'layoutTree'
    );
  end loop;

  -- 4. Collections
  v_position := 0;
  if jsonb_array_length(coalesce(p_data->'collections', '[]'::jsonb)) > 0 then
    for v_collection in select value from jsonb_array_elements(p_data->'collections')
    loop
      insert into collections (
        tenant_id, slug, name, description, status, position
      )
      values (
        v_tenant_id,
        v_collection->>'slug',
        v_collection->>'name',
        v_collection->>'description',
        'active',
        v_position
      );
      v_position := v_position + 1;
    end loop;
  end if;

  -- 5. Product listings
  if jsonb_array_length(coalesce(p_data->'listings', '[]'::jsonb)) > 0 then
    for v_listing in select value from jsonb_array_elements(p_data->'listings')
    loop
      v_collection_id := null;
      if v_listing ? 'collection_slug' and v_listing->>'collection_slug' is not null then
        select id into v_collection_id
        from collections
        where tenant_id = v_tenant_id
          and slug = v_listing->>'collection_slug'
        limit 1;
      end if;

      insert into listings (
        tenant_id, listing_type, slug, name, short_description, description,
        base_price_cents, status, is_preview, requires_shipping, metadata,
        primary_collection_id, published_at
      )
      values (
        v_tenant_id,
        'product',
        v_listing->>'slug',
        v_listing->>'name',
        v_listing->>'short_description',
        v_listing->>'description',
        (v_listing->>'base_price_cents')::int,
        'active',
        true,
        true,
        jsonb_build_object('placeholder', true, 'image_url', v_listing->>'image_url'),
        v_collection_id,
        now()
      );
    end loop;
  end if;

  -- 6. Subscription listings
  if jsonb_array_length(coalesce(p_data->'subscriptions', '[]'::jsonb)) > 0 then
    for v_subscription in select value from jsonb_array_elements(p_data->'subscriptions')
    loop
      insert into listings (
        tenant_id, listing_type, slug, name, short_description, description,
        base_price_cents, status, is_preview, payment_model, subscription_interval,
        requires_shipping, metadata, published_at
      )
      values (
        v_tenant_id,
        'subscription',
        v_subscription->>'slug',
        v_subscription->>'name',
        v_subscription->>'short_description',
        v_subscription->>'description',
        (v_subscription->>'base_price_cents')::int,
        'active',
        true,
        'subscription',
        v_subscription->>'subscription_interval',
        true,
        jsonb_build_object('placeholder', true, 'image_url', v_subscription->>'image_url'),
        now()
      );
    end loop;
  end if;

  return jsonb_build_object(
    'tenantId', v_tenant_id,
    'subdomain', p_data->>'subdomain'
  );
end;
$$;

comment on function write_tenant_storefront_layout(jsonb) is
  'Atomic write for layout-engine tenants — tenant + style_sheet + content_pages with layout_tree (incl. navbar placement) + collections + listings + subscriptions. Companion to write_tenant_storefront. Called from lib/generation/write-storefront-layout.ts.';
