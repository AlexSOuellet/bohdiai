import { supabaseAdmin } from '@/lib/supabase';
import type { Json } from '@/lib/database.types';
import type { DesignTokens } from '@/lib/tokens';
import type { GeneratedPage } from './generate-page';
import type { GeneratedListingWithImage } from './generate-listings';
import type { GeneratedCollection } from './generate-collections';
import type { GeneratedSubscription } from './generate-subscriptions';

// Supabase's Json type is a deep recursive union TypeScript cannot prove
// our validated objects satisfy structurally. Cast once at the DB boundary.
function toJson(value: unknown): Json {
  return value as Json;
}

export interface StorefrontPageInput {
  slug: string;
  pageType: string;
  title: string;
  blocks: GeneratedPage['blocks'];
}

export interface StorefrontWriteInput {
  subdomain: string;
  shopName: string;
  nicheSlug: string;
  moodKey: string;
  tenantTypes: string[];
  tokens: DesignTokens;
  pages: StorefrontPageInput[];
  /** AI-generated sample collections (may be empty when niche doesn't fit). */
  collections: GeneratedCollection[];
  listings: GeneratedListingWithImage[];
  /** AI-generated sample subscription listings (may be empty when niche doesn't fit). */
  subscriptions: GeneratedSubscriptionWithImage[];
  /** Optional uploaded logo URL — stored on tenants.logo_url. */
  logoUrl?: string | undefined;
}

export interface GeneratedSubscriptionWithImage extends GeneratedSubscription {
  image_url: string | null;
}

export interface StorefrontWriteResult {
  tenantId: string;
  subdomain: string;
}

interface WriteRPCResult {
  tenantId: string;
  subdomain: string;
}

function isWriteRPCResult(value: unknown): value is WriteRPCResult {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return typeof record['tenantId'] === 'string' && typeof record['subdomain'] === 'string';
}

export async function writeStorefront(input: StorefrontWriteInput): Promise<StorefrontWriteResult> {
  // Flatten slots into content before sending — the RPC expects a single content object per block.
  const pages = input.pages.map((page) => ({
    slug: page.slug,
    pageType: page.pageType,
    title: page.title,
    blocks: page.blocks.map((block) => {
      const content: Record<string, unknown> = { ...block.content };
      if (Object.keys(block.slots).length > 0) {
        content['slots'] = block.slots;
      }
      return {
        blockKey: block.blockKey,
        position: block.position,
        content,
      };
    }),
  }));

  const { data, error } = await supabaseAdmin().rpc('write_tenant_storefront', {
    p_data: toJson({
      subdomain: input.subdomain,
      shopName: input.shopName,
      nicheSlug: input.nicheSlug,
      moodKey: input.moodKey,
      tenantTypes: input.tenantTypes,
      tokens: input.tokens,
      pages,
      collections: input.collections,
      listings: input.listings,
      subscriptions: input.subscriptions,
      logoUrl: input.logoUrl ?? '',
    }),
  });

  if (error !== null) {
    throw new Error(`Failed to write storefront: ${error.message}`);
  }

  if (!isWriteRPCResult(data)) {
    throw new Error('write_tenant_storefront returned an unexpected shape');
  }

  return { tenantId: data.tenantId, subdomain: data.subdomain };
}
