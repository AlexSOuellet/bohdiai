import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { emptyProductForm, type ProductForm } from '@/lib/backend/catalog/product-form';

const { saveProduct, duplicateProduct, uploadProductPhoto, uploadProductFile, replace, push, refresh } = vi.hoisted(() => ({
  saveProduct: vi.fn(),
  duplicateProduct: vi.fn(),
  uploadProductPhoto: vi.fn(),
  uploadProductFile: vi.fn(),
  replace: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock('@/lib/backend/catalog/actions', () => ({ saveProduct, duplicateProduct, uploadProductPhoto, uploadProductFile }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace, push, refresh }), unstable_rethrow: vi.fn() }));

import { ProductEditor } from './ProductEditor';

const collections = [{ id: 'c1', name: 'Autumn' }];
const existing = (over: Partial<ProductForm> = {}): ProductForm => ({ ...emptyProductForm(), id: 'l1', slug: 'fig', name: 'Fig Candle', price: '24', ...over });
const renderEditor = (initial: ProductForm, digital = false, homeCount = 0) =>
  render(<ProductEditor initial={initial} collections={collections} digital={digital} shopUrl="https://shop.bohdiai.com" homeCount={homeCount} />);

/** Add option "Size" with choice "Small" and type 30 as its price. */
const sizeSmallAt30 = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Add an option' }));
  fireEvent.change(screen.getByLabelText('Option 1 name'), { target: { value: 'Size' } });
  const input = screen.getByLabelText('New choice for Size');
  fireEvent.change(input, { target: { value: 'Small' } });
  fireEvent.keyDown(input, { key: 'Enter' });
  fireEvent.change(screen.getByLabelText('Price for Small'), { target: { value: '30' } });
};

