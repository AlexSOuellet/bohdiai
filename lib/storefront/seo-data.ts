import 'server-only';
import { supabaseAdmin } from '@/lib/supabase';
import type { TenantSeoFacts } from './seo';
import { loadHomeEnvelope } from './load-envelope';
import { seoFromHomes, withHomesSeo } from './seo-homes';

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
  // A site on the newer format writes nothing for search in its page record: the
  // homes fill what the record doesn't say.
  if (facts.seoDescription === undefined || facts.imageUrl === undefined || facts.tagline === undefined) {
    return withHomesSeo(facts, seoFromHomes(await loadHomesSeoRows(db, tenantId)));
  }
  return facts;
}

async function loadHomesSeoRows(db: ReturnType<typeof supabaseAdmin>, tenantId: string): Promise<Parameters<typeof seoFromHomes>[0]> {
  const [moment, firstPhoto, profile, firstPiece] = await Promise.all([
    db.from('site_moments').select('kicker, media_upload_id').eq('tenant_id', tenantId).maybeSingle(),
    db.from('site_moment_photos').select('upload_id').eq('tenant_id', tenantId).order('position').limit(1).maybeSingle(),
    db.from('site_profiles').select('headline, makes').eq('tenant_id', tenantId).maybeSingle(),
    db.from('listings').select('media_ids').eq('tenant_id', tenantId).eq('status', 'active').is('deleted_at', null).order('created_at').limit(1).maybeSingle(),
  ]);
  const ids = [moment.data?.media_upload_id ?? null, firstPhoto.data?.upload_id ?? null, firstPiece.data?.media_ids[0] ?? null];
  const wanted = ids.filter((id): id is string => id !== null);
  const { data: ups } = wanted.length === 0 ? { data: [] } : await db.from('uploads').select('id, public_url, mime_type').in('id', wanted);
  const byId = new Map((ups ?? []).flatMap((u) => (u.public_url === null ? [] : [[u.id, { url: u.public_url, mime: u.mime_type }] as const])));
  return {
    momentKicker: moment.data?.kicker ?? null,
    profileHeadline: profile.data?.headline ?? null,
    makes: profile.data?.makes ?? null,
    pictures: ids.map((id) => (id === null ? null : byId.get(id) ?? null)),
  };
}
