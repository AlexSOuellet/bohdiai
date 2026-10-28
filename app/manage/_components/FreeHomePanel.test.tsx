import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import { FreeHomePanel } from './FreeHomePanel';
import type { FreeHome } from '@/lib/tools/free-home';

afterEach(cleanup);

const fresh: FreeHome = {
  steps: [
    { key: 'price', done: false, href: '/manage/tools/cost' },
    { key: 'pieces', done: false, href: '/manage/tools/cost' },
    { key: 'event', done: false, href: '/manage/markets/new' },
    { key: 'after', done: false, href: '/manage/tools/market' },
  ],
  next: 'price',
  belowCost: [],
  noCosts: 0,
  products: 0,
  lastMarket: null,
  bestMarket: null,
};

describe('FreeHomePanel — Free’s Home (Alex, 2026-10-24)', () => {
  it('lights the step to do next, with one Start', () => {
    render(<FreeHomePanel view={fresh} showcasePrice={5} />);
    const steps = screen.getAllByRole('listitem').slice(0, 4);
    expect(steps[0]).toHaveAttribute('data-state', 'now');
    expect(steps[1]).toHaveAttribute('data-state', 'later');
    expect(screen.getAllByRole('link', { name: 'Start' })).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Start' })).toHaveAttribute('href', '/manage/tools/cost');
    expect(screen.getByText('No pieces yet. Price your first one in Cost to make.')).toBeInTheDocument();
    expect(screen.getByText(/Nothing filled in yet/)).toBeInTheDocument();
    expect(screen.queryByText('Your pieces are ready to show')).toBeNull();
  });

  it('shows her numbers once there are some, and the way up to Showcase', () => {
    const view: FreeHome = {
      ...fresh,
      steps: fresh.steps.map((s) => ({ ...s, done: true })),
      next: null,
      belowCost: [{ id: 'l2', name: 'Tin' }],
      products: 4,
      lastMarket: { id: 'e2', name: 'Fall Fair', profit: 338.6, hourly: 33.86 },
      bestMarket: { id: 'e1', name: 'Spring Fair', hourly: 40 },
    };
    render(<FreeHomePanel view={view} showcasePrice={5} />);
    expect(screen.queryByText('Know your numbers')).toBeNull();
    expect(screen.getByText('Tin').closest('a')).toHaveAttribute('href', '/manage/products');
    expect(screen.getByText('Fall Fair').closest('a')).toHaveTextContent('you took home $339, $33.86 an hour.');
    expect(screen.getByText('Spring Fair').closest('a')).toHaveAttribute('href', '/manage/markets/e1?tab=after');
    const up = screen.getByRole('heading', { name: 'Your pieces are ready to show' }).closest('section')!;
    expect(within(up).getByText(/\$5 a month/)).toBeInTheDocument();
  });

  it('counts several pieces priced too low, and pieces with no costs', () => {
    const { rerender } = render(<FreeHomePanel view={{ ...fresh, belowCost: [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }], products: 2 }} showcasePrice={5} />);
    expect(screen.getByText('2 pieces')).toBeInTheDocument();
    rerender(<FreeHomePanel view={{ ...fresh, products: 3, noCosts: 2 }} showcasePrice={5} />);
    expect(screen.getByText('2 of your 3 pieces have no costs worked out yet.')).toBeInTheDocument();
    rerender(<FreeHomePanel view={{ ...fresh, products: 2, lastMarket: { id: 'e', name: 'Fair', profit: 10, hourly: null } }} showcasePrice={5} />);
    expect(screen.getByText('Every piece is priced above what it costs you.')).toBeInTheDocument();
    expect(screen.getByText('Fair').closest('a')).toHaveTextContent('you took home $10.');
  });
});
