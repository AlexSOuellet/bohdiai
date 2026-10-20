'use client';

/**
 * Business card, shoreline design — the buyer's steps on a market's page, in the
 * shoreline's words and look. The steps themselves are shared with every design
 * (lib/storefront/MarketBuyer.tsx). The words are the site's own.
 */
import type { ReactElement } from 'react';
import type { MarketPieceCount, ProductView } from '@/lib/archetypes/content';
import type { PayMethod } from '@/lib/market/pay';
import { MarketBuyer } from '@/lib/storefront/MarketBuyer';
import type { CardWords } from './words';

export function ShorelineMarketBuyer(props: {
  marketId: string;
  pieces: ProductView[]; stock?: Record<string, MarketPieceCount> | undefined;
  methods: PayMethod[];
  w: CardWords['shoreline']['market'];
}): ReactElement {
  const { w, ...rest } = props;
  return <MarketBuyer {...rest} strings={w} prefix="sl" shop={{ href: '/shop', label: w.toShop }} />;
}
