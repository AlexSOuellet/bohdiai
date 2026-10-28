import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import { FreeNumbers, ReadyToShow } from './FreeHomePanel';
import { freeSteps, type FreeHome } from '@/lib/tools/free-home';

afterEach(cleanup);

const fresh: FreeHome = {
  steps: [
    { key: 'price', done: false, href: '/manage/tools/cost' },
    { key: 'pieces', done: false, href: '/manage/tools/cost' },
    { key: 'describe', done: false, href: '/manage/tools/describe' },
  ],
  next: 'price',
  belowCost: [],
  noCosts: 0,
  products: 0,
};

const tag = () => screen.getByRole('complementary', { name: 'Your numbers' });

describe('Free’s first steps (the ladder, Alex 2026-10-24)', () => {
  it('are Home’s steps: price a piece, the rest, a description (no events on Free)', () => {
    const s = freeSteps(fresh);
    expect(s?.title).toBe('Know your numbers');
    expect(s?.steps.map((x) => x.label)).toEqual(['Price your first piece', 'Add the rest of your pieces', 'Write a description for a piece']);
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
    expect(within(tag()).queryByText('Last market')).toBeNull();
  });

  it('shows pieces worked out and the one priced too low', () => {
    render(<FreeNumbers view={{ ...fresh, products: 4, noCosts: 1, belowCost: [{ id: 'l2', name: 'Tin' }] }} />);
    expect(within(tag()).getByText('3 of 4')).toBeInTheDocument();
    expect(within(tag()).getByRole('link', { name: 'Tin' })).toHaveAttribute('href', '/manage/products');
  });

  it('counts several pieces priced too low', () => {
    render(<FreeNumbers view={{ ...fresh, products: 2, belowCost: [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }] }} />);
    expect(within(tag()).getByRole('link', { name: '2 pieces' })).toBeInTheDocument();
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
