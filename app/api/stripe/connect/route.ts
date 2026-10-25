import { NextResponse } from 'next/server';
import { requireActingSite } from '@/lib/backend/current-site';

export const dynamic = 'force-dynamic';

/** Connect Stripe: the connection is built with online payments. Until then, back to
 *  Getting paid saying Stripe isn't set up on BohdiAI yet. */
export async function GET(req: Request): Promise<NextResponse> {
  await requireActingSite();
  const back = new URL('/manage/payments', req.url);
  back.searchParams.set('stripe', 'not-set-up');
  return NextResponse.redirect(back);
}
