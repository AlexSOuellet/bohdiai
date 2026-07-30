'use client';

import { useMemo, useState, useTransition } from 'react';
import { WALKTHROUGH_STEPS } from '@/lib/editor/walkthrough';
import { getField, type EditableField } from '@/lib/editor/editable-fields';
import type { SectionKey } from '@/lib/archetypes/main-street/families';
import { editContent, setFieldValues } from '../actions';

interface WalkthroughProps {
  /** id → current value from the draft/live envelope (seeds the "write it myself" fields). */
  values: Record<string, unknown>;
  /** First run chases completeness; a re-run is a keep-or-change tour. Framing only. */
  firstRun: boolean;
  /** Ask the host to refresh the preview after a staged change. */
  onChanged: () => void;
  /** Leave the walk (back to the look editor). */
  onExit: () => void;
}

/** Bohdi's per-section lead — what he says before the ask. Warm, first person. */
const LEADS: Record<SectionKey, { title: string; lead: string; placeholder: string }> = {
  hero: {
    title: 'Your welcome',
    lead: "This is the first thing anyone sees. Tell me what your shop is about — or just the feeling you want people to get — and I'll write your opening.",
    placeholder: 'e.g. hand-poured soy candles, calm and a little witchy',
  },
  founder: {
    title: 'Your story',
    lead: "This one has to be yours — I won't make it up. Tell me about you and your shop and I'll shape it into your story.",
    placeholder: 'Tell me in your own words…',
  },
  goods: {
    title: 'Your goods',
    lead: "What do you call your work? Give me a word or two and I'll write the heading for your products.",
    placeholder: 'e.g. small-batch candles',
  },
  collections: {
    title: 'Your collections',
    lead: 'If you group your work into collections, tell me about them — or keep it simple for now.',
    placeholder: 'e.g. seasonal scents, gift sets',
  },
  reviews: {
    title: 'Kind words',
    lead: "This is where kind words from customers live. For now let's name the section — you'll add real testimonials once you have them.",
    placeholder: 'e.g. Loved by customers',
  },
  marquee: {
    title: 'The scrolling line',
    lead: 'A few short phrases scroll across your store. Give me the spirit of your shop and I\'ll write them.',
    placeholder: 'e.g. small batch, poured by hand, made in Rhode Island',
  },
  contact: {
    title: 'Getting in touch',
    lead: "How would you like people to reach out? Tell me the vibe and I'll write your invitation to get in touch.",
    placeholder: 'e.g. friendly, happy to take custom orders',
  },
  close: {
    title: 'Your sign-off',
    lead: "The last word before someone leaves. Tell me how you'd like to send them off and I'll write it.",
    placeholder: 'e.g. warm, come back soon',
  },
  findUs: { title: 'Where to find you', lead: '', placeholder: '' },
};

/** Render one editable field for the "write it myself" path. */
function FieldEditor({
  field,
  value,
  onChange,
}: {
  field: EditableField;
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  const isLines = field.kind === 'lines';
  const text = isLines
    ? (Array.isArray(value) ? (value as string[]).join('\n') : '')
    : typeof value === 'string'
      ? value
      : '';
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wider text-muted">{field.label}</span>
      <textarea
        value={text}
        rows={isLines ? 3 : 2}
        onChange={(e) => onChange(isLines ? e.target.value.split('\n') : e.target.value)}
        className="mt-1 w-full resize-none rounded-lg border border-white/12 bg-bg-2/60 px-3 py-2 text-sm text-text placeholder:text-muted focus:border-honey/50 focus:outline-none"
      />
    </label>
  );
}

