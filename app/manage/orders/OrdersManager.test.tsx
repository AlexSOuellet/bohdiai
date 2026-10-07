import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import type { OrderRow } from '@/lib/backend/orders/orders';

const setOrderStatus = vi.fn();
vi.mock('@/lib/backend/orders/actions', () => ({ setOrderStatus: (...a: unknown[]) => setOrderStatus(...a) }));

const { OrdersManager } = await import('./OrdersManager');
Element.prototype.scrollIntoView = vi.fn(); // jsdom has no layout

const order = (over: Partial<OrderRow> = {}): OrderRow => ({
  id: 'o1',
  number: '1001',
  createdAt: '2026-10-07T16:00:00Z',
  status: 'pending',
  name: 'Pat',
  email: 'pat@example.com',
  phone: '401 555 0100',
  note: 'Pickup at the fair',
  total: '$120',
  items: [{ name: 'Theo', price: '$120' }],
  ...over,
});

afterEach(() => {
  cleanup();
  setOrderStatus.mockReset();
});

describe('OrdersManager', () => {
  it('shows each open order with the buyer, pieces, total and note', () => {
    render(<OrdersManager initial={[order(), order({ id: 'o2', number: '1000', status: 'fulfilled' })]} timeZone="America/New_York" />);
    expect(screen.getByText('#1001 · Pat')).toBeTruthy();
    expect(screen.queryByText('#1000 · Pat')).toBeNull();
    expect(screen.getByRole('link', { name: 'pat@example.com' }).getAttribute('href')).toBe('mailto:pat@example.com');
    expect(screen.getByText('Total $120')).toBeTruthy();
    expect(screen.getByText('“Pickup at the fair”')).toBeTruthy();
  });

  it('marks an order paid', async () => {
    setOrderStatus.mockResolvedValue({ ok: true });
    render(<OrdersManager initial={[order()]} timeZone="America/New_York" />);
    fireEvent.click(screen.getByRole('button', { name: 'Mark paid: order 1001' }));
    await waitFor(() => expect(screen.getByText(/Marked paid/)).toBeTruthy());
    expect(setOrderStatus).toHaveBeenCalledWith('o1', 'paid');
    expect(screen.getByRole('button', { name: 'Mark handed over: order 1001' })).toBeTruthy();
  });

  it('shows the error when the change fails', async () => {
    setOrderStatus.mockResolvedValue({ ok: false, error: 'The order couldn’t be updated. Try again in a moment.' });
    render(<OrdersManager initial={[order()]} timeZone="America/New_York" />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel: order 1001' }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('couldn’t be updated'));
  });

  it('says so when there are no orders', () => {
    render(<OrdersManager initial={[]} timeZone="America/New_York" />);
    expect(screen.getByText(/No orders yet/)).toBeTruthy();
  });
});
