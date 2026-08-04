import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

const converseSection = vi.fn();
const writeSectionFromConversation = vi.fn();
const setFieldValues = vi.fn();
const keepSection = vi.fn();
const toggleSection = vi.fn();
const setMomentPlayMode = vi.fn();
const setReviewQuotes = vi.fn();
const setFindUsRows = vi.fn();
vi.mock('../actions', () => ({
  converseSection: (...a: unknown[]) => converseSection(...a),
  writeSectionFromConversation: (...a: unknown[]) => writeSectionFromConversation(...a),
  setFieldValues: (...a: unknown[]) => setFieldValues(...a),
  keepSection: (...a: unknown[]) => keepSection(...a),
  toggleSection: (...a: unknown[]) => toggleSection(...a),
  setMomentPlayMode: (...a: unknown[]) => setMomentPlayMode(...a),
  setReviewQuotes: (...a: unknown[]) => setReviewQuotes(...a),
  setFindUsRows: (...a: unknown[]) => setFindUsRows(...a),
}));

import SectionEditor from './SectionEditor';
import { WALKTHROUGH_STEPS, walkUiSteps } from '@/lib/editor/walkthrough';
import type { SectionResolution } from '@/lib/editor/section-state';

const step = (section: string) => WALKTHROUGH_STEPS.find((s) => s.section === section)!;
/** The Moment step, as the walk builds it for a Cozy maker. */
const momentStep = () => walkUiSteps('cozy').find((s) => s.isMoment)!;

beforeEach(() => {
  [converseSection, writeSectionFromConversation, setFieldValues, keepSection, toggleSection, setMomentPlayMode, setReviewQuotes, setFindUsRows].forEach(
    (m) => m.mockReset(),
  );
});

function renderSection(
  section: string,
  opts: {
    title?: string;
    values?: Record<string, unknown>;
    resolution?: SectionResolution;
    reviewsShowsRating?: boolean;
    reviewsSummary?: { score?: string; count?: string };
  } = {},
) {
  const s = step(section);
  const onResolved = vi.fn();
  const onChanged = vi.fn();
  const { unmount } = render(
    <SectionEditor
      section={s.section}
      title={opts.title ?? s.title}
      cls={s.cls}
      keepable={s.keepable}
      fieldIds={s.fieldIds}
      values={opts.values ?? {}}
      resolution={opts.resolution}
      reviewsShowsRating={opts.reviewsShowsRating}
      reviewsSummary={opts.reviewsSummary}
      onResolved={onResolved}
      onChanged={onChanged}
    />,
  );
  return { onResolved, onChanged, unmount };
}

/** Render the Cozy Moment step with its play-frequency control. */
function renderMoment(opts: { momentPlayMode?: 'once' | 'always' | 'off'; lines?: string[] } = {}) {
  const s = momentStep();
  const onResolved = vi.fn();
  const onChanged = vi.fn();
  render(
    <SectionEditor
      section={s.section}
      title={s.title}
      cls={s.cls}
      keepable={s.keepable}
      fieldIds={s.fieldIds}
      values={opts.lines ? { 'moment.story': opts.lines } : {}}
      isMoment
      momentPlayMode={opts.momentPlayMode ?? 'once'}
      moodLabel="Cozy"
      onResolved={onResolved}
      onChanged={onChanged}
    />,
  );
  return { onResolved, onChanged };
}

