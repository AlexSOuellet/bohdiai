import { describe, it, expect } from 'vitest';
import { readPricing, pricingBrief } from './pricing';
import { bankQuestion, toAsked } from './bank';
import type { Answer, Turn } from './transcript';

const turn = (id: string, answer: Answer): Turn => {
  const q = bankQuestion(id);
  if (q === undefined) throw new Error(`no question ${id}`);
  return { question: toAsked(q, [], ''), answer };
};

describe('readPricing', () => {
  it('has nothing to say without money answers', () => {
    expect(readPricing([])).toBeNull();
  });

  it('calls a healthy amount left "fine", however many shoppers hesitate', () => {
    expect(readPricing([turn('left_over', '$15 to $30'), turn('market_table', ['They hesitate at the price'])])).toBe('fine');
  });

  it('calls it mixed when the numbers are fine but they price low out of nerves', () => {
    expect(readPricing([turn('left_over', '$15 to $30'), turn('price_how', ['I price low so it sells'])])).toBe('room');
    expect(readPricing([turn('left_over', 'More than $30'), turn('price_how', ['I feel funny charging more'])])).toBe('room');
  });

  it('calls very little left thin, and underpriced when nerves are behind it', () => {
    expect(readPricing([turn('left_over', '$5 to $15')])).toBe('thin');
    expect(readPricing([turn('left_over', 'Less than $5'), turn('price_how', ['I price low so it sells', 'and I worry nobody will buy'])])).toBe(
      'thin_nervous',
    );
  });

  it('uses whether sales cover supplies for a pay-for-itself maker', () => {
    expect(readPricing([turn('covers', 'About even')])).toBe('thin');
    expect(readPricing([turn('covers', 'Yes, with a bit left over')])).toBe('fine');
    expect(readPricing([turn('covers', 'I haven’t kept track')])).toBe('unknown');
    expect(readPricing([turn('left_over', 'I’ve never worked it out')])).toBe('unknown');
  });
});

describe('pricingBrief', () => {
  it('tells the model the call, and that hesitation is no evidence', () => {
    expect(pricingBrief('room')).toMatch(/mixed read/);
    expect(pricingBrief('fine')).toMatch(/don't suggest raising it/);
    expect(pricingBrief('fine')).toMatch(/hesitating at the price is normal/);
    expect(pricingBrief(null)).toMatch(/leave pricing out/);
  });
});
