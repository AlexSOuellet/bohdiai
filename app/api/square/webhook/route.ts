import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { squareConfig, squareNotices } from '@/lib/square/config';
import { completedPayment, fromSquare } from '@/lib/square/notices';
import { confirmSquareOrder, shopForSquareOrder } from '@/lib/square/online';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Square's notice that a payment went through. Only a notice signed by Square is
 * read; it only says "go and check": the order is then confirmed by asking Square
 * directly, exactly as when the shopper comes back from Square's page, and is
 * recorded once whichever arrives first. Anything that isn't one of the online
 * shop's orders is answered OK and left alone. A failure answers 500, so Square
 * sends the notice again.
 */
export async function POST(req: Request): Promise<NextResponse> {
  const notices = squareNotices();
  const config = squareConfig();
  if (notices === null || config === null) return NextResponse.json({ error: 'Not set up.' }, { status: 503 });
  const body = await req.text();
  if (!(await fromSquare(notices, body, req.headers.get('x-square-hmacsha256-signature')))) {
    return NextResponse.json({ error: 'Bad signature.' }, { status: 401 });
  }
  const paid = completedPayment(body);
  if (paid === null) return NextResponse.json({ ok: true });
  try {
    const db = supabaseAdmin();
    const tenantId = await shopForSquareOrder(db, paid.squareOrderId, paid.merchantId);
    if (tenantId === null) return NextResponse.json({ ok: true });
    const outcome = await confirmSquareOrder(db, config, tenantId, paid.squareOrderId);
    // Square said it's paid, but asking Square didn't say so yet: try again later.
    if (outcome.kind === 'waiting') return NextResponse.json({ error: 'Not confirmed yet.' }, { status: 503 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error('square webhook: failed', { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
