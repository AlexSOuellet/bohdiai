/**
 * The checks an online PayPal payment must pass before an order is recorded paid
 * (pure, so every rule is tested): PayPal says the order and its capture completed,
 * for exactly our total in our currency, for our order, into this shop's own PayPal.
 */
import type { Capture } from './api';

export function captureMatches(capture: Capture, expected: { paypalOrderId: string; orderId: string; merchantId: string; cents: number; currency: string }): boolean {
  return (
    capture.orderId === expected.paypalOrderId &&
    capture.status === 'COMPLETED' &&
    capture.captureStatus === 'COMPLETED' &&
    capture.captureId !== '' &&
    capture.customId === expected.orderId &&
    capture.payee === expected.merchantId &&
    capture.cents === expected.cents &&
    capture.currency.toUpperCase() === expected.currency.toUpperCase()
  );
}