export default function Walkthrough({ values, firstRun, onChanged, onExit }: WalkthroughProps) {
  const steps = WALKTHROUGH_STEPS;
  const [index, setIndex] = useState(0);
  const [local, setLocal] = useState<Record<string, unknown>>(values);
  const [instruction, setInstruction] = useState('');
  const [mode, setMode] = useState<'ask' | 'own'>('ask');
  const [wrote, setWrote] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const step = steps[index]!;
  const lead = LEADS[step.section];
  const fields = useMemo(
    () => step.fieldIds.map((id) => getField(id)).filter((f): f is EditableField => f !== undefined),
    [step],
  );
  const questions = step.questions ?? [];
  const isLast = index === steps.length - 1;

  function resetStep() {
    setInstruction('');
    setMode('ask');
    setWrote(false);
    setMessage(null);
  }

  function goNext() {
    if (isLast) onExit();
    else {
      setIndex(index + 1);
      resetStep();
    }
  }

  function goBack() {
    if (index === 0) return;
    setIndex(index - 1);
    resetStep();
  }

  function askBohdi() {
    if (instruction.trim().length === 0) return;
    setMessage(null);
    startTransition(async () => {
      const res = await editContent(step.fieldIds, instruction, step.section);
      if (res.ok) {
        setWrote(true);
        onChanged();
      } else {
        setMessage(res.error);
      }
    });
  }

  function saveOwn() {
    const updates = fields.map((f) => ({ id: f.id, value: local[f.id] }));
    setMessage(null);
    startTransition(async () => {
      const res = await setFieldValues(updates, step.section);
      if (res.ok) {
        setWrote(true);
        onChanged();
      } else {
        setMessage(res.error);
      }
    });
  }

  return (
    <div className="flex min-h-0 flex-col px-6 py-8">
      {/* Header + progress */}
      <div>
        <div className="flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-[0.2em] text-honey-warm">
            {firstRun ? 'Make it yours' : 'A look back through your store'}
          </p>
          <button
            type="button"
            onClick={onExit}
            className="text-xs text-muted transition-colors hover:text-text-soft"
          >
            Close
          </button>
        </div>
        <div className="mt-3 flex items-center gap-3" data-progress={`${index + 1}/${steps.length}`}>
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/8">
            <div
              className="h-full rounded-full bg-honey transition-all duration-500"
              style={{ width: `${((index + 1) / steps.length) * 100}%` }}
            />
          </div>
          <span className="text-xs tabular-nums text-muted">
            Step {index + 1} of {steps.length}
          </span>
        </div>
      </div>

      {/* Bohdi leads */}
      <div className="mt-8">
        <h1 className="font-serif text-2xl text-text">{lead.title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-text-soft">{lead.lead}</p>

        {questions.length > 0 && (
          <ul className="mt-4 space-y-1.5 border-l-2 border-honey/40 pl-4">
            {questions.map((q) => (
              <li key={q} className="text-sm text-muted">
                {q}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* The ask */}
      <div className="mt-6 min-h-0 flex-1 overflow-y-auto">
        {mode === 'ask' ? (
          <>
            <textarea
              value={instruction}
              rows={questions.length > 0 ? 5 : 3}
              placeholder={lead.placeholder}
              onChange={(e) => setInstruction(e.target.value)}
              className="w-full resize-none rounded-xl border border-white/12 bg-bg-2/60 px-4 py-3 text-sm text-text placeholder:text-muted focus:border-honey/50 focus:outline-none"
            />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={askBohdi}
                disabled={pending || instruction.trim().length === 0}
                className="rounded-lg bg-honey px-4 py-2 text-sm font-medium text-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
              >
                {pending ? 'Bohdi’s writing…' : wrote ? 'Try another take' : 'Ask Bohdi to write it'}
              </button>
              <button
                type="button"
                onClick={() => setMode('own')}
                className="text-sm text-text-soft underline-offset-4 transition-colors hover:text-text hover:underline"
              >
                I’ll write it myself
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-4">
              {fields.map((f) => (
                <FieldEditor
                  key={f.id}
                  field={f}
                  value={local[f.id]}
                  onChange={(next) => setLocal((prev) => ({ ...prev, [f.id]: next }))}
                />
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={saveOwn}
                disabled={pending}
                className="rounded-lg bg-honey px-4 py-2 text-sm font-medium text-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
              >
                {pending ? 'Saving…' : 'Save my words'}
              </button>
              <button
                type="button"
                onClick={() => setMode('ask')}
                className="text-sm text-text-soft underline-offset-4 transition-colors hover:text-text hover:underline"
              >
                Let Bohdi write it instead
              </button>
            </div>
          </>
        )}

        {wrote && (
          <p className="mt-4 text-sm text-honey-warm">
            There it is — see it in your store on the right. Keep it, or ask for another take.
          </p>
        )}
        {message && <p className="mt-4 text-sm text-text-soft">{message}</p>}
      </div>

      {/* Step navigation */}
      <div className="mt-6 flex items-center justify-between border-t border-white/8 pt-5">
        <button
          type="button"
          onClick={goBack}
          disabled={index === 0}
          className="text-sm text-text-soft transition-colors hover:text-text disabled:cursor-not-allowed disabled:opacity-30"
        >
          ← Back
        </button>
        <div className="flex items-center gap-4">
          {!wrote && (
            <button type="button" onClick={goNext} className="text-sm text-muted transition-colors hover:text-text-soft">
              Skip for now
            </button>
          )}
          <button
            type="button"
            onClick={goNext}
            className="rounded-lg border border-white/12 px-4 py-2 text-sm text-text-soft transition-colors hover:border-honey/50 hover:text-honey-warm"
          >
            {isLast ? 'Finish' : wrote ? 'Keep it →' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}
