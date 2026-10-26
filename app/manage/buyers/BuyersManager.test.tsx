import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';

const setBuyerAccounts = vi.fn();
vi.mock('@/lib/backend/buyers/actions', () => ({ setBuyerAccounts: (...a: unknown[]) => setBuyerAccounts(...a) }));

const { BuyersManager } = await import('./BuyersManager');
Element.prototype.scrollIntoView = vi.fn(); // jsdom has no layout

afterEach(() => {
  cleanup();
  setBuyerAccounts.mockReset();
});

describe('BuyersManager', () => {
  it('turns buyer accounts off and says nothing is deleted', async () => {
    setBuyerAccounts.mockResolvedValue({ ok: true });
    render(<BuyersManager on buyers={[]} />);
    fireEvent.click(screen.getByLabelText('Let buyers make an account on my site'));
    await waitFor(() => expect(screen.getByText(/nothing is deleted/)).toBeTruthy());
    expect(setBuyerAccounts).toHaveBeenCalledWith(false);
    expect(screen.getByText(/No one has made an account yet/)).toBeTruthy();
  });

  it('shows a refusal and keeps the switch as it was', async () => {
    setBuyerAccounts.mockResolvedValue({ ok: false, error: 'Buyer accounts come with the Full plan.' });
    render(<BuyersManager on={false} buyers={[]} />);
    const box = screen.getByLabelText('Let buyers make an account on my site') as HTMLInputElement;
    fireEvent.click(box);
    await waitFor(() => expect(screen.getByText('Buyer accounts come with the Full plan.')).toBeTruthy());
    expect(box.checked).toBe(false);
  });

  it('lists her buyers', () => {
    render(<BuyersManager on buyers={[{ id: 'p1', name: 'Ada', email: 'ada@example.com', joined: '2026-10-01T12:00:00Z', orders: 2, spent: '$30' }]} />);
    expect(screen.getByRole('link', { name: 'ada@example.com' }).getAttribute('href')).toBe('mailto:ada@example.com');
    expect(screen.getByText('$30')).toBeTruthy();
  });
});
