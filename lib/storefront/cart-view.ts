/**
 * The cart page's data: the pieces in the shopper's cart cookie, priced and
 * pictured from the live catalog. A piece that is gone from the catalog drops
 * out; one that is adopted or can't go in a cart stays, marked unavailable, so
 * the shopper sees what happened to it.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import type { CartView } from '@/lib/archetypes/content';
import { formatPrice, loadProductsByIds } from './catalog';
import { isCartable, type LoadedPiece } from './order-request';

export function toCartView(loaded: readonly LoadedPiece[]): CartView {
  let total = 0;
  const lines = loaded.flatMap((p) => {
    if (p.view.id === undefined) return [];
    const available = isCartable(p);
    if (available) total += p.priceCents;
    return [{ id: p.view.id, slug: p.view.slug, name: p.view.name, price: p.view.price, photo: p.view.media.find((m) => m.kind === 'image'), available }];
  });
  return { lines, total: formatPrice(total) };
}

export async function loadCartView(db: SupabaseClient<Database>, tenantId: string, ids: readonly string[]): Promise<CartView> {
  return toCartView(await loadProductsByIds(db, tenantId, ids));
}
