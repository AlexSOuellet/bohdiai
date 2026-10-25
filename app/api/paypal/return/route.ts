import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { requireActingSite } from '@/lib/backend/current-site';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { paypalConfig } from '@/lib/paypal/config';
import { merchantFor, merchantStatus, partnerToken } from '@/lib/paypal/api';
import { canTakeOrders, saveConnection } from '@/lib/paypal/connection';
import { CONNECT_COOKIE, siteFromTracking } from '@/lib/paypal/flow';

export const dynamic = 'force-dynamic';

/** Back from PayPal's page. This browser's code and the signed-in person must match a
 *  site they run; then PayPal itself says which account finished the sign-up and what
 *  it allows (the address alone is never trusted). Every outcome lands on Getting
 *  paid with a message. */
export async function GET(req: Request): Promise<NextResponse> {
  const url = new URL(req.url);
  const back = new URL('/manage/payments', req.url);
  const done = (outcome: string): NextResponse => {
    back.searchParams.set('paypal', outcome);
    const res = NextResponse.redirect(back);
    res.cookies.delete({ name: CONNECT_COOKIE, path: '/api/paypal' });
    return res;
  };
  const config = paypalConfig();
  if (config === null) return done('not-set-up');
  if (url.searchParams.get('permissionsGranted') === 'false') return done('declined');

  const { sites } = await requireActingSite();
  const tracking = url.searchParams.get('merchantId') ?? '';
  const tenantId = siteFromTracking(tracking, (await cookies()).get(CONNECT_COOKIE)?.value);
  if (tenantId === null || !sites.some((s) => s.tenantId === tenantId)) return done('expired');
  try {
    const token = await partnerToken(config);
    const merchantId = await merchantFor(config, token, tracking);
    if (merchantId === null) return done('unfinished');
    const status = await merchantStatus(config, token, merchantId);
    if (!status.permissionsGranted) return done('declined');
    await saveConnection(supabaseAdmin(), tenantId, status);
    return done(canTakeOrders(status) ? 'connected' : 'not-ready');
  } catch (err) {
    logger.error('paypal: connect failed', { tenantId, error: err instanceof Error ? err.message : String(err) });
    return done('failed');
  }
}
