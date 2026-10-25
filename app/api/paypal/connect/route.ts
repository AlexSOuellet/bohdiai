import { NextResponse } from 'next/server';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { serverEnv } from '@/lib/env';
import { logger } from '@/lib/logger';
import { paypalConfig } from '@/lib/paypal/config';
import { partnerToken, signUpLink } from '@/lib/paypal/api';
import { CONNECT_COOKIE, CONNECT_MINUTES, connectReturnUrl, trackingId } from '@/lib/paypal/flow';

export const dynamic = 'force-dynamic';

/** Connect PayPal: off to PayPal's own page, with a tracking ID naming this site and a
 *  one-time code kept on this browser to match on the way back. Online orders only
 *  (the cart, Full). */
export async function GET(req: Request): Promise<NextResponse> {
  const { site } = await requireActingSite();
  const back = new URL('/manage/payments', req.url);
  if (!(await getSiteFeatures(site.tenantId)).has('cart')) return NextResponse.redirect(back);
  const config = paypalConfig();
  if (config === null) {
    back.searchParams.set('paypal', 'not-set-up');
    return NextResponse.redirect(back);
  }
  const nonce = crypto.randomUUID();
  try {
    const link = await signUpLink(config, await partnerToken(config), trackingId(site.tenantId, nonce), connectReturnUrl(serverEnv().SITE_URL));
    const res = NextResponse.redirect(link);
    res.cookies.set(CONNECT_COOKIE, nonce, { httpOnly: true, secure: true, sameSite: 'lax', path: '/api/paypal', maxAge: CONNECT_MINUTES * 60 });
    return res;
  } catch (err) {
    logger.error('paypal: sign-up link failed', { tenantId: site.tenantId, error: err instanceof Error ? err.message : String(err) });
    back.searchParams.set('paypal', 'failed');
    return NextResponse.redirect(back);
  }
}
