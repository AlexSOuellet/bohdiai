import { describe, it, expect } from 'vitest';
import { sanitizeTranscript, sanitizeQuestion, transcriptText, OPENING, LIMITS, type AskedQuestion } from './transcript';

const q = (over: Partial<AskedQuestion> = {}): AskedQuestion => ({
  id: 'word_back',
  kind: 'single',
  bridge: '',
  prompt: 'Who bought them?',
  aside: '',
  options: ['Friends', 'Strangers'],
  allowOther: false,
  placeholder: '',
  optional: false,
  ...over,
});

describe('sanitizeQuestion', () => {
  it('keeps a well-formed question and trims it', () => {
    expect(sanitizeQuestion({ ...q(), prompt: '  Who bought them?  ', allowOther: true })).toEqual(
      q({ allowOther: true }),
    );
  });
  it('rejects anything malformed', () => {
    expect(sanitizeQuestion(null)).toBeNull();
    expect(sanitizeQuestion([])).toBeNull();
    expect(sanitizeQuestion({ ...q(), kind: 'slider' })).toBeNull();
    expect(sanitizeQuestion({ ...q(), id: 'Not An Id!' })?.id).toBe('');
    expect(sanitizeQuestion({ ...q(), prompt: '   ' })).toBeNull();
  });
  it('caps long text and too many options, and drops blank ones', () => {
    const long = 'x'.repeat(2000);
    const cleaned = sanitizeQuestion({ ...q(), prompt: long, options: [...Array(20).keys()].map(String).concat(['']) });
    expect(cleaned?.prompt).toHaveLength(LIMITS.text);
    expect(cleaned?.options).toHaveLength(LIMITS.options);
    expect(sanitizeQuestion({ ...q(), options: 'nope' })?.options).toEqual([]);
  });
});

describe('sanitizeTranscript', () => {
  it('keeps good turns and drops bad ones', () => {
    const turns = sanitizeTranscript([
      { question: q(), answer: 'Friends' },
      { question: q(), answer: ['Friends', '', 'Strangers'] },
      { question: q(), answer: [] },
      { question: q(), answer: 42 },
      { question: { prompt: '' }, answer: 'x' },
      'junk',
      [],
    ]);
    expect(turns).toHaveLength(2);
    expect(turns[1]?.answer).toEqual(['Friends', 'Strangers']);
  });
  it('accepts a skipped answer and caps the number of turns', () => {
    expect(sanitizeTranscript([{ question: q(), answer: '' }])).toHaveLength(1);
    expect(sanitizeTranscript(Array(60).fill({ question: q(), answer: 'a' }))).toHaveLength(LIMITS.turns);
    expect(sanitizeTranscript('nope')).toEqual([]);
  });
});

describe('transcriptText', () => {
  it('reads like a numbered conversation with the choices shown', () => {
    const text = transcriptText([
      { question: q(), answer: 'Friends' },
      { question: q({ kind: 'text', options: [], prompt: 'Your link?' }), answer: '' },
      { question: q({ kind: 'multi' }), answer: ['Friends', 'Strangers'] },
    ]);
    expect(text).toContain('Q1: Who bought them?\n   (choices shown: Friends | Strangers)\nA1: Friends');
    expect(text).toContain('Q2: Your link?\nA2: (skipped)');
    expect(text).toContain('A3: Friends; Strangers');
  });
});

describe('the opening', () => {
  it('asks what they make in their own words, then their goal by tap', () => {
    expect(OPENING[0]?.kind).toBe('text');
    expect(OPENING[0]?.prompt).toBe('What do you make?');
    expect(OPENING[1]?.kind).toBe('single');
    expect(OPENING[1]?.options).toHaveLength(3);
  });
});
