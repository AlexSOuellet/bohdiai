import 'server-only';
import { supabaseAdmin } from '@/lib/supabase';
import type { TenantSeoFacts } from './seo';
import { loadHomeEnvelope } from './load-envelope';

/** A loose view of the home envelope content we read for SEO. */
interface EnvelopeContent {
  shopName?: unknown;
  moment?: { eyebrow?: unknown; media?: { kind?: unknown; url?: unknown; poster?: unknown } };
  seo?: { title?: unknown; description?: unknown; image?: unknown };
}

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() !== '' ? v : undefined;
}

/** A still image usable as a share card: hero still, or a video poster. (A bare
 *  video has no still, so we fall through to the generated OG image.) */
function heroStill(content: EnvelopeContent): string | undefined {
  const m = content.moment?.media;
  if (!m) return undefined;
  if (m.kind === 'still') return str(m.url);
  return str(m.poster);
}

/**
 * Assemble everything the SEO builders need for a tenant, in as few round-trips
 * as possible. Returns null only when the tenant has no published home — callers
 * fall back to a minimal title from the subdomain.
 */
export async function loadTenantSeoFacts(
  tenantId: string,
  subdomain: string,
): Promise<TenantSeoFacts | null> {
  const db = supabaseAdmin();

  // Envelope goes through the shared per-request cache — the same request
  // hits it from the layout's JSON-LD, this SEO facts loader, and the page
  // component itself; the cache guarantees ONE DB round-trip. (Audit #79.)
  const [{ data: tenant }, envelope] = await Promise.all([
    db
      .from('tenants')
      .select('business_name, service_areas, logo_url, contact_email, phone, primary_niche')
      .eq('id', tenantId)
      .maybeSingle(),
    loadHomeEnvelope(tenantId),
  ]);

  const content: EnvelopeContent =
    envelope !== null
      ? ((envelope['content'] as EnvelopeContent) ?? {})
      : {};

  const shopName = str(content.shopName) ?? str(tenant?.business_name) ?? subdomain;

  // Niche label for the composed (non-authored) title path.
  let nicheLabel: string | undefined;
  if (tenant?.primary_niche) {
    const { data: niche } = await db
      .from('niches')
      .select('display_name')
      .eq('slug', tenant.primary_niche)
      .maybeSingle();
    nicheLabel = str(niche?.display_name);
  }

  const facts: TenantSeoFacts = {
    shopName,
    subdomain,
    tagline: str(content.moment?.eyebrow),
    nicheLabel,
    serviceAreas: tenant?.service_areas ?? undefined,
    seoTitle: str(content.seo?.title),
    seoDescription: str(content.seo?.description),
    // Share image priority: an authored/generated card → the maker's logo → a
    // hero still. (A bare video has no still, so such tenants have no card yet.)
    imageUrl: str(content.seo?.image) ?? str(tenant?.logo_url) ?? heroStill(content),
    contactEmail: str(tenant?.contact_email),
    phone: str(tenant?.phone),
  };
  return facts;
}
