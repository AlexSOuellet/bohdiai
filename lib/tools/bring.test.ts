import { describe, it, expect } from 'vitest';
import { whatToBring, bringChoices } from './bring';
import type { PieceResult } from '@/lib/backend/markets/piece-sales';

const row = (eventId: string, key: string, name: string, sold: number, soldOut = false): PieceResult => ({
  eventId,
  key,
  name,
  brought: soldOut ? sold : sold + 2,
  sold,
  left: soldOut ? 0 : 2,
  soldOutAt: soldOut ? '2026-10-10T15:00:00Z' : null,
  givenCents: 0,
});

describe('What to bring (Alex, 2026-10-28)', () => {
  const results = [row('e1', 'l1', 'Candle', 6), row('e2', 'l1', 'Candle', 9, true), row('e1', 'l2', 'Tin', 2), row('e3', 'l2', 'Tin', 20)];

  it('suggests the most sold at one market, with the average and the sell-outs, best seller first', () => {
    expect(whatToBring(results, new Set(['e1', 'e2']))).toEqual([
      { key: 'l1', name: 'Candle', markets: 2, sold: 15, average: 7.5, best: 9, soldOut: 1 },
      { key: 'l2', name: 'Tin', markets: 1, sold: 2, average: 2, best: 2, soldOut: 0 },
    ]);
  });

  it('reads only the markets picked, and names ties in order', () => {
    expect(whatToBring(results, new Set(['e3'])).map((l) => l.name)).toEqual(['Tin']);
    expect(whatToBring([row('e1', 'b', 'Bowl', 1), row('e1', 'a', 'Apron', 1)], new Set(['e1'])).map((l) => l.name)).toEqual(['Apron', 'Bowl']);
    expect(whatToBring(results, new Set())).toEqual([]);
  });

  it('puts each market’s dates together, newest first', () => {
    expect(
      bringChoices([
        { id: 'e1', name: 'Fall Fair', date: '2025-10-11' },
        { id: 'e2', name: 'Holly Fair ', date: '2025-12-06' },
        { id: 'e3', name: 'Fall Fair', date: '2026-10-10' },
      ]),
    ).toEqual([
      { name: 'Fall Fair', ids: ['e3', 'e1'] },
      { name: 'Holly Fair', ids: ['e2'] },
    ]);
  });
});
