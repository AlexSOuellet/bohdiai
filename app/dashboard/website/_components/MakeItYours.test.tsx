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

/** A walk for the given feeling. Cozy (default) leads with the Moment step then
 *  the Hero step; other feelings lead straight with the Hero step. */
function renderWalk(mood = 'cozy') {
  render(
    <MakeItYours
      previewToken="tok-123"
      previewOrigin="https://ember.test"
      values={{}}
      steps={walkUiSteps(mood)}
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

  it('offers a replay on the Moment step that reloads the preview to play it again', () => {
    renderWalk();
    start();
    const before = (screen.getByTitle('Your store preview') as HTMLIFrameElement).src;
    fireEvent.click(screen.getByRole('button', { name: /Play it again/ }));
    const after = (screen.getByTitle('Your store preview') as HTMLIFrameElement).src;
    expect(after).not.toBe(before); // nonce bumped → the iframe reloads and the intro replays
  });

  it('has no replay on a non-Moment step (a static hero fades nothing in)', () => {
    renderWalk('rustic'); // leads with the resting Hero step, no Moment
    start();
    expect(screen.queryByRole('button', { name: /Play it again/ })).not.toBeInTheDocument();
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