describe('SectionEditor — conversation', () => {
  it('opens with the step title and Bohdi reacting to what he built', () => {
    renderSection('hero');
    expect(screen.getByText(step('hero').title)).toBeInTheDocument();
    expect(screen.getByText(/top of your store/i)).toBeInTheDocument();
  });

  it('sending a reply appends the maker turn and Bohdi’s follow-up', async () => {
    converseSection.mockResolvedValue({ ok: true, turn: { action: 'ask', message: 'And who is it for?' } });
    renderSection('hero');
    fireEvent.change(screen.getByPlaceholderText(/warmer, or shorter/i), {
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
    fireEvent.change(screen.getByPlaceholderText(/warmer, or shorter/i), { target: { value: 'calm and witchy' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    // wait for Bohdi's turn to land (the button is disabled while he's thinking)
    await screen.findByText('Got it — want me to write it?');
    fireEvent.click(screen.getByRole('button', { name: 'Write it up' }));
    await screen.findByText(/There it is/);
    // the write is scoped to the step's own fields (so a split hero step doesn't clobber the other)
    expect(writeSectionFromConversation).toHaveBeenCalledWith('hero', expect.any(Array), expect.any(Array));
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

  it('reviews renders the rows editor (real quotes), not the Bohdi conversation or Keep as built', () => {
    renderSection('reviews');
    expect(screen.getByText('What they said')).toBeInTheDocument();
    expect(screen.getByText('Who said it')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Keep as built' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Send' })).not.toBeInTheDocument();
    expect(screen.getByText(/turn this section off/i)).toBeInTheDocument();
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

describe('SectionEditor — rows sections (testimonials + events)', () => {
  it('find-us renders the dates rows editor with place / date / time, and a turn-off', () => {
    renderSection('findUs');
    expect(screen.getByLabelText('Place / event')).toBeInTheDocument();
    expect(screen.getByLabelText('Date')).toBeInTheDocument();
    expect(screen.getByLabelText('Time')).toBeInTheDocument();
    expect(screen.getByText(/turn this section off/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Send' })).not.toBeInTheDocument();
  });

  it('saving real reviews sends the typed rows to setReviewQuotes, resolves, and refreshes', async () => {
    setReviewQuotes.mockResolvedValue({ ok: true });
    const { onResolved, onChanged } = renderSection('reviews');
    fireEvent.change(screen.getByLabelText('What they said'), { target: { value: 'Best candle I have ever bought' } });
    fireEvent.change(screen.getByLabelText('Who said it'), { target: { value: 'Dana R.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save my reviews' }));
    await vi.waitFor(() => expect(setReviewQuotes).toHaveBeenCalled());
    expect(setReviewQuotes.mock.calls[0]![0]).toEqual([{ quote: 'Best candle I have ever bought', author: 'Dana R.', location: '' }]);
    expect(onResolved).toHaveBeenCalledWith(true);
    expect(onChanged).toHaveBeenCalled();
  });

  it('saving real dates sends the typed rows to setFindUsRows, resolves, and refreshes', async () => {
    setFindUsRows.mockResolvedValue({ ok: true });
    const { onResolved, onChanged } = renderSection('findUs');
    fireEvent.change(screen.getByLabelText('Place / event'), { target: { value: 'Providence Winter Market' } });
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-08-15' } });
    fireEvent.change(screen.getByLabelText('Time'), { target: { value: '9am – 2pm' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save my dates' }));
    await vi.waitFor(() => expect(setFindUsRows).toHaveBeenCalled());
    expect(setFindUsRows.mock.calls[0]![0]).toEqual([{ where: 'Providence Winter Market', date: '2026-08-15', time: '9am – 2pm' }]);
    expect(onResolved).toHaveBeenCalledWith(true);
    expect(onChanged).toHaveBeenCalled();
  });

  it('a half-filled row blocks the save with a clear message and calls no action', async () => {
    const { onResolved } = renderSection('reviews');
    fireEvent.change(screen.getByLabelText('What they said'), { target: { value: 'A quote with no name' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save my reviews' }));
    expect(await screen.findByText(/Fill in every field/i)).toBeInTheDocument();
    expect(setReviewQuotes).not.toHaveBeenCalled();
    expect(onResolved).not.toHaveBeenCalled();
  });

  it('does NOT pre-fill the seeded fake reviews when the section is still a placeholder', () => {
    renderSection('reviews', { values: { 'reviews.items': [{ quote: 'FAKE seeded quote', author: 'nobody' }] } });
    expect(screen.queryByDisplayValue('FAKE seeded quote')).not.toBeInTheDocument();
  });

  it('seeds the maker’s own saved reviews for editing on resume (a made section)', () => {
    renderSection('reviews', {
      resolution: 'made',
      values: { 'reviews.items': [{ quote: 'A real one', author: 'Dana', location: 'RI' }] },
    });
    expect(screen.getByDisplayValue('A real one')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Dana')).toBeInTheDocument();
  });

  it('always seeds the current sample dates for editing (they’re meant to be edited)', () => {
    renderSection('findUs', {
      values: { 'findUs.rows': [{ where: 'Old Market', date: '2026-01-02', time: '10am', day: 'x' }] },
    });
    expect(screen.getByDisplayValue('Old Market')).toBeInTheDocument();
  });

  it('turning the section off hides it and resolves the step', async () => {
    toggleSection.mockResolvedValue({ ok: true });
    const { onResolved } = renderSection('findUs');
    fireEvent.click(screen.getByText(/turn this section off/i));
    await vi.waitFor(() => expect(toggleSection).toHaveBeenCalledWith('findUs', true));
    expect(onResolved).toHaveBeenCalledWith(true);
  });

  it('offers the optional rating fields ONLY when the store uses the star-rating layout', () => {
    // Default (no rating layout) → no rating fields.
    renderSection('reviews');
    expect(screen.queryByText(/overall rating/i)).not.toBeInTheDocument();
    cleanup();
    // Rating layout → the two optional real-rating boxes appear.
    renderSection('reviews', { reviewsShowsRating: true });
    expect(screen.getByText(/overall rating/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/4\.9 out of 5/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/happy customers/)).toBeInTheDocument();
  });

  it('sends a real rating with the quotes when the maker fills it in', async () => {
    setReviewQuotes.mockResolvedValue({ ok: true });
    renderSection('reviews', { reviewsShowsRating: true });
    fireEvent.change(screen.getByLabelText('What they said'), { target: { value: 'Lovely work' } });
    fireEvent.change(screen.getByLabelText('Who said it'), { target: { value: 'Dana R.' } });
    fireEvent.change(screen.getByPlaceholderText(/4\.9 out of 5/), { target: { value: '4.8 out of 5' } });
    fireEvent.change(screen.getByPlaceholderText(/happy customers/), { target: { value: '30 reviews' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save my reviews' }));
    await vi.waitFor(() => expect(setReviewQuotes).toHaveBeenCalled());
    expect(setReviewQuotes.mock.calls[0]![1]).toEqual({ score: '4.8 out of 5', count: '30 reviews' });
  });

  it('passes no rating when the layout has none (so any fabricated one is stripped)', async () => {
    setReviewQuotes.mockResolvedValue({ ok: true });
    renderSection('reviews'); // not a rating layout
    fireEvent.change(screen.getByLabelText('What they said'), { target: { value: 'Lovely' } });
    fireEvent.change(screen.getByLabelText('Who said it'), { target: { value: 'Sam' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save my reviews' }));
    await vi.waitFor(() => expect(setReviewQuotes).toHaveBeenCalled());
    expect(setReviewQuotes.mock.calls[0]![1]).toBeUndefined();
  });
});

describe('SectionEditor — Moment step (play frequency)', () => {
  it('explains the feeling and offers the three plain play choices', () => {
    renderMoment();
    expect(screen.getByText(/Cozy feel/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'The first time someone visits' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Every time someone visits' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Don’t play it/ })).toBeInTheDocument();
  });

  it('a normal section shows no play-frequency control', () => {
    renderSection('goods');
    expect(screen.queryByText('How often it plays')).not.toBeInTheDocument();
  });

  it('the resting Hero step (not the Moment) shows neither explanation nor play control', () => {
    renderSection('hero');
    expect(screen.queryByText('How often it plays')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Every time someone visits' })).not.toBeInTheDocument();
  });

  it('choosing a frequency calls setMomentPlayMode, resolves, and refreshes the preview', async () => {
    setMomentPlayMode.mockResolvedValue({ ok: true });
    const { onResolved, onChanged } = renderMoment();
    fireEvent.click(screen.getByRole('button', { name: 'Every time someone visits' }));
    await vi.waitFor(() => expect(setMomentPlayMode).toHaveBeenCalledWith('always'));
    expect(onResolved).toHaveBeenCalledWith(true);
    expect(onChanged).toHaveBeenCalled();
  });

  it('marks the current play mode as pressed', () => {
    renderMoment({ momentPlayMode: 'off' });
    expect(screen.getByRole('button', { name: /Don’t play it/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'The first time someone visits' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('still offers keep-as-built and the reword conversation', () => {
    renderMoment();
    expect(screen.getByRole('button', { name: 'Keep as built' })).toBeInTheDocument();
    expect(screen.getByText(/words that fade in/i)).toBeInTheDocument();
  });

  it('shows the current opening lines so the maker can read them (they fade away in the preview)', () => {
    renderMoment({ lines: ['Hand-poured in small batches', 'Lit for slow evenings'] });
    expect(screen.getByText(/Hand-poured in small batches/)).toBeInTheDocument();
    expect(screen.getByText(/Lit for slow evenings/)).toBeInTheDocument();
  });
});
