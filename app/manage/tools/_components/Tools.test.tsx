import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';

const push = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({ usePathname: () => '/manage/tools/cost', useRouter: () => ({ push }), unstable_rethrow: () => undefined }));
const saveCostsToProduct = vi.hoisted(() => vi.fn());
vi.mock('@/lib/tools/actions', () => ({ saveCostsToProduct }));

import { CostTool } from './CostTool';
import { PriceTool } from './PriceTool';
import { MarketTool } from './MarketTool';
import { BLANK_PRICE, type CostCarry, type DayForm, type PriceForm } from '@/lib/tools/forms';
import { priceFromCost } from '@/lib/tools/handoff';

afterEach(cleanup);

const tag = (name: string) => screen.getByRole('complementary', { name });
const type = (label: string, value: string, at = 0): void => {
  fireEvent.change(screen.getAllByLabelText(label)[at] as HTMLElement, { target: { value } });
};
const params = (href: string | null): URLSearchParams => new URL(href ?? '', 'https://app.bohdiai.com').searchParams;

// The toolkit's own examples (Alex, 2026-10-24): an 8 oz soy candle at CandleScience
// prices; comps from Craftybase's benchmark.
const CANDLE: PriceForm = { ...BLANK_PRICE, name: '8 oz soy candle', materials: '3.45', time: '3.33', extras: '1.50', channels: ['markets', 'etsy'], low: '16', high: '28' };
const CANDLE_BATCH: CostCarry = { yield: '12', hours: '2', rate: '20', batch: [{ name: 'Soy wax, 10 lb bag', paid: '31.97', lasts: '2' }], piece: [{ name: '8 oz jelly jar', each: '0.66' }] };
const FAIR: DayForm = { name: 'Fall Harvest Fair', sales: '640', card: '380', cardRate: '3', booth: '75', gas: '18', food: '22', other: '15', materials: '160', hoursAtMarket: '7', hoursOther: '3', wage: '20' };

/** A batch of 12 candles: wax, fragrance, wicks, a jar and a lid, two hours at $20. */
function typeTheCandle(): void {
  type('What you’re making', '8 oz soy candle');
  type('How many one batch makes', '12');
  type('What it is', 'Soy wax, 10 lb bag');
  type('What you paid', '31.97');
  type('Batches it lasts', '2');
  fireEvent.click(screen.getByRole('button', { name: 'Add a supply' }));
  type('What it is', 'Fragrance oil, 16 oz', 1);
  type('What you paid', '30.77', 1);
  type('Batches it lasts', '2.5', 1);
  fireEvent.click(screen.getByRole('button', { name: 'Add a supply' }));
  type('What it is', 'Wicks, pack of 100', 2);
  type('What you paid', '9.93', 2);
  type('Batches it lasts', '8', 2);
  type('Item', '8 oz jelly jar');
  type('Costs you each', '0.66');
  fireEvent.click(screen.getByRole('button', { name: 'Add one' }));
  type('Item', 'Gold lid', 1);
  type('Costs you each', '0.33', 1);
  type('Hours to make the batch', '2');
}

