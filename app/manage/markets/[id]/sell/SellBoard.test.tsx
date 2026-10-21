import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { EMPTY_PAY } from '@/lib/market/pay';

const refresh = vi.fn();
const recordMarketSales = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }), unstable_rethrow: () => undefined }));
vi.mock('@/lib/backend/markets/today-actions', () => ({ recordMarketSales }));
const startCardSale = vi.fn();
vi.mock('@/lib/backend/payments/square-actions', () => ({ startCardSale }));
vi.mock('qrcode', () => ({ default: { toString: async () => '<svg data-qr="1"></svg>' } }));
Element.prototype.scrollIntoView = vi.fn(); // jsdom has no layout

const { SellBoard } = await import('./SellBoard');

const pieces = [
  { id: 'a', listingId: 'a', variantId: null, name: 'Carol star', priceCents: 1800, price: '$18', left: null },
  { id: 'b', listingId: 'b', variantId: null, name: 'Old Saint Nick', priceCents: 2200, price: '$22', left: null },
];
const pay = { ...EMPTY_PAY, venmo: 'lena-b', venmoOn: true, cashOn: true };

function board(over: Partial<Parameters<typeof SellBoard>[0]> = {}) {
  return render(<SellBoard eventId="e1" marketName="Harvest Fair" shopName="Saltmarsh & Lace" pieces={pieces} pay={pay} methods={['venmo', 'cash']} open {...over} />);
}

afterEach(() => {
  cleanup();
  recordMarketSales.mockReset();
  startCardSale.mockReset();
  refresh.mockReset();
});

