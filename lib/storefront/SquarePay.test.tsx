import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/lib/storefront/CartControls', () => ({ ClearCart: () => <span data-testid="cleared" /> }));
const { CheckoutReturned } = await import('./SquarePay');
const { returnedDone } = await import('./checkout-return');
const { NurseryOrderForm } = await import('@/lib/archetypes/boutique/NurseryOrderForm');

const w = {
  sentTitle: 'Order {n}',
  paid: 'Paid, thank you!',
  payWaiting: 'Still confirming order {n}.',
  paySold: 'Sorry, order {n} had sold.',
  payProblem: 'Order {n} didn’t add up.',
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('CheckoutReturned', () => {
  it('thanks the shopper and empties the cart once Square confirms', () => {
    render(<CheckoutReturned returned={{ kind: 'paid', orderNumber: '1042' }} w={w} numberClass="order-num" />);
    expect(screen.getByText('Order 1042').className).toBe('order-num');
    expect(screen.getByText('Paid, thank you!')).toBeTruthy();
    expect(screen.getByTestId('cleared')).toBeTruthy();
  });

  it('says it’s still being confirmed, and empties the cart so nobody pays twice', () => {
    render(<CheckoutReturned returned={{ kind: 'waiting', orderNumber: '1042' }} w={w} numberClass="n" />);
    expect(screen.getByText('Still confirming order 1042.')).toBeTruthy();
    expect(screen.getByTestId('cleared')).toBeTruthy();
  });

  it('says it had sold, or didn’t add up, and keeps the cart', () => {
    const { rerender } = render(<CheckoutReturned returned={{ kind: 'sold', orderNumber: '1042' }} w={w} numberClass="n" />);
    expect(screen.getByRole('alert').textContent).toBe('Sorry, order 1042 had sold.');
    rerender(<CheckoutReturned returned={{ kind: 'failed', orderNumber: '1042' }} w={w} numberClass="n" />);
    expect(screen.getByRole('alert').textContent).toBe('Order 1042 didn’t add up.');
    expect(screen.queryByTestId('cleared')).toBeNull();
  });

  it('knows when the cart is done with', () => {
    expect(returnedDone({ kind: 'paid', orderNumber: '1' })).toBe(true);
    expect(returnedDone({ kind: 'waiting', orderNumber: '1' })).toBe(true);
    expect(returnedDone({ kind: 'sold', orderNumber: '1' })).toBe(false);
    expect(returnedDone(undefined)).toBe(false);
  });
});

describe('NurseryOrderForm, paying through Square', () => {
  const words = {
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    note: 'Note',
    honeypot: 'Company',
    send: 'Send order',
    sending: 'Sending…',
    sentTitle: 'Order {n}',
    sent: 'Sent.',
    error: 'Something went wrong.',
    errorNetwork: 'No connection.',
    payButton: 'Pay securely',
    payGoing: 'Taking you to checkout…',
    payError: 'Didn’t go through.',
  } as never;

  it('shows Pay, never sends unpaid on Enter, and goes to Square’s page with the details', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true, url: 'https://square.link/u/1' }), { status: 200 }));
    const assign = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('location', { ...window.location, assign });
    const { container } = render(<NurseryOrderForm listingIds={['a']} w={words} square />);
    expect(screen.queryByRole('button', { name: 'Send order' })).toBeNull();
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Pat' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'pat@example.com' } });
    fireEvent.submit(container.querySelector('form') as HTMLFormElement);
    expect(fetchMock).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Pay securely' }));
    await waitFor(() => expect(assign).toHaveBeenCalledWith('https://square.link/u/1'));
    expect(JSON.parse(String((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body))).toMatchObject({ listingIds: ['a'], name: 'Pat', email: 'pat@example.com' });
  });
});
