'use client';

/**
 * Business card, shoreline design — the buyer's steps on a market's page, in the
 * shoreline's words and look. The steps themselves are shared with every design
 * (lib/storefront/MarketBuyer.tsx). The words are read here, on the client, because
 * some of them are functions, which a server page can't hand to a client component.
 */
import type { ReactElement } from 'react';
import type { ProductView } from '@/lib/archetypes/content';
import type { PayMethod } from '@/lib/market/pay';
import { MarketBuyer } from '@/lib/storefront/MarketBuyer';
import { CARD_STRINGS as S } from './strings';

export function ShorelineMarketBuyer(props: {
  marketId: string;
  pieces: ProductView[];
  methods: PayMethod[];
}): ReactElement {
  return <MarketBuyer {...props} strings={S.shoreline.market} prefix="sl" shop={{ href: '/shop', label: S.shoreline.market.toShop }} />;
}
