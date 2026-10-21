import { describe, it, expect } from 'vitest';
import { cardOutcome } from './card-outcome';

describe('cardOutcome', () => {
  it('says what happened, and nothing for an unknown outcome', () => {
    expect(cardOutcome('paid')).toEqual({ tone: 'ok', text: 'Card sale recorded. Square confirmed the payment.' });
    expect(cardOutcome('canceled')?.text).toBe('Card sale canceled in Square. Nothing was charged or recorded.');
    expect(cardOutcome('nonsense')).toBeNull();
    expect(cardOutcome(undefined)).toBeNull();
  });

  it('adds Square’s own reason to a failure, in words, when it’s a plain code', () => {
    expect(cardOutcome('square-error', 'com.squareup.pos.ERROR_USER_NOT_LOGGED_IN')?.text).toBe(
      'Square couldn’t take the card, so nothing was recorded. Try again, or take another way to pay. Square said: user not logged in.',
    );
    expect(cardOutcome('square-error', '<b>hi</b>')?.text).not.toContain('Square said');
    expect(cardOutcome('paid', 'whatever')?.text).not.toContain('Square said');
  });
});