describe('Card, through Square', () => {
  it('shows Card only when her Square is connected', () => {
    board();
    expect(screen.queryByRole('button', { name: 'Card' })).toBeNull();
    cleanup();
    board({ card: true });
    expect(screen.getByRole('button', { name: 'Card' })).toBeTruthy();
  });

  it('sends the pieces to Square, not a total the phone made up, and never records it itself', async () => {
    startCardSale.mockResolvedValue({ ok: false, error: 'Connect your Square on Getting paid first.' });
    board({ card: true });
    fireEvent.click(screen.getByRole('button', { name: /^Carol star/ }));
    fireEvent.click(screen.getByRole('button', { name: /^Carol star/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Card' }));
    fireEvent.click(screen.getByRole('button', { name: 'Charge $36 in Square' }));
    await waitFor(() => expect(startCardSale).toHaveBeenCalledWith('e1', [{ listingId: 'a', variantId: null, quantity: 2, agreedCents: null }]));
    expect(await screen.findByText('Connect your Square on Getting paid first.')).toBeTruthy();
    expect(recordMarketSales).not.toHaveBeenCalled();
  });
});

describe('Sell at the table', () => {
  it('adds up what she taps, shows the Venmo code, and records the sale', async () => {
    recordMarketSales.mockResolvedValue({ ok: true, count: 2 });
    board();
    fireEvent.click(screen.getByRole('button', { name: /^Carol star/ }));
    fireEvent.click(screen.getByRole('button', { name: /^Old Saint Nick/ }));
    expect(screen.getByRole('heading', { name: /Total \$40/ })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Venmo' }));
    expect(await screen.findByText(/Scan to pay \$40 with Venmo/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Paid · record the sale' }));
    await waitFor(() =>
      expect(recordMarketSales).toHaveBeenCalledWith(
        'e1',
        [
          { id: 'a', listingId: 'a', variantId: null, quantity: 1, agreedCents: null },
          { id: 'b', listingId: 'b', variantId: null, quantity: 1, agreedCents: null },
        ],
        'venmo',
      ),
    );
    expect(await screen.findByText('Sale recorded: $40 by Venmo.')).toBeTruthy();
  });

  it('shows the cash to take, and can drop a piece from the sale', () => {
    board();
    fireEvent.click(screen.getByRole('button', { name: /^Carol star/ }));
    fireEvent.click(screen.getByRole('button', { name: /^Old Saint Nick/ }));
    fireEvent.click(screen.getByRole('button', { name: 'One fewer Carol star' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cash' }));
    expect(screen.getByText('Take $22 in cash')).toBeTruthy();
  });

  it('keeps what wasn’t recorded in the sale and says what happened', async () => {
    recordMarketSales.mockResolvedValue({ ok: false, error: 'Only 1 of 2 were recorded.', recorded: ['a'] });
    board();
    fireEvent.click(screen.getByRole('button', { name: /^Carol star/ }));
    fireEvent.click(screen.getByRole('button', { name: /^Old Saint Nick/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Cash' }));
    fireEvent.click(screen.getByRole('button', { name: 'Paid · record the sale' }));
    expect(await screen.findByText('Only 1 of 2 were recorded.')).toBeTruthy();
    expect(screen.getByRole('heading', { name: /Total \$22/ })).toBeTruthy();
  });

  it('takes several of a piece, and stops at what’s left at the market', () => {
    board({ pieces: [{ ...pieces[0]!, left: 2 }, { ...pieces[1]!, left: 0 }] });
    expect(screen.getByText('2 left')).toBeTruthy();
    expect(screen.getByText('All gone here')).toBeTruthy();
    expect((screen.getByRole('button', { name: /^Old Saint Nick/ }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: /^Carol star/ }));
    fireEvent.click(screen.getByRole('button', { name: 'One more Carol star' }));
    expect(screen.getByText('2 × $18')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'One more Carol star' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: /^Carol star/ }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole('heading', { name: /Total \$36/ })).toBeTruthy();
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

describe('a price agreed at the table', () => {
  it('changes a line to the price they agreed, and records it that way', async () => {
    recordMarketSales.mockResolvedValue({ ok: true, count: 1 });
    board();
    fireEvent.click(screen.getByRole('button', { name: /^Carol star/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Change price' }));
    fireEvent.change(screen.getByLabelText('Price you agreed'), { target: { value: '15' } });
    fireEvent.click(screen.getByRole('button', { name: 'Use this price' }));
    expect(screen.getByRole('heading', { name: /Total \$15/ })).toBeTruthy();
    expect(screen.getByText('agreed, marked $18')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Cash' }));
    fireEvent.click(screen.getByRole('button', { name: 'Paid · record the sale' }));
    await waitFor(() => expect(recordMarketSales).toHaveBeenCalledWith('e1', [{ id: 'a', listingId: 'a', variantId: null, quantity: 1, agreedCents: 1500 }], 'cash'));
    expect(await screen.findByText('Sale recorded: $15 by Cash.')).toBeTruthy();
  });

  it('won’t go above the marked price, and a new count drops the deal', () => {
    board();
    fireEvent.click(screen.getByRole('button', { name: /^Carol star/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Change price' }));
    fireEvent.change(screen.getByLabelText('Price you agreed'), { target: { value: '25' } });
    fireEvent.click(screen.getByRole('button', { name: 'Use this price' }));
    expect(screen.getByText('That\u2019s more than the marked $18.')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Price you agreed'), { target: { value: '10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Use this price' }));
    expect(screen.getByRole('heading', { name: /Total \$10/ })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'One more Carol star' }));
    expect(screen.getByRole('heading', { name: /Total \$36/ })).toBeTruthy();
  });

  it('sends the agreed price to Square for a card', async () => {
    startCardSale.mockResolvedValue({ ok: false, error: 'stop here' });
    board({ card: true });
    fireEvent.click(screen.getByRole('button', { name: /^Carol star/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Change price' }));
    fireEvent.change(screen.getByLabelText('Price you agreed'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Use this price' }));
    fireEvent.click(screen.getByRole('button', { name: 'Card' }));
    fireEvent.click(screen.getByRole('button', { name: 'Charge $1 in Square' }));
    await waitFor(() => expect(startCardSale).toHaveBeenCalledWith('e1', [{ listingId: 'a', variantId: null, quantity: 1, agreedCents: 100 }]));
  });
});
