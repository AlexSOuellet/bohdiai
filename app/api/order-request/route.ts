import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { resend, fromEmail } from '@/lib/resend';
import { logger } from '@/lib/logger';
import { formLimitResponse } from '@/lib/forms/rate-limit';
import { orderRequestEmail, orderRequestSchema } from '@/lib/storefront/order-request';
import { placeCartOrder } from '@/lib/storefront/place-order';
import { signedInBuyerProfile } from '@/lib/buyers/session';
import { onlinePay } from '@/lib/paypal/online-pay';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * The cart's "send my order" — for shops with the cart switched on and no card
 * payments yet. Saves a pending order (priced from the catalog) and emails the
 * maker; nothing is charged. The shop comes from the host (x-tenant-id, set by
 * the middleware), never from the body.
 */
export async function POST(req: Request) {
  try {
    return await handle(req);
  } catch (err) {
    logger.error('order request fatal', { error: err instanceof Error ? err.message : String(err) });
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
  if (payload !== null && typeof payload === 'object' && 'company' in payload && payload.company !== '') {
    return NextResponse.json({ ok: true, orderNumber: null });
  }
  const parsed = orderRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request.' }, { status: 400 });
  }
  const input = parsed.data;

  const db = supabaseAdmin();
  // A shop that takes payment online takes orders only through its checkout.
  if ((await onlinePay(db, tenantId)) !== null) {
    return NextResponse.json({ error: 'This shop takes payment at checkout. Please pay with the PayPal button.' }, { status: 409 });
  }
  const placed = await placeCartOrder(db, tenantId, input, { verb: 'send' }, await signedInBuyerProfile(tenantId));
  if (!placed.ok) {
    if (placed.refusal.status === 503) logger.warn('order request: tenant has no contact_email', { tenantId });
    return NextResponse.json({ error: placed.refusal.error, ...(placed.refusal.unavailable === undefined ? {} : { unavailable: placed.refusal.unavailable }) }, { status: placed.refusal.status });
  }
  const { orderNumber, lines, subtotalCents, discount } = placed.order;
  const tenant = { business_name: placed.order.shopName, contact_email: placed.order.contactEmail };

  const mail = orderRequestEmail({
    shopName: tenant.business_name,
    orderNumber,
    input,
    lines,
    subtotalCents,
    discount,
  });
  try {
    const result = await resend().emails.send({ from: fromEmail(), to: tenant.contact_email, replyTo: input.email, ...mail });
    if (result.error) {
      // The order is saved; the maker sees it in the backend even if the email failed.
      logger.error('order request: email failed', { tenantId, orderNumber, error: result.error.message });
    }
  } catch (err) {
    logger.error('order request: email fatal', { tenantId, orderNumber, error: err instanceof Error ? err.message : String(err) });
  }

  return NextResponse.json({ ok: true, orderNumber });
}
