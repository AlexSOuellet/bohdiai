import { describe, it, expect } from 'vitest';
import { emptyProductForm } from '@/lib/backend/catalog/product-form';
import { emptyMarketForm } from '@/lib/backend/markets/market-form';
import { productLink, productFromTools, eventLink, eventFromTools } from './handoff';

const paramsOf = (href: string): Record<string, string | string[]> => {
  const out: Record<string, string | string[]> = {};
  for (const [k, v] of new URL(href, 'https://app.bohdiai.com').searchParams) {
    const had = out[k];
    out[k] = had === undefined ? v : [...(Array.isArray(had) ? had : [had]), v];
  }
  return out;
};

describe('Save as a product', () => {
  it('opens a new product with the name and price filled in', () => {
    const href = productLink('  8 oz soy candle ', 2100);
    expect(href).toBe('/manage/products/new?from=tools&name=8+oz+soy+candle&price=2100');
    expect(productFromTools(paramsOf(href))).toEqual({ ...emptyProductForm(), name: '8 oz soy candle', price: '21' });
  });

  it('leaves out a blank name or no price, and keeps cents', () => {
    expect(productLink(' ', 0)).toBe('/manage/products/new?from=tools');
    expect(productLink('Dish', Number.NaN)).toBe('/manage/products/new?from=tools&name=Dish');
    expect(productFromTools({ from: 'tools', price: '2150' }).price).toBe('21.50');
  });

  it('starts as usual when the tools didn’t send it, and ignores anything odd', () => {
    expect(productFromTools({ name: 'Sneaky' })).toEqual(emptyProductForm());
    expect(productFromTools({ from: 'tools', price: '-5' }).price).toBe('');
    expect(productFromTools({ from: 'tools', price: '12.5' }).price).toBe('');
    expect(productFromTools({ from: ['tools', 'x'], name: ['A', 'B'] }).name).toBe('A');
    expect(productFromTools({ from: 'tools', name: 'x'.repeat(200) }).name).toHaveLength(120);
    expect(productFromTools({ from: [] }).name).toBe('');
  });
});

describe('Save as an event', () => {
  it('opens a new event with the market’s name and its costs', () => {
    const href = eventLink('Fall Harvest Fair', [
      { description: 'Booth fee', cents: 7500 },
      { description: 'Gas, tolls and parking', cents: 1850 },
      { description: 'Food and coffee', cents: 0 },
    ]);
    expect(eventFromTools(paramsOf(href))).toEqual({
      ...emptyMarketForm(),
      name: 'Fall Harvest Fair',
      costs: [
        { description: 'Booth fee', amount: '75' },
        { description: 'Gas, tolls and parking', amount: '18.50' },
      ],
    });
  });

  it('keeps a description with a colon in it, and one cost on its own', () => {
    expect(eventFromTools({ from: 'tools', cost: '500:Bags: kraft' }).costs).toEqual([{ description: 'Bags: kraft', amount: '5' }]);
  });

  it('drops costs that are malformed, zero or unnamed, and caps the list and the words', () => {
    const r = eventFromTools({ from: 'tools', cost: ['abc:Booth', ':Booth', '0:Booth', '500:', '500', `100:${'y'.repeat(80)}`, ...Array.from({ length: 30 }, (_, i) => `${i + 1}00:Cost ${i}`)] });
    expect(r.costs[0]?.description).toHaveLength(60);
    expect(r.costs).toHaveLength(20);
    expect(eventFromTools({ from: 'tools', name: 'n'.repeat(90) }).name).toHaveLength(60);
  });

  it('starts as usual when the tools didn’t send it, and leaves out a blank name', () => {
    expect(eventFromTools({ cost: '7500:Booth fee' })).toEqual(emptyMarketForm());
    expect(eventLink(' ', [{ description: 'Booth', cents: Number.NaN }])).toBe('/manage/markets/new?from=tools');
  });
});
