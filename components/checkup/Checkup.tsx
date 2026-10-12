'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { Wordmark } from '@/components/Wordmark';
import { type Answer, type AskedQuestion, type Turn, sanitizeQuestion } from '@/lib/checkup/transcript';
import type { WriteUp } from '@/lib/checkup/schemas';
import { QuestionScreen } from './QuestionScreen';
import { Results } from './Results';
import { EMPTY, toWriteUp, useCheckupState, writeCheckup, type CheckupState } from './checkup-store';

type Pending = { kind: 'idle' } | { kind: 'loading'; what: 'next' | 'writeup' } | { kind: 'error'; message: string };

const NEXT_FAILED = 'I couldn’t come up with the next question. Tap Try again.';
const WRITEUP_FAILED = 'I couldn’t finish your write-up. Tap Try again.';

type Fetched = { ok: true; body: unknown } | { ok: false; message: string };

async function post(url: string, turns: readonly Turn[], fallback: string): Promise<Fetched> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ transcript: turns }),
    });
    const body: unknown = await res.json().catch(() => null);
    if (res.ok) return { ok: true, body };
    const message =
      body !== null && typeof body === 'object' && 'error' in body && typeof body.error === 'string' ? body.error : fallback;
    return { ok: false, message };
  } catch {
    return { ok: false, message: fallback };
  }
}

/** What /api/checkup/next sent back: done, a checked question, or null if it made no sense. */
function readNext(body: unknown): 'done' | AskedQuestion | null {
  if (body === null || typeof body !== 'object') return null;
  if ('done' in body && body.done === true) return 'done';
  return 'question' in body ? sanitizeQuestion(body.question) : null;
}

