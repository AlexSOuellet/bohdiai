'use client';

import { useState } from 'react';
import { SectionKicker } from './SectionKicker';

type Trade = { name: string; featured?: boolean };

// The three kinds of business bohdiai.com builds for. Illustrative, not a menu:
// anyone in these worlds is a fit, listed or not.
const MAKERS: readonly Trade[] = [
  { name: 'Candle maker', featured: true },
  { name: 'Sourdough baker', featured: true },
  { name: 'Decoupage artist', featured: true },
  { name: 'Jewelry maker', featured: true },
  { name: 'Soap maker' },
  { name: 'Woodworker' },
  { name: 'Potter' },
  { name: 'Knitter' },
  { name: 'Quilter' },
  { name: 'Florist' },
  { name: 'Printmaker' },
  { name: 'Cake decorator' },
  { name: 'Hot sauce maker' },
  { name: 'Honey producer' },
  { name: 'Stained glass artist' },
  { name: 'Resin artist' },
  { name: 'Laser engraver' },
  { name: 'Embroiderer' },
  { name: 'Jam & preserves' },
  { name: 'Vintage seller' },
];

const TRADES: readonly Trade[] = [
  { name: 'Lawn care', featured: true },
  { name: 'Landscaper', featured: true },
  { name: 'House cleaning', featured: true },
  { name: 'Hardscaping & patios' },
  { name: 'Sod & grading' },
  { name: 'Tree service' },
  { name: 'Snow removal' },
  { name: 'Handyman' },
  { name: 'Painter' },
  { name: 'Power washing' },
  { name: 'Pet grooming' },
  { name: 'Photographer' },
  { name: 'Mobile detailing' },
  { name: 'Junk removal' },
  { name: 'Pool service' },
  { name: 'Fencing' },
];

const CAUSES: readonly Trade[] = [
  { name: 'Animal rescue', featured: true },
  { name: 'Food pantry', featured: true },
  { name: 'Church' },
  { name: 'Youth sports league' },
  { name: 'PTA & PTO' },
  { name: 'Veterans group' },
  { name: 'Community garden' },
  { name: 'Friends of the library' },
  { name: 'Arts council' },
  { name: 'Shelter' },
  { name: 'Scholarship fund' },
  { name: 'Charity ride' },
  { name: 'Historical society' },
  { name: 'Fire department auxiliary' },
];

const ROWS = [
  { label: 'Makers', trades: MAKERS, reverse: false },
  { label: 'Trades & services', trades: TRADES, reverse: true },
  { label: 'Charities & causes', trades: CAUSES, reverse: false },
] as const;

export function TradesMarquee(): React.ReactElement {
  return (
    <section id="who-for" className="relative z-content px-3 pb-16 pt-24 md:pb-24 md:pt-32">
      <SectionKicker>Who I build for</SectionKicker>

      <h2 className="mx-auto max-w-[780px] px-3 text-center font-sans text-[30px] font-medium leading-[1.05] tracking-[-0.025em] text-text-soft md:text-[48px] md:tracking-[-0.03em]">
        Makers,{' '}
        <em className="not-italic text-honey-warm [text-shadow:0_0_32px_rgba(243,201,122,0.5)]">trades</em>{' '}
        and good causes
      </h2>
      <p className="mx-auto mb-10 mt-3.5 max-w-[540px] px-3 text-center text-[14px] leading-[1.55] text-muted md:mb-14 md:mt-4 md:text-[16px]">
        Your site should look like your business, not a template. Here are some of the people I build for.
      </p>

      {ROWS.map((row, i) => (
        <div key={row.label} className={i === 0 ? '' : 'mt-7 md:mt-8'}>
          <p className="mb-3 text-center text-[11px] font-medium uppercase tracking-[0.22em] text-muted">{row.label}</p>
          <MarqueeRow trades={row.trades} reverse={row.reverse} />
        </div>
      ))}

      <p className="mt-10 text-center text-[14px] font-medium text-text-soft [text-shadow:0_2px_12px_rgba(0,0,0,0.7)] md:text-[15px]">
        <span className="text-honey-warm">Don&apos;t see yours?</span>{' '}
        <a href="#contact" className="text-text-soft underline decoration-honey-warm/50 underline-offset-4 hover:decoration-honey-warm">
          Tell me what you do
        </a>
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
