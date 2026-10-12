/**
 * The maker checkup as a conversation: each turn is a question the visitor saw
 * and the answer they gave. The browser holds the transcript and sends it with
 * every request; nothing is stored on our side.
 */

export type QuestionKind = 'single' | 'multi' | 'text';

export interface AskedQuestion {
  /** Which question in the bank this is (see bank.ts). */
  readonly id: string;
  readonly kind: QuestionKind;
  /** A short reaction to their last answer, shown above the question. May be empty. */
  readonly bridge: string;
  readonly prompt: string;
  /** A small line in Alex's handwriting under the question. May be empty. */
  readonly aside: string;
  /** Tap answers for single and multi. Empty for text. */
  readonly options: readonly string[];
  /** Shows the "Something else, or anything to add" line under the choices. */
  readonly allowOther: boolean;
  /** Placeholder for a text box. */
  readonly placeholder: string;
  /** The visitor may skip it (a text box left blank, or a tap question passed over). */
  readonly optional: boolean;
}

export type Answer = string | readonly string[];

export interface Turn {
  readonly question: AskedQuestion;
  readonly answer: Answer;
}

export const LIMITS = {
  turns: 40,
  text: 600,
  options: 10,
} as const;

/** Past this many answers the checkup wraps up, whatever the model wants. */
export const MAX_QUESTIONS = 24;

function clip(v: unknown, max: number): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

/** A question arriving from outside (the browser, or storage), checked and capped. */
export function sanitizeQuestion(raw: unknown): AskedQuestion | null {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  const kind = r['kind'];
  if (kind !== 'single' && kind !== 'multi' && kind !== 'text') return null;
  const prompt = clip(r['prompt'], LIMITS.text);
  if (prompt === '') return null;
  const options = Array.isArray(r['options'])
    ? r['options'].map((o) => clip(o, LIMITS.text)).filter((o) => o !== '').slice(0, LIMITS.options)
    : [];
  const rawId = clip(r['id'], 40);
  return {
    id: /^[a-z_]+$/.test(rawId) ? rawId : '',
    kind,
    bridge: clip(r['bridge'], LIMITS.text),
    prompt,
    aside: clip(r['aside'], LIMITS.text),
    options,
    allowOther: r['allowOther'] === true,
    placeholder: clip(r['placeholder'], 120),
    optional: r['optional'] === true,
  };
}

function sanitizeAnswer(raw: unknown): Answer | null {
  if (typeof raw === 'string') return clip(raw, LIMITS.text);
  if (Array.isArray(raw)) {
    const picks = raw.map((v) => clip(v, LIMITS.text)).filter((v) => v !== '').slice(0, LIMITS.options + 1);
    return picks.length > 0 ? picks : null;
  }
  return null;
}

/**
 * A transcript arriving from the browser, cleaned: well-formed turns only,
 * every string trimmed and capped, at most LIMITS.turns turns.
 */
export function sanitizeTranscript(raw: unknown): Turn[] {
  if (!Array.isArray(raw)) return [];
  const out: Turn[] = [];
  for (const t of raw.slice(0, LIMITS.turns)) {
    if (t === null || typeof t !== 'object' || Array.isArray(t)) continue;
    const rec = t as Record<string, unknown>;
    const question = sanitizeQuestion(rec['question']);
    const answer = sanitizeAnswer(rec['answer']);
    if (question !== null && answer !== null) out.push({ question, answer });
  }
  return out;
}

/** The conversation as plain text for the model to read. */
export function transcriptText(turns: readonly Turn[]): string {
  return turns
    .map((t, i) => {
      const a = typeof t.answer === 'string' ? t.answer : t.answer.join('; ');
      const choices = t.question.options.length > 0 ? `\n   (choices shown: ${t.question.options.join(' | ')})` : '';
      return `Q${i + 1}: ${t.question.prompt}${choices}\nA${i + 1}: ${a === '' ? '(skipped)' : a}`;
    })
    .join('\n\n');
}

/** The two questions every checkup opens with. Everything after is written for the visitor. */
export const OPENING: readonly AskedQuestion[] = [
  {
    id: 'make',
    kind: 'text',
    bridge: '',
    prompt: 'What do you make?',
    aside: 'Say it however you like.',
    options: [],
    allowOther: false,
    placeholder: 'I make…',
    optional: false,
  },
  {
    id: 'goal',
    kind: 'single',
    bridge: '',
    prompt: 'What do you want your making to do for you?',
    aside: 'There’s no wrong answer.',
    options: [
      'Pay for itself, maybe a little extra',
      'Bring in real money, so I can see if this could be more',
      'Become a real business',
    ],
    allowOther: false,
    placeholder: '',
    optional: false,
  },
];

