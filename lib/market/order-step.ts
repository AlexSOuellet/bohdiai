/**
 * The buyer's two follow-up steps on a held piece — "I paid" and "pick another" —
 * as one handler the two routes share. The shop comes from the host; the order
 * id (unguessable) names the hold.
 */
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { formLimitResponse } from '@/lib/forms/rate-limit';
import { orderRefSchema } from './buyer';

export async function orderStep(req: Request, fn: 'market_mark_paid' | 'market_release', gone: string): Promise<Response> {
  try {
    const turnedAway = await formLimitResponse(req, 'market-step', (message) => ({ error: message }));
    if (turnedAway !== null) return turnedAway;
    const tenantId = req.headers.get('x-tenant-id');
    if (tenantId === null) return NextResponse.json({ error: 'Shop not found.' }, { status: 404 });
    const parsed = orderRefSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    const { error } = await supabaseAdmin().rpc(fn, { p_tenant_id: tenantId, p_order_id: parsed.data.orderId });
    if (error !== null) {
      if (error.code === 'P0002') return NextResponse.json({ error: gone }, { status: 409 });
      throw new Error(`${fn} failed: ${error.message}`);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error('market step fatal', { fn, error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: 'Something went wrong. Please try again, or ask at the table.' }, { status: 500 });
  }
}
