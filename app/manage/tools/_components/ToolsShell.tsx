'use client';

/**
 * Tools (Alex, 2026-10-24): Cost to make, Price it and Market day, from the toolkit
 * Alex built. They live in this layout so what she types carries from one tool to the
 * next while she moves between them. The strip across the top shows each tool's
 * answer and opens it. Products and events come out of the tools, not the other way.
 */
import { createContext, useContext, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import { costToMake, priceIt, marketDay, cents, dollars, type BatchSupply, type PieceItem, type Channel, type Markup, type MarketInput, type CostResult, type PriceResult, type MarketResult } from '@/lib/tools/maths';

export type CostForm = { name: string; yield: string; batch: BatchSupply[]; piece: PieceItem[]; hours: string; rate: string };
export type PriceForm = {
  name: string;
  materials: string;
  time: string;
  extras: string;
  markup: Markup;
  channels: Channel[];
  etsyPct: string;
  etsyFix: string;
  haggle: string;
  sitePct: string;
  siteFix: string;
  consignPct: string;
  consignRent: string;
  consignSold: string;
  low: string;
  high: string;
  /** Materials, time and the name follow Cost to make until she types over them. */
  linked: boolean;
};
export type DayForm = MarketInput & { name: string };

// The toolkit's own examples (Alex, 2026-10-24): an 8 oz soy candle at CandleScience
// prices; time, other costs and pay are guesses; comps from Craftybase's benchmark.
export const EXAMPLE_COST: CostForm = {
  name: '8 oz soy candle',
  yield: '12',
  batch: [
    { name: 'Soy wax, 10 lb bag', paid: '31.97', lasts: '2' },
    { name: 'Fragrance oil, 16 oz', paid: '30.77', lasts: '2.5' },
    { name: 'Wicks, pack of 100', paid: '9.93', lasts: '8' },
  ],
  piece: [
    { name: '8 oz jelly jar', each: '0.66' },
    { name: 'Gold lid', each: '0.33' },
  ],
  hours: '2',
  rate: '20',
};
export const BLANK_COST: CostForm = { name: '', yield: '', batch: [{ name: '', paid: '', lasts: '1' }], piece: [{ name: '', each: '' }], hours: '', rate: '20' };

export const EXAMPLE_PRICE: PriceForm = {
  name: '8 oz soy candle',
  materials: '3.45',
  time: '3.33',
  extras: '1.50',
  markup: 2.5,
  channels: ['markets', 'etsy'],
  etsyPct: '9.5',
  etsyFix: '0.45',
  haggle: '15',
  sitePct: '3',
  siteFix: '0.30',
  consignPct: '30',
  consignRent: '0',
  consignSold: '10',
  low: '16',
  high: '28',
  linked: true,
};

export const EXAMPLE_DAY: DayForm = {
  name: 'Fall Harvest Fair',
  sales: '640',
  card: '380',
  cardRate: '3',
  booth: '75',
  gas: '18',
  food: '22',
  other: '15',
  materials: '160',
  hoursAtMarket: '7',
  hoursOther: '3',
  wage: '20',
};
export const BLANK_DAY: DayForm = { name: '', sales: '', card: '', cardRate: '3', booth: '', gas: '', food: '', other: '', materials: '', hoursAtMarket: '', hoursOther: '', wage: '20' };

type Tools = {
  cost: CostForm;
  setCost: (next: CostForm) => void;
  costResult: CostResult;
  price: PriceForm;
  /** The price form as it reads, with Cost to make's numbers while it's linked. */
  priceShown: PriceForm;
  setPrice: (next: PriceForm) => void;
  priceResult: PriceResult;
  day: DayForm;
  setDay: (next: DayForm) => void;
  dayResult: MarketResult;
  canSaveProduct: boolean;
  canSaveEvent: boolean;
};

const ToolsContext = createContext<Tools | null>(null);

export function useTools(): Tools {
  const t = useContext(ToolsContext);
  if (t === null) throw new Error('useTools outside the Tools screens');
  return t;
}

/** What Price it shows: while linked, Cost to make's materials, time and name. */
export function linkedPrice(price: PriceForm, cost: CostForm, costResult: CostResult): PriceForm {
  if (!price.linked) return price;
  return {
    ...price,
    name: cost.name.trim() === '' ? price.name : cost.name,
    materials: costResult.has ? costResult.materials.toFixed(2) : '',
    time: costResult.time > 0 ? costResult.time.toFixed(2) : '',
  };
}

const TOOLS = [
  { href: '/manage/tools/cost', title: 'Cost to make' },
  { href: '/manage/tools/price', title: 'Price it' },
  { href: '/manage/tools/market', title: 'Market day' },
] as const;

export function ToolsShell({ canSaveProduct, canSaveEvent, children }: { canSaveProduct: boolean; canSaveEvent: boolean; children: React.ReactNode }): React.ReactElement {
  const pathname = usePathname();
  const [cost, setCost] = useState<CostForm>(EXAMPLE_COST);
  const [price, setPrice] = useState<PriceForm>(EXAMPLE_PRICE);
  const [day, setDay] = useState<DayForm>(EXAMPLE_DAY);
  const costResult = useMemo(() => costToMake(cost), [cost]);
  const priceShown = useMemo(() => linkedPrice(price, cost, costResult), [price, cost, costResult]);
  const priceResult = useMemo(() => priceIt({ ...priceShown, channels: new Set(priceShown.channels) }), [priceShown]);
  const dayResult = useMemo(() => marketDay(day), [day]);

  const readouts: Record<(typeof TOOLS)[number]['href'], { value: string; note: string }> = {
    '/manage/tools/cost': costResult.has
      ? { value: cents(costResult.materials), note: costResult.time > 0 ? `materials, ${cents(costResult.withTime)} with your time` : 'materials for one' }
      : { value: '—', note: 'materials for one' },
    '/manage/tools/price': priceResult.has ? { value: dollars(priceResult.fair), note: `break-even ${cents(priceResult.breakEven)}, shops ${dollars(priceResult.shop)}` } : { value: '—', note: 'your price' },
    '/manage/tools/market': dayResult.sales > 0 ? { value: dollars(dayResult.profit), note: dayResult.hours > 0 ? `${cents(dayResult.hourly)} an hour` : 'what you took home' } : { value: '—', note: 'what you took home' },
  };

  return (
    <ToolsContext.Provider value={{ cost, setCost, costResult, price, priceShown, setPrice, priceResult, day, setDay, dayResult, canSaveProduct, canSaveEvent }}>
      <div className="bk-head">
        <h1 className="bk-title">Tools</h1>
      </div>
      <main id="main" className="bk-content bk-tools">
        <nav className="bk-tool-strip" aria-label="Tools">
          {TOOLS.map((t) => {
            const r = readouts[t.href];
            return (
              <Link key={t.href} href={t.href as Route} className="bk-tool-ro" aria-current={pathname === t.href ? 'page' : undefined}>
                <span className="bk-tool-ro-title">{t.title}</span>
                <span className="bk-tool-ro-value">{r.value}</span>
                <span className="bk-tool-ro-note">{r.note}</span>
              </Link>
            );
          })}
        </nav>
        {children}
      </main>
    </ToolsContext.Provider>
  );
}
