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
    expect(screen.getByRole('heading', { level: 1, name: 'Add an event' })).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Event name'), { target: { value: 'Holly Fair' } });
    fireEvent.change(screen.getByLabelText('Day'), { target: { value: '2026-11-21' } });
    fireEvent.change(screen.getByLabelText(/Booth or table/), { target: { value: 'Booth 4' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Save' })[0]!);
    await waitFor(() => expect(push).toHaveBeenCalledWith('/manage/markets?saved=Holly%20Fair'));
    expect(saveMarket).toHaveBeenCalledWith(expect.objectContaining({ name: 'Holly Fair', date: '2026-11-21', booth: 'Booth 4' }), null);
  });

  it('adds costs and shows their total', () => {
    render(<MarketEditor initial={existing()} details records />);
    fireEvent.click(screen.getByRole('tab', { name: 'After' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add a cost' }));
    expect((screen.getByLabelText('What') as HTMLInputElement).value).toBe('Booth fee');
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '40' } });
    expect(screen.getByText('$40')).toBeTruthy();
  });

  it('takes a star rating and go-back answer', async () => {
    saveMarket.mockResolvedValue({ ok: true, id: 'm1' });
    render(<MarketEditor initial={existing()} details records />);
    fireEvent.click(screen.getByRole('tab', { name: 'After' }));
    fireEvent.click(screen.getByRole('button', { name: '4 stars' }));
    expect(screen.getByRole('button', { name: '4 stars' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByLabelText('Maybe'));
    fireEvent.click(screen.getAllByRole('button', { name: 'Save' })[0]!);
    await waitFor(() => expect(saveMarket).toHaveBeenCalledWith(expect.objectContaining({ rating: 4, goBack: 'maybe' }), null));
  });

  it('stops a market with no day before saving, and says why', async () => {
    render(<MarketEditor initial={emptyMarketForm()} details records />);
    fireEvent.change(screen.getByLabelText('Event name'), { target: { value: 'Holly Fair' } });
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
    fireEvent.click(screen.getByRole('button', { name: 'Remove this event' }));
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
  };
  const bringing = (): void => {
    fireEvent.click(screen.getByRole('tab', { name: 'What I’m bringing' }));
  };

  it('ticks the babies she brings and saves them with the market', async () => {
    saveMarket.mockResolvedValue({ ok: true, id: 'm1' });
    render(<MarketEditor details records initial={existing()} shop={shop} />);
    bringing();
    expect(screen.getByText(/Save the event first/)).toBeTruthy();
    fireEvent.click(screen.getByRole('checkbox', { name: /Theo/ }));
    expect(screen.getByText('What you’re bringing (1)')).toBeTruthy();
    fireEvent.click(screen.getAllByRole('button', { name: 'Save' })[0]!);
    await waitFor(() => expect(saveMarket).toHaveBeenCalledWith(expect.objectContaining({ listingIds: ['l1'] }), null));
  });

  it('shows the code for a saved event', () => {
    render(<MarketEditor details records initial={existing({ listingIds: ['l1'] })} shop={{ ...shop, marketUrl: 'https://rose-n-cat.bohdiai.com/market/m1' }} />);
    bringing();
    expect(screen.getByText('https://rose-n-cat.bohdiai.com/market/m1')).toBeTruthy();
    fireEvent.click(screen.getByRole('checkbox', { name: /Theo/ }));
    expect(screen.getByText('What you’re bringing (0)')).toBeTruthy();
  });

  it('starts each count at what she has on hand, and saves what she types', async () => {
    saveMarket.mockResolvedValue({ ok: true, id: 'm1' });
    render(<MarketEditor details records initial={existing()} shop={shop} />);
    bringing();
    fireEvent.click(screen.getByRole('checkbox', { name: /Theo/ }));
    const theo = screen.getByLabelText('How many Theo you’re bringing') as HTMLInputElement;
    expect(theo.value).toBe('6');
    fireEvent.change(theo, { target: { value: '3' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /Scarf/ }));
    expect((screen.getByLabelText('How many Scarf, Blue, you’re bringing') as HTMLInputElement).value).toBe('4');
    expect((screen.getByLabelText('How many Scarf, Red, you’re bringing') as HTMLInputElement).value).toBe('');
    fireEvent.click(screen.getAllByRole('button', { name: 'Save' })[0]!);
    await waitFor(() =>
      expect(saveMarket).toHaveBeenCalledWith(expect.objectContaining({ listingIds: ['l1', 'l3'], stock: { l1: '3', 'l3:v1': '4', 'l3:v2': '' } }), null),
    );
  });

  it('keeps a count she typed when she unticks and ticks a piece again', () => {
    render(<MarketEditor details records initial={existing({ listingIds: ['l1'], stock: { l1: '2' } })} shop={shop} />);
    bringing();
    expect((screen.getByLabelText('How many Theo you’re bringing') as HTMLInputElement).value).toBe('2');
    fireEvent.click(screen.getByRole('checkbox', { name: /Theo/ }));
    expect(screen.queryByLabelText('How many Theo you’re bringing')).toBeNull();
    fireEvent.click(screen.getByRole('checkbox', { name: /Theo/ }));
    expect((screen.getByLabelText('How many Theo you’re bringing') as HTMLInputElement).value).toBe('2');
  });

  it('says so when there is nothing live to bring', () => {
    render(<MarketEditor details records initial={existing()} shop={{ ...shop, products: [] }} />);
    bringing();
    expect(screen.getByText(/No live products yet/)).toBeTruthy();
  });

  it('asks only day, market and town at Showcase, and saves the hidden details untouched', async () => {
    saveMarket.mockResolvedValue({ ok: true, id: 'm1' });
    render(<MarketEditor details={false} records={false} initial={existing({ organizerName: 'Pat', notes: 'Bring tent weights', rating: 4, hours: '10am – 4pm', booth: 'Booth 4' })} />);
    expect(screen.getByLabelText('Event name')).toBeTruthy();
    expect(screen.getByLabelText('Town')).toBeTruthy();
    for (const label of ['Hours', 'Address', 'Booth or table', 'The event’s website']) expect(screen.queryByLabelText(new RegExp(label))).toBeNull();
    for (const name of ['Costs', 'Organizer', 'Notes', 'Your review']) expect(screen.queryByRole('heading', { name })).toBeNull();
    expect(screen.queryByRole('tablist')).toBeNull();
    fireEvent.click(screen.getAllByRole('button', { name: 'Save' })[0]!);
    await waitFor(() => expect(saveMarket).toHaveBeenCalledWith(expect.objectContaining({ organizerName: 'Pat', notes: 'Bring tent weights', rating: 4, hours: '10am – 4pm', booth: 'Booth 4' }), null));
  });

  it('adds hours, address, booth and website at Lite, without the private records', () => {
    render(<MarketEditor details records={false} initial={existing()} />);
    expect(screen.getByLabelText(/Booth or table/)).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Costs' })).toBeNull();
    expect(screen.queryByRole('tab', { name: 'After' })).toBeNull();
  });

  it('puts the organizer in Details, and costs, notes and the review in After', () => {
    render(<MarketEditor details records initial={existing()} />);
    expect(screen.getByRole('heading', { name: 'Organizer' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Costs' })).toBeNull();
    fireEvent.click(screen.getByRole('tab', { name: 'After' }));
    for (const name of ['Costs', 'Notes', 'Your review']) expect(screen.getByRole('heading', { name })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Organizer' })).toBeNull();
    expect(screen.getByRole('tab', { name: 'After' }).getAttribute('aria-selected')).toBe('true');
    expect(window.location.search).toBe('?tab=after');
    fireEvent.click(screen.getByRole('tab', { name: 'Details' }));
    expect(window.location.search).toBe('');
  });
});

describe('MarketEditor — tabs', () => {
  const shop = { products: [], marketUrl: null, fileBase: 'qr' };

  it('opens on the tab it was given, keeps changes across tabs, and hides Save on How it sold', async () => {
    saveMarket.mockResolvedValue({ ok: true, id: 'm1' });
    render(<MarketEditor details records initial={existing()} shop={shop} sold={<p>Sold list</p>} summary={<p>Summary line</p>} tab="sold" />);
    expect(screen.getByText('Summary line')).toBeTruthy();
    expect(screen.getByText('Sold list')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();
    fireEvent.click(screen.getByRole('tab', { name: 'Details' }));
    fireEvent.change(screen.getByLabelText('Town'), { target: { value: 'Bristol' } });
    fireEvent.click(screen.getByRole('tab', { name: 'After' }));
    expect(screen.queryByRole('button', { name: 'Remove this event' })).toBeNull();
    fireEvent.click(screen.getAllByRole('button', { name: 'Save' })[0]!);
    await waitFor(() => expect(saveMarket).toHaveBeenCalledWith(expect.objectContaining({ town: 'Bristol' }), null));
  });

  it('gives a new event every tab but How it sold', () => {
    render(<MarketEditor details records initial={emptyMarketForm()} shop={shop} sold={<p>Sold list</p>} tab="sold" />);
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(['Details', 'What I’m bringing', 'After']);
    expect(screen.getByRole('tab', { name: 'Details' }).getAttribute('aria-selected')).toBe('true');
  });
});

describe('MarketEditor — Market day on the event (Alex, 2026-10-24)', () => {
  const day = { sales: '640', card: '380', cardRate: '3', materials: '160', hoursAtMarket: '7', hoursOther: '3', wage: '20' };

  it('shows what the day paid with the costs above, and saves the numbers with the event', async () => {
    saveMarket.mockResolvedValue({ ok: true, id: 'm1' });
    render(<MarketEditor initial={existing({ costs: [{ description: 'Booth fee', amount: '130' }] })} details records takings={day} />);
    fireEvent.click(screen.getByRole('tab', { name: 'After' }));
    expect(screen.getByText(/You took home/)).toHaveTextContent('You took home $339, $33.86 an hour. Worth the trip.');
    fireEvent.change(screen.getByLabelText('Total sales'), { target: { value: '100' } });
    expect(screen.getByText(/You took home/)).toHaveTextContent('You paid to be there.');
    fireEvent.click(screen.getAllByRole('button', { name: 'Save' })[0]!);
    await waitFor(() => expect(saveMarket).toHaveBeenCalledWith(expect.objectContaining({ id: 'm1' }), { ...day, sales: '100' }));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/manage/markets?saved=Holly%20Fair'));
  });

  it('sends nothing when no numbers are typed, and opens the numbers again when they didn’t save', async () => {
    saveMarket.mockResolvedValue({ ok: true, id: 'm1', warning: 'takings' });
    render(<MarketEditor initial={existing()} details records takings={null} takingsUnsaved />);
    fireEvent.click(screen.getByRole('tab', { name: 'After' }));
    expect(screen.getByText(/these numbers didn’t/)).toBeInTheDocument();
    expect(screen.queryByText(/You took home/)).toBeNull();
    fireEvent.click(screen.getAllByRole('button', { name: 'Save' })[0]!);
    await waitFor(() => expect(saveMarket).toHaveBeenCalledWith(expect.objectContaining({ id: 'm1' }), null));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/manage/markets/m1?tab=after&takings=unsaved'));
  });
});
