/**
 * Persist an archetype store — clean, purpose-built (no borrowed layout-engine
 * RPC, no style sheet). Writes a tenant, one home page carrying the archetype
 * envelope (archetypeKey / lookKey / mood / content), and the catalog as real
 * listing rows. The archetype dresses entirely from its look, so there is no
 * style_sheet anywhere in this path.
 */
import { supabaseAdmin } from '@/lib/supabase';
import type { ProductView } from '@/lib/archetypes/content';

export interface ArchetypeWriteInput {
  subdomain: string;
  shopName: string;
  nicheSlug: string;
  moodKey: string;
  tenantTypes: string[];
  archetypeKey: string;
  lookKey: string;
  mood: string;
  /** Validated archetype content with generated media URLs already folded in. */
  content: unknown;
  /** Separate catalog rows (empty for archetypes that embed products in content). */
  products: ProductView[];
  logoUrl?: string | undefined;
}

export interface ArchetypeWriteResult {
  tenantId: string;
  subdomain: string;
}

type LooseClient = {
  from: (t: string) => {
    insert: (r: unknown) => {
      select: (c: string) => { single: () => Promise<{ data: { id: string } | null; error: { message: string } | null }> };
    } & Promise<{ error: { message: string } | null }>;
  };
};

export async function writeArchetypeStorefront(
  input: ArchetypeWriteInput,
): Promise<ArchetypeWriteResult> {
  const db = supabaseAdmin() as unknown as LooseClient;

  const { data: tenant, error: tenantErr } = await db
    .from('tenants')
    .insert({
      subdomain: input.subdomain,
      business_name: input.shopName,
      tier: 'basic',
      types: input.tenantTypes.length > 0 ? input.tenantTypes : ['seller'],
      primary_niche: input.nicheSlug,
      mood_key: input.moodKey,
      niche_from_list: true,
      status: 'active',
      logo_url: input.logoUrl && input.logoUrl !== '' ? input.logoUrl : null,
    })
    .select('id')
    .single();
  if (tenantErr || !tenant) throw new Error(`writeArchetypeStorefront: tenant insert failed — ${tenantErr?.message ?? 'no id'}`);
  const tenantId = tenant.id;

  const envelope = {
    root: {
      kind: 'archetype' as const,
      archetypeKey: input.archetypeKey,
      lookKey: input.lookKey,
      mood: input.mood,
      content: input.content,
    },
    meta: { title: input.shopName },
  };

  const { error: pageErr } = await db.from('content_pages').insert({
    tenant_id: tenantId,
    slug: '/',
    page_type: 'home',
    title: input.shopName,
    status: 'published',
    is_system_page: true,
    is_in_nav: false,
    layout_tree: envelope,
  });
  if (pageErr) throw new Error(`writeArchetypeStorefront: home page insert failed — ${pageErr.message}`);

  if (input.products.length > 0) {
    const now = new Date().toISOString();
    const rows = input.products.map((p) => ({
      tenant_id: tenantId,
      listing_type: 'product',
      slug: p.slug,
      name: p.name,
      short_description: p.shortDescription ?? null,
      description: p.description,
      base_price_cents: priceToCents(p.price),
      status: 'active',
      is_preview: true,
      requires_shipping: true,
      metadata: { placeholder: true, image_url: p.media[0]?.url ?? '' },
      published_at: now,
    }));
    const { error: listErr } = await db.from('listings').insert(rows);
    if (listErr) throw new Error(`writeArchetypeStorefront: listings insert failed — ${listErr.message}`);
  }

  return { tenantId, subdomain: input.subdomain };
}

/** Parse a display price ("$48", "from $40") back to cents for the listing row. */
function priceToCents(price: string): number {
  const m = price.match(/(\d+(?:\.\d{1,2})?)/);
  if (!m) return 0;
  return Math.round(parseFloat(m[1]!) * 100);
}
