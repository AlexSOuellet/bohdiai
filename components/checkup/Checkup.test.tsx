import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Checkup } from './Checkup';
import { parseSaved, resetCheckupStoreForTests } from './checkup-store';
import { OPENING, type AskedQuestion } from '@/lib/checkup/transcript';

const followUp: AskedQuestion = {
  id: 'word_back',
  kind: 'single',
  bridge: 'Friends and family are where almost everyone starts.',
  prompt: 'Do they come back for more?',
  aside: 'A rough sense is fine.',
  options: ['Yes, a few have', 'Not yet'],
  allowOther: true,
  placeholder: '',
  optional: false,
};

const writeUp = {
  summary: ['You make decoupage trays and sell to friends and family.'],
  first_steps: ['Price three pieces.', 'Find one small market.'],
  paths: [
    { group: 'better', title: 'Price to cover your supplies', body: ['Write down costs.'], step: 'Do it.' },
    { group: 'bigger', title: 'Somewhere to send people', body: ['A place of your own.'], step: 'Pick one.' },
  ],
  help_intro: 'You’re doing well at markets and need somewhere to send people.',
  help: [{ offer: 'showcase', text: 'A page your card can point to.' }],
};

type Reply = { status?: number; body: unknown };
let replies: Reply[] = [];
const fetchMock = vi.fn((url: string, init: RequestInit) => {
  void url;
  void init;
  const next = replies.shift() ?? { status: 500, body: {} };
  return Promise.resolve(Response.json(next.body, { status: next.status ?? 200 }));
});

const sentTranscript = (call: number): Array<{ answer: unknown }> =>
  (JSON.parse(String((fetchMock.mock.calls[call] as [string, RequestInit])[1].body)) as { transcript: Array<{ answer: unknown }> })
    .transcript;

