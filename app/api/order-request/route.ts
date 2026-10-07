import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { resend, fromEmail } from '@/lib/resend';
import { logger } from '@/lib/logger';
import { formLimitResponse } from '@/lib/forms/rate-limit';
import { loadSiteFeatures } from '@/lib/backend/features';
import { loadProductsByIds } from '@/lib/storefront/catalog';
import { orderLines, orderRequestEmail, orderRequestSchema } from '@/lib/storefront/order-request';

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
  const { data: tenant, error: lookupError } = await db
    .from('tenants')
    .select('business_name, contact_email')
    .eq('id', tenantId)
    .eq('status', 'active')
    .maybeSingle();
  if (lookupError !== null) throw new Error(`tenant lookup failed: ${lookupError.message}`);
  if (tenant === null) return NextResponse.json({ error: 'Shop not found.' }, { status: 404 });
  if (!(await loadSiteFeatures(db, tenantId)).has('cart')) {
    return NextResponse.json({ error: 'This shop isn’t taking orders online.' }, { status: 404 });
  }
  if (tenant.contact_email === null || tenant.contact_email === '') {
    logger.warn('order request: tenant has no contact_email', { tenantId });
    return NextResponse.json({ error: 'This shop can’t take orders right now. Please get in touch another way.' }, { status: 503 });
  }

  const priced = orderLines(input.listingIds, await loadProductsByIds(db, tenantId, input.listingIds));
  if (!priced.ok) {
    return NextResponse.json(
      { error: `No longer available: ${priced.unavailable.join(', ')}. Take it out of your cart to send the rest.`, unavailable: priced.unavailable },
      { status: 409 },
    );
  }

  const { data: orderNumber, error: placeError } = await db.rpc('place_order_request', {
    p_tenant_id: tenantId,
    p_customer_name: input.name,
    p_customer_email: input.email,
    p_customer_phone: input.phone,
    p_customer_note: input.note,
    p_items: priced.lines.map((l) => ({ listing_id: l.listingId, name: l.name, unit_price_cents: l.priceCents })),
  });
  if (placeError !== null) {
    if (placeError.code === 'P0021') {
      return NextResponse.json({ error: 'Something in your cart was just taken. Please check your cart and try again.' }, { status: 409 });
    }
    throw new Error(`place_order_request failed: ${placeError.message}`);
  }

  const mail = orderRequestEmail({ shopName: tenant.business_name, orderNumber, input, lines: priced.lines, subtotalCents: priced.subtotalCents });
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
