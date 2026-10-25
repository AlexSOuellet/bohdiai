import { NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { supabaseAdmin } from '@/lib/supabase';
import { resend, fromEmail } from '@/lib/resend';
import { logger } from '@/lib/logger';
import { formLimitResponse } from '@/lib/forms/rate-limit';
import { orderRequestEmail } from '@/lib/storefront/order-request';
import { paypalConfig } from '@/lib/paypal/config';
import { capturePayPalOrder, partnerToken } from '@/lib/paypal/api';
import { paidInto } from '@/lib/paypal/connection';
import { captureMatches } from '@/lib/paypal/checkout';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const body = z.object({ paypalOrderId: z.string().trim().min(1).max(64) });

/**
 * Paying for the cart with PayPal, step two: the buyer approved the payment in
 * PayPal. BohdiAI asks PayPal to take it, and records the order paid only when
 * PayPal says the payment completed, for exactly the order's total, into this
 * shop's own PayPal. The same payment is recorded once.
 */
export async function POST(req: Request) {
  try {
    return await handle(req);
  } catch (err) {
    logger.error('paypal checkout: capture fatal', { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: 'Something went wrong. If PayPal says you paid, the shop will see it; please get in touch with them.' }, { status: 500 });
  }
}

async function handle(req: Request) {
  const turnedAway = await formLimitResponse(req, 'order', (message) => ({ error: message }));
  if (turnedAway !== null) return turnedAway;
  const tenantId = req.headers.get('x-tenant-id');
  if (tenantId === null) return NextResponse.json({ error: 'Shop not found.' }, { status: 404 });
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  const { paypalOrderId } = parsed.data;

  const config = paypalConfig();
  if (config === null) return NextResponse.json({ error: 'This shop isn’t taking PayPal right now.' }, { status: 409 });
  const db = supabaseAdmin();
  const { data: payment, error } = await db
    .from('payments')
    .select('order_id, status, amount_cents, currency')
    .eq('tenant_id', tenantId)
    .eq('processor', 'paypal')
    .eq('payment_type', 'charge')
    .eq('external_payment_id', paypalOrderId)
    .maybeSingle();
  if (error !== null) throw new Error(`payment lookup failed: ${error.message}`);
  if (payment === null) return NextResponse.json({ error: 'That payment isn’t one of this shop’s orders.' }, { status: 404 });

  const { data: order, error: orderError } = await db
    .from('orders')
    .select('order_number, customer_name, customer_email, customer_phone, customer_note, subtotal_cents, discount_cents, discount_label')
    .eq('id', payment.order_id)
    .single();
  if (orderError !== null) throw new Error(`order lookup failed: ${orderError.message}`);
  if (payment.status === 'succeeded') return NextResponse.json({ ok: true, orderNumber: order.order_number });

  const merchantId = await paidInto(db, tenantId);
  if (merchantId === null) return NextResponse.json({ error: 'This shop isn’t taking PayPal right now.' }, { status: 409 });

  const capture = await capturePayPalOrder(config, await partnerToken(config), paypalOrderId);
  if (!captureMatches(capture, { paypalOrderId, orderId: payment.order_id, merchantId, cents: payment.amount_cents, currency: payment.currency })) {
    logger.error('paypal checkout: capture did not match', { tenantId, orderId: payment.order_id, status: capture.status, captureStatus: capture.captureStatus });
    return NextResponse.json({ error: 'PayPal didn’t complete the payment, so nothing was charged. Please try again.' }, { status: 402 });
  }

  const { error: recordError } = await db.rpc('record_online_payment', {
    p_tenant_id: tenantId,
    p_order_id: payment.order_id,
    p_processor: 'paypal',
    p_external_id: paypalOrderId,
    p_amount_cents: payment.amount_cents,
    p_currency: payment.currency,
    p_metadata: { capture_id: capture.captureId },
  });
  if (recordError !== null) throw new Error(`record_online_payment failed: ${recordError.message}`);

  // Tell the maker. The order is saved and paid; a failed email never undoes it.
  const { data: shop } = await db.from('tenants').select('business_name, contact_email').eq('id', tenantId).maybeSingle();
  const { data: items } = await db.from('order_items').select('listing_id, listing_variant_id, name_snapshot, unit_price_cents').eq('order_id', payment.order_id);
  if (shop?.contact_email) {
    const mail = orderRequestEmail({
      shopName: shop.business_name,
      orderNumber: order.order_number,
      input: { name: order.customer_name ?? '', email: order.customer_email, phone: order.customer_phone ?? '', note: order.customer_note ?? '', listingIds: [], code: '' },
      lines: (items ?? []).map((i) => ({ listingId: i.listing_id ?? '', variantId: i.listing_variant_id, name: i.name_snapshot, option: null, priceCents: i.unit_price_cents })),
      subtotalCents: order.subtotal_cents,
      discount: order.discount_cents > 0 ? { label: order.discount_label ?? '', cents: order.discount_cents } : null,
      paidWith: 'PayPal',
    });
    try {
      const sent = await resend().emails.send({ from: fromEmail(), to: shop.contact_email, replyTo: order.customer_email, ...mail });
      if (sent.error) logger.error('paypal checkout: email failed', { tenantId, orderNumber: order.order_number, error: sent.error.message });
    } catch (err) {
      logger.error('paypal checkout: email fatal', { tenantId, orderNumber: order.order_number, error: err instanceof Error ? err.message : String(err) });
    }
  }
  return NextResponse.json({ ok: true, orderNumber: order.order_number });
}
