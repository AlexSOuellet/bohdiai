import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

const editContent = vi.fn();
const setFieldValues = vi.fn();
vi.mock('../actions', () => ({
  editContent: (...a: unknown[]) => editContent(...a),
  setFieldValues: (...a: unknown[]) => setFieldValues(...a),
}));

import Walkthrough from './Walkthrough';
import { WALKTHROUGH_STEPS } from '@/lib/editor/walkthrough';

beforeEach(() => {
  editContent.mockReset();
  setFieldValues.mockReset();
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

  it('the personal story step shows the targeted questions', () => {
    renderWalk();
    // advance to step 2 (story)
    fireEvent.click(screen.getByRole('button', { name: /^Next/ }));
    expect(screen.getByText('Your story')).toBeInTheDocument();
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
  });

  it('Keep it advances to the next step', async () => {
    editContent.mockResolvedValue({ ok: true });
    renderWalk();
    fireEvent.change(screen.getByPlaceholderText(/hand-poured/i), { target: { value: 'x' } });
    fireEvent.click(screen.getByText('Ask Bohdi to write it'));
    await screen.findByText(/There it is/);
    fireEvent.click(screen.getByRole('button', { name: /Keep it/ }));
    expect(screen.getByText('Your story')).toBeInTheDocument();
    expect(screen.getByText(/Step 2 of/)).toBeInTheDocument();
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
