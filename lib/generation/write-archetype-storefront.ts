/**
 * Persist an archetype store — clean, purpose-built (no borrowed layout-engine
 * RPC, no style sheet). Writes a tenant, one home page carrying the archetype
 * envelope (archetypeKey / lookKey / mood / content), and the catalog as real
 * listing rows. The archetype dresses entirely from its look, so there is no
 * style_sheet anywhere in this path.
 */
import { supabaseAdmin } from '@/lib/supabase';
import type { Json } from '@/lib/database.types';
import type { ProductView } from '@/lib/archetypes/content';

export interface ArchetypeWriteInput {
  subdomain: string;
  shopName: string;
  /** The chosen niche slug, or null for an "Other" maker who described their own craft. */
  primaryNiche: string | null;
  /** True when the maker picked a niche from the list; false for the "Other" path. */
  nicheFromList: boolean;
  /** The maker's typed description of what they make ("Other" path); null otherwise. */
  nicheDescription: string | null;
  moodKey: string;
  tenantTypes: string[];
  archetypeKey: string;
  lookKey: string;
  mood: string;
  /** The maker's TRUE catalog size (from onboarding) — drives treatment selection. */
  catalogSize: number;
  /** Validated archetype content with generated media URLs already folded in. */
  content: unknown;
  /** Separate catalog rows (empty for archetypes that embed products in content). */
  products: ProductView[];
}

export interface ArchetypeWriteResult {
  tenantId: string;
  subdomain: string;
}

/**
 * Transactional in spirit (A2): insert the tenant as `status: 'draft'` so the
 * subdomain resolver (which matches `status=eq.active`) can't see a half-built
 * store. Only flip to `'active'` after content_pages AND listings have
 * landed. If any intermediate write fails, the tenant stays in `'draft'` —
 * the store is invisible to visitors and the row is identifiable as an orphan
 * for cleanup, instead of going live half-built.
 *
 * This is the simpler alternative to a Postgres RPC, per the audit fix plan.
 */
export async function writeArchetypeStorefront(
  input: ArchetypeWriteInput,
): Promise<ArchetypeWriteResult> {
  const db = supabaseAdmin();

  const { data: tenant, error: tenantErr } = await db
    .from('tenants')
    .insert({
      subdomain: input.subdomain,
      business_name: input.shopName,
      tier: 'basic',
      types: input.tenantTypes.length > 0 ? input.tenantTypes : ['seller'],
      primary_niche: input.primaryNiche,
      mood_key: input.moodKey,
      niche_from_list: input.nicheFromList,
      niche_description: input.nicheDescription,
      // Draft until ALL writes land; only the final flip publishes the store.
      status: 'draft',
    })
    .select('id')
    .single();
  if (tenantErr || !tenant)
    throw new Error(
      `writeArchetypeStorefront: tenant insert failed — ${tenantErr?.message ?? 'no id'}`,
    );
  const tenantId = tenant.id;

  const envelope = {
    root: {
      kind: 'archetype' as const,
      archetypeKey: input.archetypeKey,
      lookKey: input.lookKey,
      accentOverride: null,
      mood: input.mood,
      catalogSize: input.catalogSize,
      // `content` is type-erased to `unknown` at the archetype boundary (it's
      // re-validated per-archetype at render time). It's plain validated data
      // headed for the jsonb `layout_tree` column, so widen it to Json here.
      content: input.content as Json,
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
  if (pageErr)
    throw new Error(`writeArchetypeStorefront: home page insert failed — ${pageErr.message}`);

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
    if (listErr)
      throw new Error(`writeArchetypeStorefront: listings insert failed — ${listErr.message}`);
  }

  // All writes landed — publish the store. The resolver matches `status=eq.active`,
  // so only this flip makes the subdomain reachable.
  const { error: publishErr } = await db
    .from('tenants')
    .update({ status: 'active' })
    .eq('id', tenantId);
  if (publishErr)
    throw new Error(
      `writeArchetypeStorefront: tenant publish (status→active) failed — ${publishErr.message}`,
    );

  return { tenantId, subdomain: input.subdomain };
}

/** Parse a display price ("$48", "from $40") back to cents for the listing row. */
function priceToCents(price: string): number {
  const m = price.match(/(\d+(?:\.\d{1,2})?)/);
  if (!m) return 0;
  return Math.round(parseFloat(m[1]!) * 100);
}
