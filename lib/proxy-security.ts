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
