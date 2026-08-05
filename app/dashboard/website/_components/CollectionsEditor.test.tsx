import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CollectionsEditor, { type EditorCollection, type CollectionProduct } from './CollectionsEditor';

const PRODUCTS: CollectionProduct[] = [
  { id: 'l1', name: 'Seeded Sourdough', imageUrl: null },
  { id: 'l2', name: 'Cinnamon Roll', imageUrl: null },
];

function setup(opts: { initial?: EditorCollection[]; products?: CollectionProduct[] } = {}) {
  const onSave = vi.fn().mockResolvedValue({ ok: true, id: 'c1' });
  const onUpdate = vi.fn().mockResolvedValue({ ok: true });
  const onRemove = vi.fn().mockResolvedValue({ ok: true });
  const onResolved = vi.fn();
  const onChanged = vi.fn();
  render(
    <CollectionsEditor
      initialCollections={opts.initial ?? []}
      availableProducts={opts.products ?? PRODUCTS}
      onSave={onSave}
      onUpdate={onUpdate}
      onRemove={onRemove}
      onResolved={onResolved}
      onChanged={onChanged}
    />,
  );
  return { onSave, onUpdate, onRemove, onResolved, onChanged };
}

describe('CollectionsEditor', () => {
  it('tells the maker to add products first when there are none', () => {
    setup({ products: [] });
    expect(screen.getByText(/Add your products first/)).toBeInTheDocument();
  });

  it('keeps Add disabled until a name and at least one product are chosen', () => {
    setup();
    const add = screen.getByRole('button', { name: 'Add this collection' });
    expect(add).toBeDisabled();
    expect(screen.getByText(/Add a name and at least one product/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Collection name'), { target: { value: 'Weekend Bakes' } });
    expect(add).toBeDisabled(); // still no product
    fireEvent.click(screen.getByLabelText('Cinnamon Roll'));
    expect(add).toBeEnabled();
  });

  it('saving a collection appends it and resolves the step', async () => {
    const { onSave, onResolved, onChanged } = setup();
    fireEvent.change(screen.getByLabelText('Collection name'), { target: { value: 'Weekend Bakes' } });
    fireEvent.click(screen.getByLabelText('Seeded Sourdough'));
    fireEvent.click(screen.getByRole('button', { name: 'Add this collection' }));
    await vi.waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave.mock.calls[0]![0]).toMatchObject({ name: 'Weekend Bakes', productIds: ['l1'] });
    await vi.waitFor(() => expect(screen.getByText('Weekend Bakes')).toBeInTheDocument());
    expect(onResolved).toHaveBeenCalledWith(true);
    expect(onChanged).toHaveBeenCalled();
  });

  it('removing a collection drops it and reports resolution by remaining count', async () => {
    const { onRemove, onResolved } = setup({
      initial: [{ id: 'c1', name: 'Weekend Bakes', description: '', productIds: ['l1'] }],
    });
    expect(screen.getByText('Weekend Bakes')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    await vi.waitFor(() => expect(onRemove).toHaveBeenCalledWith('c1'));
    await vi.waitFor(() => expect(screen.queryByText('Weekend Bakes')).not.toBeInTheDocument());
    expect(onResolved).toHaveBeenCalledWith(false);
  });
});
