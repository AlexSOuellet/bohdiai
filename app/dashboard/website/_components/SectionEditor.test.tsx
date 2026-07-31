import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

const editContent = vi.fn();
const setFieldValues = vi.fn();
vi.mock('../actions', () => ({
  editContent: (...a: unknown[]) => editContent(...a),
  setFieldValues: (...a: unknown[]) => setFieldValues(...a),
}));

import SectionEditor from './SectionEditor';
import { WALKTHROUGH_STEPS } from '@/lib/editor/walkthrough';

const hero = WALKTHROUGH_STEPS.find((s) => s.section === 'hero')!;

beforeEach(() => {
  editContent.mockReset();
  setFieldValues.mockReset();
  cleanup();
});

function renderHero(wrote = false) {
  const onWrote = vi.fn();
  const onChanged = vi.fn();
  render(
    <SectionEditor
      section="hero"
      fieldIds={hero.fieldIds}
      values={{}}
      wrote={wrote}
      onWrote={onWrote}
      onChanged={onChanged}
    />,
  );
  return { onWrote, onChanged };
}

describe('SectionEditor', () => {
  it('renders the section lead and Ask Bohdi as the primary button', () => {
    renderHero();
    expect(screen.getByText('Your welcome')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ask Bohdi to write it' })).toBeInTheDocument();
  });

  it('typing + Ask Bohdi calls editContent with the field ids + section, and reports up', async () => {
    editContent.mockResolvedValue({ ok: true });
    const { onWrote, onChanged } = renderHero();
    fireEvent.change(screen.getByPlaceholderText(/hand-poured/i), { target: { value: 'calm and witchy' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ask Bohdi to write it' }));
    await vi.waitFor(() => expect(editContent).toHaveBeenCalledWith(hero.fieldIds, 'calm and witchy', 'hero'));
    expect(onWrote).toHaveBeenCalled();
    expect(onChanged).toHaveBeenCalled();
  });

  it('"write it myself" reveals the fields and saves verbatim via setFieldValues', async () => {
    setFieldValues.mockResolvedValue({ ok: true });
    const { onWrote } = renderHero();
    fireEvent.click(screen.getByText(/write it myself/i));
    expect(screen.getByText('Hero eyebrow')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Save my words'));
    await vi.waitFor(() => expect(setFieldValues).toHaveBeenCalled());
    expect(setFieldValues.mock.calls[0]![1]).toBe('hero');
    expect(editContent).not.toHaveBeenCalled();
    expect(onWrote).toHaveBeenCalled();
  });

  it('once wrote, shows the confirmation and offers another take', () => {
    renderHero(true);
    expect(screen.getByText(/There it is/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try another take' })).toBeInTheDocument();
  });
});
