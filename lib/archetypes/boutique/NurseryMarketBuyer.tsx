'use client';

/**
 * Boutique, nursery design — the buyer's steps on a market's page (Market POS
 * piece 2), in the nursery's words and look. The steps themselves are shared
 * with every design (lib/storefront/MarketBuyer.tsx). The words are the site's own.
 */
import type { ReactElement } from 'react';
import type { ProductView } from '@/lib/archetypes/content';
import type { PayMethod } from '@/lib/market/pay';
import { MarketBuyer } from '@/lib/storefront/MarketBuyer';
import type { NurseryWords } from './words';

export function NurseryMarketBuyer(props: {
  marketId: string;
  pieces: ProductView[];
  methods: PayMethod[];
  w: NurseryWords['market'];
}): ReactElement {
  const { w, ...rest } = props;
  return <MarketBuyer {...rest} strings={w} prefix="nn" />;
}
