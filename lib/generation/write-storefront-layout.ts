import { supabaseAdmin } from '@/lib/supabase';
import type { Json } from '@/lib/database.types';
import type { Page } from '@/lib/layout';
import type { StyleSheet } from '@/lib/style-sheet';
import type { GeneratedCollection } from './generate-collections';
import type { GeneratedListingWithImage } from './generate-listings';
import type { GeneratedSubscriptionWithImage } from './write-storefront';

function toJson(value: unknown): Json {
  return value as Json;
}

export interface LayoutStorefrontWriteInput {
  subdomain: string;
  shopName: string;
  nicheSlug: string;
  moodKey: string;
  tenantTypes: string[];
  styleSheet: StyleSheet;
  layoutPages: Page[];
  collections: GeneratedCollection[];
  listings: GeneratedListingWithImage[];
  subscriptions: GeneratedSubscriptionWithImage[];
  logoUrl?: string | undefined;
}

export interface LayoutStorefrontWriteResult {
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
  return (
    typeof record['tenantId'] === 'string' &&
    typeof record['subdomain'] === 'string'
  );
}

function pageTypeFor(slug: string): string {
  if (slug === 'home' || slug === '/' || slug === '') return 'home';
  if (slug === 'about' || slug === '/about') return 'about';
  if (slug === 'shop' || slug === '/shop') return 'shop';
  if (slug === 'contact' || slug === '/contact') return 'contact';
  return 'custom';
}

export async function writeStorefrontLayout(
  input: LayoutStorefrontWriteInput,
): Promise<LayoutStorefrontWriteResult> {
  const pages = input.layoutPages.map((p) => ({
    slug: p.slug === 'home' ? '/' : `/${p.slug.replace(/^\/+/, '')}`,
    pageType: pageTypeFor(p.slug),
    title: p.meta?.title ?? p.name,
    metaDescription: p.meta?.description ?? null,
    layoutTree: {
      root: p.root,
      meta: p.meta ?? null,
    },
  }));

  const client = supabaseAdmin() as unknown as {
    rpc: (
      name: string,
      args: { p_data: Json },
    ) => Promise<{ data: unknown; error: { message: string } | null }>;
  };
  const { data, error } = await client.rpc('write_tenant_storefront_layout', {
    p_data: toJson({
      subdomain: input.subdomain,
      shopName: input.shopName,
      nicheSlug: input.nicheSlug,
      moodKey: input.moodKey,
      tenantTypes: input.tenantTypes,
      styleSheet: input.styleSheet,
      pages,
      collections: input.collections,
      listings: input.listings,
      subscriptions: input.subscriptions,
      logoUrl: input.logoUrl ?? '',
    }),
  });

  if (error !== null) {
    throw new Error(`Failed to write storefront (layout): ${error.message}`);
  }

  if (!isWriteRPCResult(data)) {
    throw new Error('write_tenant_storefront_layout returned an unexpected shape');
  }

  return { tenantId: data.tenantId, subdomain: data.subdomain };
}
