import { supabaseAdmin } from '@/lib/supabase';
import type { Json } from '@/lib/database.types';
import type { DesignTokens } from '@/lib/tokens';
import type { GeneratedPage } from './generate-page';
import type { GeneratedListingWithImage } from './generate-listings';

export interface StorefrontWriteInput {
  subdomain: string;
  shopName: string;
  nicheSlug: string;
  tenantTypes: string[];
  tokens: DesignTokens;
  page: GeneratedPage;
  listings: GeneratedListingWithImage[];
}

export interface StorefrontWriteResult {
  tenantId: string;
  subdomain: string;
}

export async function writeStorefront(input: StorefrontWriteInput): Promise<StorefrontWriteResult> {
  const db = supabaseAdmin();

  // 1. Create the tenant row
  const { data: tenant, error: tenantError } = await db
    .from('tenants')
    .insert({
      subdomain: input.subdomain,
      business_name: input.shopName,
      tier: 'freemium',
      types: input.tenantTypes,
      primary_niche: input.nicheSlug,
      niche_from_list: true,
      status: 'active',
    })
    .select('id')
    .single();

  if (tenantError || !tenant) {
    throw new Error(`Failed to create tenant: ${tenantError?.message ?? 'unknown error'}`);
  }

  const tenantId = tenant.id;

  // 2. Write active design tokens
  const { error: tokensError } = await db.from('design_tokens').insert({
    tenant_id: tenantId,
    tokens: input.tokens as unknown as Json,
    label: 'Onboarding generation',
    source: 'onboarding',
    is_active: true,
  });

  if (tokensError) {
    throw new Error(`Failed to write design tokens: ${tokensError.message}`);
  }

  // 3. Create the home page
  const { data: homePage, error: pageError } = await db
    .from('content_pages')
    .insert({
      tenant_id: tenantId,
      slug: '/',
      page_type: 'home',
      title: input.shopName,
      status: 'published',
      is_system_page: true,
      is_in_nav: false,
    })
    .select('id')
    .single();

  if (pageError || !homePage) {
    throw new Error(`Failed to create home page: ${pageError?.message ?? 'unknown error'}`);
  }

  const pageId = homePage.id;

  // 4. Write page blocks
  if (input.page.blocks.length > 0) {
    const blockRows = input.page.blocks.map((block) => {
      const content: Json = { ...block.content } as unknown as Json;
      if (Object.keys(block.slots).length > 0) {
        (content as Record<string, unknown>)['slots'] = block.slots;
      }
      return {
        tenant_id: tenantId,
        page_id: pageId,
        block_key: block.blockKey,
        position: block.position,
        content: content as Json,
        is_visible: true,
      };
    });

    const { error: blocksError } = await db.from('page_blocks').insert(blockRows);

    if (blocksError) {
      throw new Error(`Failed to write page blocks: ${blocksError.message}`);
    }
  }

  // 5. Write placeholder listings
  if (input.listings.length > 0) {
    const now = new Date().toISOString();
    const listingRows = input.listings.map((listing) => ({
      tenant_id: tenantId,
      listing_type: 'product' as const,
      slug: listing.slug,
      name: listing.name,
      short_description: listing.short_description,
      description: listing.description,
      base_price_cents: listing.base_price_cents,
      status: 'active' as const,
      requires_shipping: true,
      media_ids: listing.image_url !== null ? [listing.image_url] : [],
      metadata: { placeholder: true, image_url: listing.image_url } as unknown as Json,
      published_at: now,
    }));

    const { error: listingsError } = await db.from('listings').insert(listingRows);

    if (listingsError) {
      throw new Error(`Failed to write listings: ${listingsError.message}`);
    }
  }

  return { tenantId, subdomain: input.subdomain };
}
