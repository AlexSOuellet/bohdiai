'use client';

/**
 * Shoreline design — the menu's cart link with its count (Full). A client component
 * of its own so the wording function stays on this side of the server boundary.
 */
import type { ReactElement } from 'react';
import { CartLink } from '@/lib/storefront/CartControls';
import { CARD_STRINGS } from './strings';

export function ShorelineCartLink(): ReactElement {
  return <CartLink label={CARD_STRINGS.shoreline.cart.nav} />;
}
