/**
 * Proxy boundary helpers — keep tenant isolation a real boundary, not a
 * forgeable hint.
 *
 * The proxy sets `x-tenant-id` / `x-tenant-subdomain` on its own after
 * resolving the subdomain to a tenant. Without sanitizing first, an inbound
 * request carrying a forged header would propagate unchecked into every
 * server component and API handler that reads it.
 */

// x-bohdi-shop is the retired Vercel-era shop header (see requestHost).
const FORGEABLE_TENANT_HEADERS = ['x-tenant-id', 'x-tenant-subdomain', 'x-bohdi-shop'] as const;

/**
 * Drop forgeable tenant-context headers from inbound request headers.
 *
 * Call this on EVERY request before the proxy decides whether to set the
 * headers itself. After this, the only way `x-tenant-id` reaches downstream
 * code is if the proxy explicitly set it from a resolved tenant.
 */
export function sanitizeTenantHeaders(headers: Headers): void {
  for (const name of FORGEABLE_TENANT_HEADERS) headers.delete(name);
}

/**
 * The hostname the middleware resolves a tenant from: the real `Host` header.
 *
 * On Vercel, a Cloudflare worker (`shop-proxy`) forwarded shop subdomains to
 * the apex and passed the real shop in `x-bohdi-shop`, which the app trusted,
 * so anyone could send it and pose as any shop (July audit, HIGH). On Cloudflare
 * every subdomain reaches the app directly with its own Host, so that header is
 * ignored here and stripped by sanitizeTenantHeaders.
 */
export function requestHost(headers: Headers): string {
  return headers.get('host') ?? '';
}

/**
 * Return true when a request targets the internal `/storefront/*` rewrite
 * path on the apex (no subdomain). Apex visitors should never see internal
 * storefront URLs — those exist only as the rewrite target for resolved
 * tenant subdomains.
 */
export function isUnreachableStorefrontPath(
  pathname: string,
  subdomain: string | null,
): boolean {
  return subdomain === null && pathname.startsWith('/storefront');
}

/**
 * Return true when the hostname is the maker dashboard host (`app.bohdiai.com`
 * or `app.localhost` in dev). The backend lives under `/manage/*`; the bare
 * app root redirects there (see middleware.ts). This is a host check only — it does
 * NOT gate auth (the backend routes do that themselves).
 */
export function isAppHost(hostname: string | null): boolean {
  const host = (hostname ?? '').split(':')[0] ?? '';
  return host === 'app.bohdiai.com' || host === 'app.localhost';
}

/**
 * Surfaces switched off while every site is built and edited by hand (the
 * automated builder is on hold — decided 2026-09-29): onboarding, the Make It
 * Yours walk, the old maker dashboard/editor, Cowork's library upload, and the
 * archetype test pages. The code stays; the middleware answers 404 on every
 * host, so nothing behind them is reachable. Server Actions post to their page's
 * path, so they are covered too. Take a path off this list to turn it back on.
 */
const DORMANT_PREFIXES = [
  '/onboarding',
  '/api/onboarding',
  '/make-it-yours',
  '/dashboard',
  '/api/library',
  '/archetype-test',
] as const;

/** True when `pathname` is, or sits under, a switched-off surface (whole segments only). */
export function isDormantPath(pathname: string): boolean {
  return DORMANT_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/**
 * The Supabase REST query that turns a subdomain into the shop it serves: an
 * active shop that hasn't been deleted. Lowercased to match the unique index
 * on lower(subdomain).
 */
export function tenantLookupUrl(supabaseUrl: string, subdomain: string): string {
  return (
    `${supabaseUrl}/rest/v1/tenants` +
    `?select=id` +
    `&subdomain=eq.${encodeURIComponent(subdomain.toLowerCase())}` +
    `&status=eq.active` +
    `&deleted_at=is.null` +
    `&limit=1`
  );
}

/**
 * www.bohdiai.com is not a second copy of the site: send it to the bare domain,
 * path and query intact (Vercel did this before the move to Cloudflare).
 * Returns the redirect target, or null when the host needs no redirect.
 */
export function apexRedirect(hostname: string, url: URL): string | null {
  const host = hostname.split(':')[0] ?? '';
  if (host !== 'www.bohdiai.com') return null;
  return `https://bohdiai.com${url.pathname}${url.search}`;
}
