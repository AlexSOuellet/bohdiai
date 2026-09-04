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
import { walkUiSteps, type WalkthroughStep } from '@/lib/editor/walkthrough';
import type { SectionResolution } from '@/lib/editor/section-state';

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
      family="cozy"
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

  /** Render the walk with a single given step so we can inspect its preview URL. */
  function renderStep(section: string) {
    const step = walkUiSteps('rustic').find((s) => s.section === section)!;
    render(
      <MakeItYours previewToken="tok-123" previewOrigin="https://ember.test" values={{}} steps={[step]} momentPlayMode="once" moodLabel="Cozy" family="rustic" />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Let’s go/ }));
    return (screen.getByTitle('Your store preview') as HTMLIFrameElement).src;
  }

  it('spotlights a home section on the home page for a normal step', () => {
    const src = renderStep('goods');
    expect(src).toContain('/?previewToken=');
    expect(src).toContain('previewSection=goods');
  });

  it('previews the /contact PAGE on the contact step (contact has no home beat to spotlight)', () => {
    const src = renderStep('contact');
    expect(src).toContain('/contact?previewToken=');
    expect(src).not.toContain('previewSection');
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

  it('starts at the beginning; a section finished earlier opens marked completed with Next open', () => {
    // Cozy walk: [moment(hero), hero, story, goods, …]. The hero was finished in an
    // earlier sitting → the first step opens completed, but the walk still starts at the
    // top (not a jump to goods), so the maker can move through or change anything.
    const steps = walkUiSteps('cozy');
    const resolvedFlags = steps.map((_, i) => i < 2);
    const resolutions: SectionResolution[] = steps.map((_, i) =>
      i === 0 ? 'made' : i === 1 ? 'kept' : 'unresolved',
    );
    render(
      <MakeItYours
        previewToken="tok"
        previewOrigin="https://ember.test"
        values={{}}
        steps={steps}
        momentPlayMode="once"
        moodLabel="Cozy"
        resolvedFlags={resolvedFlags}
        resolutions={resolutions}
        family="cozy"
      />,
    );
    // Opens on the welcome and starts at the top — no jump past finished sections.
    fireEvent.click(screen.getByRole('button', { name: /Let’s go/ }));
    expect(screen.getByText('Your opening moment')).toBeInTheDocument();
    expect(screen.getByText('Step 1 of 10')).toBeInTheDocument();
    // Marked completed, and Next is open (already resolved) — breeze past or make changes.
    expect(screen.getByText('✓ Completed')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Next/ })).not.toBeDisabled();
  });

  it('has an always-available Back button; from the first section it returns to the welcome', () => {
    renderWalk('rustic'); // leads with the Hero step (no Moment split), so step 1 is index 0
    start();
    const back = screen.getByRole('button', { name: /Back/ });
    expect(back).not.toBeDisabled();
    fireEvent.click(back);
    // Back from the first section lands on the welcome screen, not a dead end.
    expect(screen.getByRole('button', { name: /Let’s go/ })).toBeInTheDocument();
  });

  it('the last step finishes into a closing screen that routes to the editor', async () => {
    keepSection.mockResolvedValue({ ok: true });
    // A one-step walk so the first step IS the last — reach Finish without walking the
    // whole store. A keep-or-change section resolves with a single "Keep as built".
    const oneStep: WalkthroughStep[] = [
      {
        id: 'close',
        title: 'Your sign-off',
        section: 'close',
        fieldIds: ['close.headline'],
        cls: 'keep-or-change',
        keepable: true,
        personal: false,
        optional: false,
      },
    ];
    render(
      <MakeItYours
        previewToken="tok"
        previewOrigin="https://ember.test"
        values={{}}
        steps={oneStep}
        momentPlayMode="once"
        moodLabel="Cozy"
        family="cozy"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Let’s go/ }));

    // The primary button reads Finish on the last step, gated until it's resolved.
    expect(screen.getByRole('button', { name: 'Finish' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Keep as built' }));
    await screen.findByText(/Kept/);
    fireEvent.click(screen.getByRole('button', { name: 'Finish' }));

    // The closing screen appears, with the button that sends the maker to their editor
    // (the gate lets them in now that every section is resolved).
    expect(screen.getByText('Your store is yours now')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go to my editor' })).toBeInTheDocument();
    // The section list no longer shows — the walk is done, not mid-step.
    expect(screen.queryByText(/Step 1 of/)).not.toBeInTheDocument();
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
