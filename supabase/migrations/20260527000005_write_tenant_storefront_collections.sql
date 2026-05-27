-- Extend the storefront RPC to insert AI-generated sample collections AND link
-- placeholder listings to those collections via primary_collection_id. The
-- collection_slug on each listing in the payload is resolved against the
-- collections inserted in this same transaction.

create or replace function write_tenant_storefront(p_data jsonb)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_tenant_id   uuid;
  v_page_id     uuid;
  v_page        jsonb;
  v_block       jsonb;
  v_listing     jsonb;
  v_collection  jsonb;
  v_content     jsonb;
  v_position    int := 0;
  v_collection_id uuid;
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

  -- 3. Pages + page_blocks
  for v_page in select value from jsonb_array_elements(p_data->'pages')
  loop
    insert into content_pages (
      tenant_id, slug, page_type, title, status, is_system_page, is_in_nav
    )
    values (
      v_tenant_id,
      v_page->>'slug',
      v_page->>'pageType',
      v_page->>'title',
      'published',
      true,
      false
    )
    returning id into v_page_id;

    for v_block in select value from jsonb_array_elements(v_page->'blocks')
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
  end loop;

  -- 4. Collections (optional — AI returns empty array for niches that don't fit).
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

  -- 5. Listings (AI-generated samples — written as preview, optionally linked
  --    to one of the just-created collections by collection_slug).
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

  return jsonb_build_object(
    'tenantId', v_tenant_id,
    'subdomain', p_data->>'subdomain'
  );
end;
$$;

comment on function write_tenant_storefront(jsonb) is
  'Atomically creates a tenant + all onboarding artefacts (pages, collections, preview listings linked to collections) in one transaction. Called from lib/generation/write-storefront.ts.';
