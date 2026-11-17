import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { formLimitResponse } from '@/lib/forms/rate-limit';
import { requestOrigin } from '@/lib/backend/request-origin';
import { orderRequestSchema } from '@/lib/storefront/order-request';
import { placeCartOrder } from '@/lib/storefront/place-order';
import { signedInBuyerProfile } from '@/lib/buyers/session';
import { squareConfig } from '@/lib/square/config';
import { startSquareCheckout } from '@/lib/square/online';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NOT_TAKING = 'This shop isn’t taking card payments right now. Please try again later or get in touch with the shop.';

/**
 * Paying for the cart through the shop's own Square (Full). Saves the order as
 * pending, priced on the server, then has Square make its checkout page for exactly
 * that total in the maker's own Square, and answers with its address. Nothing is
 * charged here: the shopper pays on Square's page, and the order counts as paid only
 * once Square confirms it. The shop comes from the host, never from the body.
 */
export async function POST(req: Request) {
  try {
    return await handle(req);
  } catch (err) {
    logger.error('square checkout: create fatal', { error: err instanceof Error ? err.message : String(err) });
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
  // The spam trap: a filled hidden field gets nowhere near Square.
  if (payload !== null && typeof payload === 'object' && 'company' in payload && payload.company !== '') {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
  const parsed = orderRequestSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request.' }, { status: 400 });

  const config = squareConfig();
  if (config === null) return NextResponse.json({ error: NOT_TAKING }, { status: 409 });
  const db = supabaseAdmin();
  const { data: link, error: linkError } = await db.from('square_connections').select('location_id').eq('tenant_id', tenantId).maybeSingle();
  if (linkError !== null) throw new Error(`Square connection read failed: ${linkError.message}`);
  if (link?.location_id == null) return NextResponse.json({ error: NOT_TAKING }, { status: 409 });

  const placed = await placeCartOrder(db, tenantId, parsed.data, { verb: 'pay for' }, await signedInBuyerProfile(tenantId));
  if (!placed.ok) {
    return NextResponse.json({ error: placed.refusal.error, ...(placed.refusal.unavailable === undefined ? {} : { unavailable: placed.refusal.unavailable }) }, { status: placed.refusal.status });
  }
  const order = placed.order;
  // Square takes cards for $1.00 or more; a code that takes (nearly) everything off leaves nothing to pay by card.
  if (order.totalCents < 100) {
    return NextResponse.json({ error: 'This order comes to less than $1, which can’t be paid by card. Please get in touch with the shop.' }, { status: 409 });
  }

  const back = new URL('/cart', requestOrigin(req));
  back.searchParams.set('order', order.orderId);
  let started: Awaited<ReturnType<typeof startSquareCheckout>>;
  try {
    started = await startSquareCheckout(db, config, tenantId, order, parsed.data.email, back.toString());
  } catch (err) {
    await giveUp(tenantId, order.orderId);
    throw err;
  }
  if (!started.ok) {
    await giveUp(tenantId, order.orderId);
    return NextResponse.json({ error: NOT_TAKING }, { status: 409 });
  }
  return NextResponse.json({ ok: true, url: started.url });
}

/** No checkout page was made, so nobody can pay for this order: it's canceled, so
 *  it never shows in the maker's Orders as one waiting on them. */
async function giveUp(tenantId: string, orderId: string): Promise<void> {
  const { error } = await supabaseAdmin().from('orders').update({ status: 'canceled', canceled_at: new Date().toISOString() }).eq('id', orderId).eq('tenant_id', tenantId).eq('status', 'pending');
  if (error !== null) logger.error('square checkout: could not cancel the unpaid order', { tenantId, orderId, error: error.message });
}
