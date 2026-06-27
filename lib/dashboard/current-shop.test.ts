import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ShopSummary } from '@/lib/auth/membership';

let headerValue: string | null = null;
let shops: ShopSummary[] = [];

vi.mock('next/headers', () => ({
  headers: async () => ({ get: () => headerValue }),
}));
vi.mock('@/lib/auth/session', () => ({
  requireUser: async () => ({ id: 'user-1' }),
}));
vi.mock('@/lib/auth/membership', () => ({
  getUserShops: async () => shops,
}));

import { getCurrentShop } from './current-shop';

const shopA: ShopSummary = { tenantId: 'a', subdomain: 'shop-a', businessName: 'A', role: 'admin' } as ShopSummary;
const shopB: ShopSummary = { tenantId: 'b', subdomain: 'shop-b', businessName: 'B', role: 'admin' } as ShopSummary;

beforeEach(() => {
  headerValue = null;
  shops = [];
});

describe('getCurrentShop', () => {
  it('acts on the first owned shop on the app host (no tenant context)', async () => {
    shops = [shopA, shopB];
    expect(await getCurrentShop()).toBe(shopA);
  });

  it('returns null on the app host when the maker owns no shop', async () => {
    shops = [];
    expect(await getCurrentShop()).toBeNull();
  });

  it("acts on the storefront's own shop when the maker owns it", async () => {
    headerValue = 'b';
    shops = [shopA, shopB];
    expect(await getCurrentShop()).toBe(shopB);
  });

  it("returns null on a storefront the maker doesn't own (can't reach another's dashboard)", async () => {
    headerValue = 'someone-else';
    shops = [shopA, shopB];
    expect(await getCurrentShop()).toBeNull();
  });
});