beforeEach(() => {
  window.localStorage.clear();
  resetCheckupStoreForTests();
  Element.prototype.scrollIntoView = vi.fn();
  fetchMock.mockClear();
  replies = [];
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

const heading = (): HTMLElement => screen.getByRole('heading', { level: 1 });

async function startAndAnswerOpening(): Promise<void> {
  replies.push({ body: { done: false, question: OPENING[0] } }, { body: { done: false, question: OPENING[1] } });
  render(<Checkup />);
  fireEvent.click(screen.getByRole('button', { name: 'Let’s start' }));
  await waitFor(() => expect(heading()).toHaveTextContent('What do you make?'));
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Decoupage trays' } });
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  await waitFor(() => expect(heading()).toHaveTextContent('What do you want your making to do for you?'));
}

describe('the maker checkup', () => {
  it('opens on Alex’s welcome', () => {
    render(<Checkup />);
    expect(heading()).toHaveTextContent('Let’s find out where your making stands');
  });

  it('asks what they make in their own words and needs an answer to go on', async () => {
    replies.push({ body: { done: false, question: OPENING[0] } });
    render(<Checkup />);
    fireEvent.click(screen.getByRole('button', { name: 'Let’s start' }));
    await waitFor(() => expect(heading()).toHaveTextContent('What do you make?'));
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    expect(screen.getByText('Type your answer to go on')).toBeInTheDocument();
  });

  it('follows up on each answer, sending the whole conversation each time', async () => {
    await startAndAnswerOpening();
    replies.push({ body: { done: false, question: followUp } });
    vi.useFakeTimers();
    fireEvent.click(screen.getByRole('radio', { name: 'Pay for itself, maybe a little extra' }));
    await act(async () => {
      vi.advanceTimersByTime(400);
    });
    vi.useRealTimers();
    await waitFor(() => expect(heading()).toHaveTextContent('Do they come back for more?'));
    expect(screen.getByText('Friends and family are where almost everyone starts.')).toBeInTheDocument();
    expect(screen.getByText('A rough sense is fine.')).toBeInTheDocument();
    expect(sentTranscript(2).map((t) => t.answer)).toEqual(['Decoupage trays', 'Pay for itself, maybe a little extra']);
  });

  it('lets them type something else instead of a choice', async () => {
    window.localStorage.setItem(
      'bohdi-checkup-v2',
      JSON.stringify({ started: true, turns: [], current: followUp, writeUp: null }),
    );
    replies.push({ body: { done: true } }, { body: writeUp });
    render(<Checkup />);
    fireEvent.change(screen.getByLabelText('Something else, or anything to add'), { target: { value: 'One came back twice' } });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(screen.getByText('Here’s what I see')).toBeInTheDocument());
    expect(sentTranscript(0)[0]?.answer).toBe('One came back twice');
  });

  it('sends a tapped choice with the note they typed', async () => {
    window.localStorage.setItem(
      'bohdi-checkup-v2',
      JSON.stringify({ started: true, turns: [], current: followUp, writeUp: null }),
    );
    replies.push({ body: { done: true } }, { body: writeUp });
    render(<Checkup />);
    fireEvent.change(screen.getByLabelText('Something else, or anything to add'), { target: { value: 'my aunt, twice' } });
    fireEvent.click(screen.getByRole('radio', { name: 'Yes, a few have' }));
    expect(screen.getByRole('radio', { name: 'Yes, a few have' })).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(screen.getByText('Here’s what I see')).toBeInTheDocument());
    expect(sentTranscript(0)[0]?.answer).toBe('Yes, a few have (also: my aunt, twice)');
  });

  it('brings back a choice and its note after Back', async () => {
    window.localStorage.setItem(
      'bohdi-checkup-v2',
      JSON.stringify({
        started: true,
        turns: [{ question: followUp, answer: 'Not yet (also: soon)' }, { question: { ...followUp, kind: 'multi', prompt: 'Which?' }, answer: ['Yes, a few have', 'and more'] }],
        current: { ...followUp, prompt: 'Next one?' },
        writeUp: null,
      }),
    );
    render(<Checkup />);
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByRole('button', { name: 'Yes, a few have' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('Something else, or anything to add')).toHaveValue('and more');
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByRole('radio', { name: 'Not yet' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByLabelText('Something else, or anything to add')).toHaveValue('soon');
  });

  it('ends in the write-up, with Alex’s offers in their own section at the end', async () => {
    window.localStorage.setItem(
      'bohdi-checkup-v2',
      JSON.stringify({ started: true, turns: [], current: { ...followUp, kind: 'multi', allowOther: false }, writeUp: null }),
    );
    replies.push({ body: { done: true } }, { body: writeUp });
    render(<Checkup />);
    expect(screen.getByText('Pick at least one')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Not yet' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(screen.getByText('Price to cover your supplies')).toBeInTheDocument());
    expect(screen.getByText('This week')).toBeInTheDocument();
    expect(screen.getByText('Price three pieces.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'How I can help' })).toBeInTheDocument();
    expect(screen.getByText('A page your card can point to.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Learn more about the showcase site' })).toHaveTextContent('Learn more');
    expect(screen.getByText('Free tips and tricks')).toBeInTheDocument();
  });

  it('lets an optional question be skipped', async () => {
    window.localStorage.setItem(
      'bohdi-checkup-v2',
      JSON.stringify({
        started: true,
        turns: [],
        current: { ...followUp, kind: 'text', options: [], optional: true, prompt: 'Your Etsy link?' },
        writeUp: null,
      }),
    );
    replies.push({ body: { done: true } }, { body: writeUp });
    render(<Checkup />);
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
    await waitFor(() => expect(screen.getByText('Here’s what I see')).toBeInTheDocument());
    expect(sentTranscript(0)[0]?.answer).toBe('');
  });

  it('shows what went wrong and tries again', async () => {
    replies.push({ status: 502, body: { error: 'I couldn’t come up with the next question. Tap Try again.' } });
    render(<Checkup />);
    fireEvent.click(screen.getByRole('button', { name: 'Let’s start' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Tap Try again'));
    replies.push({ body: { done: false, question: OPENING[0] } });
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(heading()).toHaveTextContent('What do you make?'));
  });

  it('treats a nonsense reply or a dropped connection as a failure', async () => {
    replies.push({ body: { what: 'ever' } });
    render(<Checkup />);
    fireEvent.click(screen.getByRole('button', { name: 'Let’s start' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('couldn’t come up with'));
    fetchMock.mockImplementationOnce(() => Promise.reject(new Error('offline')));
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('couldn’t come up with'));
  });

  it('reports a failed write-up', async () => {
    window.localStorage.setItem(
      'bohdi-checkup-v2',
      JSON.stringify({ started: true, turns: [], current: followUp, writeUp: null }),
    );
    replies.push({ body: { done: true } }, { body: { summary: 'not a list' } });
    vi.useFakeTimers();
    render(<Checkup />);
    fireEvent.click(screen.getByRole('radio', { name: 'Not yet' }));
    await act(async () => {
      vi.advanceTimersByTime(400);
    });
    vi.useRealTimers();
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('couldn’t finish your write-up'));
  });

  it('goes back with their earlier answer still picked, and starts over clean', async () => {
    await startAndAnswerOpening();
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(heading()).toHaveTextContent('What do you make?');
    expect(screen.getByRole('textbox')).toHaveValue('Decoupage trays');
    fireEvent.click(screen.getByRole('button', { name: 'Start over' }));
    expect(screen.getByRole('button', { name: 'Let’s start' })).toBeInTheDocument();
  });

  it('offers to keep going after a refresh in the middle of a question', async () => {
    window.localStorage.setItem(
      'bohdi-checkup-v2',
      JSON.stringify({ started: true, turns: [{ question: OPENING[0], answer: 'Trays' }], current: null, writeUp: null }),
    );
    replies.push({ body: { done: false, question: OPENING[1] } });
    render(<Checkup />);
    fireEvent.click(screen.getByRole('button', { name: 'Keep going' }));
    await waitFor(() => expect(heading()).toHaveTextContent('What do you want your making to do for you?'));
  });
});

describe('saved checkups', () => {
  it('reads back only what checks out', () => {
    expect(parseSaved(null)).toBeNull();
    expect(parseSaved('not json')).toBeNull();
    expect(parseSaved('42')).toBeNull();
    expect(parseSaved('{"started":true,"turns":"x","current":{"kind":"nope"},"writeUp":{"summary":1}}')).toEqual({
      started: true,
      turns: [],
      current: null,
      writeUp: null,
    });
  });
});
