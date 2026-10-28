import { describe, it, expect, beforeEach } from 'vitest';
import { costRows, costSettingsFrom, costSummary, pricedBelowCost, hasCosts, saveProductCosts, loadProductCosts, loadCostSummaries, type CostSettings } from './product-costs';
import { takingsRow, takingsFrom, hasTakings, eventDay, saveTakings, loadTakings, loadAllTakings, EMPTY_TAKINGS, type Takings } from './event-takings';
import { freeHome, loadFreeHome, type FreeHomeInput } from './free-home';
import { costsFromTools, productLink, takingsFromTools, eventLink } from './handoff';

/** A stand-in for a Supabase query: any chain of calls, awaited, gives the next
 *  queued result (or the default). Every call is recorded. */
function chain(next: () => unknown, calls: string[]): unknown {
  const p: unknown = new Proxy(() => undefined, {
    get(_t, prop) {
      if (prop === 'then') return (ok: (v: unknown) => unknown, bad: (e: unknown) => unknown) => Promise.resolve(next()).then(ok, bad);
      return (...args: unknown[]) => {
        calls.push(`${String(prop)}(${args.map((a) => JSON.stringify(a)).join(',')})`);
        return p;
      };
    },
  });
  return p;
}
const state = { queue: [] as unknown[], calls: [] as string[] };
const db = () =>
  ({
    from: (t: string) => {
      state.calls.push(`from(${t})`);
      return chain(() => state.queue.shift() ?? { data: null, error: null }, state.calls);
    },
  }) as never;
const fail = { data: null, error: { message: 'down' } };
beforeEach(() => {
  state.queue = [];
  state.calls = [];
});

const candle: CostSettings = {
  yield: '12',
  hours: '2',
  rate: '20',
  extras: '1.50',
  markup: 2.5,
  batch: [
    { name: 'Soy wax, 10 lb bag', paid: '31.97', lasts: '2' },
    { name: 'Fragrance oil, 16 oz', paid: '30.77', lasts: '2.5' },
    { name: 'Wicks, pack of 100', paid: '9.93', lasts: '8' },
    { name: '', paid: '', lasts: '1' },
  ],
  piece: [
    { name: '8 oz jelly jar', each: '0.66' },
    { name: 'Gold lid', each: '0.33' },
  ],
};

