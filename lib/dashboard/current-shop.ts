/**
 * Resolve the shop the dashboard is acting on. A maker logs in once and reaches
 * any shop they own (D59 — one global login, roles per shop). For now we act on
 * their first owned shop; a shop picker for makers who own more than one is a
 * deliberate later add (the auth plan's multi-shop case) — tracked, not faked.
 */
import { headers } from 'next/headers';
import { requireUser } from '@/lib/auth/session';
import { getUserShops, type ShopSummary } from '@/lib/auth/membership';

/**
 * The shop the dashboard acts on. When the maker is on a shop's own subdomain
 * (the proxy resolved a tenant → `x-tenant-id`), act on THAT shop — but only if
 * they actually own it, so a logged-in maker can't reach someone else's
 * dashboard through their storefront. On the app host (no tenant context), act on
 * their first owned shop (the multi-shop picker is a later add). Null when they
 * own no shop, or own none matching the site they're on. Redirects to /signin if
 * logged out.
 */
export async function getCurrentShop(): Promise<ShopSummary | null> {
  const user = await requireUser();
  const shops = await getUserShops(user.id);

  const tenantId = (await headers()).get('x-tenant-id');
  if (tenantId !== null) {
    return shops.find((s) => s.tenantId === tenantId) ?? null;
  }
  return shops[0] ?? null;
}
