import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';

const { setProductOnHome } = vi.hoisted(() => ({ setProductOnHome: vi.fn() }));
vi.mock('@/lib/backend/catalog/actions', () => ({ setProductOnHome }));
vi.mock('next/navigation', () => ({ unstable_rethrow: vi.fn() }));
import { ProductTable } from './ProductTable';
import type { ProductRowView } from '@/lib/backend/catalog/queries';

const row = (id: string, name: string, status: ProductRowView['status'], over: Partial<ProductRowView> = {}): ProductRowView => ({
  id, name, status, priceLabel: '$24', stockLabel: 'Made to order', soldOut: false, photoUrl: null, photoUploadId: null, collectionIds: [], onHome: false, ...over,
});
beforeEach(() => {
  setProductOnHome.mockReset();
  setProductOnHome.mockResolvedValue({ ok: true });
  Element.prototype.scrollIntoView = vi.fn(); // jsdom has no layout
});

const rows = [row('1', 'Fig Candle', 'active', { photoUrl: 'https://x/1.webp' }), row('2', 'Pine Soap', 'draft'), row('3', 'Old Mug', 'archived')];

describe('ProductTable', () => {
  it('lists current products with a link to edit each, hiding archived ones', () => {
    render(<ProductTable products={rows} />);
    expect(screen.getByRole('link', { name: 'Fig Candle' })).toHaveAttribute('href', '/manage/products/1');
    expect(screen.getByRole('link', { name: 'Pine Soap' })).toBeInTheDocument();
    expect(screen.queryByText('Old Mug')).toBeNull();
    expect(within(screen.getByRole('row', { name: /Fig Candle/ })).getByText('Live')).toBeInTheDocument();
  });
  it('filters by name and by status', () => {
    render(<ProductTable products={rows} />);
    fireEvent.change(screen.getByLabelText('Find a product'), { target: { value: 'pine' } });
    expect(screen.queryByText('Fig Candle')).toBeNull();
    expect(screen.getByText('Pine Soap')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Find a product'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Show'), { target: { value: 'archived' } });
    expect(screen.getByText('Old Mug')).toBeInTheDocument();
    expect(screen.queryByText('Fig Candle')).toBeNull();
  });
  it('says when nothing matches, and when there is nothing yet', () => {
    const { rerender } = render(<ProductTable products={rows} />);
    fireEvent.change(screen.getByLabelText('Find a product'), { target: { value: 'zzz' } });
    expect(screen.getByText('No products match.')).toBeInTheDocument();
    rerender(<ProductTable products={[]} />);
    expect(screen.getByText('No products yet. Add your first one to get started.')).toBeInTheDocument();
  });
  it('ticks the products on the home page and counts them against the 5', () => {
    render(
      <ProductTable
        products={[
          row('1', 'Fig Candle', 'active', { onHome: true }),
          row('2', 'Pine Soap', 'draft', { onHome: true }),
          row('3', 'Old Mug', 'archived', { onHome: true }),
          row('4', 'Wax Melt', 'active'),
        ]}
      />,
    );
    expect(screen.getByText('On your home page: 2 of 5')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Show Fig Candle on your home page' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Show Wax Melt on your home page' })).not.toBeChecked();
    expect(screen.queryByText('Home', { selector: '.bk-pill' })).toBeNull();
  });
  it('gives archived products no home-page box', () => {
    render(<ProductTable products={rows} />);
    fireEvent.change(screen.getByLabelText('Show'), { target: { value: 'archived' } });
    expect(within(screen.getByRole('row', { name: /Old Mug/ })).queryByRole('checkbox')).toBeNull();
  });
  it('saves a tick straight away and updates the count', async () => {
    render(<ProductTable products={rows} />);
    const box = screen.getByRole('checkbox', { name: 'Show Pine Soap on your home page' });
    fireEvent.click(box);
    expect(box).toBeChecked();
    expect(box).toBeDisabled();
    expect(screen.getByText('On your home page: 1 of 5')).toBeInTheDocument();
    expect(setProductOnHome).toHaveBeenCalledWith('2', true);
    await waitFor(() => expect(box).toBeEnabled());
    expect(box).toBeChecked();
    expect(screen.getByRole('alert')).toBeEmptyDOMElement();
  });
  it('unticks straight away', async () => {
    render(<ProductTable products={[row('1', 'Fig Candle', 'active', { onHome: true })]} />);
    const box = screen.getByRole('checkbox', { name: 'Show Fig Candle on your home page' });
    fireEvent.click(box);
    expect(setProductOnHome).toHaveBeenCalledWith('1', false);
    await waitFor(() => expect(box).toBeEnabled());
    expect(box).not.toBeChecked();
    expect(screen.getByText('On your home page: 0 of 5')).toBeInTheDocument();
  });
  it('puts the tick back and says why when the save is refused', async () => {
    setProductOnHome.mockResolvedValue({ ok: false, error: 'That product no longer exists. Reload the page.' });
    render(<ProductTable products={rows} />);
    const box = screen.getByRole('checkbox', { name: 'Show Pine Soap on your home page' });
    fireEvent.click(box);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('That product no longer exists. Reload the page.'));
    expect(box).not.toBeChecked();
    expect(box).toBeEnabled();
    expect(screen.getByText('On your home page: 0 of 5')).toBeInTheDocument();
  });
  it('puts the tick back when the save throws', async () => {
    setProductOnHome.mockRejectedValue(new Error('offline'));
    render(<ProductTable products={[row('1', 'Fig Candle', 'active', { onHome: true })]} />);
    const box = screen.getByRole('checkbox', { name: 'Show Fig Candle on your home page' });
    fireEvent.click(box);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong. Check your connection and try again.'));
    expect(box).toBeChecked();
    expect(screen.getByText('On your home page: 1 of 5')).toBeInTheDocument();
  });
  it('refuses a sixth without asking the server, but still lets one come off', async () => {
    const five = ['A', 'B', 'C', 'D', 'E'].map((n, i) => row(String(i), n, 'active', { onHome: true }));
    render(<ProductTable products={[...five, row('9', 'Wax Melt', 'active')]} />);
    const sixth = screen.getByRole('checkbox', { name: 'Show Wax Melt on your home page' });
    expect(sixth).toBeEnabled();
    fireEvent.click(sixth);
    expect(sixth).not.toBeChecked();
    expect(setProductOnHome).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Your home page shows up to 5 products. Untick one first.');
    fireEvent.click(screen.getByRole('checkbox', { name: 'Show A on your home page' }));
    expect(setProductOnHome).toHaveBeenCalledWith('0', false);
    await waitFor(() => expect(screen.getByText('On your home page: 4 of 5')).toBeInTheDocument());
  });
});
