'use server';

/**
 * Today at the table — the owner records a sale herself (a buyer who just hands
 * her cash), and confirms or turns away a buyer's hold. Needs only the market
 * shop, so it works on Maker Market too (no online orders there).
 */
import { revalidatePath } from 'next/cache';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { logger } from '@/lib/logger';
import { tablePrice } from './table-price';
import type { DoneResult } from '../catalog/results';

/** Card by hand is the maker's own record of a sale she rang up in Square herself. */
const METHODS = ['venmo', 'cashapp', 'zelle', 'cash', 'card'] as const;

/** One sale at the table: a piece (or one option of it), how many, and how they paid. */
export async function recordMarketSale(
  eventId: string,
  listingId: string,
  method: string,
  line: { variantId?: string | null; quantity?: number; agreedCents?: number | null } = {},
): Promise<DoneResult> {
  const quantity = line.quantity ?? 1;
  const variantId = line.variantId ?? null;
  const agreed = line.agreedCents ?? null;
  if (agreed !== null && (!Number.isInteger(agreed) || agreed < 0)) return { ok: false, error: 'Type the price you agreed, like 15 or 14.50.' };
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) return { ok: false, error: 'Pick how many, from 1 to 99.' };
  const { site } = await requireActingSite();
  if (!(await getSiteFeatures(site.tenantId)).has('market_shop')) return { ok: false, error: 'The market shop isn’t switched on for this site.' };
  if (!(METHODS as readonly string[]).includes(method)) return { ok: false, error: 'Pick how they paid.' };
  const db = await createSupabaseServerClient();
  const price = await tablePrice(db, site.tenantId, listingId, variantId);
  if ('error' in price) return { ok: false, error: price.error };
  // A price agreed with the buyer: the line keeps its marked price and the
  // difference is the order's discount, so "How it sold" shows what was given.
  const marked = price.cents * quantity;
  if (agreed !== null && agreed > marked) return { ok: false, error: `That’s more than the marked price for ${price.name}.` };

  const { error } = await db.rpc('market_record_sale', {
    p_tenant_id: site.tenantId,
    p_event_id: eventId,
    p_listing_id: listingId,
    p_method: method,
    p_price_cents: price.cents,
    p_quantity: quantity,
    ...(variantId === null ? {} : { p_variant_id: variantId }),
    ...(agreed === null ? {} : { p_discount_cents: marked - agreed }),
  });
  if (error !== null) {
    if (error.code === 'P0040') return { ok: false, error: 'This market isn’t on today, so it can’t take a sale.' };
    if (error.code === 'P0021') return { ok: false, error: 'That one is already sold or held, or isn’t marked for this market.' };
    if (error.code === 'P0023') return { ok: false, error: error.hint === '0' ? `${price.name} is all gone at this market.` : `Only ${error.hint} of ${price.name} left at this market.` };
    if (error.code === 'P0024') return { ok: false, error: `Pick which ${price.name} they’re taking.` };
    logger.error('market: record sale failed', { tenantId: site.tenantId, error: error.message });
    return { ok: false, error: 'The sale couldn’t be recorded. Try again in a moment.' };
  }
  revalidatePath(`/manage/markets/${eventId}/today`);
  return { ok: true };
}

/** A line in a sale at the table: its key (`SellPiece.id`), the piece, the option, how many. */
export type SaleLine = { id: string; listingId: string; variantId: string | null; quantity: number; agreedCents?: number | null };

/** Sell at the table: record each line the buyer took, all paid the same way. Stops at
 *  the first that can't be recorded and says which went through (by line key), so
 *  nothing is recorded twice when she tries again with what's left. */
export async function recordMarketSales(eventId: string, lines: readonly SaleLine[], method: string): Promise<{ ok: true; count: number } | { ok: false; error: string; recorded: string[] }> {
  if (lines.length === 0) return { ok: false, error: 'Tap the pieces they’re taking first.', recorded: [] };
  const recorded: string[] = [];
  for (const line of lines) {
    const r = await recordMarketSale(eventId, line.listingId, method, { variantId: line.variantId, quantity: line.quantity, agreedCents: line.agreedCents ?? null });
    if (!r.ok) {
      const done = recorded.length === 0 ? '' : ` ${recorded.length} of ${lines.length} were recorded; the rest are still in the sale.`;
      return { ok: false, error: `${r.error}${done}`, recorded };
    }
    recorded.push(line.id);
  }
  return { ok: true, count: lines.reduce((n, l) => n + l.quantity, 0) };
}

/** A buyer's hold at the table: Paid (the money arrived) or Not received (back on
 *  the shelf). */
export async function settleMarketOrder(eventId: string, orderId: string, outcome: 'paid' | 'canceled'): Promise<DoneResult> {
  const { site } = await requireActingSite();
  if (!(await getSiteFeatures(site.tenantId)).has('market_shop')) return { ok: false, error: 'The market shop isn’t switched on for this site.' };
  if (outcome !== 'paid' && outcome !== 'canceled') return { ok: false, error: 'That isn’t a step an order can take.' };
  const db = await createSupabaseServerClient();
  const { error } = await db.rpc('set_order_status', { p_tenant_id: site.tenantId, p_order_id: orderId, p_status: outcome });
  if (error !== null) {
    logger.error('market: settle hold failed', { tenantId: site.tenantId, orderId, outcome, error: error.message });
    return { ok: false, error: 'That order couldn’t be updated. Try again in a moment.' };
  }
  revalidatePath(`/manage/markets/${eventId}/day`);
  revalidatePath(`/manage/markets/${eventId}/today`);
  return { ok: true };
}
