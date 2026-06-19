'use client';

import { useState } from 'react';
import { SectionKicker } from './SectionKicker';

type Trade = { name: string; featured?: boolean };

// Only niches we have built or have locked to build (the 43-niche traditional-
// craft launch batch). Keep this list in step with content/niches/ — no trades
// we don't actually cover.
const TRADES_ROW_1: readonly Trade[] = [
  { name: 'Candle maker', featured: true },
  { name: 'Sourdough baker', featured: true },
  { name: 'Jewelry maker', featured: true },
  { name: 'Soap maker' },
  { name: 'Woodworker' },
  { name: 'Potter' },
  { name: 'Leatherworker' },
  { name: 'Knitter' },
  { name: 'Crocheter' },
  { name: 'Quilter' },
  { name: 'Florist' },
  { name: 'Herbalist' },
  { name: 'Printmaker' },
  { name: 'Chocolatier' },
  { name: 'Cake decorator' },
  { name: 'Coffee roaster' },
  { name: 'Hot sauce maker' },
  { name: 'Honey producer' },
  { name: 'Cheesemaker' },
];

const TRADES_ROW_2: readonly Trade[] = [
  { name: 'Stained glass artist' },
  { name: 'Resin artist' },
  { name: 'Macramé artist' },
  { name: 'Embroiderer' },
  { name: 'Calligrapher' },
  { name: 'Wedding stationery' },
  { name: 'Pins & patches' },
  { name: 'Toy maker' },
  { name: 'Plush & doll maker' },
  { name: 'Glass artist' },
  { name: 'Mosaic artist' },
  { name: 'Knife maker' },
  { name: 'Wood turner' },
  { name: 'Woodcarver' },
  { name: 'Weaver' },
  { name: 'Basket weaver' },
  { name: 'Tea blender' },
  { name: 'Jam & preserves' },
  { name: 'Vintage seller' },
  { name: 'Antique dealer' },
];

export function TradesMarquee(): React.ReactElement {
  return (
    <section className="relative z-content px-3 pb-16 pt-14 md:pb-24 md:pt-20">
      <SectionKicker>Built for every kind of small business</SectionKicker>

      <h2 className="mx-auto max-w-[780px] px-3 text-center font-sans text-[30px] font-medium leading-[1.05] tracking-[-0.025em] text-text-soft md:text-[48px] md:tracking-[-0.03em]">
        If you make it, bake it, teach it, or sell it —{' '}
        <em className="not-italic text-honey-warm [text-shadow:0_0_32px_rgba(243,201,122,0.5)]">
          we build it for you
        </em>
        .
      </h2>
      <p className="mx-auto mb-10 mt-3.5 max-w-[540px] px-3 text-center text-[14px] leading-[1.55] text-muted md:mb-14 md:mt-4 md:text-[16px]">
        BohdiAI doesn&apos;t pick a template. It generates a storefront tuned to your specific kind
        of business.
      </p>

      <MarqueeRow trades={TRADES_ROW_1} reverse={false} />
      <div className="mt-3.5">
        <MarqueeRow trades={TRADES_ROW_2} reverse={true} />
      </div>

      <p className="mt-10 text-center text-[14px] font-medium text-text-soft [text-shadow:0_2px_12px_rgba(0,0,0,0.7)] md:text-[15px]">
        …and <b className="font-bold text-honey-warm">97 more</b> business types and counting.{' '}
        <span className="text-honey-warm">Don&apos;t see yours?</span> Tell us and we&apos;ll tune
        one for you.
      </p>
    </section>
  );
}

function MarqueeRow({
  trades,
  reverse,
}: {
  trades: readonly Trade[];
  reverse: boolean;
}): React.ReactElement {
  const [paused, setPaused] = useState(false);
  return (
    <div
      className={`marquee-fade ${paused ? 'paused' : ''}`}
      onClick={() => setPaused((p) => !p)}
    >
      <div
        className={`flex w-max gap-3 ${
          reverse ? 'animate-scroll-right' : 'animate-scroll-left'
        }`}
      >
        {[...trades, ...trades].map((t, i) => (
          <TradeChip key={`${t.name}-${i}`} trade={t} />
        ))}
      </div>
    </div>
  );
}

function TradeChip({ trade }: { trade: Trade }): React.ReactElement {
  if (trade.featured) {
    return (
      <span className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-pill border border-honey-warm/[0.35] bg-honey-warm/[0.1] px-4 py-2.5 text-[14px] font-medium tracking-[-0.005em] text-honey-warm">
        <span className="size-1.5 rounded-full bg-honey-warm shadow-[0_0_8px_var(--honey-warm)]" />
        {trade.name}
      </span>
    );
  }
  return (
    <span className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-pill border border-text/[0.1] bg-text/[0.04] px-4 py-2.5 text-[14px] font-medium tracking-[-0.005em] text-text-soft transition-colors hover:border-honey-warm/[0.25] hover:bg-honey-warm/[0.08]">
      <span className="size-1.5 rounded-full bg-muted" />
      {trade.name}
    </span>
  );
}