/** A server call that answers only when the test says so. */
function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}
const saveButtons = () => screen.getAllByRole('button', { name: 'Save' });
const addChoice = (option: string, value: string) => {
  const input = screen.getByLabelText(`New choice for ${option}`);
  fireEvent.change(input, { target: { value } });
  fireEvent.keyDown(input, { key: 'Enter' });
};
const pickFile = (label: string, name: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { files: [new File(['x'], name, { type: 'application/pdf' })] } });
/** Add option "Size" with a download choice "Small", then pick its file. */
const smallDownloadUploading = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Add an option' }));
  fireEvent.change(screen.getByLabelText('Option 1 name'), { target: { value: 'Size' } });
  addChoice('Size', 'Small');
  fireEvent.change(screen.getByLabelText('Small is sold as'), { target: { value: 'digital' } });
  pickFile('Upload the file for Small', 'small.pdf');
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
  it('saves a new product and returns to the list, naming it', async () => {
    saveProduct.mockResolvedValue({ ok: true, id: 'new' });
    renderEditor(emptyProductForm());
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Fig Candle' } });
    fireEvent.change(screen.getByLabelText('Price'), { target: { value: '24' } });
    fireEvent.click(screen.getByLabelText('Autumn'));
    fireEvent.click(screen.getAllByRole('button', { name: 'Save' })[0]!);
    await waitFor(() => expect(push).toHaveBeenCalledWith('/manage/products?saved=Fig%20Candle'));
    expect(saveProduct.mock.calls[0]![0]).toMatchObject({ name: 'Fig Candle', price: '24', collectionIds: ['c1'] });
  });
  it('returns to the list after saving an existing product, from either Save button', async () => {
    saveProduct.mockResolvedValue({ ok: true, id: 'l1' });
    renderEditor(existing());
    fireEvent.click(saveButtons()[1]!);
    await waitFor(() => expect(push).toHaveBeenCalledWith('/manage/products?saved=Fig%20Candle'));
    expect(replace).not.toHaveBeenCalled();
  });
  it('puts the saved name, trimmed and encoded, in the list address', async () => {
    saveProduct.mockResolvedValue({ ok: true, id: 'l1' });
    renderEditor(existing({ name: '  Fig & Clove?  ' }));
    fireEvent.click(saveButtons()[0]!);
    await waitFor(() => expect(push).toHaveBeenCalledWith('/manage/products?saved=Fig%20%26%20Clove%3F'));
  });
  it('shows the server’s message, and a plain one when the call throws', async () => {
    saveProduct.mockResolvedValueOnce({ ok: false, error: 'The product couldn’t be saved. Try again in a moment.' });
    renderEditor(existing());
    fireEvent.click(screen.getAllByRole('button', { name: 'Save' })[0]!);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('The product couldn’t be saved. Try again in a moment.'));
    saveProduct.mockRejectedValueOnce(new Error('offline'));
    fireEvent.click(screen.getAllByRole('button', { name: 'Save' })[0]!);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong. Check your connection and try again.'));
    expect(push).not.toHaveBeenCalled();
    expect(saveButtons()[0]).toBeEnabled();
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
    await waitFor(() => expect(push).toHaveBeenCalledWith('/manage/products?archived=Fig%20Candle'));
  });
  it('stays on the page with the message when an archive fails', async () => {
    saveProduct.mockResolvedValue({ ok: false, error: 'The product couldn’t be saved. Try again in a moment.' });
    renderEditor(existing({ status: 'active' }));
    fireEvent.click(screen.getByRole('button', { name: 'Archive' }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes, archive it' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('The product couldn’t be saved.'));
    expect(push).not.toHaveBeenCalled();
  });
  it('asks for a save before archiving unsaved changes, so they are never dropped', () => {
    renderEditor(existing({ status: 'active' }));
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Fig & Clove Candle' } });
    expect(screen.getByRole('button', { name: 'Archive' })).toBeDisabled();
    expect(screen.getByText('Save your changes first')).toBeInTheDocument();
  });
  it('links to the live product on the shop', () => {
    renderEditor(existing({ status: 'active' }));
    expect(screen.getByRole('link', { name: 'View on your shop' })).toHaveAttribute('href', 'https://shop.bohdiai.com/listings/fig');
  });
  it('stays busy while returning to the list, so a second click saves nothing twice', async () => {
    saveProduct.mockResolvedValue({ ok: true, id: 'l1' });
    renderEditor(existing());
    fireEvent.click(saveButtons()[0]!);
    await waitFor(() => expect(push).toHaveBeenCalledWith('/manage/products?saved=Fig%20Candle'));
    const buttons = screen.getAllByRole('button', { name: 'Saving…' });
    expect(buttons).toHaveLength(2);
    for (const b of buttons) expect(b).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Archive' })).toBeDisabled();
  });
  it('stays busy while a new product returns to the list, so a second click saves nothing twice', async () => {
    saveProduct.mockResolvedValue({ ok: true, id: 'new' });
    renderEditor({ ...emptyProductForm(), name: 'Fig Candle', price: '24' });
    fireEvent.click(saveButtons()[0]!);
    await waitFor(() => expect(push).toHaveBeenCalledWith('/manage/products?saved=Fig%20Candle'));
    const buttons = screen.getAllByRole('button', { name: 'Saving…' });
    expect(buttons).toHaveLength(2);
    for (const b of buttons) expect(b).toBeDisabled();
  });
  it('stays busy while the copy opens, so a second click makes no second copy', async () => {
    duplicateProduct.mockResolvedValue({ ok: true, id: 'copy' });
    renderEditor(existing());
    fireEvent.click(screen.getByRole('button', { name: 'Duplicate' }));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/manage/products/copy'));
    expect(screen.getByRole('button', { name: 'Duplicate' })).toBeDisabled();
  });
  it('keeps choices added while a choice’s file uploads', async () => {
    const upload = deferred<{ ok: true; uploadId: string; fileName: string }>();
    uploadProductFile.mockReturnValue(upload.promise);
    renderEditor(existing(), true);
    smallDownloadUploading();
    addChoice('Size', 'Large');
    await act(async () => upload.resolve({ ok: true, uploadId: 'f1', fileName: 'small.pdf' }));
    expect(screen.getByText('small.pdf')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove Large' })).toBeInTheDocument();
  });
  it('says so when a choice goes away while its file uploads', async () => {
    const upload = deferred<{ ok: true; uploadId: string; fileName: string }>();
    uploadProductFile.mockReturnValue(upload.promise);
    renderEditor(existing(), true);
    smallDownloadUploading();
    fireEvent.click(screen.getByRole('button', { name: 'Remove Small' }));
    await act(async () => upload.resolve({ ok: true, uploadId: 'f1', fileName: 'small.pdf' }));
    expect(screen.getByRole('alert')).toHaveTextContent('That choice changed while its file was uploading — upload the file again.');
    expect(screen.queryByRole('button', { name: 'Remove Small' })).toBeNull();
  });
  it('keeps typed prices when an option name is cleared and a new one typed', () => {
    renderEditor(existing());
    sizeSmallAt30();
    fireEvent.change(screen.getByLabelText('Option 1 name'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Option 1 name'), { target: { value: 'Width' } });
    expect(screen.getByLabelText('Price for Small')).toHaveValue('30');
  });
  it('does not rename typed prices onto a name another option already has', () => {
    renderEditor(existing());
    sizeSmallAt30();
    fireEvent.click(screen.getByRole('button', { name: 'Add an option' }));
    fireEvent.change(screen.getByLabelText('Option 2 name'), { target: { value: 'Colour' } });
    addChoice('Colour', 'Red');
    fireEvent.change(screen.getByLabelText('Price for Small / Red'), { target: { value: '35' } });
    fireEvent.change(screen.getByLabelText('Option 2 name'), { target: { value: 'Size' } });
    fireEvent.change(screen.getByLabelText('Option 2 name'), { target: { value: 'Colour' } });
    expect(screen.getByLabelText('Price for Small / Red')).toHaveValue('35');
  });
  it('cannot archive while a save is in flight', () => {
    saveProduct.mockReturnValue(new Promise(() => undefined));
    renderEditor(existing({ status: 'active' }));
    fireEvent.click(screen.getByRole('button', { name: 'Archive' }));
    fireEvent.click(saveButtons()[0]!);
    expect(screen.getByRole('button', { name: 'Yes, archive it' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Keep it' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Yes, archive it' }));
    expect(saveProduct).toHaveBeenCalledTimes(1);
  });
  it('returns to the list when a save works after one that failed', async () => {
    saveProduct.mockResolvedValueOnce({ ok: false, error: 'The product couldn’t be saved. Try again in a moment.' }).mockResolvedValueOnce({ ok: true, id: 'l1' });
    renderEditor(existing());
    fireEvent.click(saveButtons()[0]!);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('The product couldn’t be saved.'));
    fireEvent.click(saveButtons()[0]!);
    await waitFor(() => expect(push).toHaveBeenCalledWith('/manage/products?saved=Fig%20Candle'));
  });
  it('groups the status choices under a name', () => {
    renderEditor(existing());
    expect(screen.getByRole('group', { name: 'Status' })).toContainElement(screen.getByLabelText('Live on your shop'));
  });
  it('keeps the notice regions in the page and moves focus to a new error', () => {
    renderEditor(emptyProductForm());
    expect(screen.getByRole('alert')).toHaveTextContent('');
    expect(screen.getByRole('status')).toHaveTextContent('');
    fireEvent.click(saveButtons()[0]!);
    expect(screen.getByRole('alert').parentElement).toHaveFocus();
    const first = screen.getByText('Give the product a name.');
    fireEvent.click(saveButtons()[0]!);
    expect(screen.getByText('Give the product a name.')).not.toBe(first); // a fresh node, so it is announced again
  });
  it('asks for a save before duplicating unsaved changes', () => {
    renderEditor(existing());
    expect(screen.queryByText('Save your changes first')).toBeNull();
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Fig Candle, large' } });
    expect(screen.getByRole('button', { name: 'Duplicate' })).toBeDisabled();
    expect(screen.getByText('Save your changes first')).toBeInTheDocument();
  });
});

describe('ProductEditor — home page', () => {
  const FULL = 'Your home page already shows 5 products. Untick one to add this one.';
  it('puts the product on the home page with the save', async () => {
    saveProduct.mockResolvedValue({ ok: true, id: 'l1' });
    renderEditor(existing(), false, 4);
    const box = screen.getByLabelText('Show on your home page');
    // In the first section, right after the name, so it's seen without scrolling.
    expect(screen.getByRole('region', { name: 'The basics' })).toContainElement(box);
    const name = screen.getByLabelText('Name');
    const short = screen.getByLabelText('Short description');
    expect(name.compareDocumentPosition(box) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(box.compareDocumentPosition(short) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(box).not.toBeChecked();
    fireEvent.click(box);
    fireEvent.click(saveButtons()[0]!);
    await waitFor(() => expect(saveProduct).toHaveBeenCalledWith(expect.objectContaining({ onHome: true })));
    expect(screen.queryByText(FULL)).toBeNull();
  });
  it('can’t add a sixth product, and says why', () => {
    renderEditor(existing(), false, 5);
    const box = screen.getByLabelText('Show on your home page');
    expect(box).toBeDisabled();
    expect(box).toHaveAccessibleDescription(FULL);
  });
  it('can always take a product that is on the home page off it', () => {
    renderEditor(existing({ onHome: true }), false, 5);
    const box = screen.getByLabelText('Show on your home page');
    expect(box).toBeChecked();
    expect(box).toBeEnabled();
    expect(screen.queryByText(FULL)).toBeNull();
    fireEvent.click(box);
    expect(box).not.toBeChecked();
  });
  it('stays on the page with the message when the home page is full after all', async () => {
    saveProduct.mockResolvedValue({ ok: false, error: 'Your home page shows up to 5 products. Untick one of the others first.' });
    renderEditor(existing(), false, 4);
    fireEvent.click(screen.getByLabelText('Show on your home page'));
    fireEvent.click(saveButtons()[0]!);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Your home page shows up to 5 products.'));
    expect(push).not.toHaveBeenCalled();
  });
});

describe('ProductEditor — sample photo', () => {
  it('shows the shop’s sample photo for a product with no real photos', () => {
    renderEditor(existing({ samplePhotoUrl: 'https://stock/fig.jpg' }));
    expect(screen.getByRole('img', { name: 'Sample photo' })).toHaveAttribute('src', 'https://stock/fig.jpg');
    expect(screen.getByText('Your shop is showing this sample photo. Add your own photos to replace it.')).toBeInTheDocument();
  });
});

describe('ProductEditor — new arrival', () => {
  it('offers the tick only on sites with new arrivals, and saves it', async () => {
    saveProduct.mockResolvedValue({ ok: true, id: 'l1' });
    const { unmount } = renderEditor(existing());
    expect(screen.queryByLabelText('New arrival')).toBeNull();
    unmount();
    render(<ProductEditor initial={existing()} collections={collections} digital={false} newArrivals shopUrl="https://shop.bohdiai.com" homeCount={0} />);
    fireEvent.click(screen.getByLabelText('New arrival'));
    fireEvent.click(saveButtons()[0]!);
    await waitFor(() => expect(saveProduct).toHaveBeenCalledWith(expect.objectContaining({ isNew: true })));
  });
});
