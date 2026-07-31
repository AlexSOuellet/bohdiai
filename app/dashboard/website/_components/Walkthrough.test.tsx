import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

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

import Walkthrough from './Walkthrough';
import { WALKTHROUGH_STEPS } from '@/lib/editor/walkthrough';

beforeEach(() => {
  [editContent, setFieldValues, keepSection, toggleSection].forEach((m) => m.mockReset());
  cleanup();
});

function renderWalk() {
  const onChanged = vi.fn();
  const onExit = vi.fn();
  render(<Walkthrough values={{}} firstRun onChanged={onChanged} onExit={onExit} />);
  return { onChanged, onExit };
}

describe('Walkthrough', () => {
  it('opens on the first step (the welcome / hero) with step-1 progress', () => {
    renderWalk();
    expect(screen.getByText('Your welcome')).toBeInTheDocument();
    expect(screen.getByText(/Step 1 of/)).toBeInTheDocument();
  });

  it('Next is disabled until the section is resolved', () => {
    renderWalk();
    expect(screen.getByRole('button', { name: /Next/ })).toBeDisabled();
    expect(screen.getByText(/to continue/)).toBeInTheDocument();
  });

  it('keeping the section resolves it and lets Next advance to the story step', async () => {
    keepSection.mockResolvedValue({ ok: true });
    renderWalk();
    fireEvent.click(screen.getByRole('button', { name: 'Keep as built' }));
    await screen.findByText(/Kept/);
    fireEvent.click(screen.getByRole('button', { name: /Next/ }));
    expect(screen.getByText('Your story')).toBeInTheDocument();
    expect(screen.getByText(/Step 2 of/)).toBeInTheDocument();
    expect(screen.getByText(/How did this start/i)).toBeInTheDocument();
  });

  it('typing + Ask Bohdi calls editContent with the step field ids + section, and refreshes the preview', async () => {
    editContent.mockResolvedValue({ ok: true });
    const { onChanged } = renderWalk();
    fireEvent.change(screen.getByPlaceholderText(/hand-poured/i), { target: { value: 'calm and witchy' } });
    fireEvent.click(screen.getByText('Ask Bohdi to write it'));
    await screen.findByText(/There it is/);
    expect(editContent).toHaveBeenCalledWith(WALKTHROUGH_STEPS[0]!.fieldIds, 'calm and witchy', 'hero');
    expect(onChanged).toHaveBeenCalled();
    // an edit resolves the step, so Next advances
    fireEvent.click(screen.getByRole('button', { name: /Next/ }));
    expect(screen.getByText('Your story')).toBeInTheDocument();
  });

  it('"write it myself" reveals the fields and saves verbatim via setFieldValues', async () => {
    setFieldValues.mockResolvedValue({ ok: true });
    renderWalk();
    fireEvent.click(screen.getByText(/write it myself/i));
    expect(screen.getByText('Hero eyebrow')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Save my words'));
    await screen.findByText(/There it is/);
    expect(setFieldValues).toHaveBeenCalled();
    expect(setFieldValues.mock.calls[0]![1]).toBe('hero');
    expect(editContent).not.toHaveBeenCalled();
  });
});
