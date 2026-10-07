import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { EMPTY_PAY } from '@/lib/market/pay';

const savePaySettings = vi.fn();
vi.mock('@/lib/backend/payments/actions', () => ({ savePaySettings: (...a: unknown[]) => savePaySettings(...a) }));

const { PayManager } = await import('./PayManager');
Element.prototype.scrollIntoView = vi.fn(); // jsdom has no layout

afterEach(() => {
  cleanup();
  savePaySettings.mockReset();
});

describe('PayManager', () => {
  it('saves Venmo turned on with her username', async () => {
    savePaySettings.mockResolvedValue({ ok: true });
    render(<PayManager initial={EMPTY_PAY} />);
    fireEvent.click(screen.getByLabelText('Venmo'));
    fireEvent.change(screen.getByLabelText('Your Venmo username'), { target: { value: '@renee' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(screen.getByText(/Saved/)).toBeTruthy());
    expect(savePaySettings).toHaveBeenCalledWith(expect.objectContaining({ venmo: '@renee', venmoOn: true, cashOn: true }));
  });

  it('stops a method switched on without its handle, and says why', async () => {
    render(<PayManager initial={EMPTY_PAY} />);
    fireEvent.click(screen.getByLabelText('Cash App'));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('$cashtag'));
    expect(savePaySettings).not.toHaveBeenCalled();
  });

  it('shows a failed save', async () => {
    savePaySettings.mockResolvedValue({ ok: false, error: 'Your payment details couldn’t be saved. Try again in a moment.' });
    render(<PayManager initial={EMPTY_PAY} />);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('couldn’t be saved'));
  });
});