describe('a product’s costs', () => {
  it('take half an hour typed as .5, as the tools read it (Alex, 2026-10-28)', () => {
    const r = costRows('t1', 'l1', { ...candle, hours: '.5' });
    expect(r.ok && r.costs.batch_hours).toBe(0.5);
    expect(costRows('t1', 'l1', { ...candle, hours: '.' }).ok).toBe(false);
  });

  it('turn into rows in cents, dropping blank lines, and back again', () => {
    const r = costRows('t1', 'l1', candle);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.costs).toEqual({ tenant_id: 't1', listing_id: 'l1', pieces_per_batch: 12, batch_hours: 2, hourly_pay_cents: 2000, other_cents: 150, markup: 2.5 });
    expect(r.items.map((i) => [i.kind, i.paid_cents, i.batches_lasts, i.position])).toEqual([
      ['batch', 3197, 2, 0],
      ['batch', 3077, 2.5, 1],
      ['batch', 993, 8, 2],
      ['piece', 66, null, 3],
      ['piece', 33, null, 4],
    ]);
    const back = costSettingsFrom(r.costs, [...r.items].reverse());
    expect(back).toEqual({ ...candle, batch: candle.batch.slice(0, 3), extras: '1.50', rate: '20' });
  });

  it('allow the optional numbers to be blank', () => {
    const r = costRows('t1', 'l1', { ...candle, yield: '', hours: '', rate: '', extras: '', batch: [{ name: 'Clay', paid: '24', lasts: '' }], piece: [] });
    expect(r.ok && r.costs).toMatchObject({ pieces_per_batch: null, batch_hours: null, hourly_pay_cents: null, other_cents: null });
    expect(r.ok && r.items[0]?.batches_lasts).toBeNull();
  });

  it('say what to check', () => {
    const bad = (over: Partial<CostSettings>) => {
      const r = costRows('t1', 'l1', { ...candle, ...over });
      return r.ok ? null : r.error;
    };
    expect(bad({ yield: '0' })).toMatch(/how many one batch makes/);
    expect(bad({ yield: 'lots' })).toMatch(/how many one batch makes/);
    expect(bad({ hours: '-1' })).toMatch(/hours/);
    expect(bad({ rate: 'x' })).toMatch(/hourly pay/);
    expect(bad({ extras: 'x' })).toMatch(/other costs/);
    expect(bad({ markup: 4 as never })).toMatch(/mark it up/);
    expect(bad({ batch: [{ name: 'Wax', paid: '', lasts: '1' }] })).toBe('Check what you paid for Wax.');
    expect(bad({ batch: [{ name: '', paid: 'x', lasts: '1' }] })).toBe('Check what you paid for a supply.');
    expect(bad({ batch: [{ name: 'Wax', paid: '3', lasts: '0' }] })).toBe('Check how many batches Wax lasts.');
    expect(bad({ batch: [{ name: '', paid: '3', lasts: 'x' }] })).toBe('Check how many batches a supply lasts.');
    expect(bad({ piece: [{ name: 'Jar', each: 'x' }] })).toBe('Check what Jar costs you each.');
    expect(bad({ piece: [{ name: '', each: 'x' }] })).toBe('Check what an item costs you each.');
    expect(bad({ batch: Array.from({ length: 31 }, () => ({ name: 'W', paid: '1', lasts: '1' })) })).toMatch(/30 supplies/);
  });

  it('give materials, break-even and the suggested price, and read an odd markup as the usual one', () => {
    expect(costSummary(candle)).toEqual({ materials: expect.closeTo(3.4512, 3), breakEven: expect.closeTo(8.2845, 3), suggestedCents: 2100 });
    expect(costSummary({ ...candle, yield: '', batch: [], piece: [] })).toBeNull();
    expect(costSettingsFrom({ pieces_per_batch: null, batch_hours: null, hourly_pay_cents: null, other_cents: null, markup: 7 }, []).markup).toBe(2.5);
    expect(costSettingsFrom({ pieces_per_batch: null, batch_hours: null, hourly_pay_cents: null, other_cents: null }, [{ kind: 'batch', paid_cents: 100 }]).batch).toEqual([{ name: '', paid: '1', lasts: '' }]);
  });

  it('flag a price below break-even, but not a missing one', () => {
    const s = costSummary(candle);
    expect(pricedBelowCost(700, s)).toBe(true);
    expect(pricedBelowCost(2100, s)).toBe(false);
    expect(pricedBelowCost(null, s)).toBe(false);
    expect(pricedBelowCost(0, s)).toBe(false);
    expect(pricedBelowCost(700, null)).toBe(false);
  });

  it('know whether anything is filled in', () => {
    expect(hasCosts(candle)).toBe(true);
    expect(hasCosts({ ...candle, yield: '', batch: [{ name: 'x', paid: '', lasts: '' }], piece: [{ name: '', each: '' }] })).toBe(false);
    expect(hasCosts({ ...candle, yield: '', batch: [], piece: [{ name: 'Jar', each: '1' }] })).toBe(true);
  });
});

