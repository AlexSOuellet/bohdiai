import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { formLimitResponse } from '@/lib/forms/rate-limit';
import { orderRequestSchema } from '@/lib/storefront/order-request';
import { placeCartOrder } from '@/lib/storefront/place-order';
import { signedInBuyerProfile } from '@/lib/buyers/session';
import { paypalConfig } from '@/lib/paypal/config';
import { createPayPalOrder, partnerToken } from '@/lib/paypal/api';
import { paidInto } from '@/lib/paypal/connection';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NOT_TAKING = 'This shop isn’t taking PayPal right now. Please try again later or get in touch with the shop.';

/**
 * Paying for the cart with PayPal, step one (the PayPal button calls it). Saves the
 * order as pending, priced on the server, then asks PayPal for a payment of exactly
 * that total into the maker's own PayPal. Nothing is charged until the buyer
 * approves it in PayPal and step two (capture) hears PayPal confirm it. The shop
 * comes from the host, never from the body.
 */
export async function POST(req: Request) {
  try {
    return await handle(req);
  } catch (err) {
    logger.error('paypal checkout: create fatal', { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}

async function handle(req: Request) {
  const turnedAway = await formLimitResponse(req, 'order', (message) => ({ error: message }));
  if (turnedAway !== null) return turnedAway;
  const tenantId = req.headers.get('x-tenant-id');
  if (tenantId === null) return NextResponse.json({ error: 'Shop not found.' }, { status: 404 });

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
  // The spam trap: a filled hidden field gets nowhere near PayPal.
  if (payload !== null && typeof payload === 'object' && 'company' in payload && payload.company !== '') {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
  const parsed = orderRequestSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request.' }, { status: 400 });

  const config = paypalConfig();
  const db = supabaseAdmin();
  const merchantId = config === null ? null : await paidInto(db, tenantId);
  if (config === null || merchantId === null) return NextResponse.json({ error: NOT_TAKING }, { status: 409 });

  const placed = await placeCartOrder(db, tenantId, parsed.data, { verb: 'pay for' }, await signedInBuyerProfile(tenantId));
  if (!placed.ok) {
    return NextResponse.json({ error: placed.refusal.error, ...(placed.refusal.unavailable === undefined ? {} : { unavailable: placed.refusal.unavailable }) }, { status: placed.refusal.status });
  }
  const order = placed.order;
  if (order.totalCents <= 0) {
    // A code that takes the whole price off leaves nothing to pay: it goes through as a plain order.
    return NextResponse.json({ error: 'There’s nothing to pay for this order. Please get in touch with the shop.' }, { status: 409 });
  }

  const token = await partnerToken(config);
  const { data: tenant } = await db.from('tenants').select('subdomain').eq('id', tenantId).maybeSingle();
  const paypalOrderId = await createPayPalOrder(config, token, {
    id: order.orderId,
    invoiceId: `${tenant?.subdomain ?? 'shop'}-${order.orderNumber}`,
    totalCents: order.totalCents,
    currency: order.currency,
    merchantId,
    description: `${order.shopName} order ${order.orderNumber}`,
  });

  // The payment's record, pending until PayPal confirms it: the only way step two finds this order.
  const { error } = await db.from('payments').insert({
    order_id: order.orderId,
    tenant_id: tenantId,
    processor: 'paypal',
    external_payment_id: paypalOrderId,
    payment_type: 'charge',
    status: 'pending',
    amount_cents: order.totalCents,
    currency: order.currency,
    payment_method_type: 'paypal',
    metadata: { paypal_order_id: paypalOrderId },
  });
  if (error !== null) throw new Error(`pending payment insert failed: ${error.message}`);

  return NextResponse.json({ ok: true, paypalOrderId });
}
