import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';

const { cancelAtTermEnd, keepSite, refresh } = vi.hoisted(() => ({
  cancelAtTermEnd: vi.fn(),
  keepSite: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock('@/lib/backend/plan/actions', () => ({ cancelAtTermEnd, keepSite }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
  unstable_rethrow: () => undefined,
}));

import { CancelPanel } from './CancelPanel';

const END = 'Tuesday, November 18, 2026';

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn(); // jsdom has no layout
  cancelAtTermEnd.mockReset().mockResolvedValue({ ok: true });
  keepSite.mockReset().mockResolvedValue({ ok: true });
  refresh.mockReset();
});
afterEach(cleanup);

describe('CancelPanel', () => {
  it('cancels only after a confirm, saying the maker moves to Free at the end of the term (Alex, 2026-11-16)', async () => {
    render(<CancelPanel cancels={false} endsOn={END} offerShowcase={false} waiting={null} />);
    expect(screen.getByText(new RegExp(`stays up until ${END}`))).toBeTruthy();
    expect(
      screen.getByText(
        /you move to Free: nothing more is charged, and your products and tools stay/,
      ),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel my site' }));
    expect(cancelAtTermEnd).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: `Yes, move me to Free on ${END}` }));
    await waitFor(() => expect(cancelAtTermEnd).toHaveBeenCalled());
    expect(refresh).toHaveBeenCalled();
  });

  it('offers Showcase first on Market and Full, never on Showcase', () => {
    const { rerender } = render(
      <CancelPanel cancels={false} endsOn={END} offerShowcase waiting={null} />,
    );
    expect(screen.getByRole('link', { name: 'Move to Showcase' }).getAttribute('href')).toBe(
      '/manage/plan/change?to=showcase',
    );
    rerender(<CancelPanel cancels={false} endsOn={END} offerShowcase={false} waiting={null} />);
    expect(screen.queryByRole('link', { name: 'Move to Showcase' })).toBeNull();
  });

  it('says what happens to a downgrade already waiting (Alex, 2026-11-16)', () => {
    render(
      <CancelPanel cancels={false} endsOn={END} offerShowcase={false} waiting="Maker Showcase" />,
    );
    expect(
      screen.getByText(
        `You’re set to move to Maker Showcase on ${END}. If you cancel instead, you move to Free that day.`,
      ),
    ).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Move to Showcase' })).toBeNull();
  });

  it('once cancelled, shows the closing day and lets the maker keep the site', async () => {
    render(<CancelPanel cancels endsOn={END} offerShowcase={false} waiting={null} />);
    expect(
      screen.getByText(
        new RegExp(
          `On ${END}, at the end of your current term, your site comes down and you move to Free`,
        ),
      ),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Keep my site' }));
    await waitFor(() => expect(keepSite).toHaveBeenCalled());
  });

  it('shows a failure plainly', async () => {
    keepSite.mockResolvedValueOnce({
      ok: false,
      error: 'That couldn’t be saved. Try again in a moment.',
    });
    render(<CancelPanel cancels endsOn={END} offerShowcase={false} waiting={null} />);
    fireEvent.click(screen.getByRole('button', { name: 'Keep my site' }));
    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toBe(
        'That couldn’t be saved. Try again in a moment.',
      ),
    );
  });
});
