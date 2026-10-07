import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { formLimitResponse } from '@/lib/forms/rate-limit';
import { loadSiteFeatures } from '@/lib/backend/features';
import { loadProductsByIds, formatPrice } from '@/lib/storefront/catalog';
import { isCartable } from '@/lib/storefront/order-request';
import { bestDiscount, checkCode, runningSale } from '@/lib/storefront/promotions';
import { loadShopPromotions } from '@/lib/storefront/promotions-load';
import { holdSchema, payNote, payStep } from '@/lib/market/buyer';
import { loadPaySettings, marketListingIds } from '@/lib/market/queries';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * A buyer at a market puts a piece on hold and gets the payment step: the amount
 * (sale or code taken off) and how to pay her. The piece leaves the shelf at once.
 * The shop comes from the host (x-tenant-id), never from the body.
 */
export async function POST(req: Request) {
  try {
    return await handle(req);
  } catch (err) {
    logger.error('market hold fatal', { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: 'Something went wrong. Please try again, or ask at the table.' }, { status: 500 });
  }
}

const refuse = (error: string, status = 409) => NextResponse.json({ error }, { status });

async function handle(req: Request) {
  const turnedAway = await formLimitResponse(req, 'market', (message) => ({ error: message }));
  if (turnedAway !== null) return turnedAway;
  const tenantId = req.headers.get('x-tenant-id');
  if (tenantId === null) return refuse('Shop not found.', 404);

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return refuse('Invalid request.', 400);
  }
  const parsed = holdSchema.safeParse(payload);
  if (!parsed.success) return refuse(parsed.error.issues[0]?.message ?? 'Invalid request.', 400);
  const input = parsed.data;

  const db = supabaseAdmin();
  const [tenant, features] = await Promise.all([
    db.from('tenants').select('business_name').eq('id', tenantId).eq('status', 'active').maybeSingle(),
    loadSiteFeatures(db, tenantId),
  ]);
  if (tenant.error !== null) throw new Error(`tenant lookup failed: ${tenant.error.message}`);
  if (tenant.data === null || !features.has('market_shop')) return refuse('Shop not found.', 404);

  const brought = await marketListingIds(db, input.eventId);
  if (!brought.includes(input.listingId)) return refuse('That piece isn’t at this market.');
  const [piece] = await loadProductsByIds(db, tenantId, [input.listingId]);
  if (piece === undefined || !isCartable(piece)) return refuse('Sorry, that one was just taken. Pick another.');

  const promo = await loadShopPromotions(db, tenantId);
  let codePromo = null;
  if (input.code !== '') {
    const checked = checkCode(promo.promos, input.code, promo.today);
    if (!checked.ok) return refuse(checked.error);
    codePromo = checked.promo;
  }
  const discount = bestDiscount([piece.priceCents], runningSale(promo.promos, promo.today), codePromo);

  const { data, error } = await db.rpc('market_hold', {
    p_tenant_id: tenantId,
    p_event_id: input.eventId,
    p_listing_id: input.listingId,
    p_name: input.name,
    p_email: input.email,
    p_method: input.method,
    p_price_cents: piece.priceCents,
    p_discount_cents: discount?.cents ?? 0,
    ...(discount === null ? {} : { p_discount_label: discount.label }),
    ...(discount?.promotionId == null ? {} : { p_promotion_id: discount.promotionId }),
  });
  if (error !== null) {
    if (error.code === 'P0040') return refuse('This market isn’t taking orders right now.');
    if (error.code === 'P0021') return refuse('Sorry, that one was just taken. Pick another.');
    if (error.code === 'P0041') return refuse('That way to pay isn’t available. Pick another.');
    if (error.code === 'P0022') return refuse('That code just ended or was used up.');
    throw new Error(`market_hold failed: ${error.message}`);
  }
  const held = Array.isArray(data) ? data[0] : null;
  if (held == null) throw new Error('market_hold returned nothing');

  const totalCents = piece.priceCents - (discount?.cents ?? 0);
  const step = payStep(await loadPaySettings(db, tenantId), input.method, totalCents, payNote(tenant.data.business_name, piece.view.name, held.order_number));
  if (step === null) throw new Error('payment method vanished after the hold');

  return NextResponse.json({
    ok: true,
    orderId: held.order_id,
    orderNumber: held.order_number,
    piece: piece.view.name,
    amount: formatPrice(totalCents),
    discount: discount === null ? null : { label: discount.label, amount: formatPrice(discount.cents) },
    pay: step,
  });
}
