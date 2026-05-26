/** Derive a URL-safe subdomain slug from a shop name. */
export function toSubdomain(shopName: string): string {
  return shopName
    .toLowerCase()
    .replace(/[''`']/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63);
}
