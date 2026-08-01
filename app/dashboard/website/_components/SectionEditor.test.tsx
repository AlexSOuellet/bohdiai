import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const converseSection = vi.fn();
const writeSectionFromConversation = vi.fn();
const setFieldValues = vi.fn();
const keepSection = vi.fn();
const toggleSection = vi.fn();
vi.mock('../actions', () => ({
  converseSection: (...a: unknown[]) => converseSection(...a),
  writeSectionFromConversation: (...a: unknown[]) => writeSectionFromConversation(...a),
  setFieldValues: (...a: unknown[]) => setFieldValues(...a),
  keepSection: (...a: unknown[]) => keepSection(...a),
  toggleSection: (...a: unknown[]) => toggleSection(...a),
}));

import SectionEditor from './SectionEditor';
import { WALKTHROUGH_STEPS } from '@/lib/editor/walkthrough';

const step = (section: string) => WALKTHROUGH_STEPS.find((s) => s.section === section)!;

beforeEach(() => {
  [converseSection, writeSectionFromConversation, setFieldValues, keepSection, toggleSection].forEach((m) =>
    m.mockReset(),
  );
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
      onResolved={onResolved}
      onChanged={onChanged}
    />,
  );
  return { onResolved, onChanged, unmount };
}

describe('SectionEditor — conversation', () => {
  it('opens with the section title and Bohdi reacting to what he built', () => {
    renderSection('hero');
    expect(screen.getByText('Your opening')).toBeInTheDocument();
    expect(screen.getByText(/first thing anyone sees/i)).toBeInTheDocument();
  });

  it('sending a reply appends the maker turn and Bohdi’s follow-up', async () => {
    converseSection.mockResolvedValue({ ok: true, turn: { action: 'ask', message: 'And who is it for?' } });
    renderSection('hero');
    fireEvent.change(screen.getByPlaceholderText(/tell me what you think/i), {
      target: { value: 'It should feel calm and a little witchy' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(await screen.findByText('And who is it for?')).toBeInTheDocument();
    expect(screen.getByText('It should feel calm and a little witchy')).toBeInTheDocument();
    // the whole conversation (opener + maker reply) goes to the action
    const convo = converseSection.mock.calls[0]![1] as { speaker: string; text: string }[];
    expect(convo[convo.length - 1]).toEqual({ speaker: 'maker', text: 'It should feel calm and a little witchy' });
  });

  it('once the maker has spoken, Write it up sends the conversation to the writer, resolves, and refreshes', async () => {
    converseSection.mockResolvedValue({ ok: true, turn: { action: 'ready', message: 'Got it — want me to write it?' } });
    writeSectionFromConversation.mockResolvedValue({ ok: true });
    const { onResolved, onChanged } = renderSection('hero');
    fireEvent.change(screen.getByPlaceholderText(/tell me what you think/i), { target: { value: 'calm and witchy' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    // wait for Bohdi's turn to land (the button is disabled while he's thinking)
    await screen.findByText('Got it — want me to write it?');
    fireEvent.click(screen.getByRole('button', { name: 'Write it up' }));
    await screen.findByText(/There it is/);
    expect(writeSectionFromConversation).toHaveBeenCalledWith('hero', expect.any(Array));
    expect(onResolved).toHaveBeenCalledWith(true);
    expect(onChanged).toHaveBeenCalled();
  });

  it('does not offer Write it up before the maker has said anything', () => {
    renderSection('hero');
    expect(screen.queryByRole('button', { name: /Write it up/ })).not.toBeInTheDocument();
  });

  it('"write it myself" reveals the fields and saves verbatim via setFieldValues', async () => {
    setFieldValues.mockResolvedValue({ ok: true });
    const { onResolved } = renderSection('hero');
    fireEvent.click(screen.getByText(/write it myself/i));
    expect(screen.getByText('Hero eyebrow')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Save my words'));
    await vi.waitFor(() => expect(setFieldValues).toHaveBeenCalled());
    expect(setFieldValues.mock.calls[0]![1]).toBe('hero');
    expect(writeSectionFromConversation).not.toHaveBeenCalled();
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
