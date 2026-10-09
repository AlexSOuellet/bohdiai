import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { EMPTY_PAY } from '@/lib/market/pay';

const refresh = vi.fn();
const recordMarketSales = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }), unstable_rethrow: () => undefined }));
vi.mock('@/lib/backend/markets/today-actions', () => ({ recordMarketSales }));
vi.mock('qrcode', () => ({ default: { toString: async () => '<svg data-qr="1"></svg>' } }));
Element.prototype.scrollIntoView = vi.fn(); // jsdom has no layout

const { SellBoard } = await import('./SellBoard');

const pieces = [
  { id: 'a', name: 'Carol star', priceCents: 1800, price: '$18' },
  { id: 'b', name: 'Old Saint Nick', priceCents: 2200, price: '$22' },
];
const pay = { ...EMPTY_PAY, venmo: 'lena-b', venmoOn: true, cashOn: true };

function board(over: Partial<Parameters<typeof SellBoard>[0]> = {}) {
  return render(<SellBoard eventId="e1" marketName="Harvest Fair" shopName="Saltmarsh & Lace" pieces={pieces} pay={pay} methods={['venmo', 'cash']} open {...over} />);
}

afterEach(() => {
  cleanup();
  recordMarketSales.mockReset();
  refresh.mockReset();
});

describe('Sell at the table', () => {
  it('adds up what she taps, shows the Venmo code, and records the sale', async () => {
    recordMarketSales.mockResolvedValue({ ok: true, count: 2 });
    board();
    fireEvent.click(screen.getByRole('button', { name: /Carol star/ }));
    fireEvent.click(screen.getByRole('button', { name: /Old Saint Nick/ }));
    expect(screen.getByRole('heading', { name: /Total \$40/ })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Venmo' }));
    expect(await screen.findByText(/Scan to pay \$40 with Venmo/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Paid · record the sale' }));
    await waitFor(() => expect(recordMarketSales).toHaveBeenCalledWith('e1', ['a', 'b'], 'venmo'));
    expect(await screen.findByText('Sale recorded: $40 by Venmo.')).toBeTruthy();
  });

  it('shows the cash to take, and can drop a piece from the sale', () => {
    board();
    fireEvent.click(screen.getByRole('button', { name: /Carol star/ }));
    fireEvent.click(screen.getByRole('button', { name: /Old Saint Nick/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Remove Carol star' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cash' }));
    expect(screen.getByText('Take $22 in cash')).toBeTruthy();
  });

  it('keeps what wasn’t recorded in the sale and says what happened', async () => {
    recordMarketSales.mockResolvedValue({ ok: false, error: 'Only 1 of 2 were recorded.', recorded: ['a'] });
    board();
    fireEvent.click(screen.getByRole('button', { name: /Carol star/ }));
    fireEvent.click(screen.getByRole('button', { name: /Old Saint Nick/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Cash' }));
    fireEvent.click(screen.getByRole('button', { name: 'Paid · record the sale' }));
    expect(await screen.findByText('Only 1 of 2 were recorded.')).toBeTruthy();
    expect(screen.getByRole('heading', { name: /Total \$22/ })).toBeTruthy();
  });

  it('explains when it can’t sell: closed market, nothing ticked, no way to get paid', () => {
    board({ open: false });
    expect(screen.getByText(/isn’t on today/)).toBeTruthy();
    cleanup();
    board({ pieces: [] });
    expect(screen.getByRole('link', { name: 'Go to the market’s page' })).toBeTruthy();
    cleanup();
    board({ methods: [] });
    expect(screen.getByRole('link', { name: 'Go to Getting paid' })).toBeTruthy();
  });
});
