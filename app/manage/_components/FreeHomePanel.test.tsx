import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import { FreeNumbers, ReadyToShow } from './FreeHomePanel';
import { freeSteps, type FreeHome } from '@/lib/tools/free-home';

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

const tag = () => screen.getByRole('complementary', { name: 'Your numbers' });

describe('Free’s first steps (the ladder, Alex 2026-10-24)', () => {
  it('are Home’s steps: price a piece, the rest, the next market, what it paid', () => {
    const s = freeSteps(fresh);
    expect(s?.title).toBe('Know your numbers');
    expect(s?.steps.map((x) => x.label)).toEqual(['Price your first piece', 'Add the rest of your pieces', 'Add your next market', 'After the market, fill in what it paid you']);
    expect(s?.steps[0]).toMatchObject({ href: '/manage/tools/cost', done: false });
  });

  it('go away once every step is done', () => {
    expect(freeSteps({ ...fresh, steps: fresh.steps.map((s) => ({ ...s, done: true })), next: null })).toBeNull();
  });
});

describe('Free’s numbers on the tag', () => {
  it('starts with nothing worked out yet', () => {
    render(<FreeNumbers view={fresh} />);
    expect(within(tag()).getByText('0 of 0')).toBeInTheDocument();
    expect(within(tag()).getByText('None')).toBeInTheDocument();
    expect(within(tag()).getByText('Not yet')).toBeInTheDocument();
    expect(within(tag()).queryByText('Paid you best')).toBeNull();
  });

  it('shows pieces worked out, the one priced too low, the last market and the best', () => {
    render(
      <FreeNumbers
        view={{ ...fresh, products: 4, noCosts: 1, belowCost: [{ id: 'l2', name: 'Tin' }], lastMarket: { id: 'e2', name: 'Fall Fair', profit: 338.6, hourly: 33.86 }, bestMarket: { id: 'e1', name: 'Spring Fair', hourly: 40 } }}
      />,
    );
    expect(within(tag()).getByText('3 of 4')).toBeInTheDocument();
    expect(within(tag()).getByRole('link', { name: 'Tin' })).toHaveAttribute('href', '/manage/products');
    expect(within(tag()).getByRole('link', { name: '$339 home, $33.86 an hour' })).toHaveAttribute('href', '/manage/markets/e2?tab=after');
    expect(within(tag()).getByText('Fall Fair')).toBeInTheDocument();
    expect(within(tag()).getByRole('link', { name: '$40.00 an hour' })).toHaveAttribute('href', '/manage/markets/e1?tab=after');
  });

  it('counts several pieces priced too low, and a market with no hours', () => {
    render(<FreeNumbers view={{ ...fresh, products: 2, belowCost: [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }], lastMarket: { id: 'e', name: 'Fair', profit: 10, hourly: null } }} />);
    expect(within(tag()).getByRole('link', { name: '2 pieces' })).toBeInTheDocument();
    expect(within(tag()).getByRole('link', { name: '$10 home' })).toBeInTheDocument();
  });
});

describe('Showcase’s nudge', () => {
  it('shows once she has a few pieces, with Showcase’s price', () => {
    const { rerender } = render(<ReadyToShow view={{ ...fresh, products: 2 }} showcasePrice={5} />);
    expect(screen.queryByText('Your pieces are ready to show')).toBeNull();
    rerender(<ReadyToShow view={{ ...fresh, products: 3 }} showcasePrice={5} />);
    const up = screen.getByRole('heading', { name: 'Your pieces are ready to show' }).closest('section') as HTMLElement;
    expect(within(up).getByText(/\$5 a month/)).toBeInTheDocument();
  });
});
