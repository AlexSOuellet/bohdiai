import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { emptyMarketForm, type MarketForm } from '@/lib/backend/markets/market-form';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }), unstable_rethrow: () => undefined }));
const saveMarket = vi.fn();
const removeMarket = vi.fn();
vi.mock('@/lib/backend/markets/actions', () => ({
  saveMarket: (...a: unknown[]) => saveMarket(...a),
  removeMarket: (...a: unknown[]) => removeMarket(...a),
}));

const { MarketEditor } = await import('./MarketEditor');
Element.prototype.scrollIntoView = vi.fn(); // jsdom has no layout

const existing = (over: Partial<MarketForm> = {}): MarketForm => ({
  ...emptyMarketForm(),
  id: 'm1',
  name: 'Holly Fair',
  date: '2026-11-21',
  town: 'Johnston',
  ...over,
});

afterEach(() => {
  cleanup();
  push.mockReset();
  saveMarket.mockReset();
  removeMarket.mockReset();
});

describe('MarketEditor', () => {
  it('saves a new market with its details and goes back to the list', async () => {
    saveMarket.mockResolvedValue({ ok: true, id: 'm9' });
    render(<MarketEditor initial={emptyMarketForm()} details records />);
    expect(screen.getByRole('heading', { level: 1, name: 'Add a market' })).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Market name'), { target: { value: 'Holly Fair' } });
    fireEvent.change(screen.getByLabelText('Day'), { target: { value: '2026-11-21' } });
    fireEvent.change(screen.getByLabelText(/Booth or table/), { target: { value: 'Booth 4' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Save' })[0]!);
    await waitFor(() => expect(push).toHaveBeenCalledWith('/manage/markets?saved=Holly%20Fair'));
    expect(saveMarket).toHaveBeenCalledWith(expect.objectContaining({ name: 'Holly Fair', date: '2026-11-21', booth: 'Booth 4' }));
  });

  it('adds costs and shows their total', () => {
    render(<MarketEditor initial={existing()} details records />);
    fireEvent.click(screen.getByRole('button', { name: 'Add a cost' }));
    expect((screen.getByLabelText('What') as HTMLInputElement).value).toBe('Booth fee');
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '40' } });
    expect(screen.getByText('$40')).toBeTruthy();
  });

  it('takes a star rating and go-back answer', async () => {
    saveMarket.mockResolvedValue({ ok: true, id: 'm1' });
    render(<MarketEditor initial={existing()} details records />);
    fireEvent.click(screen.getByRole('button', { name: '4 stars' }));
    expect(screen.getByRole('button', { name: '4 stars' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByLabelText('Maybe'));
    fireEvent.click(screen.getAllByRole('button', { name: 'Save' })[0]!);
    await waitFor(() => expect(saveMarket).toHaveBeenCalledWith(expect.objectContaining({ rating: 4, goBack: 'maybe' })));
  });

  it('stops a market with no day before saving, and says why', async () => {
    render(<MarketEditor initial={emptyMarketForm()} details records />);
    fireEvent.change(screen.getByLabelText('Market name'), { target: { value: 'Holly Fair' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Save' })[0]!);
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('first day'));
    expect(saveMarket).not.toHaveBeenCalled();
  });

  it('shows a failed save and stays on the page', async () => {
    saveMarket.mockResolvedValue({ ok: false, error: 'The market couldn’t be saved. Try again in a moment.' });
    render(<MarketEditor initial={existing()} details records />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Save' })[0]!);
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('couldn’t be saved'));
    expect(push).not.toHaveBeenCalled();
  });

  it('removes a market after a confirm', async () => {
    removeMarket.mockResolvedValue({ ok: true });
    render(<MarketEditor initial={existing()} details records />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove this market' }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes, remove it' }));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/manage/markets?removed=Holly%20Fair'));
  });
});

describe('MarketEditor — your table', () => {
  const shop = {
    products: [
      { id: 'l1', name: 'Theo', photoUrl: null, soldOut: false, onHand: 6, options: [] },
      { id: 'l2', name: 'Rosie', photoUrl: 'https://cdn/r.webp', soldOut: true, onHand: 0, options: [] },
      {
        id: 'l3',
        name: 'Scarf',
        photoUrl: null,
        soldOut: false,
        onHand: null,
        options: [
          { id: 'v1', label: 'Blue', onHand: 4 },
          { id: 'v2', label: 'Red', onHand: null },
        ],
      },
    ],
    marketUrl: null,
    fileBase: 'rose-n-cat-market-qr',
    todayHref: null,
  };

  it('ticks the babies she brings and saves them with the market', async () => {
    saveMarket.mockResolvedValue({ ok: true, id: 'm1' });
    render(<MarketEditor details records initial={existing()} shop={shop} />);
    expect(screen.getByText(/Save the market first/)).toBeTruthy();
    fireEvent.click(screen.getByRole('checkbox', { name: /Theo/ }));
    expect(screen.getByText('What you’re bringing (1)')).toBeTruthy();
    fireEvent.click(screen.getAllByRole('button', { name: 'Save' })[0]!);
    await waitFor(() => expect(saveMarket).toHaveBeenCalledWith(expect.objectContaining({ listingIds: ['l1'] })));
  });

  it('opens Today and shows the code for a saved market', () => {
    render(<MarketEditor details records initial={existing({ listingIds: ['l1'] })} shop={{ ...shop, marketUrl: 'https://rose-n-cat.bohdiai.com/market/m1', todayHref: '/manage/markets/m1/day' }} />);
    expect(screen.getByRole('link', { name: 'Market POS' }).getAttribute('href')).toBe('/manage/markets/m1/day');
    expect(screen.getByText('https://rose-n-cat.bohdiai.com/market/m1')).toBeTruthy();
    fireEvent.click(screen.getByRole('checkbox', { name: /Theo/ }));
    expect(screen.getByText('What you’re bringing (0)')).toBeTruthy();
  });

  it('starts each count at what she has on hand, and saves what she types', async () => {
    saveMarket.mockResolvedValue({ ok: true, id: 'm1' });
    render(<MarketEditor details records initial={existing()} shop={shop} />);
    fireEvent.click(screen.getByRole('checkbox', { name: /Theo/ }));
    const theo = screen.getByLabelText('How many Theo you’re bringing') as HTMLInputElement;
    expect(theo.value).toBe('6');
    fireEvent.change(theo, { target: { value: '3' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /Scarf/ }));
    expect((screen.getByLabelText('How many Scarf, Blue, you’re bringing') as HTMLInputElement).value).toBe('4');
    expect((screen.getByLabelText('How many Scarf, Red, you’re bringing') as HTMLInputElement).value).toBe('');
    fireEvent.click(screen.getAllByRole('button', { name: 'Save' })[0]!);
    await waitFor(() =>
      expect(saveMarket).toHaveBeenCalledWith(expect.objectContaining({ listingIds: ['l1', 'l3'], stock: { l1: '3', 'l3:v1': '4', 'l3:v2': '' } })),
    );
  });

  it('keeps a count she typed when she unticks and ticks a piece again', () => {
    render(<MarketEditor details records initial={existing({ listingIds: ['l1'], stock: { l1: '2' } })} shop={shop} />);
    expect((screen.getByLabelText('How many Theo you’re bringing') as HTMLInputElement).value).toBe('2');
    fireEvent.click(screen.getByRole('checkbox', { name: /Theo/ }));
    expect(screen.queryByLabelText('How many Theo you’re bringing')).toBeNull();
    fireEvent.click(screen.getByRole('checkbox', { name: /Theo/ }));
    expect((screen.getByLabelText('How many Theo you’re bringing') as HTMLInputElement).value).toBe('2');
  });

  it('says so when there is nothing live to bring', () => {
    render(<MarketEditor details records initial={existing()} shop={{ ...shop, products: [] }} />);
    expect(screen.getByText(/No live products yet/)).toBeTruthy();
  });

  it('asks only day, market and town at Showcase, and saves the hidden details untouched', async () => {
    saveMarket.mockResolvedValue({ ok: true, id: 'm1' });
    render(<MarketEditor details={false} records={false} initial={existing({ organizerName: 'Pat', notes: 'Bring tent weights', rating: 4, hours: '10am – 4pm', booth: 'Booth 4' })} />);
    expect(screen.getByLabelText('Market name')).toBeTruthy();
    expect(screen.getByLabelText('Town')).toBeTruthy();
    for (const label of ['Hours', 'Address', 'Booth or table', 'The market’s website']) expect(screen.queryByLabelText(new RegExp(label))).toBeNull();
    for (const name of ['Costs', 'Organizer', 'Notes', 'Your review']) expect(screen.queryByRole('heading', { name })).toBeNull();
    fireEvent.click(screen.getAllByRole('button', { name: 'Save' })[0]!);
    await waitFor(() => expect(saveMarket).toHaveBeenCalledWith(expect.objectContaining({ organizerName: 'Pat', notes: 'Bring tent weights', rating: 4, hours: '10am – 4pm', booth: 'Booth 4' })));
  });

  it('adds hours, address, booth and website at Lite, without the private records', () => {
    render(<MarketEditor details records={false} initial={existing()} />);
    expect(screen.getByLabelText(/Booth or table/)).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Costs' })).toBeNull();
  });

  it('shows costs, organizer, notes and the review with market records', () => {
    render(<MarketEditor details records initial={existing()} />);
    for (const name of ['Costs', 'Organizer', 'Notes', 'Your review']) expect(screen.getByRole('heading', { name })).toBeTruthy();
  });
});