describe('saving and reading a product’s costs', () => {
  it('replaces the costs and the supply list', async () => {
    expect(await saveProductCosts(db(), 't1', 'l1', candle)).toEqual({ ok: true });
    expect(state.calls.filter((c) => c.startsWith('from('))).toEqual(['from(product_costs)', 'from(product_cost_items)', 'from(product_cost_items)']);
    expect(state.calls.some((c) => c.startsWith('delete('))).toBe(true);
  });

  it('writes no items when there are none, and refuses bad numbers before writing', async () => {
    await saveProductCosts(db(), 't1', 'l1', { ...candle, batch: [], piece: [] });
    expect(state.calls.some((c) => c.startsWith('insert('))).toBe(false);
    state.calls = [];
    expect((await saveProductCosts(db(), 't1', 'l1', { ...candle, yield: '0' })).ok).toBe(false);
    expect(state.calls).toEqual([]);
  });

  it('says so when a write fails', async () => {
    state.queue.push(fail);
    await expect(saveProductCosts(db(), 't1', 'l1', candle)).rejects.toThrow('Could not save the costs: down');
    state.queue.push({ data: null, error: null }, fail);
    await expect(saveProductCosts(db(), 't1', 'l1', candle)).rejects.toThrow('Could not save the supplies: down');
    state.queue.push({ data: null, error: null }, { data: null, error: null }, fail);
    await expect(saveProductCosts(db(), 't1', 'l1', candle)).rejects.toThrow('Could not save the supplies: down');
  });

  it('reads one product’s costs, or none', async () => {
    state.queue.push({ data: { pieces_per_batch: 12, batch_hours: 2, hourly_pay_cents: 2000, other_cents: 150, markup: 2.5 }, error: null }, { data: [{ kind: 'piece', name: 'Jar', paid_cents: 66, batches_lasts: null, position: 0 }], error: null });
    expect((await loadProductCosts(db(), 't1', 'l1'))?.piece).toEqual([{ name: 'Jar', each: '0.66' }]);
    state.queue.push({ data: null, error: null }, { data: null, error: null });
    expect(await loadProductCosts(db(), 't1', 'l1')).toBeNull();
    state.queue.push(fail, { data: [], error: null });
    await expect(loadProductCosts(db(), 't1', 'l1')).rejects.toThrow('Could not read the costs: down');
    state.queue.push({ data: null, error: null }, fail);
    await expect(loadProductCosts(db(), 't1', 'l1')).rejects.toThrow('Could not read the supplies: down');
  });

  it('reads every product’s summary, skipping ones with nothing to go on', async () => {
    state.queue.push(
      {
        data: [
          { listing_id: 'l1', pieces_per_batch: 12, batch_hours: 2, hourly_pay_cents: 2000, other_cents: 150, markup: 2.5 },
          { listing_id: 'l2', pieces_per_batch: null, batch_hours: null, hourly_pay_cents: null, other_cents: null, markup: 2.5 },
        ],
        error: null,
      },
      { data: [{ listing_id: 'l1', kind: 'piece', name: 'Jar', paid_cents: 100, batches_lasts: null, position: 0 }], error: null },
    );
    const m = await loadCostSummaries(db(), 't1');
    expect([...m.keys()]).toEqual(['l1']);
    state.queue.push({ data: null, error: null }, { data: null, error: null });
    expect((await loadCostSummaries(db(), 't1')).size).toBe(0);
    state.queue.push(fail, { data: [], error: null });
    await expect(loadCostSummaries(db(), 't1')).rejects.toThrow('Could not read the costs: down');
    state.queue.push({ data: [], error: null }, fail);
    await expect(loadCostSummaries(db(), 't1')).rejects.toThrow('Could not read the supplies: down');
  });
});

const fair: Takings = { sales: '640', card: '380', cardRate: '3', materials: '160', hoursAtMarket: '7', hoursOther: '3', wage: '20' };

