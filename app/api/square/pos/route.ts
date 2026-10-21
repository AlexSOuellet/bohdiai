import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { squareConfig } from '@/lib/square/config';
import { alreadyRecorded, confirmCardSale, readCardNote, recordCardSale, savePayments } from '@/lib/square/flow';
import { readSquareReturn, squareReason, wasCanceled } from '@/lib/square/pos';

export const dynamic = 'force-dynamic';

/**
 * Back from the Square app after a card sale. Square opens this in the phone's
 * browser, which may not be signed in (an iPhone's home-screen app keeps its own
 * sign-in), so the proof is the sale itself: a note only the server can sign, used
 * once, and Square's own word that the card payment completed for that exact total
 * at the maker's location. Only then is the sale recorded. A sale taken with no
 * signal (Square sends it later) is recorded as waiting for Square. Every outcome
 * lands back on the market day with a message.
 */
export async function GET(req: Request): Promise<NextResponse> {
  const url = new URL(req.url);
  const config = squareConfig();
  const result = readSquareReturn(url.searchParams);
  const note = config === null || result === null ? null : await readCardNote(config, result.state, Date.now());
  const land = (eventId: string | null, outcome: string, reason: string | null = null): NextResponse => {
    const to = new URL(eventId === null ? '/manage/markets' : `/manage/markets/${eventId}/day`, req.url);
    to.searchParams.set('card', outcome);
    if (reason !== null) to.searchParams.set('reason', reason);
    return NextResponse.redirect(to, 303);
  };
  if (config === null || result === null || note === null) return land(null, 'lost');
  if (result.kind === 'failed') {
    if (wasCanceled(result.code)) return land(note.eventId, 'canceled');
    logger.error('square: the Square app refused the card sale', { tenantId: note.tenantId, code: result.code });
    return land(note.eventId, 'square-error', squareReason(result.code));
  }

  const admin = supabaseAdmin();
  let paymentIds: string[] = [];
  try {
    if (result.kind === 'paid') {
      const check = await confirmCardSale(admin, config, note.tenantId, note.nonce, result.orderId, note.totalCents);
      if (!check.ok) {
        if (check.reason !== 'already-recorded') logger.error('square: card sale not confirmed', { tenantId: note.tenantId, reason: check.reason });
        return land(note.eventId, check.reason === 'already-recorded' ? 'recorded' : 'not-confirmed');
      }
      paymentIds = check.paymentIds;
    } else if (await alreadyRecorded(admin, note.tenantId, note.nonce, null)) {
      return land(note.eventId, 'recorded');
    }
  } catch (err) {
    logger.error('square: card check failed', { tenantId: note.tenantId, error: err instanceof Error ? err.message : String(err) });
    return land(note.eventId, 'not-confirmed');
  }

  const orderId = result.kind === 'paid' ? result.orderId : null;
  const recorded = await recordCardSale(admin, note.tenantId, note.eventId, note.lines);
  try {
    await savePayments(admin, note.tenantId, note.nonce, orderId, paymentIds, recorded.orderNumbers, result.kind === 'paid' ? 'succeeded' : 'pending');
  } catch (err) {
    logger.error('square: card payment not saved', { tenantId: note.tenantId, orderId, error: err instanceof Error ? err.message : String(err) });
  }
  // The card was charged but a piece couldn't be recorded: say so plainly, so the
  // maker sorts it out with the buyer.
  if (!recorded.ok) return land(note.eventId, 'charged-not-recorded');
  return land(note.eventId, result.kind === 'paid' ? 'paid' : 'offline');
}
