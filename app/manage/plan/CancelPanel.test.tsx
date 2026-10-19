import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';

const { cancelAtTermEnd, keepSite, refresh } = vi.hoisted(() => ({ cancelAtTermEnd: vi.fn(), keepSite: vi.fn(), refresh: vi.fn() }));
vi.mock('@/lib/backend/plan/actions', () => ({ cancelAtTermEnd, keepSite }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }), unstable_rethrow: () => undefined }));

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
  it('cancels only after a confirm, saying the site stays up to the end of the term', async () => {
    render(<CancelPanel cancels={false} endsOn={END} offerShowcase={false} />);
    expect(screen.getByText(new RegExp(`stays up until ${END}`))).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel my site' }));
    expect(cancelAtTermEnd).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: `Yes, close it on ${END}` }));
    await waitFor(() => expect(cancelAtTermEnd).toHaveBeenCalled());
    expect(refresh).toHaveBeenCalled();
  });

  it('offers Showcase first on Market and Full, never on Showcase', () => {
    const { rerender } = render(<CancelPanel cancels={false} endsOn={END} offerShowcase />);
    expect(screen.getByRole('link', { name: 'Move to Showcase' }).getAttribute('href')).toBe('/manage/plan/change?to=showcase');
    rerender(<CancelPanel cancels={false} endsOn={END} offerShowcase={false} />);
    expect(screen.queryByRole('link', { name: 'Move to Showcase' })).toBeNull();
  });

  it('once cancelled, shows the closing day and lets the maker keep the site', async () => {
    render(<CancelPanel cancels endsOn={END} offerShowcase={false} />);
    expect(screen.getByText(new RegExp(`goes down on ${END}`))).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Keep my site' }));
    await waitFor(() => expect(keepSite).toHaveBeenCalled());
  });

  it('shows a failure plainly', async () => {
    keepSite.mockResolvedValueOnce({ ok: false, error: 'That couldn’t be saved. Try again in a moment.' });
    render(<CancelPanel cancels endsOn={END} offerShowcase={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Keep my site' }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('That couldn’t be saved. Try again in a moment.'));
  });
});
