import 'server-only';
import { headers } from 'next/headers';
import type { Metadata } from 'next';
import { loadTenantSeoFacts } from './seo-data';
import { buildTenantMetadata, type PageSeo, type TenantSeoFacts } from './seo';

/** Read the tenant context the proxy set on the request, or null on the apex. */
async function tenantContext(): Promise<{ tenantId: string; subdomain: string } | null> {
  const h = await headers();
  const tenantId = h.get('x-tenant-id');
  if (tenantId === null) return null;
  return { tenantId, subdomain: h.get('x-tenant-subdomain') ?? '' };
}

/** The shop's SEO facts for the current request, or null when not a tenant page. */
export async function storefrontSeoFacts(): Promise<TenantSeoFacts | null> {
  const ctx = await tenantContext();
  if (ctx === null) return null;
  return (
    (await loadTenantSeoFacts(ctx.tenantId, ctx.subdomain)) ?? {
      shopName: ctx.subdomain || 'Shop',
      subdomain: ctx.subdomain,
    }
  );
}

/**
 * Build a storefront page's `<title>`/meta/OG/canonical from the tenant context.
 * Call from a route's `generateMetadata`. Returns {} on the apex (no tenant).
 */
export async function storefrontMetadata(page: PageSeo): Promise<Metadata> {
  const facts = await storefrontSeoFacts();
  if (facts === null) return {};
  return buildTenantMetadata(facts, page);
}
