import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';

const path = vi.hoisted(() => ({ current: '/manage/tools/cost' }));
const push = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({ usePathname: () => path.current, useRouter: () => ({ push }), unstable_rethrow: () => undefined }));
const saveCostsToProduct = vi.hoisted(() => vi.fn());
vi.mock('@/lib/tools/actions', () => ({ saveCostsToProduct }));

import { ToolsShell, linkedPrice, EXAMPLE_COST, EXAMPLE_PRICE } from './ToolsShell';
import { CostTool } from './CostTool';
import { PriceTool } from './PriceTool';
import { MarketTool } from './MarketTool';
import { costToMake } from '@/lib/tools/maths';

afterEach(cleanup);

const shell = (tool: React.ReactElement, canSaveProduct = true, canSaveEvent = true) =>
  render(
    <ToolsShell canSaveProduct={canSaveProduct} canSaveEvent={canSaveEvent}>
      {tool}
    </ToolsShell>,
  );
const tag = (name: string) => screen.getByRole('complementary', { name });
const strip = () => screen.getByRole('navigation', { name: 'Tools' });

describe('the strip across the top', () => {
  it('shows each tool’s answer and marks the one open', () => {
    path.current = '/manage/tools/price';
    shell(<PriceTool />);
    const links = within(strip()).getAllByRole('link');
    expect(links.map((l) => l.getAttribute('href'))).toEqual(['/manage/tools/cost', '/manage/tools/price', '/manage/tools/market']);
    expect(links[1]).toHaveAttribute('aria-current', 'page');
    expect(links[0]).toHaveTextContent('$3.45');
    expect(links[1]).toHaveTextContent('$21');
    expect(links[2]).toHaveTextContent('$339');
    path.current = '/manage/tools/cost';
  });
});

