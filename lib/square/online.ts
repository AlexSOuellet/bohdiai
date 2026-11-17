/**
 * The online shop paid through the maker's own Square (Full; Alex, 2026-11-17).
 *
 * Paying: the cart's order is saved as pending, priced on our server; Square makes a
 * checkout page for exactly that order in the maker's own Square; the shopper types
 * their card only there. BohdiAI never sees a card.
 *
 * Confirming: an order counts as paid only when our server asks Square itself and
 * Square says this order (its reference is our order's ID), at the maker's location,
 * in the shop's currency, for exactly its total, is paid in full, every card payment
 * on it completed. It runs when the shopper comes back from Square's page and when
 * Square's own notice arrives, so an order still counts if the shopper closes their
 * phone first. Either way it's recorded once, and the maker is emailed once.
 *
 * Sold twice (Alex, 2026-11-17): nothing holds a piece while a shopper is on Square's
 * page. If a piece in the order has sold by the time Square confirms, the database
 * refuses (P0028); the shopper's money goes straight back through Square, the order
 * is recorded as refunded, and the maker is told.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { logger } from '@/lib/logger';
import { resend, fromEmail } from '@/lib/resend';
import { SITE_CONTACT_EMAIL } from '@/lib/site/contact';
import { serverEnv } from '@/lib/env';
import { appOrigin } from '@/lib/backend/app-url';
import type { PlacedOrder } from '@/lib/storefront/place-order';
import type { SquareConfig } from './config';
import { createPaymentLink, findPayment, findSale, refundPayment, type SquareSale } from './api';
import { liveKey } from './connection';
import { paidOrderEmail, soldTwiceEmail, type PaidOrderFacts } from './online-emails';

type Db = SupabaseClient<Database>;
type Fetcher = typeof fetch;

/** Where a Square payment stands, for the shopper coming back and for the notice. */
export type OnlineOutcome =
  | { kind: 'paid'; orderNumber: string }
  /** Not confirmed yet (Square still finishing, or the shopper hasn't paid). */
  | { kind: 'waiting'; orderNumber: string }
  /** It had sold: the money went back. */
  | { kind: 'sold'; orderNumber: string }
  /** Square's order doesn't match ours: nothing is recorded. */
  | { kind: 'failed'; orderNumber: string }
  | { kind: 'unknown' };

/** Square's checkout page for a placed order, or why there can't be one. The
 *  pending payment saved here is the only way a later step finds the order. */
export async function startSquareCheckout(
  db: Db,
  config: SquareConfig,
  tenantId: string,
  order: PlacedOrder,
  buyerEmail: string,
  redirectUrl: string,
  fetcher: Fetcher = fetch,
): Promise<{ ok: true; url: string } | { ok: false; reason: 'not-connected' | 'mismatch' }> {
  const key = await liveKey(db, config, tenantId, new Date(), fetcher);
  if (key === null || key.locationId === null) return { ok: false, reason: 'not-connected' };
  const link = await createPaymentLink(
    config,
    key.token,
    {
      referenceId: order.orderId,
      locationId: key.locationId,
      currency: order.currency,
      lines: order.lines.map((l) => ({ name: l.name, cents: l.priceCents })),
      discount: order.discount === null ? null : { name: order.discount.label, cents: order.discount.cents },
      redirectUrl,
      buyerEmail,
      note: `${order.shopName} order ${order.orderNumber}`,
    },
    fetcher,
  );
  // Square worked the total out itself: it must be ours to the cent before anyone pays.
  if (link.totalCents !== order.totalCents || link.currency.toUpperCase() !== order.currency) {
    logger.error('square online: checkout total did not match', { tenantId, orderId: order.orderId, ours: order.totalCents, square: link.totalCents });
    return { ok: false, reason: 'mismatch' };
  }
  const { error } = await db.from('payments').insert({
    order_id: order.orderId,
    tenant_id: tenantId,
    processor: 'square',
    external_payment_id: link.orderId,
    payment_type: 'charge',
    status: 'pending',
    amount_cents: order.totalCents,
    currency: order.currency,
    payment_method_type: 'card',
    metadata: { square_order_id: link.orderId, online: true },
  });
  if (error !== null) throw new Error(`pending Square payment insert failed: ${error.message}`);
  return { ok: true, url: link.url };
}

/** The Square order behind one of this shop's online orders (the shopper coming back). */
export async function squareOrderFor(db: Db, tenantId: string, orderId: string): Promise<string | null> {
  const { data, error } = await db
    .from('payments')
    .select('external_payment_id')
    .eq('tenant_id', tenantId)
    .eq('order_id', orderId)
    .eq('processor', 'square')
    .eq('payment_type', 'charge')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error !== null) throw new Error(`Could not read the payment: ${error.message}`);
  return data?.external_payment_id ?? null;
}

