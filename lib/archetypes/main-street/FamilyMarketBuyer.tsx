'use client';

/**
 * Main Street — the buyer's steps on a market's page, in the family's words and
 * look. The steps themselves are shared with every design
 * (lib/storefront/MarketBuyer.tsx). The words are the site's own.
 */
import type { ReactElement } from 'react';
import type { ProductView } from '@/lib/archetypes/content';
import type { PayMethod } from '@/lib/market/pay';
import { MarketBuyer } from '@/lib/storefront/MarketBuyer';
import type { FamilyWords } from './words';

export function FamilyMarketBuyer(props: { marketId: string; pieces: ProductView[]; methods: PayMethod[]; w: FamilyWords['market'] }): ReactElement {
  const { w, ...rest } = props;
  return <MarketBuyer {...rest} strings={w} prefix="ms" shop={{ href: '/shop', label: w.toShop }} />;
}
