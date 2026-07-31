'use client';

import { useMemo, useState, useTransition } from 'react';
import { getField, type EditableField } from '@/lib/editor/editable-fields';
import type { SectionKey } from '@/lib/archetypes/main-street/families';
import type { SectionClass } from '@/lib/editor/walkthrough';
import { editContent, setFieldValues, keepSection, toggleSection } from '../actions';

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

/** What the maker has done with a section this session — drives the confirmation
 *  copy and which controls show. `off` hides the edit area entirely. */
type Status = 'none' | 'wrote' | 'kept' | 'off';

export interface SectionEditorProps {
  /** The section being edited (drives the lead + which fields show). */
  section: SectionKey;
  /** How this section may be resolved (drives the keep/turn-off controls). */
  cls: SectionClass;
  /** Whether "keep as built" is offered (false for reviews — D70). */
  keepable: boolean;
  /** The editable text field ids this section rewrites. */
  fieldIds: readonly string[];
  /** id → current value, seeding the "write it myself" fields. */
  values: Record<string, unknown>;
  /** The targeted questions for a personal section (story), if any. */
  questions?: readonly string[] | undefined;
  /** Whether the section is currently turned off (seeds the control state). */
  hidden?: boolean | undefined;
  /** Report resolution up so the host can gate Next: true once made/kept/off,
   *  false again if the maker turns a section back on. */
  onResolved: (resolved: boolean) => void;
  /** Ask the host to refresh the preview after a staged change. */
  onChanged: () => void;
}

/** The reusable per-section editor — Bohdi writes it from a direction, or the maker
 *  types it verbatim, or (for optional sections) keeps or turns it off. Hosted by
 *  the walk (gated sequence) and the editor's content area (free navigation).
 *  Content-only: writes text fields to the draft via the same actions; never
 *  touches look, structure, or link destinations. */
export default function SectionEditor({
  section,
  cls,
  keepable,
  fieldIds,
  values,
  questions,
  hidden,
  onResolved,
  onChanged,
}: SectionEditorProps) {
  const lead = LEADS[section];
  const fields = useMemo(
    () => fieldIds.map((id) => getField(id)).filter((f): f is EditableField => f !== undefined),
    [fieldIds],
  );
  const [instruction, setInstruction] = useState('');
  const [mode, setMode] = useState<'ask' | 'own'>('ask');
  const [local, setLocal] = useState<Record<string, unknown>>(values);
  const [status, setStatus] = useState<Status>(hidden ? 'off' : 'none');
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const wrote = status === 'wrote';

  function askBohdi() {
    if (instruction.trim().length === 0) return;
    setMessage(null);
    startTransition(async () => {
      const res = await editContent(fieldIds, instruction, section);
      if (res.ok) {
        setStatus('wrote');
        onResolved(true);
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
      const res = await setFieldValues(updates, section);
      if (res.ok) {
        setStatus('wrote');
        onResolved(true);
        onChanged();
      } else {
        setMessage(res.error);
      }
    });
  }

  function keep() {
    setMessage(null);
    startTransition(async () => {
      const res = await keepSection(section);
      if (res.ok) {
        setStatus('kept');
        onResolved(true);
      } else {
        setMessage(res.error);
      }
    });
  }

  function setOff(off: boolean) {
    setMessage(null);
    startTransition(async () => {
      const res = await toggleSection(section, off);
      if (res.ok) {
        setStatus(off ? 'off' : 'none');
        onResolved(off);
        onChanged();
      } else {
        setMessage(res.error);
      }
    });
  }

  // A turned-off section collapses to a single "turn it back on" affordance.
  if (status === 'off') {
    return (
      <div>
        <h1 className="font-serif text-2xl text-text">{lead.title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-text-soft">
          This section is turned off — it won’t show on your store.
        </p>
        <button
          type="button"
          onClick={() => setOff(false)}
          disabled={pending}
          className="mt-6 rounded-lg border border-white/12 px-4 py-2 text-sm text-text-soft transition-colors hover:border-honey/50 hover:text-honey-warm disabled:opacity-40"
        >
          Turn it back on
        </button>
        {message && <p className="mt-4 text-sm text-text-soft">{message}</p>}
      </div>
    );
  }

  const canKeep = keepable && cls !== 'must-change';
  const canTurnOff = cls === 'optional';

  return (
    <div>
      <h1 className="font-serif text-2xl text-text">{lead.title}</h1>
      <p className="mt-3 text-sm leading-relaxed text-text-soft">{lead.lead}</p>

      {questions && questions.length > 0 && (
        <ul className="mt-4 space-y-1.5 border-l-2 border-honey/40 pl-4">
          {questions.map((q) => (
            <li key={q} className="text-sm text-muted">
              {q}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6">
        {mode === 'ask' ? (
          <>
            <textarea
              value={instruction}
              rows={questions && questions.length > 0 ? 5 : 3}
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
        {status === 'kept' && (
          <p className="mt-4 text-sm text-honey-warm">Kept — this section stays as it is.</p>
        )}
        {message && <p className="mt-4 text-sm text-text-soft">{message}</p>}
      </div>

      {/* Keep / turn-off — the resolutions besides an edit. Must-change sections
          (story, products) show neither; they can only be edited. */}
      {(canKeep || canTurnOff) && (
        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-white/8 pt-5">
          {canKeep && (
            <button
              type="button"
              onClick={keep}
              disabled={pending}
              className="rounded-lg border border-white/12 px-4 py-2 text-sm text-text-soft transition-colors hover:border-honey/50 hover:text-honey-warm disabled:opacity-40"
            >
              Keep as built
            </button>
          )}
          {canTurnOff && (
            <button
              type="button"
              onClick={() => setOff(true)}
              disabled={pending}
              className="text-sm text-muted underline-offset-4 transition-colors hover:text-text-soft hover:underline disabled:opacity-40"
            >
              Turn it off
            </button>
          )}
        </div>
      )}
    </div>
  );
}
