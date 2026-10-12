'use client';

import { useId, useState } from 'react';
import type { Answer, AskedQuestion } from '@/lib/checkup/transcript';

const NOTE_LABEL = 'Something else, or anything to add';

interface Props {
  readonly question: AskedQuestion;
  /** Their earlier answer, when they came back to this question. */
  readonly previous: Answer | null;
  readonly onAnswer: (answer: Answer) => void;
  readonly onBack: (() => void) | null;
}

/** How a one-answer pick and a typed note are sent together. */
export function withNote(choice: string, note: string): string {
  return `${choice} (also: ${note})`;
}

const WITH_NOTE = /^(.*) \(also: (.*)\)$/s;

/** Splits an earlier answer back into tapped choices and the typed note. */
function unpack(q: AskedQuestion, previous: Answer | null): { picks: string[]; note: string } {
  if (previous === null || q.kind === 'text') return { picks: [], note: '' };
  if (typeof previous === 'string') {
    if (q.options.includes(previous)) return { picks: [previous], note: '' };
    const m = WITH_NOTE.exec(previous);
    if (m !== null && m[1] !== undefined && m[2] !== undefined && q.options.includes(m[1])) {
      return { picks: [m[1]], note: m[2] };
    }
    return { picks: [], note: previous };
  }
  return {
    picks: previous.filter((v) => q.options.includes(v)),
    note: previous.filter((v) => !q.options.includes(v)).join('; '),
  };
}

/** One question: a reaction to their last answer, the question, then tags and/or a text box. */
export function QuestionScreen({ question: q, previous, onAnswer, onBack }: Props): React.ReactElement {
  const headingId = useId();
  const noteId = useId();
  const start = unpack(q, previous);
  const [picks, setPicks] = useState<string[]>(start.picks);
  const [note, setNote] = useState(start.note);
  const [text, setText] = useState(typeof previous === 'string' && q.kind === 'text' ? previous : '');
  const [leaving, setLeaving] = useState(false);

  const typedNote = note.trim();
  const chosen = picks[0] ?? null;

  function tapSingle(option: string): void {
    if (leaving) return;
    setPicks([option]);
    // With a note typed, the tap only selects; Next sends both. Without one, move straight on,
    // after the tag has had a moment to stamp and swing.
    if (typedNote === '') {
      setLeaving(true);
      window.setTimeout(() => onAnswer(option), 380);
    }
  }

  function toggleMulti(option: string): void {
    setPicks((p) => (p.includes(option) ? p.filter((v) => v !== option) : [...p, option]));
  }

  const answer: Answer | null =
    q.kind === 'text'
      ? text.trim()
      : q.kind === 'multi'
        ? [...picks, ...(typedNote !== '' ? [typedNote] : [])]
        : chosen !== null && typedNote !== ''
          ? withNote(chosen, typedNote)
          : (chosen ?? (typedNote !== '' ? typedNote : null));
  const hasAnswer = typeof answer === 'string' ? answer !== '' : answer !== null && answer.length > 0;
  const showNext = q.kind !== 'single' || typedNote !== '';
  const skippable = q.optional && !hasAnswer;

  return (
    <div className="checkup-screen flex flex-1 flex-col">
      <div className="flex-1">
        {q.bridge !== '' && (
          <p className="mb-4 max-w-[600px] text-[18px] leading-[1.45] text-text-soft md:text-[20px]">{q.bridge}</p>
        )}
        <h1
          id={headingId}
          className="max-w-[640px] text-[30px] font-medium leading-[1.08] tracking-[-0.025em] text-text md:text-[44px]"
        >
          {q.prompt}
        </h1>
        {q.aside !== '' && (
          <p className="checkup-hand mt-3 max-w-[560px] text-[22px] leading-[1.2] text-honey-warm md:text-[25px]">
            {q.aside}
          </p>
        )}

        <div className="mt-8 md:mt-10">
          {q.kind === 'text' && (
            <input
              type="text"
              aria-labelledby={headingId}
              autoComplete="off"
              autoFocus
              placeholder={q.placeholder}
              value={text}
              maxLength={600}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && hasAnswer && answer !== null) onAnswer(answer);
              }}
              className="w-full max-w-[560px] border-0 border-b-2 border-honey/50 bg-transparent px-0 py-3 text-[20px] text-text placeholder:text-muted focus:border-honey-warm focus:outline-none"
            />
          )}

          {q.kind !== 'text' && (
            <div
              role={q.kind === 'single' ? 'radiogroup' : 'group'}
              aria-labelledby={headingId}
              className="checkup-tags"
            >
              {q.options.map((o) =>
                q.kind === 'single' ? (
                  <button
                    key={o}
                    type="button"
                    role="radio"
                    aria-checked={chosen === o}
                    className="tag"
                    onClick={() => tapSingle(o)}
                  >
                    {o}
                  </button>
                ) : (
                  <button
                    key={o}
                    type="button"
                    aria-pressed={picks.includes(o)}
                    className="tag"
                    onClick={() => toggleMulti(o)}
                  >
                    {o}
                  </button>
                ),
              )}
            </div>
          )}

          {q.kind !== 'text' && q.allowOther && (
            <div className="mt-7 max-w-[560px]">
              <label htmlFor={noteId} className="checkup-hand block text-[21px] leading-none text-honey-warm">
                {NOTE_LABEL}
              </label>
              <input
                id={noteId}
                type="text"
                autoComplete="off"
                value={note}
                maxLength={600}
                onChange={(e) => setNote(e.target.value)}
                className="mt-1 w-full border-0 border-b-2 border-honey/40 bg-transparent px-0 py-2.5 text-[18px] text-text focus:border-honey-warm focus:outline-none"
              />
            </div>
          )}
        </div>
      </div>

      <div className="mt-10 flex items-center justify-between gap-4">
        {onBack !== null ? (
          <button type="button" onClick={onBack} className="min-h-[48px] px-1 text-[16px] text-muted hover:text-text">
            Back
          </button>
        ) : (
          <span />
        )}
        {(showNext || skippable) && (
          <div className="flex flex-col items-end gap-1.5">
            <button
              type="button"
              onClick={() => onAnswer(skippable ? '' : (answer ?? ''))}
              disabled={!hasAnswer && !skippable}
              className="min-h-[52px] rounded-md bg-honey px-8 text-[17px] font-semibold text-bg transition-colors hover:bg-honey-warm disabled:cursor-not-allowed disabled:opacity-40"
            >
              {skippable ? 'Skip' : 'Next'}
            </button>
            {!hasAnswer && !skippable && (
              <span className="text-[13px] text-muted">
                {q.kind === 'multi' ? (q.allowOther ? 'Pick at least one, or type below' : 'Pick at least one') : 'Type your answer to go on'}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