describe('a market’s own numbers', () => {
  it('turn into the row and back, and work out the day with the event’s costs', () => {
    const r = takingsRow('t1', 'e1', fair);
    expect(r.ok && r.row).toEqual({ tenant_id: 't1', event_id: 'e1', sales_cents: 64000, card_cents: 38000, card_fee_pct: 3, materials_cents: 16000, hours_at_market: 7, hours_other: 3, hourly_pay_cents: 2000 });
    if (r.ok) expect(takingsFrom(r.row)).toEqual(fair);
    expect(takingsFrom({})).toEqual(EMPTY_TAKINGS);
    const d = eventDay(fair, 13000);
    expect(d.profit).toBeCloseTo(338.6, 6);
    expect(d.verdict).toBe('worth');
  });

  it('say what to check', () => {
    const bad = (over: Partial<Takings>) => {
      const r = takingsRow('t1', 'e1', { ...fair, ...over });
      return r.ok ? null : r.error;
    };
    expect(bad({ sales: 'x' })).toMatch(/total sales/);
    expect(bad({ card: 'x' })).toMatch(/paid by card/);
    expect(bad({ card: '700' })).toMatch(/can’t be more than the total sales/);
    expect(bad({ cardRate: '150' })).toMatch(/card fee/);
    expect(bad({ materials: 'x' })).toMatch(/cost you to make/);
    expect(bad({ hoursAtMarket: 'x' })).toMatch(/hours at the market/);
    expect(bad({ hoursOther: 'x' })).toMatch(/driving and packing/);
    expect(bad({ wage: 'x' })).toMatch(/hour of your time/);
    expect(bad({ sales: '', card: '500' })).toBeNull();
  });

  it('know whether anything is filled in', () => {
    expect(hasTakings(EMPTY_TAKINGS)).toBe(false);
    expect(hasTakings({ ...EMPTY_TAKINGS, sales: '5' })).toBe(true);
  });

  it('save, read one and read all, and say so when they can’t', async () => {
    expect(await saveTakings(db(), 't1', 'e1', fair)).toEqual({ ok: true });
    expect((await saveTakings(db(), 't1', 'e1', { ...fair, sales: 'x' })).ok).toBe(false);
    state.queue.push(fail);
    await expect(saveTakings(db(), 't1', 'e1', fair)).rejects.toThrow(/Could not save the market’s numbers/);
    state.queue.push({ data: { sales_cents: 100 }, error: null });
    expect((await loadTakings(db(), 't1', 'e1'))?.sales).toBe('1');
    expect(await loadTakings(db(), 't1', 'e1')).toBeNull();
    state.queue.push(fail);
    await expect(loadTakings(db(), 't1', 'e1')).rejects.toThrow(/Could not read/);
    state.queue.push({ data: [{ event_id: 'e1', sales_cents: 100 }], error: null });
    expect((await loadAllTakings(db(), 't1')).get('e1')?.sales).toBe('1');
    expect((await loadAllTakings(db(), 't1')).size).toBe(0);
    state.queue.push(fail);
    await expect(loadAllTakings(db(), 't1')).rejects.toThrow(/Could not read/);
  });
});

describe('the hand-off carries costs and a market’s numbers', () => {
  it('sends a product’s costs and reads them back', () => {
    const href = productLink('Candle', 2100, candle);
    const params = Object.fromEntries([...new URL(href, 'https://x').searchParams.keys()].map((k) => [k, new URL(href, 'https://x').searchParams.getAll(k)]));
    const back = costsFromTools(Object.fromEntries(Object.entries(params).map(([k, v]) => [k, v.length === 1 ? v[0] : v])));
    expect(back).toEqual({ ...candle, batch: candle.batch.slice(0, 3) });
  });

  it('reads nothing without costs, an odd markup as the usual one, and a line missing its parts as blank', () => {
    expect(costsFromTools({ from: 'tools' })).toBeNull();
    expect(costsFromTools({ y: '12' })).toBeNull();
    const r = costsFromTools({ from: 'tools', y: '12', m: '9', b: 'Wax', p: 'Jar' });
    expect(r?.markup).toBe(2.5);
    expect(r?.batch).toEqual([{ name: 'Wax', paid: '', lasts: '' }]);
    expect(r?.piece).toEqual([{ name: 'Jar', each: '' }]);
  });

  it('sends a market’s numbers with the event and reads them back', () => {
    const q = new URL(eventLink('Fair', [], { ...fair, wage: '' }), 'https://x').searchParams;
    expect(q.get('t_sales')).toBe('640');
    expect(q.get('t_wage')).toBeNull();
    expect(takingsFromTools(Object.fromEntries(q))).toEqual({ ...fair, wage: '' });
    expect(takingsFromTools({ from: 'tools' })).toBeNull();
    expect(takingsFromTools({ t_sales: '5' })).toBeNull();
  });
});

