import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import { MarketList } from './MarketList';
import type { MarketRowView } from '@/lib/backend/markets/queries';

const m = (id: string, name: string, date: string, over: Partial<MarketRowView> = {}): MarketRowView => ({
  id,
  name,
  date,
  endDate: '',
  town: 'Johnston',
  canceled: false,
  rating: 0,
  costs: '$0',
  ...over,
});

afterEach(cleanup);

describe('MarketList', () => {
  it('lists coming-up markets soonest first and past ones newest first, with stars', () => {
    render(
      <MarketList
        today="2026-10-15"
        markets={[
          m('a', 'Scituate Art Festival', '2026-10-10', { endDate: '2026-10-12', rating: 4 }),
          m('b', 'Pumpkin Fest', '2026-10-14'),
          m('c', 'Bazaar', '2026-10-17'),
          m('d', 'Holly Fair', '2026-11-21', { canceled: true }),
        ]}
      />,
    );
    const upcoming = within(screen.getByRole('list', { name: 'Coming up' })).getAllByRole('link').map((a) => a.querySelector('.bk-list-name')?.textContent);
    expect(upcoming).toEqual(['Bazaar', 'Holly Fair']);
    const past = within(screen.getByRole('list', { name: 'Past markets' })).getAllByRole('link').map((a) => a.querySelector('.bk-list-name')?.textContent);
    expect(past).toEqual(['Pumpkin Fest', 'Scituate Art Festival']);
    expect(screen.getByLabelText('4 of 5 stars')).toBeTruthy();
    expect(screen.getByText('Canceled')).toBeTruthy();
    expect(screen.getByRole('link', { name: /Bazaar/ }).getAttribute('href')).toBe('/manage/markets/c');
  });

  it('says what to do when there are none', () => {
    render(<MarketList markets={[]} today="2026-10-15" />);
    expect(screen.getByText(/No markets yet/)).toBeTruthy();
  });
});
