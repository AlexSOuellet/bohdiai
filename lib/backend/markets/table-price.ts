import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { loadProductsByIds } from '@/lib/storefront/catalog';
import { runningSale, salePriceCents } from '@/lib/storefront/promotions';
import { loadShopPromotions } from '@/lib/storefront/promotions-load';

/** What one of a piece (or one option of it) sells for at the table today: the
 *  option's own price when it has one, less a running sale. The market app records
 *  sales at this price, and a card sale sends Square the same total. */
export async function tablePrice(
  db: SupabaseClient<Database>,
  tenantId: string,
  listingId: string,
  variantId: string | null,
): Promise<{ cents: number; name: string } | { error: string }> {
  const [piece] = await loadProductsByIds(db, tenantId, [listingId]);
  if (piece === undefined) return { error: 'That piece isn’t on your site any more.' };
  let unit = piece.priceCents;
  if (variantId !== null) {
    const { data: v, error: vErr } = await db.from('listing_variants').select('price_cents').eq('id', variantId).eq('listing_id', listingId).maybeSingle();
    if (vErr !== null || v === null) return { error: 'That option isn’t on your site any more.' };
    unit = v.price_cents ?? piece.priceCents;
  }
  const promo = await loadShopPromotions(db, tenantId);
  const sale = runningSale(promo.promos, promo.today);
  return { cents: sale?.percentOff == null ? unit : salePriceCents(unit, sale.percentOff), name: piece.view.name };
}
