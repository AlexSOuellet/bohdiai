import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';

const refresh = vi.fn();
const checkPayPal = vi.fn();
const disconnectPayPal = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }), unstable_rethrow: () => undefined }));
vi.mock('@/lib/backend/payments/paypal-actions', () => ({ checkPayPal, disconnectPayPal }));
Element.prototype.scrollIntoView = vi.fn(); // jsdom has no layout

const { PayPalPanel } = await import('./PayPalPanel');

const linked = { email: 'renee@example.com', ready: true, paymentsReceivable: true, emailConfirmed: true, connectedAt: '2026-10-25T12:00:00Z' };

afterEach(() => {
  cleanup();
  [refresh, checkPayPal, disconnectPayPal].forEach((f) => f.mockReset());
});

describe('PayPalPanel', () => {
  it('offers Connect PayPal, and says plainly it’s in test mode', () => {
    render(<PayPalPanel link={null} ready testing outcome={null} />);
    expect(screen.getByRole('link', { name: 'Connect PayPal' }).getAttribute('href')).toBe('/api/paypal/connect');
    expect(screen.getByText(/test mode/)).toBeTruthy();
    expect(screen.getByText(/BohdiAI never sees a card or your PayPal password/)).toBeTruthy();
  });

  it('says it’s waiting on PayPal when PayPal isn’t set up on BohdiAI', () => {
    render(<PayPalPanel link={null} ready={false} testing={false} outcome={null} />);
    expect(screen.getByRole('link', { name: 'Connect PayPal' })).toBeTruthy();
    expect(screen.getByText(/waiting on PayPal’s approval/)).toBeTruthy();
    expect(screen.queryByText(/test mode/)).toBeNull();
  });

  it('shows what’s connected, and disconnects after a yes', async () => {
    disconnectPayPal.mockResolvedValue({ ok: true });
    render(<PayPalPanel link={linked} ready testing={false} outcome={null} />);
    expect(screen.getByText('renee@example.com')).toBeTruthy();
    expect(screen.getByText(/takes PayPal and cards/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Disconnect PayPal' }));
    expect(disconnectPayPal).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Yes, disconnect' }));
    await waitFor(() => expect(disconnectPayPal).toHaveBeenCalled());
    expect(await screen.findByText(/checkout no longer offers it/)).toBeTruthy();
    expect(refresh).toHaveBeenCalled();
  });

  it('says what PayPal is still waiting for, and checks again', async () => {
    checkPayPal.mockResolvedValue({ ok: false, error: 'PayPal says your account can’t take payments yet.' });
    const { rerender } = render(<PayPalPanel link={{ ...linked, ready: false, emailConfirmed: false }} ready testing={false} outcome={null} />);
    expect(screen.getByText(/confirm your email address with PayPal/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Check again' }));
    await waitFor(() => expect(checkPayPal).toHaveBeenCalled());
    expect(await screen.findByText('PayPal says your account can’t take payments yet.')).toBeTruthy();
    rerender(<PayPalPanel link={{ ...linked, ready: false, paymentsReceivable: false }} ready testing={false} outcome={null} />);
    expect(screen.getByText(/finish the steps PayPal emailed you/)).toBeTruthy();
  });

  it('says so when the screen can’t reach the server', async () => {
    checkPayPal.mockRejectedValue(new Error('offline'));
    render(<PayPalPanel link={{ ...linked, ready: false, emailConfirmed: false }} ready testing={false} outcome={null} />);
    fireEvent.click(screen.getByRole('button', { name: 'Check again' }));
    expect(await screen.findByText(/Check your connection/)).toBeTruthy();
  });

  it('names an account with no email plainly', () => {
    render(<PayPalPanel link={{ ...linked, email: '' }} ready testing={false} outcome={null} />);
    expect(screen.getByText('your PayPal')).toBeTruthy();
  });

  it('shows what happened on PayPal’s page', () => {
    render(<PayPalPanel link={linked} ready testing={false} outcome={{ tone: 'ok', text: 'Your PayPal is connected.' }} />);
    expect(screen.getByText('Your PayPal is connected.')).toBeTruthy();
    cleanup();
    render(<PayPalPanel link={null} ready testing={false} outcome={{ tone: 'error', text: 'PayPal didn’t finish connecting.' }} />);
    expect(screen.getByText('PayPal didn’t finish connecting.')).toBeTruthy();
  });
});
