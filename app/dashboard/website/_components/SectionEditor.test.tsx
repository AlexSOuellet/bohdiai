import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const editContent = vi.fn();
const setFieldValues = vi.fn();
const keepSection = vi.fn();
const toggleSection = vi.fn();
vi.mock('../actions', () => ({
  editContent: (...a: unknown[]) => editContent(...a),
  setFieldValues: (...a: unknown[]) => setFieldValues(...a),
  keepSection: (...a: unknown[]) => keepSection(...a),
  toggleSection: (...a: unknown[]) => toggleSection(...a),
}));

import SectionEditor from './SectionEditor';
import { WALKTHROUGH_STEPS } from '@/lib/editor/walkthrough';

const step = (section: string) => WALKTHROUGH_STEPS.find((s) => s.section === section)!;

beforeEach(() => {
  [editContent, setFieldValues, keepSection, toggleSection].forEach((m) => m.mockReset());
});

function renderSection(section: string) {
  const s = step(section);
  const onResolved = vi.fn();
  const onChanged = vi.fn();
  const { unmount } = render(
    <SectionEditor
      section={s.section}
      cls={s.cls}
      keepable={s.keepable}
      fieldIds={s.fieldIds}
      values={{}}
      questions={s.questions}
      onResolved={onResolved}
      onChanged={onChanged}
    />,
  );
  return { onResolved, onChanged, unmount };
}

describe('SectionEditor', () => {
  it('renders the section lead and Ask Bohdi as the primary button', () => {
    renderSection('hero');
    expect(screen.getByText('Your welcome')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ask Bohdi to write it' })).toBeInTheDocument();
  });

  it('typing + Ask Bohdi calls editContent, resolves, refreshes, and confirms', async () => {
    editContent.mockResolvedValue({ ok: true });
    const { onResolved, onChanged } = renderSection('hero');
    fireEvent.change(screen.getByPlaceholderText(/hand-poured/i), { target: { value: 'calm and witchy' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ask Bohdi to write it' }));
    await screen.findByText(/There it is/);
    expect(editContent).toHaveBeenCalledWith(step('hero').fieldIds, 'calm and witchy', 'hero');
    expect(onResolved).toHaveBeenCalledWith(true);
    expect(onChanged).toHaveBeenCalled();
  });

  it('"write it myself" reveals the fields and saves verbatim via setFieldValues', async () => {
    setFieldValues.mockResolvedValue({ ok: true });
    const { onResolved } = renderSection('hero');
    fireEvent.click(screen.getByText(/write it myself/i));
    expect(screen.getByText('Hero eyebrow')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Save my words'));
    await vi.waitFor(() => expect(setFieldValues).toHaveBeenCalled());
    expect(setFieldValues.mock.calls[0]![1]).toBe('hero');
    expect(editContent).not.toHaveBeenCalled();
    expect(onResolved).toHaveBeenCalledWith(true);
  });

  it('a keep-or-change section offers Keep as built but not Turn it off', () => {
    renderSection('hero');
    expect(screen.getByRole('button', { name: 'Keep as built' })).toBeInTheDocument();
    expect(screen.queryByText('Turn it off')).not.toBeInTheDocument();
  });

  it('Keep as built calls keepSection and resolves', async () => {
    keepSection.mockResolvedValue({ ok: true });
    const { onResolved } = renderSection('hero');
    fireEvent.click(screen.getByRole('button', { name: 'Keep as built' }));
    await vi.waitFor(() => expect(keepSection).toHaveBeenCalledWith('hero'));
    expect(onResolved).toHaveBeenCalledWith(true);
    expect(await screen.findByText(/Kept/)).toBeInTheDocument();
  });

  it('an optional keepable section offers both Keep as built and Turn it off', () => {
    renderSection('collections');
    expect(screen.getByRole('button', { name: 'Keep as built' })).toBeInTheDocument();
    expect(screen.getByText('Turn it off')).toBeInTheDocument();
  });

  it('reviews (optional, not keepable) offers Turn it off but not Keep as built', () => {
    renderSection('reviews');
    expect(screen.queryByRole('button', { name: 'Keep as built' })).not.toBeInTheDocument();
    expect(screen.getByText('Turn it off')).toBeInTheDocument();
  });

  it('Turn it off hides the section and resolves; it can be turned back on', async () => {
    toggleSection.mockResolvedValue({ ok: true });
    const { onResolved } = renderSection('collections');
    fireEvent.click(screen.getByText('Turn it off'));
    await vi.waitFor(() => expect(toggleSection).toHaveBeenCalledWith('collections', true));
    expect(onResolved).toHaveBeenCalledWith(true);
    fireEvent.click(await screen.findByText('Turn it back on'));
    await vi.waitFor(() => expect(toggleSection).toHaveBeenCalledWith('collections', false));
    expect(onResolved).toHaveBeenLastCalledWith(false);
  });

  it('a must-change section offers neither keep nor turn-off', () => {
    renderSection('goods');
    expect(screen.queryByRole('button', { name: 'Keep as built' })).not.toBeInTheDocument();
    expect(screen.queryByText('Turn it off')).not.toBeInTheDocument();
  });
});
