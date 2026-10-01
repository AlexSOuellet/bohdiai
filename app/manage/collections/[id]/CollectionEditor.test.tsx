import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { ProductRowView } from '@/lib/backend/catalog/queries';

const { saveCollection, refresh } = vi.hoisted(() => ({ saveCollection: vi.fn(), refresh: vi.fn() }));
vi.mock('@/lib/backend/catalog/actions', () => ({ saveCollection }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }), unstable_rethrow: vi.fn() }));

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
  it('adds, orders and removes products, then saves', async () => {
    saveCollection.mockResolvedValue({ ok: true, id: 'c1' });
    render(<CollectionEditor initial={initial} products={products} />);
    fireEvent.click(screen.getByRole('button', { name: 'Pine Soap' }));
    fireEvent.click(screen.getByRole('button', { name: 'Move Pine Soap up' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(saveCollection).toHaveBeenCalledWith(expect.objectContaining({ productIds: ['l2', 'l1'] })));
    expect(await screen.findByRole('status')).toHaveTextContent('Saved.');
    fireEvent.click(screen.getByRole('button', { name: 'Remove Fig Candle from this collection' }));
    expect(screen.queryByRole('button', { name: 'Move Fig Candle up' })).toBeNull();
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
    expect(await screen.findByRole('alert')).toHaveTextContent('Give the collection a name.');
    expect(saveCollection).not.toHaveBeenCalled();
  });
  it('shows the server’s message, and a message when saving throws', async () => {
    saveCollection.mockResolvedValueOnce({ ok: false, error: 'That name is taken.' }).mockRejectedValueOnce(new Error('network'));
    render(<CollectionEditor initial={initial} products={products} />);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('That name is taken.');
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong.'));
  });
  it('archives after a second confirmation', async () => {
    saveCollection.mockResolvedValue({ ok: true, id: 'c1' });
    render(<CollectionEditor initial={{ ...initial, status: 'active' }} products={products} />);
    fireEvent.click(screen.getByRole('button', { name: 'Archive' }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes, archive it' }));
    await waitFor(() => expect(saveCollection).toHaveBeenCalledWith(expect.objectContaining({ status: 'archived' })));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Archive' })).toBeNull());
  });
});
