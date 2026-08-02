import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

const converseSection = vi.fn();
const writeSectionFromConversation = vi.fn();
const setFieldValues = vi.fn();
const keepSection = vi.fn();
const toggleSection = vi.fn();
const setMomentPlayMode = vi.fn();
vi.mock('../actions', () => ({
  converseSection: (...a: unknown[]) => converseSection(...a),
  writeSectionFromConversation: (...a: unknown[]) => writeSectionFromConversation(...a),
  setFieldValues: (...a: unknown[]) => setFieldValues(...a),
  keepSection: (...a: unknown[]) => keepSection(...a),
  toggleSection: (...a: unknown[]) => toggleSection(...a),
  setMomentPlayMode: (...a: unknown[]) => setMomentPlayMode(...a),
}));

import MakeItYours from './MakeItYours';
import { walkUiSteps } from '@/lib/editor/walkthrough';

beforeEach(() => {
  [converseSection, writeSectionFromConversation, setFieldValues, keepSection, toggleSection, setMomentPlayMode].forEach(
    (m) => m.mockReset(),
  );
  cleanup();
});

/** A Cozy walk, so the list leads with the Moment step then the Hero step. */
function renderWalk() {
  render(
    <MakeItYours
      previewToken="tok-123"
      previewOrigin="https://ember.test"
      values={{}}
      steps={walkUiSteps('cozy')}
      momentPlayMode="once"
      moodLabel="Cozy"
    />,
  );
}

/** Get past the welcome screen into the first section. */
function start() {
  fireEvent.click(screen.getByRole('button', { name: /Let’s go/ }));
}

describe('MakeItYours (full-screen walk)', () => {
  it('opens on a welcome screen explaining the walk, then Let’s go starts it', () => {
    renderWalk();
    expect(screen.getByText(/Let’s make this store yours/)).toBeInTheDocument();
    expect(screen.getByText(/one section at a time/)).toBeInTheDocument();
    expect(screen.queryByText(/Step 1 of/)).not.toBeInTheDocument();
    start();
    expect(screen.getByText(/Step 1 of/)).toBeInTheDocument();
    // Cozy leads with the Moment step, with its plain play choices.
    expect(screen.getByText('Your opening moment')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Every time someone visits' })).toBeInTheDocument();
  });

  it('shows the gated full-screen shell with no exit', () => {
    renderWalk();
    start();
    expect(screen.getByText('Make it yours')).toBeInTheDocument();
    expect(screen.getByText('Finish to reach your editor')).toBeInTheDocument();
    expect(screen.queryByText('Close')).not.toBeInTheDocument();
  });

  it('previews the maker’s own draft', () => {
    renderWalk();
    start();
    const frame = screen.getByTitle('Your store preview') as HTMLIFrameElement;
    expect(frame.src).toContain('previewToken=tok-123');
    expect(frame.src).toContain('previewStill=1');
  });

  it('Next is gated until the step is resolved, then advances Moment → Hero', async () => {
    keepSection.mockResolvedValue({ ok: true });
    renderWalk();
    start();
    expect(screen.getByRole('button', { name: /Next/ })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Keep as built' }));
    await screen.findByText(/Kept/);
    fireEvent.click(screen.getByRole('button', { name: /Next/ }));
    // The Hero step (the resting top) follows the Moment step for a Cozy maker.
    expect(screen.getByText('The top of your store')).toBeInTheDocument();
    expect(screen.getByText(/Step 2 of/)).toBeInTheDocument();
  });
});
