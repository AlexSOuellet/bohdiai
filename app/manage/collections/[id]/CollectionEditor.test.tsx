import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { ProductRowView } from '@/lib/backend/catalog/queries';

const { saveCollection, push } = vi.hoisted(() => ({ saveCollection: vi.fn(), push: vi.fn() }));
vi.mock('@/lib/backend/catalog/actions', () => ({ saveCollection }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }), unstable_rethrow: vi.fn() }));

import { CollectionEditor } from './CollectionEditor';

const product = (id: string, name: string, photo: string | null = null): ProductRowView => ({
  id, name, status: 'active', priceLabel: '$1', stockLabel: '', soldOut: false, photoUrl: photo === null ? null : `https://x/${photo}.webp`, photoUploadId: photo, collectionIds: [],
});
const products = [product('l1', 'Fig Candle', 'u1'), product('l2', 'Pine Soap', 'u2'), product('l3', 'Mug')];
const initial = { id: 'c1', name: 'Autumn', description: '', status: 'draft' as const, featuredImageId: null, productIds: ['l1'] };

beforeEach(() => {
  vi.clearAllMocks();
  Element.prototype.scrollIntoView = vi.fn(); // jsdom has no layout
});

describe('CollectionEditor', () => {
  it('adds, orders and removes products, then saves and returns to the list', async () => {
    saveCollection.mockResolvedValue({ ok: true, id: 'c1' });
    render(<CollectionEditor initial={initial} products={products} />);
    fireEvent.click(screen.getByRole('button', { name: 'Pine Soap' }));
    fireEvent.click(screen.getByRole('button', { name: /Mug$/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Move Pine Soap up' }));
    fireEvent.click(screen.getByRole('button', { name: 'Remove Mug from this collection' }));
    expect(screen.queryByRole('button', { name: 'Move Mug up' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(saveCollection).toHaveBeenCalledWith(expect.objectContaining({ productIds: ['l2', 'l1'] })));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/manage/collections?saved=Autumn'));
  });
  it('puts the saved name, trimmed and encoded, in the list address', async () => {
    saveCollection.mockResolvedValue({ ok: true, id: 'c1' });
    render(<CollectionEditor initial={{ ...initial, name: ' Gifts & more ' }} products={products} />);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/manage/collections?saved=Gifts%20%26%20more'));
  });
  it('chooses a cover from the products’ photos, or the automatic one', async () => {
    saveCollection.mockResolvedValue({ ok: true, id: 'c1' });
    render(<CollectionEditor initial={initial} products={products} />);
    expect(screen.getByLabelText('First product’s photo (automatic)')).toBeChecked();
    fireEvent.click(screen.getByLabelText('Fig Candle’s photo'));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(saveCollection).toHaveBeenCalledWith(expect.objectContaining({ featuredImageId: 'u1' })));
  });
  it('shows the validation message without saving', async () => {
    render(<CollectionEditor initial={{ ...initial, name: '' }} products={products} />);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Give the collection a name.'));
    expect(saveCollection).not.toHaveBeenCalled();
  });
  it('shows the server’s message, and a message when saving throws', async () => {
    saveCollection.mockResolvedValueOnce({ ok: false, error: 'That name is taken.' }).mockRejectedValueOnce(new Error('network'));
    render(<CollectionEditor initial={initial} products={products} />);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('That name is taken.'));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong.'));
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
  });
  it('archives after a second confirmation', async () => {
    saveCollection.mockResolvedValue({ ok: true, id: 'c1' });
    render(<CollectionEditor initial={{ ...initial, status: 'active' }} products={products} />);
    fireEvent.click(screen.getByRole('button', { name: 'Archive' }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes, archive it' }));
    await waitFor(() => expect(saveCollection).toHaveBeenCalledWith(expect.objectContaining({ status: 'archived' })));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/manage/collections?archived=Autumn'));
  });
  it('stays on the page with the message when an archive fails', async () => {
    saveCollection.mockResolvedValue({ ok: false, error: 'The collection couldn’t be saved. Try again in a moment.' });
    render(<CollectionEditor initial={{ ...initial, status: 'active' }} products={products} />);
    fireEvent.click(screen.getByRole('button', { name: 'Archive' }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes, archive it' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('The collection couldn’t be saved.'));
    expect(push).not.toHaveBeenCalled();
  });
  it('asks for a save before archiving unsaved changes, so they are never dropped', () => {
    render(<CollectionEditor initial={{ ...initial, status: 'active' }} products={products} />);
    expect(screen.queryByText('Save your changes first')).toBeNull();
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Autumn gifts' } });
    expect(screen.getByRole('button', { name: 'Archive' })).toBeDisabled();
    expect(screen.getByText('Save your changes first')).toBeInTheDocument();
  });
  it('goes back to the automatic cover when the product with the chosen photo is removed', () => {
    render(<CollectionEditor initial={{ ...initial, productIds: ['l1', 'l2'] }} products={products} />);
    fireEvent.click(screen.getByLabelText('Fig Candle’s photo'));
    fireEvent.click(screen.getByRole('button', { name: 'Remove Pine Soap from this collection' }));
    expect(screen.getByLabelText('Fig Candle’s photo')).toBeChecked(); // another product's removal leaves it
    fireEvent.click(screen.getByRole('button', { name: 'Remove Fig Candle from this collection' }));
    expect(screen.getByLabelText('First product’s photo (automatic)')).toBeChecked();
    expect(screen.queryByText('The cover photo chosen before')).toBeNull();
  });
  it('stays busy while returning to the list, so a second click saves nothing twice', async () => {
    saveCollection.mockResolvedValue({ ok: true, id: 'c1' });
    render(<CollectionEditor initial={{ ...initial, status: 'active' }} products={products} />);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/manage/collections?saved=Autumn'));
    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Archive' })).toBeDisabled();
  });
  it('cannot archive while a save is in flight', () => {
    saveCollection.mockReturnValue(new Promise(() => undefined));
    render(<CollectionEditor initial={{ ...initial, status: 'active' }} products={products} />);
    fireEvent.click(screen.getByRole('button', { name: 'Archive' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('button', { name: 'Yes, archive it' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Yes, archive it' }));
    expect(saveCollection).toHaveBeenCalledTimes(1);
  });
  it('groups the cover and status choices under names', () => {
    render(<CollectionEditor initial={initial} products={products} />);
    expect(screen.getByRole('group', { name: 'Status' })).toContainElement(screen.getByLabelText('Live on your shop'));
    expect(screen.getByRole('group', { name: 'Cover photo' })).toContainElement(screen.getByLabelText('First product’s photo (automatic)'));
  });
});
