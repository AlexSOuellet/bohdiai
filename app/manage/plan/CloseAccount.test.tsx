import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';

const { closeAccount, keepSite, refresh } = vi.hoisted(() => ({
  closeAccount: vi.fn(),
  keepSite: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock('@/lib/backend/plan/actions', () => ({ closeAccount, keepSite }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
  unstable_rethrow: () => undefined,
}));

import { CloseAccount } from './CloseAccount';

const END = 'December 16, 2026';
beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
  closeAccount.mockReset().mockResolvedValue({ ok: true });
  keepSite.mockReset().mockResolvedValue({ ok: true });
  refresh.mockReset();
});
afterEach(cleanup);

describe('Close my account (Alex, 2026-11-16)', () => {
  it('is one plain line until opened', () => {
    render(
      <CloseAccount
        siteName="Lena Hart Decoupage"
        endsOn={END}
        closesNow={false}
        closing={false}
      />,
    );
    expect(screen.getByText(/Want to leave BohdiAI completely\?/)).toBeTruthy();
    expect(screen.queryByLabelText(/Type Lena Hart Decoupage to confirm/)).toBeNull();
  });

  it('says exactly what goes, that it can’t be undone, and closes only once the site’s name is typed', async () => {
    render(
      <CloseAccount
        siteName="Lena Hart Decoupage"
        endsOn={END}
        closesNow={false}
        closing={false}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Close my account' }));
    expect(
      screen.getByText(
        `Your account closes on ${END}, at the end of your current term. This can’t be undone. Everything is removed for good:`,
      ),
    ).toBeTruthy();
    for (const line of [
      'your site, and its web address',
      'every photo and file you uploaded',
      'your products, events, sales and customer lists',
      'your saved Print it pieces and tool numbers',
      'your login, so BohdiAI won’t email you again',
    ])
      expect(screen.getByText(line)).toBeTruthy();
    expect(screen.getByText(/Stripe keeps its own record of your past payments/)).toBeTruthy();
    const go = screen.getByRole('button', {
      name: `Close my account on ${END}`,
    }) as HTMLButtonElement;
    expect(go.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Type Lena Hart Decoupage to confirm'), {
      target: { value: 'lena hart decoupage' },
    });
    expect(go.disabled).toBe(false);
    fireEvent.click(go);
    await waitFor(() => expect(closeAccount).toHaveBeenCalledWith('lena hart decoupage'));
    expect(refresh).toHaveBeenCalled();
  });

  it('with nothing paid to run out, closes as soon as it’s confirmed', () => {
    render(<CloseAccount siteName="Lena Hart Decoupage" endsOn="" closesNow closing={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Close my account' }));
    expect(screen.getByText(/Your account closes as soon as you confirm/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Close my account now' })).toBeTruthy();
  });

  it('once set to close, says when and lets the maker keep the account; a failure shows plainly', async () => {
    keepSite.mockResolvedValueOnce({
      ok: false,
      error: 'That couldn’t be saved. Try again in a moment.',
    });
    render(<CloseAccount siteName="Lena Hart Decoupage" endsOn={END} closesNow={false} closing />);
    expect(
      screen.getByText(
        new RegExp(`On ${END}, at the end of your current term, your account closes`),
      ),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Keep my account' }));
    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toBe(
        'That couldn’t be saved. Try again in a moment.',
      ),
    );
  });
});