describe('Cost to make', () => {
  it('works out the example candle on the tag', () => {
    shell(<CostTool />);
    expect(within(tag('Cost to make one')).getByText('$3.45')).toBeInTheDocument();
    expect(within(tag('Cost to make one')).getByText('$29.53 for the batch ÷ 12 pieces')).toBeInTheDocument();
    expect(within(tag('Cost to make one')).getByText('$6.78')).toBeInTheDocument();
  });

  it('follows what she types and carries it to Price it', () => {
    shell(<CostTool />);
    fireEvent.change(screen.getByLabelText('How many one batch makes'), { target: { value: '6' } });
    expect(within(tag('Cost to make one')).getByText('$5.91')).toBeInTheDocument();
    expect(within(strip()).getAllByRole('link')[0]).toHaveTextContent('$5.91');
  });

  it('adds and removes supplies, keeping one row to type in', () => {
    shell(<CostTool />);
    fireEvent.click(screen.getByRole('button', { name: 'Add a supply' }));
    expect(screen.getAllByLabelText('Supply')).toHaveLength(4);
    for (const name of ['Remove Soy wax, 10 lb bag', 'Remove Fragrance oil, 16 oz', 'Remove Wicks, pack of 100', 'Remove this supply']) fireEvent.click(screen.getByRole('button', { name }));
    expect(screen.getAllByLabelText('Supply')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Add one' }));
    expect(screen.getAllByLabelText('Item')).toHaveLength(3);
  });

  it('starts blank, asking how many it makes', () => {
    shell(<CostTool />);
    fireEvent.click(screen.getByRole('button', { name: 'Start blank' }));
    expect(screen.getByLabelText('What you’re making')).toHaveValue('');
    expect(within(tag('Cost to make one')).getByText('add how many it makes')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Save as a product' })).toBeNull();
  });

  it('saves as a product with the name and price, where the site has products', () => {
    shell(<CostTool />);
    const q = new URL(screen.getByRole('link', { name: 'Save as a product' }).getAttribute('href') ?? '', 'https://app.bohdiai.com').searchParams;
    expect([q.get('name'), q.get('price'), q.get('y'), q.get('o'), q.get('m')]).toEqual(['8 oz soy candle', '2100', '12', '1.50', '2.5']);
    expect(q.getAll('b')).toEqual(['31.97:2:Soy wax, 10 lb bag', '30.77:2.5:Fragrance oil, 16 oz', '9.93:8:Wicks, pack of 100']);
    cleanup();
    shell(<CostTool />, false);
    expect(screen.queryByRole('link', { name: 'Save as a product' })).toBeNull();
  });
});

describe('Price it', () => {
  it('shows break-even, the price, each place she sells, and the shop price', () => {
    shell(<PriceTool />);
    const t = tag('Your price');
    expect(t.querySelector('.bk-hangtag-big-value')).toHaveTextContent('$21');
    expect(within(t).getByText('$8.28')).toBeInTheDocument();
    expect(within(t).getByText('Ask at markets').nextElementSibling).toHaveTextContent('$21');
    expect(within(t).getByText('List on Etsy at').nextElementSibling).toHaveTextContent('$24');
    expect(within(t).getByText('Selling to a shop, charge them').nextElementSibling).toHaveTextContent('$17');
    expect(within(t).getByText('Your price sits right in with other makers. That’s a good place to be.')).toBeInTheDocument();
  });

  it('follows the markup and the places picked, with each place’s own settings', () => {
    shell(<PriceTool />);
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

  it('stops following Cost to make once she types over its numbers', () => {
    shell(<PriceTool />);
    fireEvent.change(screen.getByLabelText('Materials for one'), { target: { value: '5' } });
    expect(screen.getByLabelText('Fill these in from Cost to make')).not.toBeChecked();
    expect(screen.getByText(/no longer follow Cost to make/)).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Fill these in from Cost to make'));
    expect(screen.getByLabelText('Materials for one')).toHaveValue('3.45');
  });

  it('reads her price against what others charge', () => {
    shell(<PriceTool />);
    fireEvent.change(screen.getByLabelText('Lowest you’ve seen'), { target: { value: '30' } });
    fireEvent.change(screen.getByLabelText('Highest you’ve seen'), { target: { value: '40' } });
    expect(within(tag('Your price')).getByText(/below everyone you’ve seen/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Lowest you’ve seen'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Highest you’ve seen'), { target: { value: '' } });
    expect(within(tag('Your price')).queryByText('Next to other makers')).toBeNull();
  });

  it('starts blank, with no search buttons until it’s named', () => {
    shell(<PriceTool />);
    fireEvent.click(screen.getByRole('button', { name: 'Start blank' }));
    expect(within(tag('Your price')).getByText('Add your materials and time to start.')).toBeInTheDocument();
    expect(screen.getByText(/search buttons appear here/)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Save as a product' })).toBeNull();
  });
});

describe('linkedPrice', () => {
  it('takes Cost to make’s numbers only while linked, and keeps its own name when Cost to make has none', () => {
    const r = costToMake(EXAMPLE_COST);
    expect(linkedPrice(EXAMPLE_PRICE, EXAMPLE_COST, r)).toMatchObject({ materials: '3.45', time: '3.33', name: '8 oz soy candle' });
    expect(linkedPrice({ ...EXAMPLE_PRICE, name: 'Mine' }, { ...EXAMPLE_COST, name: ' ', hours: '' }, costToMake({ ...EXAMPLE_COST, hours: '' }))).toMatchObject({ name: 'Mine', time: '' });
    const blank = { yield: '', batch: [], piece: [], hours: '', rate: '' };
    expect(linkedPrice(EXAMPLE_PRICE, { ...EXAMPLE_COST, ...blank }, costToMake(blank)).materials).toBe('');
    const own = { ...EXAMPLE_PRICE, linked: false, materials: '9' };
    expect(linkedPrice(own, EXAMPLE_COST, r)).toBe(own);
  });
});

describe('Market day', () => {
  it('gives the verdict, take-home, pay per hour and the sales she’d need', () => {
    shell(<MarketTool />);
    const t = tag('Market day');
    expect(within(t).getByText('Worth the trip')).toBeInTheDocument();
    expect(within(t).getByText('$339')).toBeInTheDocument();
    expect(within(t).getByText('$33.86')).toBeInTheDocument();
    expect(within(t).getByText('To pay yourself $20 an hour at this market, you’d need about $451 in sales.')).toBeInTheDocument();
  });

  it('says so when the day lost money', () => {
    shell(<MarketTool />);
    fireEvent.change(screen.getByLabelText('Total sales'), { target: { value: '100' } });
    expect(within(tag('Market day')).getByText('You paid to be there')).toBeInTheDocument();
    expect(within(tag('Market day')).getByText('Short by')).toBeInTheDocument();
  });

  it('starts blank and asks for the day', () => {
    shell(<MarketTool />);
    fireEvent.click(screen.getByRole('button', { name: 'Start blank' }));
    expect(within(tag('Market day')).getByText('Fill in your day')).toBeInTheDocument();
    expect(within(tag('Market day')).getByText(/Add your sales, hours and hourly rate/)).toBeInTheDocument();
  });

  it('saves as an event with its name and the costs of being there', () => {
    shell(<MarketTool />);
    const href = screen.getByRole('link', { name: 'Save as an event' }).getAttribute('href') ?? '';
    const q = new URL(href, 'https://app.bohdiai.com').searchParams;
    expect(q.get('name')).toBe('Fall Harvest Fair');
    expect(q.getAll('cost')).toEqual(['7500:Booth fee', '1800:Gas, tolls and parking', '2200:Food and coffee', '1500:Bags, signs, other']);
    cleanup();
    shell(<MarketTool />, true, false);
    expect(screen.queryByRole('link', { name: 'Save as an event' })).toBeNull();
  });
});

describe('Cost to make, opened from a product', () => {
  const product = { id: 'l1', name: 'Fig candle', costs: { yield: '10', hours: '', rate: '20', extras: '2', markup: 3 as const, batch: [{ name: 'Wax', paid: '30', lasts: '' }], piece: [] } };

  it('starts from the product’s own costs and saves them back to it', async () => {
    saveCostsToProduct.mockResolvedValue({ ok: true });
    shell(<CostTool product={product} />);
    expect(screen.getByText('Working on Fig candle')).toBeInTheDocument();
    expect(screen.getByLabelText('How many one batch makes')).toHaveValue('10');
    expect(screen.queryByRole('link', { name: 'Save as a product' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Save to Fig candle' }));
    await vi.waitFor(() => expect(push).toHaveBeenCalledWith('/manage/products/l1'));
    expect(saveCostsToProduct).toHaveBeenCalledWith('l1', expect.objectContaining({ yield: '10', extras: '2', markup: 3 }));
  });

  it('starts blank for a product with no costs, and says why a save failed', async () => {
    saveCostsToProduct.mockResolvedValueOnce({ ok: false, error: 'Check the hours to make the batch.' });
    shell(<CostTool product={{ id: 'l2', name: 'Tin', costs: null }} />);
    expect(screen.getByLabelText('What you’re making')).toHaveValue('Tin');
    expect(screen.getByLabelText('How many one batch makes')).toHaveValue('');
    fireEvent.click(screen.getByRole('button', { name: 'Save to Tin' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Check the hours to make the batch.');
    saveCostsToProduct.mockRejectedValueOnce(new Error('offline'));
    fireEvent.click(screen.getByRole('button', { name: 'Save to Tin' }));
    expect(await screen.findByText(/Check your connection/)).toBeInTheDocument();
  });
});
