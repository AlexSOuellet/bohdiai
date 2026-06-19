/**
 * Proxy boundary helpers — keep tenant isolation a real boundary, not a
 * forgeable hint.
 *
 * The proxy sets `x-tenant-id` / `x-tenant-subdomain` on its own after
 * resolving the subdomain to a tenant. Without sanitizing first, an inbound
 * request carrying a forged header would propagate unchecked into every
 * server component and API handler that reads it.
 */

const FORGEABLE_TENANT_HEADERS = ['x-tenant-id', 'x-tenant-subdomain'] as const;

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
 * Pick the hostname the proxy resolves a tenant from.
 *
 * Storefront subdomains can't get their own TLS cert from our host while DNS
 * lives on Cloudflare, so a Cloudflare edge snippet proxies `*.bohdiai.com`
 * requests to the apex (which has a valid cert) and forwards the real shop host
 * in a custom `x-bohdi-shop` header (not `x-forwarded-host`, which Vercel's edge
 * manages itself). When that header is present we resolve against it;
 * otherwise we use the actual `host`. Resolving a forged value only ever yields
 * a public storefront or nothing, so this widens no real boundary — the
 * internal `x-tenant-id` is still set by the proxy alone (see sanitize above).
 */
export function resolveProxyHost(forwardedHost: string | null, host: string | null): string {
  const forwarded = forwardedHost?.trim();
  if (forwarded) return forwarded;
  return host ?? '';
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