describe('Free’s Home', () => {
  const summary = costSummary(candle);
  const input = (over: Partial<FreeHomeInput> = {}): FreeHomeInput => ({
    products: [
      { id: 'l1', name: 'Candle', priceCents: 2100 },
      { id: 'l2', name: 'Tin', priceCents: 500 },
      { id: 'l3', name: 'Melt', priceCents: null },
    ],
    costs: new Map([
      ['l1', summary!],
      ['l2', summary!],
    ]),
    events: [
      { id: 'e1', name: 'Spring Fair', date: '2026-05-02', costsCents: 13000 },
      { id: 'e2', name: 'Fall Fair', date: '2026-10-10', costsCents: 13000 },
    ],
    takings: new Map([
      ['e1', fair],
      ['e2', { ...fair, sales: '400' }],
    ]),
    ...over,
  });

  it('starts at the first step, with every step undone', () => {
    const h = freeHome({ products: [], costs: new Map(), events: [], takings: new Map() });
    expect(h.steps.map((s) => [s.key, s.done])).toEqual([
      ['price', false],
      ['pieces', false],
      ['event', false],
      ['after', false],
    ]);
    expect(h.next).toBe('price');
    expect(h.steps[3]?.href).toBe('/manage/tools/market');
    expect(h.lastMarket).toBeNull();
    expect(h.bestMarket).toBeNull();
  });

  it('marks steps done from what exists, and gives her numbers', () => {
    const h = freeHome(input());
    expect(h.next).toBeNull();
    expect(h.steps[3]?.href).toBe('/manage/markets/e2?tab=after');
    expect(h.belowCost).toEqual([{ id: 'l2', name: 'Tin' }]);
    expect(h.noCosts).toBe(1);
    expect(h.lastMarket).toMatchObject({ id: 'e2', name: 'Fall Fair' });
    expect(h.bestMarket).toMatchObject({ id: 'e1', name: 'Spring Fair' });
  });

  it('leaves out markets with no sales, keeps one with no hours, and needs two to name the best', () => {
    const h = freeHome(input({ takings: new Map([['e1', { ...fair, hoursAtMarket: '', hoursOther: '' }], ['e2', { ...fair, sales: '' }]]) }));
    expect(h.lastMarket).toMatchObject({ id: 'e1', hourly: null });
    expect(h.bestMarket).toBeNull();
    const two = freeHome(input({ takings: new Map([['e1', { ...fair, sales: '400' }], ['e2', fair]]) }));
    expect(two.bestMarket?.id).toBe('e2');
  });

  it('loads from the database, and says so when it can’t', async () => {
    // The costs and the markets' numbers are asked for first, then the products and events.
    const empty = { data: [], error: null };
    state.queue.push(
      { data: [{ listing_id: 'l1', pieces_per_batch: 12, batch_hours: 2, hourly_pay_cents: 2000, other_cents: 150, markup: 2.5 }], error: null },
      empty,
      { data: [{ event_id: 'e1', sales_cents: 64000, hours_at_market: 7 }], error: null },
      { data: [{ id: 'l1', name: 'Candle', base_price_cents: 300 }, { id: 'l2', name: 'Tin', base_price_cents: 0 }], error: null },
      { data: [{ id: 'e1', name: 'Fair', event_date: '2026-10-10', event_expenses: [{ amount_cents: 7500 }] }], error: null },
    );
    const h = await loadFreeHome(db(), 't1');
    expect(h.products).toBe(2);
    expect(h.belowCost).toEqual([{ id: 'l1', name: 'Candle' }]);
    expect(h.lastMarket?.name).toBe('Fair');
    state.queue.push(empty, empty, empty, fail, empty);
    await expect(loadFreeHome(db(), 't1')).rejects.toThrow('Could not read the products: down');
    state.queue.push(empty, empty, empty, empty, fail);
    await expect(loadFreeHome(db(), 't1')).rejects.toThrow('Could not read the events: down');
    state.queue.push(empty, empty, empty, { data: null, error: null }, { data: [{ id: 'e1', name: 'Fair', event_date: '2026-10-10', event_expenses: null }], error: null });
    expect((await loadFreeHome(db(), 't1')).products).toBe(0);
  });
});
