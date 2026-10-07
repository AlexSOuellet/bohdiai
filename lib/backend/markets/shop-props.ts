/** The market shop's part of a market's backend page: the live pieces she could
 *  bring and the market's own address (what its QR code opens). */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { listProducts } from '@/lib/backend/catalog/queries';

export type ShopPick = { id: string; name: string; photoUrl: string | null; soldOut: boolean };

export async function shopPicks(db: SupabaseClient<Database>, tenantId: string): Promise<ShopPick[]> {
  return (await listProducts(db, tenantId))
    .filter((p) => p.status === 'active')
    .map((p) => ({ id: p.id, name: p.name, photoUrl: p.photoUrl, soldOut: p.soldOut }));
}

/** The page buyers scan to: /market/<id> on the shop's own address. */
export function marketPageUrl(siteOrigin: string, eventId: string): string {
  return `${siteOrigin}/market/${eventId}`;
}
