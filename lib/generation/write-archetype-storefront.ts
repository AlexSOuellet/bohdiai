/**
 * Persist an archetype store. Reuses the layout-engine atomic write RPC: the
 * home page's layout_tree carries an ARCHETYPE ENVELOPE (kind/archetypeKey/
 * skinKey/mood/content) instead of a layout node, and the products land as real
 * `listings` rows. StorefrontPage detects the envelope and renders the archetype
 * (reading the listing rows back as the catalog) — the renderer never authors
 * the catalog; it consumes rows.
 *
 * A style_sheet row is written only because the RPC requires one; archetype
 * stores style entirely from the skin, so it's a minimal placeholder the render
 * path ignores.
 */
import { supabaseAdmin } from '@/lib/supabase';
import type { Json } from '@/lib/database.types';

export interface ArchetypeListingRow {
  slug: string;
  name: string;
  short_description: string;
  description: string;
  base_price_cents: number;
  image_url: string | null;
}

export interface ArchetypeWriteInput {
  subdomain: string;
  shopName: string;
  nicheSlug: string;
  moodKey: string;
  tenantTypes: string[];
  archetypeKey: string;
  skinKey: string;
  /** Render-time hint for treatment selection (goods/founder). */
  mood: string;
  /** Validated archetype content (with generated media URLs already folded in). */
  content: unknown;
  listings: ArchetypeListingRow[];
  logoUrl?: string | undefined;
}

export interface ArchetypeWriteResult {
  tenantId: string;
  subdomain: string;
}

// The skin owns all styling, so this is a constraint-satisfying placeholder only.
const PLACEHOLDER_STYLE_SHEET = {
  palette: [{ name: 'primary', value: '#000000', character: 'placeholder — archetype styles from its skin' }],
  fonts: [{ name: 'body', family: 'system-ui', source: 'system', weights: [400], fallback: 'system-ui', character: 'placeholder' }],
  textures: [],
};

function toJson(value: unknown): Json {
  return value as Json;
}

function isResult(value: unknown): value is ArchetypeWriteResult {
  if (typeof value !== 'object' || value === null) return false;
  const r = value as Record<string, unknown>;
  return typeof r['tenantId'] === 'string' && typeof r['subdomain'] === 'string';
}

export async function writeArchetypeStorefront(
  input: ArchetypeWriteInput,
): Promise<ArchetypeWriteResult> {
  const envelope = {
    kind: 'archetype' as const,
    archetypeKey: input.archetypeKey,
    skinKey: input.skinKey,
    mood: input.mood,
    content: input.content,
  };

  const pages = [
    {
      slug: '/',
      pageType: 'home',
      title: input.shopName,
      metaDescription: null,
      isInNav: false,
      navLabel: null,
      navPosition: null,
      layoutTree: { root: envelope, meta: { title: input.shopName } },
    },
  ];

  const listings = input.listings.map((l) => ({
    slug: l.slug,
    name: l.name,
    short_description: l.short_description,
    description: l.description,
    base_price_cents: l.base_price_cents,
    image_url: l.image_url ?? '',
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
      tenantTypes: input.tenantTypes.length > 0 ? input.tenantTypes : ['seller'],
      styleSheet: PLACEHOLDER_STYLE_SHEET,
      pages,
      collections: [],
      listings,
      subscriptions: [],
      logoUrl: input.logoUrl ?? '',
    }),
  });

  if (error !== null) {
    throw new Error(`Failed to write archetype storefront: ${error.message}`);
  }
  if (!isResult(data)) {
    throw new Error('write_tenant_storefront_layout returned an unexpected shape');
  }
  return { tenantId: data.tenantId, subdomain: data.subdomain };
}
