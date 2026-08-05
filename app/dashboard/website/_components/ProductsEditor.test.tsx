import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ProductsEditor, { type EditorProduct } from './ProductsEditor';

function setup(opts: { initial?: EditorProduct[] } = {}) {
  const onUpload = vi.fn().mockResolvedValue({ ok: true, uploadId: 'up1', url: 'https://x/p.jpg' });
  const onSave = vi.fn().mockResolvedValue({ ok: true, id: 'l1' });
  const onUpdate = vi.fn().mockResolvedValue({ ok: true });
  const onRemove = vi.fn().mockResolvedValue({ ok: true });
  const onDraftCopy = vi.fn().mockResolvedValue({ ok: true, copy: { shortDescription: 'Hand-poured', description: 'A calming candle.' } });
  const onResolved = vi.fn();
  const onChanged = vi.fn();
  render(
    <ProductsEditor
      initialProducts={opts.initial ?? []}
      onUpload={onUpload}
      onSave={onSave}
      onUpdate={onUpdate}
      onRemove={onRemove}
      onDraftCopy={onDraftCopy}
      onResolved={onResolved}
      onChanged={onChanged}
    />,
  );
  return { onUpload, onSave, onUpdate, onRemove, onDraftCopy, onResolved, onChanged };
}

const pngFile = () => new File(['x'], 'candle.png', { type: 'image/png' });

describe('ProductsEditor', () => {
  it('shows the add form and an empty list on a fresh walk', () => {
    setup();
    expect(screen.getByText('Add a product')).toBeInTheDocument();
    expect(screen.getByLabelText('Product name')).toBeInTheDocument();
  });

  it('explains what is still missing while Save is disabled', async () => {
    setup();
    expect(screen.getByText(/Add a name, a price, a photo to save/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Product name'), { target: { value: 'Amber' } });
    // name filled → only price + photo remain in the hint
    expect(screen.getByText(/Add a price, a photo to save/)).toBeInTheDocument();
  });

  it('keeps Add disabled until name, price, and a photo are all present', async () => {
    const { onUpload } = setup();
    const addBtn = screen.getByRole('button', { name: 'Add this product' });
    expect(addBtn).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Product name'), { target: { value: 'Amber' } });
    fireEvent.change(screen.getByLabelText('Price'), { target: { value: '$24' } });
    expect(addBtn).toBeDisabled(); // still no photo

    fireEvent.change(screen.getByLabelText('Photo'), { target: { files: [pngFile()] } });
    await vi.waitFor(() => expect(onUpload).toHaveBeenCalled());
    await vi.waitFor(() => expect(addBtn).toBeEnabled());
  });

  it('saving a product appends it to the list and resolves the step', async () => {
    const { onSave, onResolved, onChanged, onUpload } = setup();
    fireEvent.change(screen.getByLabelText('Product name'), { target: { value: 'Amber' } });
    fireEvent.change(screen.getByLabelText('Price'), { target: { value: '$24' } });
    fireEvent.change(screen.getByLabelText('Photo'), { target: { files: [pngFile()] } });
    await vi.waitFor(() => expect(onUpload).toHaveBeenCalled());
    const addBtn = screen.getByRole('button', { name: 'Add this product' });
    await vi.waitFor(() => expect(addBtn).toBeEnabled());

    fireEvent.click(addBtn);
    await vi.waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave.mock.calls[0]![0]).toMatchObject({ name: 'Amber', price: '$24', uploadId: 'up1' });
    await vi.waitFor(() => expect(screen.getByText('Amber')).toBeInTheDocument());
    expect(onResolved).toHaveBeenCalledWith(true);
    expect(onChanged).toHaveBeenCalled();
  });

  it('Ask Bohdi fills the word fields from the draft', async () => {
    const { onDraftCopy } = setup();
    fireEvent.change(screen.getByLabelText('Product name'), { target: { value: 'Amber' } });
    fireEvent.change(screen.getByLabelText('Tell Bohdi about it (optional)'), { target: { value: 'lavender' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ask Bohdi to write the words' }));
    await vi.waitFor(() => expect(onDraftCopy).toHaveBeenCalledWith('Amber', 'lavender'));
    await vi.waitFor(() => expect(screen.getByDisplayValue('Hand-poured')).toBeInTheDocument());
    expect(screen.getByDisplayValue('A calming candle.')).toBeInTheDocument();
  });

  it('does not update the parent during render when adding a product (regression)', async () => {
    // Reproduces the real bug: onResolved triggers a parent setState. If ProductsEditor
    // calls it inside a setState updater (which runs during render), React logs
    // "Cannot update a component while rendering a different component".
    const errors: string[] = [];
    const spy = vi.spyOn(console, 'error').mockImplementation((...args) => {
      errors.push(args.map(String).join(' '));
    });
    const onUpload = vi.fn().mockResolvedValue({ ok: true, uploadId: 'up1', url: 'https://x/p.jpg' });
    const onSave = vi.fn().mockResolvedValue({ ok: true, id: 'l1' });
    function Host() {
      const [, setResolved] = useState(false);
      return (
        <ProductsEditor
          initialProducts={[]}
          onUpload={onUpload}
          onSave={onSave}
          onUpdate={vi.fn().mockResolvedValue({ ok: true })}
          onRemove={vi.fn().mockResolvedValue({ ok: true })}
          onDraftCopy={vi.fn()}
          onResolved={(r) => setResolved(r)}
          onChanged={vi.fn()}
        />
      );
    }
    render(<Host />);
    fireEvent.change(screen.getByLabelText('Product name'), { target: { value: 'Amber' } });
    fireEvent.change(screen.getByLabelText('Price'), { target: { value: '$24' } });
    fireEvent.change(screen.getByLabelText('Photo'), { target: { files: [pngFile()] } });
    const addBtn = screen.getByRole('button', { name: 'Add this product' });
    await vi.waitFor(() => expect(addBtn).toBeEnabled());
    fireEvent.click(addBtn);
    await vi.waitFor(() => expect(onSave).toHaveBeenCalled());
    await vi.waitFor(() => expect(screen.getByText('Amber')).toBeInTheDocument());
    expect(errors.join('\n')).not.toContain('while rendering a different component');
    spy.mockRestore();
  });

  it('removing a product drops it and reports resolution by remaining count', async () => {
    const { onRemove, onResolved } = setup({
      initial: [{ id: 'l1', name: 'Amber', price: '$24', shortDescription: '', description: '', imageUrl: null }],
    });
    expect(screen.getByText('Amber')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    await vi.waitFor(() => expect(onRemove).toHaveBeenCalledWith('l1'));
    await vi.waitFor(() => expect(screen.queryByText('Amber')).not.toBeInTheDocument());
    expect(onResolved).toHaveBeenCalledWith(false);
  });
});