/** The shop an online Square order belongs to, for Square's notice (which names
 *  only the Square business): the order must be one BohdiAI made, for a shop
 *  connected to that same Square business. */
export async function shopForSquareOrder(db: Db, squareOrderId: string, merchantId: string): Promise<string | null> {
  const { data, error } = await db.from('payments').select('tenant_id').eq('processor', 'square').eq('payment_type', 'charge').eq('external_payment_id', squareOrderId).maybeSingle();
  if (error !== null) throw new Error(`Could not read the payment: ${error.message}`);
  if (data === null) return null;
  const { data: link, error: linkError } = await db.from('square_connections').select('merchant_id').eq('tenant_id', data.tenant_id).maybeSingle();
  if (linkError !== null) throw new Error(`Could not read the Square connection: ${linkError.message}`);
  return link?.merchant_id === merchantId ? data.tenant_id : null;
}

/** Square's order matches ours: our reference, the maker's location, our currency
 *  and total. Paid is checked separately. */
export function orderMatches(sale: SquareSale, expect: { orderId: string; locationId: string | null; cents: number; currency: string }): boolean {
  if (sale.referenceId !== expect.orderId || sale.totalCents !== expect.cents || sale.currency.toUpperCase() !== expect.currency.toUpperCase()) return false;
  return expect.locationId === null || sale.locationId === expect.locationId;
}

type OrderFacts = {
  id: string;
  order_number: string;
  status: string;
  source: string;
  total_cents: number;
  customer_name: string | null;
  customer_email: string;
  customer_phone: string | null;
  customer_note: string | null;
  discount_cents: number;
  discount_label: string | null;
};

/** Ask Square about one online order and record what it says, once. */
export async function confirmSquareOrder(db: Db, config: SquareConfig, tenantId: string, squareOrderId: string, fetcher: Fetcher = fetch): Promise<OnlineOutcome> {
  const { data: payment, error } = await db
    .from('payments')
    .select('order_id, status, amount_cents, currency')
    .eq('tenant_id', tenantId)
    .eq('processor', 'square')
    .eq('payment_type', 'charge')
    .eq('external_payment_id', squareOrderId)
    .maybeSingle();
  if (error !== null) throw new Error(`Could not read the payment: ${error.message}`);
  if (payment === null) return { kind: 'unknown' };
  const { data: order, error: orderError } = await db
    .from('orders')
    .select('id, order_number, status, source, total_cents, customer_name, customer_email, customer_phone, customer_note, discount_cents, discount_label')
    .eq('id', payment.order_id)
    .eq('tenant_id', tenantId)
    .maybeSingle();
  if (orderError !== null) throw new Error(`Could not read the order: ${orderError.message}`);
  // A market card sale has its own record: nothing here touches it.
  if (order === null || order.source !== 'storefront') return { kind: 'unknown' };
  const n = order.order_number;
  if (order.status === 'refunded' && payment.status === 'succeeded') return { kind: 'sold', orderNumber: n };
  if (payment.status === 'succeeded') return { kind: 'paid', orderNumber: n };
  if (order.status !== 'pending') return { kind: 'failed', orderNumber: n };

  const key = await liveKey(db, config, tenantId, new Date(), fetcher);
  if (key === null) {
    logger.error('square online: shop no longer connected', { tenantId, orderId: order.id });
    return { kind: 'waiting', orderNumber: n };
  }
  const sale = await findSale(config, key.token, squareOrderId, fetcher);
  if (sale === null) return { kind: 'waiting', orderNumber: n };
  if (!orderMatches(sale, { orderId: order.id, locationId: key.locationId, cents: payment.amount_cents, currency: payment.currency })) {
    logger.error('square online: Square order did not match', { tenantId, orderId: order.id });
    return { kind: 'failed', orderNumber: n };
  }
  if (sale.state === 'CANCELED') return { kind: 'failed', orderNumber: n };
  if (sale.dueCents > 0) return { kind: 'waiting', orderNumber: n };

  // Every card payment on it, from Square itself: completed, on this order, adding up to the total.
  const cardIds = sale.payments.filter((p) => p.type === 'CARD' && p.id !== '').map((p) => p.id);
  if (cardIds.length === 0 || cardIds.length !== sale.payments.length) return { kind: 'waiting', orderNumber: n };
  const paid = await Promise.all(cardIds.map((id) => findPayment(config, key.token, id, fetcher)));
  if (paid.some((p) => p === null || p.status !== 'COMPLETED' || p.orderId !== sale.orderId)) return { kind: 'waiting', orderNumber: n };
  const done = paid.filter((p) => p !== null);
  if (done.reduce((s, p) => s + p.amountCents, 0) !== payment.amount_cents) {
    logger.error('square online: payments did not add up', { tenantId, orderId: order.id });
    return { kind: 'failed', orderNumber: n };
  }

  const args = { p_tenant_id: tenantId, p_order_id: order.id, p_processor: 'square', p_external_id: squareOrderId, p_amount_cents: payment.amount_cents, p_currency: payment.currency };
  const { data: recorded, error: recordError } = await db.rpc('record_online_payment', { ...args, p_metadata: { square_payment_ids: cardIds } });
  if (recordError === null) {
    if (recorded) await tellMaker(db, tenantId, order, 'paid');
    return { kind: 'paid', orderNumber: n };
  }
  if (recordError.code !== 'P0028') throw new Error(`record_online_payment failed: ${recordError.message}`);

  // It sold first: the money goes straight back, then the order is recorded as refunded.
  const refundIds: string[] = [];
  try {
    for (const [i, p] of done.entries()) {
      refundIds.push(
        await refundPayment(config, key.token, { paymentId: p.id, cents: p.amountCents, currency: p.currency, key: `sold-${i}-${order.id}`, reason: 'The piece had already sold' }, fetcher),
      );
    }
  } catch (err) {
    // The order stays pending, so the next try (Square's notice comes again) refunds it with the same key, never twice.
    logger.error('square online: sold-twice refund failed', { tenantId, orderId: order.id, error: err instanceof Error ? err.message : String(err) });
    await tellAlex(`A shopper on order ${n} paid for a piece that had already sold, and Square didn't give the money back. Check their Square (shop ${tenantId}).`);
    return { kind: 'sold', orderNumber: n };
  }
  const { data: soldNow, error: soldError } = await db.rpc('record_online_sold', { ...args, p_metadata: { square_payment_ids: cardIds, square_refund_ids: refundIds } });
  if (soldError !== null) throw new Error(`record_online_sold failed: ${soldError.message}`);
  if (soldNow) await tellMaker(db, tenantId, order, 'sold');
  return { kind: 'sold', orderNumber: n };
}

