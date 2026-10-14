'use client';

/**
 * Shoreline design — the menu's cart link with its count (Full), in the site's
 * own words. A client component of its own: the count lives in the browser.
 */
import type { ReactElement } from 'react';
import { CartLink } from '@/lib/storefront/CartControls';
import type { CardWords } from './words';

export function ShorelineCartLink({ w }: { w: CardWords['shoreline']['cart'] }): ReactElement {
  return <CartLink label={w.nav} labelEmpty={w.navEmpty} />;
}
