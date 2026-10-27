import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';

const setBuyerAccounts = vi.fn();
vi.mock('@/lib/backend/buyers/actions', () => ({ setBuyerAccounts: (...a: unknown[]) => setBuyerAccounts(...a) }));

const { CustomerAccountsSwitch } = await import('./CustomerAccountsSwitch');
Element.prototype.scrollIntoView = vi.fn(); // jsdom has no layout

afterEach(() => {
  cleanup();
  setBuyerAccounts.mockReset();
});

describe('CustomerAccountsSwitch', () => {
  it('turns customer accounts off and says nothing is deleted', async () => {
    setBuyerAccounts.mockResolvedValue({ ok: true });
    render(<CustomerAccountsSwitch on />);
    fireEvent.click(screen.getByLabelText('Let customers make an account on my site'));
    await waitFor(() => expect(screen.getByText(/nothing is deleted/)).toBeTruthy());
    expect(setBuyerAccounts).toHaveBeenCalledWith(false);
  });

  it('turns them on and says Customers joins the menu', async () => {
    setBuyerAccounts.mockResolvedValue({ ok: true });
    render(<CustomerAccountsSwitch on={false} />);
    fireEvent.click(screen.getByLabelText('Let customers make an account on my site'));
    await waitFor(() => expect(screen.getByText(/Customers is in your menu here/)).toBeTruthy());
  });

  it('shows a refusal and keeps the switch as it was', async () => {
    setBuyerAccounts.mockResolvedValue({ ok: false, error: 'Customer accounts come with the Full plan.' });
    render(<CustomerAccountsSwitch on={false} />);
    const box = screen.getByLabelText('Let customers make an account on my site') as HTMLInputElement;
    fireEvent.click(box);
    await waitFor(() => expect(screen.getByText('Customer accounts come with the Full plan.')).toBeTruthy());
    expect(box.checked).toBe(false);
  });
});
