import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { emptyProductForm, type ProductForm } from '@/lib/backend/catalog/product-form';

const { saveProduct, duplicateProduct, replace, push, refresh } = vi.hoisted(() => ({
  saveProduct: vi.fn(),
  duplicateProduct: vi.fn(),
  replace: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock('@/lib/backend/catalog/actions', () => ({ saveProduct, duplicateProduct, uploadProductPhoto: vi.fn(), uploadProductFile: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace, push, refresh }), unstable_rethrow: vi.fn() }));

import { ProductEditor } from './ProductEditor';

const collections = [{ id: 'c1', name: 'Autumn' }];
const existing = (over: Partial<ProductForm> = {}): ProductForm => ({ ...emptyProductForm(), id: 'l1', slug: 'fig', name: 'Fig Candle', price: '24', ...over });
const renderEditor = (initial: ProductForm, digital = false) =>
  render(<ProductEditor initial={initial} collections={collections} digital={digital} shopUrl="https://shop.bohdiai.com" />);

/** Add option "Size" with choice "Small" and type 30 as its price. */
const sizeSmallAt30 = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Add an option' }));
  fireEvent.change(screen.getByLabelText('Option 1 name'), { target: { value: 'Size' } });
  const input = screen.getByLabelText('New choice for Size');
  fireEvent.change(input, { target: { value: 'Small' } });
  fireEvent.keyDown(input, { key: 'Enter' });
  fireEvent.change(screen.getByLabelText('Price for Small'), { target: { value: '30' } });
};

const scrollIntoView = vi.fn();
beforeEach(() => {
  vi.clearAllMocks();
  Element.prototype.scrollIntoView = scrollIntoView; // jsdom has no layout
});

