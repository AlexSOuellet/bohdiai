import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react';
import { EMPTY_PAY } from '@/lib/market/pay';
import type { TodayOrder } from '@/lib/backend/markets/today';

const refresh = vi.fn();
const settleMarketOrder = vi.fn();
const recordMarketSales = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }), unstable_rethrow: () => undefined }));
vi.mock('@/lib/backend/markets/today-actions', () => ({ settleMarketOrder, recordMarketSales }));
vi.mock('qrcode', () => ({ default: { toString: async () => '<svg data-qr="1"></svg>' } }));
Element.prototype.scrollIntoView = vi.fn(); // jsdom has no layout

const { MarketDay } = await import('./MarketDay');

const order = (over: Partial<TodayOrder>): TodayOrder => ({
  id: 'o1',
  number: '1004',
  createdAt: '2026-10-12T15:05:00Z',
  status: 'pending',
  name: 'Rachel',
  piece: 'Peony trinket box',
  amount: '$34',
  amountCents: 3400,
  method: 'venmo',
  saysPaid: true,
  ...over,
});
const orders = [
  order({}),
  order({ id: 'o2', number: '1005', name: 'Tom', piece: 'Seashell votive', amount: '$22', amountCents: 2200, method: 'cash', saysPaid: false }),
  order({ id: 'o3', number: '1001', name: 'Ann', piece: 'Carol star', status: 'paid', amount: '$18', amountCents: 1800, method: 'cash' }),
];
const pieces = [{ id: 'a', listingId: 'a', variantId: null, name: 'Old Saint Nick', priceCents: 2200, price: '$22', left: null }];
const pay = { ...EMPTY_PAY, cashOn: true };

function day(over: Partial<Parameters<typeof MarketDay>[0]> = {}) {
  return render(
    <MarketDay
      eventId="e1"
      marketName="Saturday Market on the Common"
      date="2026-10-12"
      booth="9"
      town="Bristol"
      shopName="Saltmarsh & Lace"
      orders={orders}
      pieces={pieces}
      pay={pay}
      methods={['cash']}
      open
      timeZone="America/New_York"
      {...over}
    />,
  );
}

afterEach(() => {
  cleanup();
  settleMarketOrder.mockReset();
  recordMarketSales.mockReset();
  refresh.mockReset();
});

describe('the market day', () => {
  it('shows who is waiting to pay, what sold and the day’s takings, with one way out', () => {
    const { container } = day();
    const waiting = screen.getByRole('list', { name: 'Waiting to pay' });
    expect(within(waiting).getAllByRole('listitem')).toHaveLength(2);
    expect(within(waiting).getByText('Says they paid')).toBeTruthy();
    expect(within(screen.getByRole('list', { name: 'Sold today' })).getByText('Carol star')).toBeTruthy();
    expect(screen.getByText('Taken today').parentElement?.textContent).toContain('$18');
    const links = container.querySelectorAll('a');
    expect(links).toHaveLength(1);
    expect(links[0]?.getAttribute('href')).toBe('/manage/markets/e1');
    expect(screen.getByText('Monday, October 12')).toBeTruthy();
  });

  it('marks a buyer paid, or puts the piece back when the money never came', async () => {
    settleMarketOrder.mockResolvedValue({ ok: true });
    day();
    fireEvent.click(screen.getByRole('button', { name: 'Paid: Rachel, Peony trinket box' }));
    await waitFor(() => expect(settleMarketOrder).toHaveBeenCalledWith('e1', 'o1', 'paid'));
    expect(await screen.findByText('Paid. Peony trinket box is sold to Rachel.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Not received from Tom for Seashell votive' }));
    await waitFor(() => expect(settleMarketOrder).toHaveBeenCalledWith('e1', 'o2', 'canceled'));
    expect(refresh).toHaveBeenCalled();
  });

  it('says why when marking fails, and when the connection drops', async () => {
    settleMarketOrder.mockResolvedValueOnce({ ok: false, error: 'That order couldn’t be updated. Try again in a moment.' });
    day();
    fireEvent.click(screen.getByRole('button', { name: 'Paid: Rachel, Peony trinket box' }));
    expect(await screen.findByText('That order couldn’t be updated. Try again in a moment.')).toBeTruthy();
    settleMarketOrder.mockRejectedValueOnce(new Error('offline'));
    fireEvent.click(screen.getByRole('button', { name: 'Paid: Rachel, Peony trinket box' }));
    expect(await screen.findByText('Something went wrong. Check your connection and try again.')).toBeTruthy();
  });

  it('rings up a sale in its own sheet and closes it once recorded', async () => {
    recordMarketSales.mockResolvedValue({ ok: true, count: 1 });
    day();
    fireEvent.click(screen.getByRole('button', { name: 'Ring up a sale' }));
    const sheet = screen.getByRole('dialog', { name: 'Ring up a sale' });
    fireEvent.click(within(sheet).getByRole('button', { name: /^Old Saint Nick/ }));
    fireEvent.click(within(sheet).getByRole('button', { name: 'Cash' }));
    fireEvent.click(within(sheet).getByRole('button', { name: 'Paid · record the sale' }));
    await waitFor(() => expect(recordMarketSales).toHaveBeenCalledWith('e1', [{ id: 'a', listingId: 'a', variantId: null, quantity: 1 }], 'cash'));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.getByText('Sale recorded: $22 by Cash.')).toBeTruthy();
  });

  it('on another day: nothing waiting, no ringing up, and it says why', () => {
    day({ open: false, orders: [] });
    expect(screen.getByText(/isn’t on today/)).toBeTruthy();
    expect(screen.getByText(/No one’s waiting/)).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Ring up a sale' }) as HTMLButtonElement).disabled).toBe(true);
  });
});
