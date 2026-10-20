/** The market shop's part of a market's backend page: the live pieces she could
 *  bring (with what she has on hand, and their options), and the market's own
 *  address (what its QR code opens). */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { listProducts } from '@/lib/backend/catalog/queries';
import { optionLabel } from '@/lib/market/stock';

export { optionLabel };

/** One option of a piece (a colour, a size): its words and what's on hand (null: not counted). */
export type ShopPickOption = { id: string; label: string; onHand: number | null };

export type ShopPick = {
  id: string;
  name: string;
  photoUrl: string | null;
  soldOut: boolean;
  /** What she has on hand of the piece itself (null: not counted, or it has options). */
  onHand: number | null;
  /** Its options, when it has them; each is counted on its own. */
  options: ShopPickOption[];
};

export async function shopPicks(db: SupabaseClient<Database>, tenantId: string): Promise<ShopPick[]> {
  const live = (await listProducts(db, tenantId)).filter((p) => p.status === 'active');
  if (live.length === 0) return [];
  const { data, error } = await db
    .from('listings')
    .select('id, inventory_count, listing_variants(id, option_combination, inventory_count, status)')
    .eq('tenant_id', tenantId)
    .in('id', live.map((p) => p.id));
  if (error !== null) throw new Error(`Could not load what you have on hand: ${error.message}`);
  const stock = new Map((data ?? []).map((r) => [r.id, r]));
  return live.map((p) => {
    const row = stock.get(p.id);
    const options = (row?.listing_variants ?? [])
      .filter((v) => v.status === 'active')
      .map((v) => ({ id: v.id, label: optionLabel(v.option_combination), onHand: v.inventory_count }));
    return { id: p.id, name: p.name, photoUrl: p.photoUrl, soldOut: p.soldOut, onHand: options.length > 0 ? null : (row?.inventory_count ?? null), options };
  });
}

/** The page buyers scan to: /market/<id> on the shop's own address. */
export function marketPageUrl(siteOrigin: string, eventId: string): string {
  return `${siteOrigin}/market/${eventId}`;
}
