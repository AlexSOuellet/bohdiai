import { reasonWords, squareReason } from '@/lib/square/pos';

/** What happened to a card sale in Square, in words, for the market day when Square
 *  hands back. Every outcome says something; none is silent. */
export const CARD_OUTCOME: Record<string, { tone: 'ok' | 'error'; text: string }> = {
  paid: { tone: 'ok', text: 'Card sale recorded. Square confirmed the payment.' },
  offline: {
    tone: 'ok',
    text: 'Card sale recorded. Square took it with no signal and sends the payment when your phone is back online. Check it in Square later.',
  },
  recorded: { tone: 'ok', text: 'That card sale was already recorded.' },
  canceled: { tone: 'error', text: 'Card sale canceled in Square. Nothing was charged or recorded.' },
  'square-error': { tone: 'error', text: 'Square couldn’t take the card, so nothing was recorded. Try again, or take another way to pay.' },
  'not-confirmed': { tone: 'error', text: 'Square didn’t confirm a payment for that total, so nothing was recorded. Check the Square app before charging again.' },
  'charged-not-recorded': {
    tone: 'error',
    text: 'Square took the payment, but not every piece could be recorded (one may have sold online, or the market closed). Check the sale in Square and settle it with the buyer.',
  },
  lost: { tone: 'error', text: 'That card sale couldn’t be matched to one started here, so nothing was recorded. Check the Square app before charging again.' },
  'no-app': { tone: 'error', text: 'The Square app isn’t on this phone. Install Square Point of Sale, sign in, and try again.' },
};

/** The outcome in words, with Square's own reason on a failure when it gave one. */
export function cardOutcome(value: string | string[] | undefined, reason?: string | string[]): { tone: 'ok' | 'error'; text: string } | null {
  const outcome = typeof value === 'string' ? (CARD_OUTCOME[value] ?? null) : null;
  if (outcome === null || outcome.tone !== 'error' || typeof reason !== 'string') return outcome;
  const code = squareReason(reason);
  return code === null ? outcome : { ...outcome, text: `${outcome.text} Square said: ${reasonWords(code)}.` };
}
