import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor, within } from '@testing-library/react';
import type { TodayOrder } from '@/lib/backend/markets/today';

const refundMarketOrder = vi.fn();
const settleMarketOrder = vi.fn();
const refresh = vi.fn();
vi.mock('@/lib/backend/markets/today-actions', () => ({
  refundMarketOrder: (...a: unknown[]) => refundMarketOrder(...a),
  settleMarketOrder: (...a: unknown[]) => settleMarketOrder(...a),
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }), unstable_rethrow: () => undefined }));

const { MarketSales } = await import('./MarketSales');
Element.prototype.scrollIntoView = vi.fn(); // jsdom has no layout

const sale = (over: Partial<TodayOrder> = {}): TodayOrder => ({
  id: 'o1',
  number: '1037',
  createdAt: '2026-10-21T16:00:00Z',
  status: 'paid',
  name: 'Pat',
  piece: 'Theo',
  amount: '$120',
  amountCents: 12000,
  method: 'venmo',
  saysPaid: false,
  ...over,
});

afterEach(() => {
  cleanup();
  refundMarketOrder.mockReset();
  settleMarketOrder.mockReset();
  refresh.mockReset();
});

describe('MarketSales', () => {
  it('says so when nothing sold', () => {
    render(<MarketSales eventId="e1" orders={[]} timeZone="America/New_York" />);
    expect(screen.getByText('Nothing sold here yet.')).toBeTruthy();
  });

  it('puts buyers waiting to pay first, then what sold, then refunds, one line each', () => {
    render(
      <MarketSales
        eventId="e1"
        orders={[
          sale(),
          sale({ id: 'o2', number: '1038', status: 'refunded', piece: 'Rosie', method: null }),
          sale({ id: 'o3', number: '1039', status: 'pending', piece: 'Scarf', name: 'Lee', saysPaid: true }),
          sale({ id: 'o4', number: '1040', name: 'At the table', method: 'cash', piece: 'Mug' }),
        ]}
        timeZone="America/New_York"
      />,
    );
    const rows = within(screen.getByRole('list', { name: 'Sales' })).getAllByRole('listitem');
    expect(rows.map((r) => r.getAttribute('data-state'))).toEqual(['waiting', 'sold', 'sold', 'refunded']);
    expect(rows[0]?.textContent).toContain('Waiting to pay, Venmo, Lee, Wed 12:00 PM (says they paid)');
    expect(rows[1]?.textContent).toContain('Venmo, Pat, Wed 12:00 PM');
    // The till's stand-in name isn't repeated on every line.
    expect(rows[2]?.textContent).toContain('Cash, Wed 12:00 PM');
    expect(rows[3]?.textContent).toContain('Refunded, Other, Pat');
    expect(within(rows[3]!).queryByRole('button')).toBeNull();
  });

  it('settles a buyer waiting to pay', async () => {
    settleMarketOrder.mockResolvedValue({ ok: true });
    render(<MarketSales eventId="e1" orders={[sale({ status: 'pending' }), sale({ id: 'o2', number: '1038', status: 'pending' })]} timeZone="America/New_York" />);
    fireEvent.click(screen.getByRole('button', { name: 'Paid: order 1037' }));
    await waitFor(() => expect(screen.getByText('Paid. Theo is sold.')).toBeTruthy());
    expect(settleMarketOrder).toHaveBeenCalledWith('e1', 'o1', 'paid');
    fireEvent.click(screen.getByRole('button', { name: 'Not received: order 1038' }));
    await waitFor(() => expect(settleMarketOrder).toHaveBeenCalledWith('e1', 'o2', 'canceled'));
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it('refunds a sale after a yes, and reminds her about the Square app for a card', async () => {
    refundMarketOrder.mockResolvedValue({ ok: true });
    render(<MarketSales eventId="e1" orders={[sale({ method: 'card' })]} timeZone="America/New_York" />);
    fireEvent.click(screen.getByRole('button', { name: 'Refund: order 1037' }));
    expect(refundMarketOrder).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Yes, refund $120' }));
    await waitFor(() => expect(screen.getByText(/in the Square app too/)).toBeTruthy());
    expect(refundMarketOrder).toHaveBeenCalledWith('e1', 'o1');
    expect(refresh).toHaveBeenCalled();
  });

  it('keeps the sale when the refund is not confirmed', () => {
    render(<MarketSales eventId="e1" orders={[sale()]} timeZone="America/New_York" />);
    fireEvent.click(screen.getByRole('button', { name: 'Refund: order 1037' }));
    fireEvent.click(screen.getByRole('button', { name: 'Keep the sale' }));
    expect(refundMarketOrder).not.toHaveBeenCalled();
  });

  it('says what went wrong when a refund fails or throws', async () => {
    refundMarketOrder.mockResolvedValueOnce({ ok: false, error: 'Only a paid sale can be refunded, and only once.' });
    render(<MarketSales eventId="e1" orders={[sale()]} timeZone="America/New_York" />);
    fireEvent.click(screen.getByRole('button', { name: 'Refund: order 1037' }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes, refund $120' }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('only once'));
    refundMarketOrder.mockRejectedValueOnce(new Error('offline'));
    fireEvent.click(screen.getByRole('button', { name: 'Refund: order 1037' }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes, refund $120' }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Check your connection'));
    expect(refresh).not.toHaveBeenCalled();
  });
});
