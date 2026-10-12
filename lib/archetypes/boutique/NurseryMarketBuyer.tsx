'use client';

/**
 * Boutique, nursery design — the buyer's steps on a market's page (Market POS
 * piece 2), in the nursery's words and look. The steps themselves are shared
 * with every design (lib/storefront/MarketBuyer.tsx).
 */
import type { ReactElement } from 'react';
import type { ProductView } from '@/lib/archetypes/content';
import type { PayMethod } from '@/lib/market/pay';
import { MarketBuyer } from '@/lib/storefront/MarketBuyer';
import { NURSERY_STRINGS as S } from './strings';

export function NurseryMarketBuyer(props: {
  marketId: string;
  pieces: ProductView[];
  methods: PayMethod[];
}): ReactElement {
  return <MarketBuyer {...props} strings={{ ...S.market, gone: S.card.adopted }} prefix="nn" />;
}
