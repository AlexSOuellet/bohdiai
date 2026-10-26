import 'server-only';
/**
 * The cart's order, saved as pending: priced from the catalog (never from the
 * shopper's browser), the same sale-or-code choice the cart showed worked out again
 * from the shop's own promotions, then placed in one step by the database (which
 * checks every piece can still be had and counts the code's use). Shared by "send
 * my order" (no payment) and paying online. The shop comes from the host, never
 * from the body.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { loadSiteFeatures } from '@/lib/backend/features';
import { loadProductsByIds } from '@/lib/storefront/catalog';
import { orderLines, type OrderLine, type OrderRequestInput } from '@/lib/storefront/order-request';
import { splitEntry } from '@/lib/storefront/cart';
import { bestDiscount, checkCode, runningSale } from '@/lib/storefront/promotions';
import { loadShopPromotions } from '@/lib/storefront/promotions-load';

type Db = SupabaseClient<Database>;

export type PlacedOrder = {
  orderId: string;
  orderNumber: string;
  shopName: string;
  contactEmail: string;
  currency: string;
  lines: OrderLine[];
  subtotalCents: number;
  discount: { label: string; cents: number } | null;
  totalCents: number;
};

/** Why an order couldn't be placed, with the status to answer and any pieces to take out. */
export type PlaceRefusal = { status: number; error: string; unavailable?: string[] };

export async function placeCartOrder(db: Db, tenantId: string, input: OrderRequestInput, sendWords: { verb: string }, buyerProfileId: string | null = null): Promise<{ ok: true; order: PlacedOrder } | { ok: false; refusal: PlaceRefusal }> {
  const { data: tenant, error: lookupError } = await db.from('tenants').select('business_name, contact_email, currency').eq('id', tenantId).eq('status', 'active').maybeSingle();
  if (lookupError !== null) throw new Error(`tenant lookup failed: ${lookupError.message}`);
  if (tenant === null) return { ok: false, refusal: { status: 404, error: 'Shop not found.' } };
  if (!(await loadSiteFeatures(db, tenantId)).has('cart')) return { ok: false, refusal: { status: 404, error: 'This shop isn’t taking orders online.' } };
  if (tenant.contact_email === null || tenant.contact_email === '') {
    return { ok: false, refusal: { status: 503, error: 'This shop can’t take orders right now. Please get in touch another way.' } };
  }

  const pieceIds = [...new Set(input.listingIds.map((e) => splitEntry(e).listingId))];
  const priced = orderLines(input.listingIds, await loadProductsByIds(db, tenantId, pieceIds));
  if (!priced.ok) {
    return {
      ok: false,
      refusal: { status: 409, error: `No longer available: ${priced.unavailable.join(', ')}. Take it out of your cart to ${sendWords.verb} the rest.`, unavailable: priced.unavailable },
    };
  }

  const promo = await loadShopPromotions(db, tenantId);
  let codePromo = null;
  if (input.code !== '') {
    const checked = checkCode(promo.promos, input.code, promo.today);
    if (!checked.ok) return { ok: false, refusal: { status: 409, error: `${checked.error} Remove it from your cart to ${sendWords.verb} your order.` } };
    codePromo = checked.promo;
  }
  const discount = bestDiscount(
    priced.lines.map((l) => l.priceCents),
    runningSale(promo.promos, promo.today),
    codePromo,
  );

  const { data: orderNumber, error: placeError } = await db.rpc('place_order_request', {
    p_tenant_id: tenantId,
    p_customer_name: input.name,
    p_customer_email: input.email,
    p_customer_phone: input.phone,
    p_customer_note: input.note,
    p_items: priced.lines.map((l) => ({
      listing_id: l.listingId,
      ...(l.variantId === null ? {} : { listing_variant_id: l.variantId, option: l.option }),
      name: l.name,
      unit_price_cents: l.priceCents,
    })),
    p_discount_cents: discount?.cents ?? 0,
    ...(discount === null ? {} : { p_discount_label: discount.label }),
    ...(discount?.promotionId == null ? {} : { p_promotion_id: discount.promotionId }),
  });
  if (placeError !== null) {
    if (placeError.code === 'P0021') return { ok: false, refusal: { status: 409, error: 'Something in your cart was just taken. Please check your cart and try again.' } };
    if (placeError.code === 'P0022') return { ok: false, refusal: { status: 409, error: `That discount code just ended or was used up. Remove it from your cart to ${sendWords.verb} your order.` } };
    throw new Error(`place_order_request failed: ${placeError.message}`);
  }

  const { data: row, error: rowError } = await db.from('orders').select('id, total_cents').eq('tenant_id', tenantId).eq('order_number', orderNumber).single();
  if (rowError !== null) throw new Error(`placed order lookup failed: ${rowError.message}`);
  // A signed-in buyer (buyer accounts, Full) finds the order in My account.
  if (buyerProfileId !== null) {
    const { error: linkError } = await db.from('orders').update({ customer_profile_id: buyerProfileId }).eq('id', row.id).eq('tenant_id', tenantId);
    if (linkError !== null) throw new Error(`linking the order to the buyer failed: ${linkError.message}`);
  }

  return {
    ok: true,
    order: {
      orderId: row.id,
      orderNumber,
      shopName: tenant.business_name,
      contactEmail: tenant.contact_email,
      currency: (tenant.currency || 'USD').toUpperCase(),
      lines: priced.lines,
      subtotalCents: priced.subtotalCents,
      discount: discount === null ? null : { label: discount.label, cents: discount.cents },
      totalCents: row.total_cents,
    },
  };
}
