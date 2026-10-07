import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor, act } from '@testing-library/react';
import type { TodayOrder } from '@/lib/backend/markets/today';

const refresh = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }), unstable_rethrow: () => undefined }));
const setOrderStatus = vi.fn();
const recordMarketSale = vi.fn();
vi.mock('@/lib/backend/orders/actions', () => ({ setOrderStatus: (...a: unknown[]) => setOrderStatus(...a) }));
vi.mock('@/lib/backend/markets/today-actions', () => ({ recordMarketSale: (...a: unknown[]) => recordMarketSale(...a) }));

const { TodayBoard, REFRESH_MS } = await import('./TodayBoard');
Element.prototype.scrollIntoView = vi.fn(); // jsdom has no layout

const order = (over: Partial<TodayOrder> = {}): TodayOrder => ({
  id: 'o1',
  number: '1004',
  createdAt: '2026-10-10T15:00:00Z',
  status: 'pending',
  name: 'Pat',
  piece: 'Theo',
  amount: '$120',
  amountCents: 12000,
  method: 'venmo',
  saysPaid: true,
  ...over,
});
const board = (orders: TodayOrder[], open = true) =>
  render(<TodayBoard eventId="e1" marketName="Holly Fair" orders={orders} pieces={[{ id: 'l2', name: 'Rosie' }]} open={open} timeZone="America/New_York" />);

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  refresh.mockReset();
  setOrderStatus.mockReset();
  recordMarketSale.mockReset();
});

describe('TodayBoard', () => {
  it('lists holds waiting on her and the day’s takings by method', () => {
    board([order(), order({ id: 'o2', status: 'paid', name: 'Sam', piece: 'Ruby', method: 'cash', amount: '$90', amountCents: 9000 }), order({ id: 'o3', status: 'paid', amount: '$60', amountCents: 6000 })]);
    expect(screen.getByText('Pat · Theo')).toBeTruthy();
    expect(screen.getByText('$120 by Venmo')).toBeTruthy();
    expect(screen.getByText(/Says they paid/)).toBeTruthy();
    expect(screen.getByText('Sold here (2)')).toBeTruthy();
    expect(screen.getByText('$150')).toBeTruthy();
    expect(screen.getByText(/Cash \$90 · Venmo \$60/)).toBeTruthy();
  });

  it('confirms a payment', async () => {
    setOrderStatus.mockResolvedValue({ ok: true });
    board([order()]);
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Pat’s payment for Theo' }));
    await waitFor(() => expect(screen.getByText('Confirmed. Theo is sold.')).toBeTruthy());
    expect(setOrderStatus).toHaveBeenCalledWith('o1', 'paid');
    expect(refresh).toHaveBeenCalled();
  });

  it('puts a baby back when the money never came', async () => {
    setOrderStatus.mockResolvedValue({ ok: true });
    board([order({ saysPaid: false })]);
    expect(screen.getByText(/Paying now/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Not received from Pat for Theo' }));
    await waitFor(() => expect(setOrderStatus).toHaveBeenCalledWith('o1', 'canceled'));
  });

  it('records a sale by hand', async () => {
    recordMarketSale.mockResolvedValue({ ok: true });
    board([]);
    expect(screen.getByText(/Nobody’s waiting/)).toBeTruthy();
    const record = screen.getByRole('button', { name: 'Record sale' }) as HTMLButtonElement;
    expect(record.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Piece'), { target: { value: 'l2' } });
    fireEvent.change(screen.getByLabelText('Paid by'), { target: { value: 'zelle' } });
    fireEvent.click(record);
    await waitFor(() => expect(screen.getByText('Recorded. Rosie is sold.')).toBeTruthy());
    expect(recordMarketSale).toHaveBeenCalledWith('e1', 'l2', 'zelle');
  });

  it('shows a failure, and hides recording when the market is not on', async () => {
    setOrderStatus.mockResolvedValue({ ok: false, error: 'The order couldn’t be updated. Try again in a moment.' });
    board([order()], false);
    expect(screen.getByText(/isn’t on today/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Record sale' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Pat’s payment for Theo' }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('couldn’t be updated'));
  });

  it('looks for new holds on its own', () => {
    vi.useFakeTimers();
    board([]);
    act(() => {
      vi.advanceTimersByTime(REFRESH_MS * 2);
    });
    expect(refresh).toHaveBeenCalledTimes(2);
  });
});
