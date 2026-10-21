import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { requireActingSite } from '@/lib/backend/current-site';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { squareConfig } from '@/lib/square/config';
import { CONNECT_COOKIE, checkConnectNote, finishConnect } from '@/lib/square/flow';

export const dynamic = 'force-dynamic';

/** Back from Square's page. The note, this browser's code and the signed-in person
 *  must all match, and the person must still run that site, before the code is
 *  swapped for keys. Every outcome lands on Getting paid with a message. */
export async function GET(req: Request): Promise<NextResponse> {
  const url = new URL(req.url);
  const back = new URL('/manage/payments', req.url);
  const done = (outcome: string): NextResponse => {
    back.searchParams.set('square', outcome);
    const res = NextResponse.redirect(back);
    res.cookies.delete({ name: CONNECT_COOKIE, path: '/api/square' });
    return res;
  };
  const config = squareConfig();
  if (config === null) return done('not-set-up');
  if (url.searchParams.get('error') !== null) return done('declined');

  const { user, sites } = await requireActingSite();
  const note = await checkConnectNote(config, url.searchParams.get('state') ?? '', (await cookies()).get(CONNECT_COOKIE)?.value, user.id, Date.now());
  const code = url.searchParams.get('code');
  if (note === null || code === null || code === '' || !sites.some((s) => s.tenantId === note.tenantId)) return done('expired');
  try {
    await finishConnect(supabaseAdmin(), config, note.tenantId, code);
  } catch (err) {
    logger.error('square: connect failed', { tenantId: note.tenantId, error: err instanceof Error ? err.message : String(err) });
    return done('failed');
  }
  return done('connected');
}
