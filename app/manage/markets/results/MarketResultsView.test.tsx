import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import { MarketResultsView } from './MarketResultsView';

const results = [
  { id: 'a', name: 'Harvest Fair', date: '2026-10-24', town: 'Bristol', rating: 5, sales: 2, takingsCents: 9000, costsCents: 5000, profitCents: 4000 },
  { id: 'b', name: 'Holiday Market', date: '2026-11-14', town: '', rating: 0, sales: 1, takingsCents: 3400, costsCents: 9000, profitCents: -5600 },
  { id: 'd', name: 'Harvest Fair', date: '2025-10-25', town: 'Bristol', rating: 4, sales: 1, takingsCents: 7000, costsCents: 4000, profitCents: 3000 },
];

afterEach(cleanup);

describe('Market results', () => {
  it('compares this year with last and ranks each year’s markets', () => {
    render(<MarketResultsView results={results} year={2026} />);
    expect(screen.getByText('Profit 2026').nextElementSibling?.textContent).toBe('−$16');
    expect(screen.getByText(/−\$46 on 2025/)).toBeTruthy();
    const thisYear = screen.getByRole('region', { name: '2026, best first' });
    expect(within(thisYear).getAllByRole('row').slice(1).map((r) => r.querySelector('td')?.textContent)).toEqual(['Harvest Fair · Bristol', 'Holiday Market']);
    expect(screen.getByRole('region', { name: '2025, best first' })).toBeTruthy();
  });

  it('says when there is no last year to compare', () => {
    render(<MarketResultsView results={results.slice(0, 2)} year={2026} />);
    expect(screen.getAllByText('No markets in 2025 to compare')).toHaveLength(3);
    expect(screen.queryByRole('region', { name: '2025, best first' })).toBeNull();
  });
});
