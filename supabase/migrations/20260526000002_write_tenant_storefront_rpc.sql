-- Atomic storefront creation. Wraps all five inserts (tenant, design_tokens,
-- content_pages, page_blocks, listings) in a single transaction so there is
-- no partial-write state if any step fails.

create or replace function write_tenant_storefront(p_data jsonb)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_tenant_id uuid;
  v_page_id   uuid;
  v_block     jsonb;
  v_listing   jsonb;
  v_content   jsonb;
begin
  -- 1. Tenant
  insert into tenants (
    subdomain, business_name, tier, types,
    primary_niche, mood_key, niche_from_list, status
  )
  values (
    p_data->>'subdomain',
    p_data->>'shopName',
    'basic',
    (select array_agg(v) from jsonb_array_elements_text(p_data->'tenantTypes') as t(v)),
    p_data->>'nicheSlug',
    p_data->>'moodKey',
    true,
    'active'
  )
  returning id into v_tenant_id;

  -- 2. Design tokens
  insert into design_tokens (tenant_id, tokens, label, source, is_active)
  values (
    v_tenant_id,
    p_data->'tokens',
    'Onboarding generation',
    'onboarding',
    true
  );

  -- 3. Home page
  insert into content_pages (
    tenant_id, slug, page_type, title, status, is_system_page, is_in_nav
  )
  values (
    v_tenant_id,
    '/',
    'home',
    p_data->>'shopName',
    'published',
    true,
    false
  )
  returning id into v_page_id;

  -- 4. Page blocks
  for v_block in select value from jsonb_array_elements(p_data->'blocks')
  loop
    v_content := v_block->'content';
    if (v_block ? 'slots') and (v_block->'slots' <> 'null'::jsonb) then
      v_content := v_content || jsonb_build_object('slots', v_block->'slots');
    end if;
    insert into page_blocks (
      tenant_id, page_id, block_key, position, content, is_visible
    )
    values (
      v_tenant_id,
      v_page_id,
      v_block->>'blockKey',
      (v_block->>'position')::int,
      v_content,
      true
    );
  end loop;

  -- 5. Listings (optional — may be empty)
  if jsonb_array_length(coalesce(p_data->'listings', '[]'::jsonb)) > 0 then
    for v_listing in select value from jsonb_array_elements(p_data->'listings')
    loop
      insert into listings (
        tenant_id, listing_type, slug, name, short_description, description,
        base_price_cents, status, requires_shipping, metadata, published_at
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
        jsonb_build_object('placeholder', true, 'image_url', v_listing->>'image_url'),
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

comment on function write_tenant_storefront(jsonb) is
  'Atomically creates a tenant + all onboarding artefacts in one transaction. Called from lib/generation/write-storefront.ts.';
