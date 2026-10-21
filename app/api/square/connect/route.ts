import { NextResponse } from 'next/server';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { squareConfig } from '@/lib/square/config';
import { authorizeUrl } from '@/lib/square/api';
import { CONNECT_COOKIE, CONNECT_MINUTES, CONNECT_PURPOSE, type ConnectNote } from '@/lib/square/flow';
import { signNote } from '@/lib/square/vault';

export const dynamic = 'force-dynamic';

/** Connect Square: off to Square's own page, with a signed note naming this site and
 *  person, and a one-time code kept on this browser to match on the way back. */
export async function GET(req: Request): Promise<NextResponse> {
  const { user, site } = await requireActingSite();
  const back = new URL('/manage/payments', req.url);
  if (!(await getSiteFeatures(site.tenantId)).has('market_shop')) return NextResponse.redirect(back);
  const config = squareConfig();
  if (config === null) {
    back.searchParams.set('square', 'not-set-up');
    return NextResponse.redirect(back);
  }
  const nonce = crypto.randomUUID();
  const note: ConnectNote = { tenantId: site.tenantId, userId: user.id, nonce, expires: Date.now() + CONNECT_MINUTES * 60 * 1000 };
  const res = NextResponse.redirect(authorizeUrl(config, await signNote(CONNECT_PURPOSE, note, config.tokenKey)));
  res.cookies.set(CONNECT_COOKIE, nonce, { httpOnly: true, secure: true, sameSite: 'lax', path: '/api/square', maxAge: CONNECT_MINUTES * 60 });
  return res;
}
