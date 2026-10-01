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
    expect(screen.getByRole('button', { name: 'Add collection' })).toBeDisabled(); // no second copy while it opens
  });
  it('shows why a collection couldn’t be added', async () => {
    createCollection.mockResolvedValue({ ok: false, error: 'Give the collection a name.' });
    render(<CollectionList collections={list} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add collection' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Give the collection a name.'));
  });
  it('shows a message when adding throws', async () => {
    createCollection.mockRejectedValue(new Error('network'));
    render(<CollectionList collections={list} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add collection' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong.'));
  });
  it('moves a collection and saves the order, putting it back if saving fails', async () => {
    orderCollections.mockResolvedValueOnce({ ok: true }).mockResolvedValueOnce({ ok: false, error: 'The new order couldn’t be saved. Try again.' });
    render(<CollectionList collections={list} />);
    fireEvent.click(screen.getByRole('button', { name: 'Move Gifts up' }));
    await waitFor(() => expect(orderCollections).toHaveBeenCalledWith(['c2', 'c1']));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Move Gifts down' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Move Gifts down' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('The new order couldn’t be saved. Try again.'));
    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent('Gifts');
  });
  it('holds the move buttons while an order is saving, so a failure can’t undo a later move', async () => {
    let finish: (v: { ok: true }) => void = () => {};
    orderCollections.mockReturnValueOnce(new Promise((resolve) => { finish = resolve; }));
    render(<CollectionList collections={list} />);
    fireEvent.click(screen.getByRole('button', { name: 'Move Gifts up' }));
    expect(screen.getByRole('button', { name: 'Move Gifts down' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Move Autumn up' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Move Gifts down' }));
    expect(orderCollections).toHaveBeenCalledTimes(1);
    finish({ ok: true });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Move Gifts down' })).toBeEnabled());
    expect(screen.getByRole('button', { name: 'Move Gifts up' })).toBeDisabled(); // first in line now
  });
  it('puts the order back when saving it throws', async () => {
    orderCollections.mockRejectedValue(new Error('network'));
    render(<CollectionList collections={list} />);
    fireEvent.click(screen.getByRole('button', { name: 'Move Gifts up' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong.'));
    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent('Autumn');
  });
  it('says when there are none yet', () => {
    render(<CollectionList collections={[]} />);
    expect(screen.getByText('No collections yet. Collections group products on your shop, like “Autumn” or “Gifts under $30”.')).toBeInTheDocument();
  });
});
