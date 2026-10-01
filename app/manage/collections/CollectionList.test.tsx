import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const { createCollection, orderCollections, push } = vi.hoisted(() => ({ createCollection: vi.fn(), orderCollections: vi.fn(), push: vi.fn() }));
vi.mock('@/lib/backend/catalog/actions', () => ({ createCollection, orderCollections }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }), unstable_rethrow: vi.fn() }));

import { CollectionList } from './CollectionList';

const list = [
  { id: 'c1', name: 'Autumn', status: 'active' as const, productCount: 3 },
  { id: 'c2', name: 'Gifts', status: 'draft' as const, productCount: 1 },
];

beforeEach(() => {
  vi.clearAllMocks();
  Element.prototype.scrollIntoView = vi.fn(); // jsdom has no layout
});

describe('CollectionList', () => {
  it('lists collections with counts, status and an edit link', () => {
    render(<CollectionList collections={list} />);
    expect(screen.getByText('3 products')).toBeInTheDocument();
    expect(screen.getByText('1 product')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Edit Autumn' })).toHaveAttribute('href', '/manage/collections/c1');
  });
  it('adds a collection and opens it', async () => {
    createCollection.mockResolvedValue({ ok: true, id: 'c3' });
    render(<CollectionList collections={list} />);
    fireEvent.change(screen.getByLabelText('New collection name'), { target: { value: 'Spring' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add collection' }));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/manage/collections/c3'));
  });
  it('shows why a collection couldn’t be added', async () => {
    createCollection.mockResolvedValue({ ok: false, error: 'Give the collection a name.' });
    render(<CollectionList collections={list} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add collection' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Give the collection a name.');
  });
  it('shows a message when adding throws', async () => {
    createCollection.mockRejectedValue(new Error('network'));
    render(<CollectionList collections={list} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add collection' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong.');
  });
  it('moves a collection and saves the order, putting it back if saving fails', async () => {
    orderCollections.mockResolvedValueOnce({ ok: true }).mockResolvedValueOnce({ ok: false, error: 'The new order couldn’t be saved. Try again.' });
    render(<CollectionList collections={list} />);
    fireEvent.click(screen.getByRole('button', { name: 'Move Gifts up' }));
    await waitFor(() => expect(orderCollections).toHaveBeenCalledWith(['c2', 'c1']));
    fireEvent.click(screen.getByRole('button', { name: 'Move Gifts down' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('The new order couldn’t be saved. Try again.');
    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent('Gifts');
  });
  it('puts the order back when saving it throws', async () => {
    orderCollections.mockRejectedValue(new Error('network'));
    render(<CollectionList collections={list} />);
    fireEvent.click(screen.getByRole('button', { name: 'Move Gifts up' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong.');
    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent('Autumn');
  });
  it('says when there are none yet', () => {
    render(<CollectionList collections={[]} />);
    expect(screen.getByText('No collections yet. Collections group products on your shop, like “Autumn” or “Gifts under $30”.')).toBeInTheDocument();
  });
});
