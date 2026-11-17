import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';

const drawn = vi.hoisted(() => ({ props: null as null | { details: () => Record<string, unknown> | null; onPaid: (n: string | null) => void } }));
vi.mock('@/lib/storefront/CartControls', () => ({ ClearCart: () => <span data-testid="cleared" /> }));
vi.mock('./PayPalButtons', () => ({
  PayPalButtons: (p: { details: () => Record<string, unknown> | null; onPaid: (n: string | null) => void }) => {
    drawn.props = p;
    return <div data-testid="paypal" />;
  },
}));

const { OrderRequestForm } = await import('./OrderRequestForm');

const w = {
  name: 'Name',
  email: 'Email',
  phone: 'Phone',
  note: 'Note',
  send: 'Send order',
  sending: 'Sending…',
  sentTitle: 'Order {n}',
  sent: 'We’ll write back.',
  error: 'Something went wrong.',
  errorNetwork: 'No connection.',
  paying: 'Finishing…',
  payError: 'Didn’t go through.',
  payCancelled: 'Closed.',
  payUnavailable: 'Can’t load.',
  paid: 'Paid, thank you!',
  payButton: 'Pay securely',
  payGoing: 'Taking you to checkout…',
};
const fetchMock = vi.fn();
const json = (status: number, body: unknown): Response => new Response(JSON.stringify(body), { status });

function fill(): void {
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Pat' } });
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'pat@example.com' } });
}

beforeEach(() => {
  drawn.props = null;
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('OrderRequestForm, no online payment', () => {
  it('sends the order and shows its number', async () => {
    fetchMock.mockResolvedValue(json(200, { ok: true, orderNumber: '1001' }));
    render(<OrderRequestForm listingIds={['a']} code="FIVE" w={w} honeypot="Company" />);
    fill();
    fireEvent.click(screen.getByRole('button', { name: 'Send order' }));
    expect(await screen.findByText('Order 1001')).toBeTruthy();
    expect(screen.getByText('We’ll write back.')).toBeTruthy();
    expect(JSON.parse(String((fetchMock.mock.calls[0]?.[1] as RequestInit).body))).toMatchObject({ listingIds: ['a'], code: 'FIVE', name: 'Pat' });
    expect(screen.queryByTestId('paypal')).toBeNull();
  });
  it('a sent order without a number still says thank you', async () => {
    fetchMock.mockResolvedValue(json(200, { ok: true, orderNumber: null }));
    render(<OrderRequestForm listingIds={['a']} w={w} honeypot="Company" />);
    fill();
    fireEvent.click(screen.getByRole('button', { name: 'Send order' }));
    expect(await screen.findByText('We’ll write back.')).toBeTruthy();
    expect(screen.queryByText(/Order /)).toBeNull();
  });
  it('shows the shop’s reason, a plain error, or no connection', async () => {
    render(<OrderRequestForm listingIds={['a']} w={w} honeypot="Company" />);
    fill();
    fetchMock.mockResolvedValueOnce(json(409, { error: 'No longer available: Theo.' }));
    fireEvent.click(screen.getByRole('button', { name: 'Send order' }));
    expect(await screen.findByText('No longer available: Theo.')).toBeTruthy();
    fetchMock.mockResolvedValueOnce(new Response('oops', { status: 500 }));
    fireEvent.click(screen.getByRole('button', { name: 'Send order' }));
    expect(await screen.findByText('Something went wrong.')).toBeTruthy();
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    fireEvent.click(screen.getByRole('button', { name: 'Send order' }));
    expect(await screen.findByText('No connection.')).toBeTruthy();
  });
});

describe('OrderRequestForm, paying with PayPal', () => {
  const pay = { kind: 'paypal' as const, clientId: 'client', merchantId: 'M1', currency: 'USD' };
  it('shows the PayPal button instead of Send, and never sends an unpaid order on Enter', () => {
    const { container } = render(<OrderRequestForm listingIds={['a']} w={w} honeypot="Company" pay={pay} />);
    expect(screen.getByTestId('paypal')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Send order' })).toBeNull();
    fill();
    fireEvent.submit(container.querySelector('form') as HTMLFormElement);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('hands PayPal the details only once they’re filled in', () => {
    render(<OrderRequestForm listingIds={['a']} code={null} w={w} honeypot="Company" pay={pay} />);
    expect(drawn.props?.details()).toBeNull();
    fill();
    expect(drawn.props?.details()).toEqual({ listingIds: ['a'], code: '', name: 'Pat', email: 'pat@example.com', phone: '', note: '', company: '' });
  });
  it('thanks the buyer for paying, with the order number', async () => {
    render(<OrderRequestForm listingIds={['a']} w={w} honeypot="Company" pay={pay} />);
    drawn.props?.onPaid('1002');
    expect(await screen.findByText('Order 1002')).toBeTruthy();
    expect(screen.getByText('Paid, thank you!')).toBeTruthy();
    await waitFor(() => expect(screen.getByTestId('cleared')).toBeTruthy());
  });
});

describe('OrderRequestForm, paying through Square', () => {
  const pay = { kind: 'square' as const };
  const assign = vi.fn();
  beforeEach(() => {
    assign.mockReset();
    vi.stubGlobal('location', { ...window.location, assign });
  });

  it('shows Pay instead of Send, and never sends an unpaid order on Enter', () => {
    const { container } = render(<OrderRequestForm listingIds={['a']} w={w} honeypot="Company" pay={pay} />);
    expect(screen.getByRole('button', { name: 'Pay securely' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Send order' })).toBeNull();
    fill();
    fireEvent.submit(container.querySelector('form') as HTMLFormElement);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('asks for the details first, then goes to Square’s own page', async () => {
    fetchMock.mockResolvedValue(json(200, { ok: true, url: 'https://sandbox.square.link/u/abc' }));
    render(<OrderRequestForm listingIds={['a']} code="FIVE" w={w} honeypot="Company" pay={pay} />);
    fireEvent.click(screen.getByRole('button', { name: 'Pay securely' }));
    expect(fetchMock).not.toHaveBeenCalled();
    fill();
    fireEvent.click(screen.getByRole('button', { name: 'Pay securely' }));
    await waitFor(() => expect(assign).toHaveBeenCalledWith('https://sandbox.square.link/u/abc'));
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/checkout/square/create');
    expect(JSON.parse(String(init.body))).toMatchObject({ listingIds: ['a'], code: 'FIVE', name: 'Pat', email: 'pat@example.com' });
  });

  it('says why when there’s no page to go to', async () => {
    fetchMock.mockResolvedValueOnce(json(409, { error: 'Not taking cards.' }));
    render(<OrderRequestForm listingIds={['a']} w={w} honeypot="Company" pay={pay} />);
    fill();
    fireEvent.click(screen.getByRole('button', { name: 'Pay securely' }));
    expect(await screen.findByText('Not taking cards.')).toBeTruthy();
    fetchMock.mockResolvedValueOnce(json(200, { ok: true, url: 'http://not-square' }));
    fireEvent.click(screen.getByRole('button', { name: 'Pay securely' }));
    expect(await screen.findByText('Didn’t go through.')).toBeTruthy();
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    fireEvent.click(screen.getByRole('button', { name: 'Pay securely' }));
    expect(await screen.findByText('No connection.')).toBeTruthy();
    expect(assign).not.toHaveBeenCalled();
  });
});