async function tellMaker(db: Db, tenantId: string, order: OrderFacts, what: 'paid' | 'sold'): Promise<void> {
  try {
    const { data: shop } = await db.from('tenants').select('business_name, contact_email').eq('id', tenantId).maybeSingle();
    if (!shop?.contact_email) return;
    const { data: items } = await db.from('order_items').select('name_snapshot, unit_price_cents, quantity').eq('order_id', order.id);
    const facts: PaidOrderFacts = {
      shopName: shop.business_name,
      orderNumber: order.order_number,
      name: order.customer_name ?? '',
      email: order.customer_email,
      phone: order.customer_phone ?? '',
      note: order.customer_note ?? '',
      lines: (items ?? []).map((i) => ({ name: i.quantity > 1 ? `${i.name_snapshot} × ${i.quantity}` : i.name_snapshot, cents: i.unit_price_cents * i.quantity })),
      discount: order.discount_cents > 0 ? { label: order.discount_label ?? 'Discount', cents: order.discount_cents } : null,
      totalCents: order.total_cents,
      ordersUrl: `${appOrigin(serverEnv().SITE_URL)}/manage/orders`,
    };
    const mail = what === 'paid' ? paidOrderEmail(facts) : soldTwiceEmail(facts);
    const sent = await resend().emails.send({ from: fromEmail(), to: shop.contact_email, replyTo: order.customer_email, ...mail });
    if (sent.error) logger.error('square online: maker email failed', { tenantId, orderNumber: order.order_number, error: sent.error.message });
  } catch (err) {
    // The order is recorded; a failed email never undoes it.
    logger.error('square online: maker email fatal', { tenantId, orderNumber: order.order_number, error: err instanceof Error ? err.message : String(err) });
  }
}

async function tellAlex(text: string): Promise<void> {
  try {
    const sent = await resend().emails.send({ from: fromEmail(), to: SITE_CONTACT_EMAIL, subject: 'A Square refund needs a look', text });
    if (sent.error) logger.error('square online: alex email failed', { error: sent.error.message });
  } catch (err) {
    logger.error('square online: alex email fatal', { error: err instanceof Error ? err.message : String(err) });
  }
}