describe('Cost to make, on its own', () => {
  it('starts blank, asking how many it makes, with no example', () => {
    render(<CostTool />);
    expect(screen.getByLabelText('What you’re making')).toHaveValue('');
    expect(within(tag('Cost to make one product')).getByText('add how many it makes')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Start blank' })).toBeNull();
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('What does it cost to make one product?');
  });

  it('works out the cost of one as she types, asking in her own words', () => {
    render(<CostTool />);
    typeTheCandle();
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('What does it cost to make one 8 oz soy candle?');
    expect(within(tag('Cost to make one product')).getByText('$3.45')).toBeInTheDocument();
    expect(within(tag('Cost to make one product')).getByText('$29.53 for the batch ÷ 12 pieces')).toBeInTheDocument();
    expect(within(tag('Cost to make one product')).getByText('$6.78')).toBeInTheDocument();
  });

  it('adds and removes supplies, keeping one row to type in', () => {
    render(<CostTool />);
    fireEvent.click(screen.getByRole('button', { name: 'Add a supply' }));
    expect(screen.getAllByLabelText('What it is')).toHaveLength(2);
    fireEvent.click(screen.getAllByRole('button', { name: 'Remove this supply' })[0] as HTMLElement);
    fireEvent.click(screen.getByRole('button', { name: 'Remove this supply' }));
    expect(screen.getAllByLabelText('What it is')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Remove this item' }));
    expect(screen.getAllByLabelText('Item')).toHaveLength(1);
  });

  it('links to Price it with this piece’s cost and its batch (Alex, 2026-10-28)', () => {
    render(<CostTool />);
    typeTheCandle();
    const link = screen.getByRole('link', { name: 'Price this piece' });
    expect(link.getAttribute('href')).toMatch(/^\/manage\/tools\/price\?/);
    const q = params(link.getAttribute('href'));
    expect([q.get('from'), q.get('name'), q.get('mat'), q.get('time'), q.get('y')]).toEqual(['cost', '8 oz soy candle', '3.45', '3.33', '12']);
    expect(q.getAll('b')).toEqual(['31.97:2:Soy wax, 10 lb bag', '30.77:2.5:Fragrance oil, 16 oz', '9.93:8:Wicks, pack of 100']);
    expect(screen.queryByRole('link', { name: 'Save as a product' })).toBeNull();
  });
});

describe('Cost to make, opened from a product', () => {
  const product = { id: 'l1', name: 'Fig candle', costs: { yield: '10', hours: '', rate: '20', extras: '2', markup: 3 as const, batch: [{ name: 'Wax', paid: '30', lasts: '' }], piece: [] } };

  it('starts from the product’s own costs and saves them back, keeping its markup', async () => {
    saveCostsToProduct.mockResolvedValue({ ok: true });
    render(<CostTool product={product} />);
    expect(screen.getByText('Working on Fig candle')).toBeInTheDocument();
    expect(screen.getByLabelText('How many one batch makes')).toHaveValue('10');
    expect(screen.getAllByLabelText('Item')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Save to Fig candle' }));
    await vi.waitFor(() => expect(push).toHaveBeenCalledWith('/manage/products/l1'));
    expect(saveCostsToProduct).toHaveBeenCalledWith('l1', expect.objectContaining({ yield: '10', extras: '2', markup: 3 }));
  });

  it('starts blank for a product with no costs, and says why a save failed', async () => {
    saveCostsToProduct.mockResolvedValueOnce({ ok: false, error: 'Check the hours to make the batch.' });
    render(<CostTool product={{ id: 'l2', name: 'Tin', costs: null }} />);
    expect(screen.getByLabelText('What you’re making')).toHaveValue('Tin');
    expect(screen.getByLabelText('How many one batch makes')).toHaveValue('');
    fireEvent.click(screen.getByRole('button', { name: 'Save to Tin' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Check the hours to make the batch.');
    expect(saveCostsToProduct).toHaveBeenLastCalledWith('l2', expect.objectContaining({ extras: '', markup: 2.5 }));
    saveCostsToProduct.mockRejectedValueOnce(new Error('offline'));
    fireEvent.click(screen.getByRole('button', { name: 'Save to Tin' }));
    expect(await screen.findByText(/Check your connection/)).toBeInTheDocument();
  });
});

describe('Price it', () => {
  it('starts blank on its own, with no search buttons until it’s named, and points to Cost to make', () => {
    render(<PriceTool initial={BLANK_PRICE} carry={null} canSaveProduct />);
    expect(within(tag('Your price')).getByText('Add your materials and time to start.')).toBeInTheDocument();
    expect(screen.getByText(/search buttons appear here/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Work it out in Cost to make' })).toHaveAttribute('href', '/manage/tools/cost');
    expect(screen.queryByRole('link', { name: 'Save as a product' })).toBeNull();
  });

  it('shows break-even, the price, each place she sells, and the shop price', () => {
    render(<PriceTool initial={CANDLE} carry={null} canSaveProduct />);
    const t = tag('Your price');
    expect(t.querySelector('.bk-hangtag-big-value')).toHaveTextContent('$21');
    expect(within(t).getByText('$8.28')).toBeInTheDocument();
    expect(within(t).getByText('Ask at markets').nextElementSibling).toHaveTextContent('$21');
    expect(within(t).getByText('List on Etsy at').nextElementSibling).toHaveTextContent('$24');
    expect(within(t).getByText('Selling to a shop, charge them').nextElementSibling).toHaveTextContent('$17');
    expect(within(t).getByText('Your price sits right in with other makers. That’s a good place to be.')).toBeInTheDocument();
  });

  it('follows the markup and the places picked, with each place’s own settings', () => {
    render(<PriceTool initial={CANDLE} carry={null} canSaveProduct />);
    fireEvent.click(screen.getByRole('button', { name: /^Triple/ }));
    expect(tag('Your price').querySelector('.bk-hangtag-big-value')).toHaveTextContent('$25');
    fireEvent.click(screen.getByRole('button', { name: 'Etsy' }));
    expect(within(tag('Your price')).queryByText('List on Etsy at')).toBeNull();
    for (const c of ['Facebook', 'My own website', 'Consignment shop']) fireEvent.click(screen.getByRole('button', { name: c }));
    expect(screen.getByLabelText('Room to haggle on Facebook')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Facebook Marketplace' })).toHaveAttribute('href', 'https://www.facebook.com/marketplace/search/?query=8%20oz%20soy%20candle');
    expect(within(tag('Your price')).getByText('Tag it at the consignment shop')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Booth or shelf rent'), { target: { value: '50' } });
    fireEvent.change(screen.getByLabelText('About how many sell there a month'), { target: { value: '' } });
    expect(within(tag('Your price')).getByText('Add about how many pieces sell there a month so the rent can be counted.')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('About how many sell there a month'), { target: { value: '10' } });
    expect(within(tag('Your price')).getByText(/covers this piece’s share of the rent/)).toBeInTheDocument();
  });

  it('reads her price against what others charge', () => {
    render(<PriceTool initial={CANDLE} carry={null} canSaveProduct />);
    fireEvent.change(screen.getByLabelText('Lowest you’ve seen'), { target: { value: '30' } });
    fireEvent.change(screen.getByLabelText('Highest you’ve seen'), { target: { value: '40' } });
    expect(within(tag('Your price')).getByText(/below everyone you’ve seen/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Lowest you’ve seen'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Highest you’ve seen'), { target: { value: '' } });
    expect(within(tag('Your price')).queryByText('Next to other makers')).toBeNull();
  });

  it('opened from Cost to make, says so and saves the product with the batch it carried', () => {
    const { form, carry } = priceFromCost({ from: 'cost', name: '8 oz soy candle', mat: '3.45', time: '3.33', y: '12', h: '2', r: '20', b: '31.97:2:Soy wax, 10 lb bag', p: '0.66:8 oz jelly jar' });
    render(<PriceTool initial={{ ...form, extras: '1.50' }} carry={carry} canSaveProduct />);
    expect(screen.getByText('Filled in from Cost to make. Change anything you like.')).toBeInTheDocument();
    expect(screen.getByLabelText('Materials for one')).toHaveValue('3.45');
    const q = params(screen.getByRole('link', { name: 'Save as a product' }).getAttribute('href'));
    expect([q.get('name'), q.get('price'), q.get('y'), q.get('o'), q.get('m')]).toEqual(['8 oz soy candle', '2100', '12', '1.50', '2.5']);
    expect(q.getAll('b')).toEqual(['31.97:2:Soy wax, 10 lb bag']);
  });

  it('on its own, saves the product without costs it never had', () => {
    render(<PriceTool initial={CANDLE} carry={null} canSaveProduct />);
    const q = params(screen.getByRole('link', { name: 'Save as a product' }).getAttribute('href'));
    expect([q.get('price'), q.get('y')]).toEqual(['2100', null]);
    cleanup();
    render(<PriceTool initial={CANDLE} carry={CANDLE_BATCH} canSaveProduct={false} />);
    expect(screen.queryByRole('link', { name: 'Save as a product' })).toBeNull();
  });

  it('has no link to Market day, which is unrelated (Alex, 2026-10-28)', () => {
    render(<PriceTool initial={BLANK_PRICE} carry={null} canSaveProduct />);
    expect(screen.queryByRole('link', { name: 'Market day' })).toBeNull();
  });
});

describe('Market day', () => {
  it('starts blank and asks for the day', () => {
    render(<MarketTool canSaveEvent />);
    expect(within(tag('Market day')).getByText('Fill in your day')).toBeInTheDocument();
    expect(within(tag('Market day')).getByText(/Add your sales, hours and hourly rate/)).toBeInTheDocument();
  });

  it('gives the verdict, take-home, pay per hour and the sales she’d need', () => {
    render(<MarketTool canSaveEvent initial={FAIR} />);
    const t = tag('Market day');
    expect(within(t).getByText('Worth the trip')).toBeInTheDocument();
    expect(within(t).getByText('$339')).toBeInTheDocument();
    expect(within(t).getByText('$33.86')).toBeInTheDocument();
    expect(within(t).getByText('To pay yourself $20 an hour at this market, you’d need about $451 in sales.')).toBeInTheDocument();
  });

  it('says so when the day lost money', () => {
    render(<MarketTool canSaveEvent initial={FAIR} />);
    fireEvent.change(screen.getByLabelText('Total sales'), { target: { value: '100' } });
    expect(within(tag('Market day')).getByText('You paid to be there')).toBeInTheDocument();
    expect(within(tag('Market day')).getByText('Short by')).toBeInTheDocument();
  });

  it('saves as an event with its name and the costs of being there', () => {
    render(<MarketTool canSaveEvent initial={FAIR} />);
    const q = params(screen.getByRole('link', { name: 'Save as an event' }).getAttribute('href'));
    expect(q.get('name')).toBe('Fall Harvest Fair');
    expect(q.getAll('cost')).toEqual(['7500:Booth fee', '1800:Gas, tolls and parking', '2200:Food and coffee', '1500:Bags, signs, other']);
    cleanup();
    render(<MarketTool canSaveEvent={false} initial={FAIR} />);
    expect(screen.queryByRole('link', { name: 'Save as an event' })).toBeNull();
  });

  it('has no link to Cost to make, which is unrelated (Alex, 2026-10-28)', () => {
    render(<MarketTool canSaveEvent />);
    expect(screen.queryByRole('link', { name: 'Cost to make' })).toBeNull();
  });
});
