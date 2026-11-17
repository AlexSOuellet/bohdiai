/**
 * Whether the shopper's order is placed once they're back from Square's page (paid,
 * or still being confirmed), so the cart is done with. Plain code, not a browser
 * component: the designs call it while drawing the cart on the server.
 */
import type { CheckoutReturn } from '@/lib/archetypes/content';

export function returnedDone(r: CheckoutReturn | undefined): boolean {
  return r?.kind === 'paid' || r?.kind === 'waiting';
}
