import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { PieceSales, SoldOutList } from './PieceSales';
import type { PieceResult } from '@/lib/backend/markets/piece-sales';

afterEach(cleanup);

const mug: PieceResult = { eventId: 'e1', key: 'a', name: 'Mug', brought: 3, sold: 3, left: 0, soldOutAt: '2026-10-20T18:15:00Z', givenCents: 0 };
const card: PieceResult = { eventId: 'e1', key: 'c', name: 'Card', brought: null, sold: 4, left: null, soldOutAt: null, givenCents: 0 };

describe('PieceSales', () => {
  it('shows brought, sold, left and the time a counted piece sold out, in the shop’s time', () => {
    render(<PieceSales rows={[mug, card]} timeZone="America/New_York" />);
    expect(screen.getByRole('heading', { name: 'How it sold' })).toBeTruthy();
    expect(screen.getByText('2:15 PM')).toBeTruthy();
    expect(screen.getByText('Not counted')).toBeTruthy();
  });
  it('shows what was haggled off, only once something was', () => {
    render(<PieceSales rows={[mug, card]} timeZone="America/New_York" />);
    expect(screen.queryByText('Haggled off')).toBeNull();
    cleanup();
    render(<PieceSales rows={[{ ...mug, givenCents: 350 }, { ...card, givenCents: 200 }]} timeZone="America/New_York" />);
    expect(screen.getByRole('columnheader', { name: 'Haggled off' })).toBeTruthy();
    expect(screen.getByText('$5.50')).toBeTruthy();
  });
  it('shows nothing until something was counted or sold', () => {
    const { container } = render(<PieceSales rows={[]} timeZone="America/New_York" />);
    expect(container.innerHTML).toBe('');
  });
});

describe('SoldOutList', () => {
  it('lists what sold out, where and when, newest first', () => {
    const later = { ...mug, key: 'b', name: 'Bowl', eventId: 'e2', soldOutAt: '2026-10-25T15:00:00Z' };
    render(<SoldOutList rows={[mug, card, later]} markets={new Map([['e1', 'Harvest Fair']])} timeZone="America/New_York" />);
    const items = screen.getAllByRole('listitem').map((li) => li.textContent);
    expect(items).toEqual(['BowlA market · all 3 gone by 11:00 AM, Sun, Oct 25', 'MugHarvest Fair · all 3 gone by 2:15 PM, Tue, Oct 20']);
  });
  it('says how to get there when nothing has sold out', () => {
    render(<SoldOutList rows={[card]} markets={new Map()} timeZone="America/New_York" />);
    expect(screen.getByText(/Nothing has sold out yet/)).toBeTruthy();
  });
});