/** bohdiai.com/checkup: a conversation that ends in Alex's write-up. */
export function Checkup(): React.ReactElement {
  const { started, turns, current, writeUp } = useCheckupState();
  const [pending, setPending] = useState<Pending>({ kind: 'idle' });
  // Their earlier answer to the question on screen, after they tap Back.
  const [previous, setPrevious] = useState<Answer | null>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const requestId = useRef(0);

  function save(next: CheckupState): void {
    writeCheckup(next);
    topRef.current?.scrollIntoView({ block: 'start' });
  }

  async function fetchWriteUp(withTurns: readonly Turn[]): Promise<void> {
    const id = ++requestId.current;
    setPending({ kind: 'loading', what: 'writeup' });
    const result = await post('/api/checkup/writeup', withTurns, WRITEUP_FAILED);
    if (id !== requestId.current) return;
    const done: WriteUp | null = result.ok ? toWriteUp(result.body) : null;
    if (done === null) {
      setPending({ kind: 'error', message: result.ok ? WRITEUP_FAILED : result.message });
      return;
    }
    setPending({ kind: 'idle' });
    save({ started: true, turns: withTurns, current: null, writeUp: done });
  }

  async function fetchNext(withTurns: readonly Turn[]): Promise<void> {
    const id = ++requestId.current;
    setPending({ kind: 'loading', what: 'next' });
    const result = await post('/api/checkup/next', withTurns, NEXT_FAILED);
    if (id !== requestId.current) return;
    const next = result.ok ? readNext(result.body) : null;
    if (next === null) {
      setPending({ kind: 'error', message: result.ok ? NEXT_FAILED : result.message });
      return;
    }
    if (next === 'done') {
      await fetchWriteUp(withTurns);
      return;
    }
    setPending({ kind: 'idle' });
    save({ started: true, turns: withTurns, current: next, writeUp: null });
  }

  function start(): void {
    writeCheckup({ ...EMPTY, started: true });
    void fetchNext([]);
  }

  function answer(a: Answer): void {
    if (current === null) return;
    const withTurns = [...turns, { question: current, answer: a }];
    setPrevious(null);
    writeCheckup({ started: true, turns: withTurns, current: null, writeUp: null });
    void fetchNext(withTurns);
  }

  function back(): void {
    const last = turns[turns.length - 1];
    if (last === undefined) return;
    requestId.current += 1;
    setPending({ kind: 'idle' });
    setPrevious(last.answer);
    save({ started: true, turns: turns.slice(0, -1), current: last.question, writeUp: null });
  }

  /** Asks again for whatever was missing: the next question, or the write-up. */
  function retry(): void {
    void fetchNext(turns);
  }

  function restart(): void {
    requestId.current += 1;
    setPending({ kind: 'idle' });
    setPrevious(null);
    save(EMPTY);
  }

  // A refresh while a question was being written leaves nothing on screen.
  const stalled = started && current === null && writeUp === null && pending.kind === 'idle';

  return (
    <div className="checkup" ref={topRef}>
      <div className="mx-auto flex w-full max-w-[880px] items-center justify-between px-4 pt-5 md:px-8 md:pt-7">
        <Link
          href="/"
          aria-label="BohdiAI home"
          className="rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-honey-warm"
        >
          <Wordmark className="text-[22px]" />
        </Link>
        {started && (
          <button type="button" onClick={restart} className="text-[14px] text-muted hover:text-text">
            Start over
          </button>
        )}
      </div>

      {started && writeUp === null && (
        <div className="mx-auto mt-5 w-full max-w-[880px] px-4 md:px-8">
          <p className="sr-only">Question {turns.length + 1}</p>
          {/* A trail left behind, one ember per answer. The conversation sets its own length, so no total. */}
          <div className="checkup-trail" aria-hidden="true">
            {turns.map((t, i) => (
              <span key={`${i}-${t.question.prompt}`} data-state="done" />
            ))}
            <span data-state="now" />
          </div>
        </div>
      )}

      <main id="main" className="mx-auto flex w-full max-w-[880px] flex-1 flex-col px-4 pb-8 pt-10 md:px-8 md:pt-16">
        {!started && <Intro onStart={start} />}

        {current !== null && pending.kind === 'idle' && (
          <QuestionScreen
            key={`${turns.length}-${current.prompt}`}
            question={current}
            previous={previous}
            onAnswer={answer}
            onBack={turns.length > 0 ? back : null}
          />
        )}

        {pending.kind === 'loading' && (
          <div className="checkup-screen flex flex-1 flex-col justify-center pb-16" role="status">
            <p className="checkup-hand checkup-thinking text-[30px] leading-[1.15] text-honey-warm md:text-[36px]">
              {pending.what === 'writeup'
                ? 'Putting your write-up together…'
                : turns.length === 0
                  ? 'Pulling up a chair…'
                  : 'Thinking about what you said…'}
            </p>
            {pending.what === 'writeup' && (
              <p className="mt-3 text-[16px] text-muted">This one takes a little longer. Give it a moment.</p>
            )}
          </div>
        )}

        {(pending.kind === 'error' || stalled) && (
          <div className="checkup-screen flex flex-1 flex-col justify-center gap-6 pb-16" role="alert">
            <p className="max-w-[520px] text-[22px] leading-[1.4] text-text">
              {pending.kind === 'error' ? pending.message : 'Let’s pick up where you left off.'}
            </p>
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={retry}
                className="min-h-[52px] rounded-md bg-honey px-8 text-[17px] font-semibold text-bg transition-colors hover:bg-honey-warm"
              >
                {pending.kind === 'error' ? 'Try again' : 'Keep going'}
              </button>
              {turns.length > 0 && (
                <button type="button" onClick={back} className="text-[16px] text-muted hover:text-text">
                  Back
                </button>
              )}
            </div>
          </div>
        )}

        {writeUp !== null && <Results writeUp={writeUp} onRestart={restart} />}
      </main>
    </div>
  );
}

function Intro({ onStart }: { onStart: () => void }): React.ReactElement {
  return (
    <div className="checkup-screen flex max-w-[640px] flex-1 flex-col justify-center pb-10">
      <p className="checkup-hand text-[26px] leading-none text-honey-warm md:text-[30px]">Pull up a chair</p>
      <h1 className="mt-4 text-[38px] font-medium leading-[1.02] tracking-[-0.03em] text-text md:text-[64px]">
        Let’s find out where your making stands
      </h1>
      <p className="mt-6 text-[18px] leading-[1.6] text-text-soft md:text-[20px]">
        Tell me about your work and what you want from it. At the end you’ll get an honest write-up: what’s working,
        what isn’t, and where I’d start if I were you. Sometimes that means a website. Often it doesn’t.
      </p>
      <p className="mt-3 text-[15px] text-muted">A few minutes. Mostly taps, a little typing.</p>
      <div className="mt-9">
        <button
          type="button"
          onClick={onStart}
          className="min-h-[56px] rounded-md bg-honey px-9 text-[18px] font-semibold text-bg transition-colors hover:bg-honey-warm"
        >
          Let’s start
        </button>
      </div>
    </div>
  );
}