describe('ProductEditor', () => {
  it('shows the validation message without calling the server', async () => {
    renderEditor(emptyProductForm());
    fireEvent.click(screen.getAllByRole('button', { name: 'Save' })[0]!);
    expect(await screen.findByRole('alert')).toHaveTextContent('Give the product a name.');
    expect(saveProduct).not.toHaveBeenCalled();
    expect(scrollIntoView).toHaveBeenCalled();
  });
  it('saves a new product and opens it', async () => {
    saveProduct.mockResolvedValue({ ok: true, id: 'new' });
    renderEditor(emptyProductForm());
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Fig Candle' } });
    fireEvent.change(screen.getByLabelText('Price'), { target: { value: '24' } });
    fireEvent.click(screen.getByLabelText('Autumn'));
    fireEvent.click(screen.getAllByRole('button', { name: 'Save' })[0]!);
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/manage/products/new'));
    expect(saveProduct.mock.calls[0]![0]).toMatchObject({ name: 'Fig Candle', price: '24', collectionIds: ['c1'] });
  });
  it('confirms a save of an existing product', async () => {
    saveProduct.mockResolvedValue({ ok: true, id: 'l1' });
    renderEditor(existing());
    fireEvent.click(screen.getAllByRole('button', { name: 'Save' })[0]!);
    expect(await screen.findByRole('status')).toHaveTextContent('Saved.');
    expect(refresh).toHaveBeenCalled();
  });
  it('shows the server’s message, and a plain one when the call throws', async () => {
    saveProduct.mockResolvedValueOnce({ ok: false, error: 'The product couldn’t be saved. Try again in a moment.' });
    renderEditor(existing());
    fireEvent.click(screen.getAllByRole('button', { name: 'Save' })[0]!);
    expect(await screen.findByRole('alert')).toHaveTextContent('The product couldn’t be saved. Try again in a moment.');
    saveProduct.mockRejectedValueOnce(new Error('offline'));
    fireEvent.click(screen.getAllByRole('button', { name: 'Save' })[0]!);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong. Check your connection and try again.'));
  });
  it('builds combinations as options are added', () => {
    renderEditor(existing());
    fireEvent.click(screen.getByRole('button', { name: 'Add an option' }));
    fireEvent.change(screen.getByLabelText('Option 1 name'), { target: { value: 'Size' } });
    const input = screen.getByLabelText('New choice for Size');
    fireEvent.change(input, { target: { value: 'Small' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByLabelText('Price for Small')).toBeInTheDocument();
    expect(screen.queryByLabelText('Stock')).toBeNull();
  });
  it('keeps typed combination prices when an option is renamed', () => {
    renderEditor(existing());
    sizeSmallAt30();
    fireEvent.change(screen.getByLabelText('Option 1 name'), { target: { value: 'Sizes' } });
    expect(screen.getByLabelText('Price for Small')).toHaveValue('30');
  });
  it('brings typed prices back when an option name is cleared and typed again', () => {
    renderEditor(existing());
    sizeSmallAt30();
    fireEvent.change(screen.getByLabelText('Option 1 name'), { target: { value: '' } });
    expect(screen.queryByLabelText('Price for Small')).toBeNull();
    fireEvent.change(screen.getByLabelText('Option 1 name'), { target: { value: 'Size' } });
    expect(screen.getByLabelText('Price for Small')).toHaveValue('30');
  });
  it('brings typed prices back when a removed choice is added again', () => {
    renderEditor(existing());
    sizeSmallAt30();
    fireEvent.click(screen.getByRole('button', { name: 'Remove Small' }));
    expect(screen.queryByLabelText('Price for Small')).toBeNull();
    const input = screen.getByLabelText('New choice for Size');
    fireEvent.change(input, { target: { value: 'Small' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByLabelText('Price for Small')).toHaveValue('30');
  });
  it('does not carry prices across when an option is removed and the others move up', () => {
    renderEditor(existing());
    fireEvent.click(screen.getByRole('button', { name: 'Add an option' }));
    fireEvent.change(screen.getByLabelText('Option 1 name'), { target: { value: 'Size' } });
    const size = screen.getByLabelText('New choice for Size');
    fireEvent.change(size, { target: { value: 'Small' } });
    fireEvent.keyDown(size, { key: 'Enter' });
    fireEvent.click(screen.getByRole('button', { name: 'Add an option' }));
    fireEvent.change(screen.getByLabelText('Option 2 name'), { target: { value: 'Colour' } });
    const colour = screen.getByLabelText('New choice for Colour');
    fireEvent.change(colour, { target: { value: 'Red' } });
    fireEvent.keyDown(colour, { key: 'Enter' });
    fireEvent.change(screen.getByLabelText('Price for Small / Red'), { target: { value: '30' } });
    fireEvent.click(screen.getByRole('button', { name: 'Remove the Size option' }));
    expect(screen.getByLabelText('Price for Red')).toHaveValue('');
  });
  it('hides download choices unless the site has them', () => {
    renderEditor(existing());
    expect(screen.queryByLabelText('Download')).toBeNull();
  });
  it('offers download and its file when the site has them', () => {
    renderEditor(existing(), true);
    fireEvent.click(screen.getByLabelText('Download'));
    expect(screen.getByLabelText('Upload the download file')).toBeInTheDocument();
    expect(screen.queryByLabelText('Stock')).toBeNull();
  });
  it('duplicates an existing product and opens the copy', async () => {
    duplicateProduct.mockResolvedValue({ ok: true, id: 'copy' });
    renderEditor(existing());
    fireEvent.click(screen.getByRole('button', { name: 'Duplicate' }));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/manage/products/copy'));
  });
  it('archives after a second confirmation', async () => {
    saveProduct.mockResolvedValue({ ok: true, id: 'l1' });
    renderEditor(existing({ status: 'active' }));
    fireEvent.click(screen.getByRole('button', { name: 'Archive' }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes, archive it' }));
    await waitFor(() => expect(saveProduct.mock.calls[0]![0]).toMatchObject({ status: 'archived' }));
  });
  it('links to the live product on the shop', () => {
    renderEditor(existing({ status: 'active' }));
    expect(screen.getByRole('link', { name: 'View on your shop' })).toHaveAttribute('href', 'https://shop.bohdiai.com/listings/fig');
  });
});
