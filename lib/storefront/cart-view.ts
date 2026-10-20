/**
 * The cart page's data: the pieces in the shopper's cart cookie, priced and
 * pictured from the live catalog, with the shop's running sale or the shopper's
 * code taken off. A piece that is gone from the catalog drops out; one that is
 * adopted or can't go in a cart stays, marked unavailable, so the shopper sees
 * what happened to it.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import type { CartView } from '@/lib/archetypes/content';
import { formatPrice, loadProductsByIds } from './catalog';
import { cartLine, type LoadedPiece } from './order-request';
import { cartEntry, splitEntry } from './cart';
import { bestDiscount, checkCode, runningSale, salePriceCents, type Promotion } from './promotions';
import { loadShopPromotions } from './promotions-load';

export function toCartView(
  loaded: readonly LoadedPiece[],
  promo: { promos: readonly Promotion[]; today: string; codesOn: boolean; code: string | null } = { promos: [], today: '', codesOn: false, code: null },
  /** The cart's entries in order (a piece, or a piece and its choice). Absent: one line per piece loaded. */
  entries?: readonly string[],
): CartView {
  const sale = runningSale(promo.promos, promo.today);
  const prices: number[] = [];
  const keys = entries ?? loaded.flatMap((p) => (p.view.id === undefined ? [] : [cartEntry(p.view.id)]));
  const lines = keys.flatMap((entry) => {
    const p = loaded.find((x) => x.view.id === splitEntry(entry).listingId);
    if (p === undefined || p.view.id === undefined) return [];
    const line = cartLine(entry, loaded);
    const available = line !== null;
    const cents = line?.priceCents ?? p.priceCents;
    if (available) prices.push(cents);
    const onSale = available && sale !== null && sale.percentOff !== null;
    return [
      {
        id: entry,
        slug: p.view.slug,
        name: line?.name ?? p.view.name,
        price: formatPrice(cents),
        salePrice: onSale ? formatPrice(salePriceCents(cents, sale.percentOff ?? 0)) : undefined,
        photo: p.view.media.find((m) => m.kind === 'image'),
        available,
      },
    ];
  });
  const subtotal = prices.reduce((s, c) => s + c, 0);

  const entered = promo.code === null || promo.code === '' ? null : promo.code;
  const checked = entered === null ? null : checkCode(promo.promos, entered, promo.today);
  const discount = bestDiscount(prices, sale, checked?.ok === true ? checked.promo : null);
  let code: CartView['code'];
  if (entered !== null && checked !== null) {
    if (!checked.ok) code = { value: entered, applied: false, message: checked.error };
    else if (discount?.source === 'code') code = { value: checked.promo.code ?? entered, applied: true };
    else code = { value: checked.promo.code ?? entered, applied: false, message: 'The sale already saves you more than this code.' };
  }

  return {
    lines,
    subtotal: formatPrice(subtotal),
    discount: discount === null ? undefined : { label: discount.label, amount: formatPrice(discount.cents) },
    total: formatPrice(subtotal - (discount?.cents ?? 0)),
    codes: promo.codesOn,
    code,
  };
}

export async function loadCartView(
  db: SupabaseClient<Database>,
  tenantId: string,
  entries: readonly string[],
  code: string | null = null,
): Promise<CartView> {
  const pieceIds = [...new Set(entries.map((e) => splitEntry(e).listingId))];
  const [loaded, promo] = await Promise.all([loadProductsByIds(db, tenantId, pieceIds), loadShopPromotions(db, tenantId)]);
  const codesOn = promo.promos.some((p) => p.kind === 'code');
  return toCartView(loaded, { ...promo, codesOn, code }, entries);
}
