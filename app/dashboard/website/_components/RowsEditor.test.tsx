import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RowsEditor, { type RowColumn } from './RowsEditor';

const COLS: readonly RowColumn[] = [
  { key: 'quote', label: 'What they said', kind: 'textarea', required: true },
  { key: 'author', label: 'Who said it', kind: 'text', required: true },
  { key: 'location', label: 'Where', kind: 'text' },
];

type SaveFn = (rows: Record<string, string>[]) => Promise<{ ok: boolean; error?: string }>;

function renderEditor(opts: { initialRows?: Record<string, string>[]; onSave?: ReturnType<typeof vi.fn<SaveFn>> } = {}) {
  const onSave = opts.onSave ?? vi.fn<SaveFn>().mockResolvedValue({ ok: true });
  const onSaved = vi.fn();
  render(
    <RowsEditor
      columns={COLS}
      initialRows={opts.initialRows ?? []}
      addLabel="Add another review"
      saveLabel="Save my reviews"
      onSave={(rows) => onSave(rows)}
      onSaved={onSaved}
    />,
  );
  return { onSave, onSaved };
}

describe('RowsEditor', () => {
  it('starts with one blank row when seeded empty', () => {
    renderEditor();
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.queryByText('#2')).not.toBeInTheDocument();
  });

  it('“Add another” appends a row', () => {
    renderEditor();
    fireEvent.click(screen.getByRole('button', { name: /Add another review/ }));
    expect(screen.getByText('#2')).toBeInTheDocument();
  });

  it('removing the last remaining row leaves one blank row (never zero)', () => {
    renderEditor({ initialRows: [{ quote: 'q', author: 'a', location: '' }] });
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    // still one row, now blank
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('q')).not.toBeInTheDocument();
  });

  it('marks non-required columns with an (optional) hint', () => {
    renderEditor();
    expect(screen.getByText(/Where \(optional\)/)).toBeInTheDocument();
  });

  it('only complete (non-blank) rows are sent to onSave', async () => {
    const onSave = vi.fn<SaveFn>().mockResolvedValue({ ok: true });
    renderEditor({ onSave });
    // Row 1 complete
    fireEvent.change(screen.getByLabelText('What they said'), { target: { value: 'Great' } });
    fireEvent.change(screen.getByLabelText('Who said it'), { target: { value: 'Sam' } });
    // Row 2 added but left blank — should be dropped, not block the save
    fireEvent.click(screen.getByRole('button', { name: /Add another review/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Save my reviews' }));
    await vi.waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave.mock.calls[0]![0]).toEqual([{ quote: 'Great', author: 'Sam', location: '' }]);
  });
});
