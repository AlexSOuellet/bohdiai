'use client';

import { useMemo, useState, useTransition } from 'react';
import { getField, type EditableField } from '@/lib/editor/editable-fields';
import type { SectionKey } from '@/lib/archetypes/main-street/families';
import type { SectionClass } from '@/lib/editor/walkthrough';
import type { Turn } from '@/lib/editor/conversation';
import {
  converseSection,
  writeSectionFromConversation,
  setFieldValues,
  keepSection,
  toggleSection,
  setHeroIntro,
} from '../actions';

/** Bohdi's opening for each section — he shows what he built and invites the maker in.
 *  Deep sections (opening, story) open a real conversation; light sections open a quick
 *  react-and-go. `placeholder` seeds the maker's reply box. */
const INTRO: Record<SectionKey, { title: string; opener: string; placeholder: string }> = {
  hero: {
    title: 'Your opening',
    opener:
      "This is the first thing anyone sees — I took a first swing at it, there on the right. What feels right to you, and what's off?",
    placeholder: 'Tell me what you think…',
  },
  founder: {
    title: 'Your story',
    opener:
      "This part has to be yours — I won't make it up. Take a look at what's there, then tell me: how did all this start for you?",
    placeholder: 'Tell me in your own words…',
  },
  goods: {
    title: 'Your goods',
    opener: "Here's the heading I gave your products. Does it fit what you actually make, or should we change it?",
    placeholder: 'e.g. I call them small-batch candles',
  },
  collections: {
    title: 'Your collections',
    opener: 'If you group your work into collections, here’s a start. Tell me about them, keep this, or turn it off.',
    placeholder: 'e.g. seasonal scents, gift sets',
  },
  reviews: {
    title: 'Kind words',
    opener:
      "This is where kind words from customers live. You can name the section now and add real ones later — or turn it off until you have some.",
    placeholder: 'e.g. call it "Loved by locals"',
  },
  marquee: {
    title: 'The scrolling line',
    opener: "A few short phrases scroll across your store. Here's what I wrote — want them as they are, or different?",
    placeholder: 'e.g. small batch, poured by hand',
  },
  contact: {
    title: 'Getting in touch',
    opener: "Here's how I'm inviting people to reach out. Keep it, or tell me how you'd like it to sound?",
    placeholder: 'e.g. friendly, happy to take custom orders',
  },
  close: {
    title: 'Your sign-off',
    opener: "The last word before someone leaves. Here's mine — want it warmer, shorter, or in your own words?",
    placeholder: 'e.g. warm, come back soon',
  },
  findUs: {
    title: 'Where to find you',
    opener: 'This is where you show the markets and events where people can find you in person.',
    placeholder: '',
  },
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
    ? Array.isArray(value)
      ? (value as string[]).join('\n')
      : ''
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

/** One line of the conversation, as a chat bubble (Bohdi left, the maker right). */
function Bubble({ turn }: { turn: Turn }) {
  const mine = turn.speaker === 'maker';
  return (
    <div className={mine ? 'flex justify-end' : 'flex justify-start'}>
      <div
        className={
          mine
            ? 'max-w-[85%] rounded-2xl rounded-br-sm bg-honey/15 px-4 py-2.5 text-sm leading-relaxed text-text'
            : 'max-w-[85%] rounded-2xl rounded-bl-sm bg-white/5 px-4 py-2.5 text-sm leading-relaxed text-text-soft'
        }
      >
        {turn.text}
      </div>
    </div>
  );
}

/** What the maker has done with this section — drives the confirmation copy and which
 *  controls show. `off` collapses the section to a turn-back-on affordance. */
type Status = 'none' | 'wrote' | 'kept' | 'off';

export interface SectionEditorProps {
  /** The section being made yours (drives the opener + which fields the maker can type). */
  section: SectionKey;
  /** How this section may be resolved (drives the keep / turn-off controls). */
  cls: SectionClass;
  /** Whether "keep as built" is offered (false for reviews — D70). */
  keepable: boolean;
  /** The editable text field ids this section rewrites (the "write it myself" path). */
  fieldIds: readonly string[];
  /** id → current value, seeding the "write it myself" fields. */
  values: Record<string, unknown>;
  /** Whether the section is currently turned off (seeds the control state). */
  hidden?: boolean | undefined;
  /** Hero only — whether the first-run intro is currently on (seeds the intro control). */
  heroIntroOn?: boolean | undefined;
  /** Report resolution up so the host can gate Next: true once made/kept/off, false
   *  again if the maker turns a section back on. */
  onResolved: (resolved: boolean) => void;
  /** Ask the host to refresh the preview after a staged change. */
  onChanged: () => void;
}

/** The reusable per-section editor — a session with Bohdi (D69). He shows what he
 *  built, the maker reacts, and on a story section it's a real back-and-forth that
 *  pulls their story out before he writes it; on a light section it's a quick
 *  react-and-go. The maker can always write it themselves verbatim (D68), and can keep
 *  or turn off the sections that allow it. Content-only: writes text fields to the
 *  draft via the same actions; never touches look, structure, or link destinations. */
export default function SectionEditor({
  section,
  cls,
  keepable,
  fieldIds,
  values,
  hidden,
  heroIntroOn,
  onResolved,
  onChanged,
}: SectionEditorProps) {
  const intro = INTRO[section];
  const fields = useMemo(
    () => fieldIds.map((id) => getField(id)).filter((f): f is EditableField => f !== undefined),
    [fieldIds],
  );

  // The conversation starts with Bohdi's opener; the maker's replies and his follow-ups
  // append as they talk.
  const [convo, setConvo] = useState<Turn[]>([{ speaker: 'bohdi', text: intro.opener }]);
  const [reply, setReply] = useState('');
  const [mode, setMode] = useState<'talk' | 'own'>('talk');
  const [local, setLocal] = useState<Record<string, unknown>>(values);
  const [status, setStatus] = useState<Status>(hidden ? 'off' : 'none');
  const [introOn, setIntroOn] = useState(heroIntroOn ?? true);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const saidSomething = convo.some((t) => t.speaker === 'maker');
  const wrote = status === 'wrote';

  function send() {
    const text = reply.trim();
    if (text.length === 0) return;
    const next: Turn[] = [...convo, { speaker: 'maker', text }];
    setConvo(next);
    setReply('');
    setMessage(null);
    startTransition(async () => {
      const res = await converseSection(section, next);
      if (res.ok) setConvo([...next, { speaker: 'bohdi', text: res.turn.message }]);
      else setMessage(res.error);
    });
  }

  function writeIt() {
    setMessage(null);
    startTransition(async () => {
      const res = await writeSectionFromConversation(section, convo);
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

  // Hero only — turn the first-run intro play on or off (D54). Off loads the store
  // straight to the resting hero; turning it off is a deliberate choice that resolves
  // the hero step.
  function toggleIntro(on: boolean) {
    setMessage(null);
    startTransition(async () => {
      const res = await setHeroIntro(on);
      if (res.ok) {
        setIntroOn(on);
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
        <h1 className="font-serif text-2xl text-text">{intro.title}</h1>
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
      <h1 className="font-serif text-2xl text-text">{intro.title}</h1>

      {mode === 'talk' ? (
        <div className="mt-4">
          {/* The conversation so far */}
          <div className="space-y-3">
            {convo.map((t, i) => (
              <Bubble key={i} turn={t} />
            ))}
          </div>

          {/* The maker's reply box */}
          <div className="mt-4">
            <textarea
              value={reply}
              rows={3}
              placeholder={intro.placeholder}
              onChange={(e) => setReply(e.target.value)}
              className="w-full resize-none rounded-xl border border-white/12 bg-bg-2/60 px-4 py-3 text-sm text-text placeholder:text-muted focus:border-honey/50 focus:outline-none"
            />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={send}
                disabled={pending || reply.trim().length === 0}
                className="rounded-lg border border-white/12 px-4 py-2 text-sm text-text-soft transition-colors hover:border-honey/50 hover:text-honey-warm disabled:cursor-not-allowed disabled:opacity-30"
              >
                {pending ? 'Bohdi’s thinking…' : 'Send'}
              </button>
              {saidSomething && (
                <button
                  type="button"
                  onClick={writeIt}
                  disabled={pending}
                  className="rounded-lg bg-honey px-4 py-2 text-sm font-medium text-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  {wrote ? 'Write it again' : 'Write it up'}
                </button>
              )}
              <button
                type="button"
                onClick={() => setMode('own')}
                className="text-sm text-text-soft underline-offset-4 transition-colors hover:text-text hover:underline"
              >
                I’ll write it myself
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4">
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
              onClick={() => setMode('talk')}
              className="text-sm text-text-soft underline-offset-4 transition-colors hover:text-text hover:underline"
            >
              Talk it through with Bohdi instead
            </button>
          </div>
        </div>
      )}

      {wrote && (
        <p className="mt-4 text-sm text-honey-warm">
          There it is — see it in your store on the right. Keep talking to refine it, or move on.
        </p>
      )}
      {status === 'kept' && (
        <p className="mt-4 text-sm text-honey-warm">Kept — this section stays as it is.</p>
      )}
      {message && <p className="mt-4 text-sm text-text-soft">{message}</p>}

      {/* Hero only — the first-run intro play (D54). Keep it, change the words above,
          or turn it off so the store loads straight to the resting hero. */}
      {section === 'hero' && (
        <div className="mt-6 border-t border-white/8 pt-5">
          <p className="text-[11px] uppercase tracking-wider text-muted">The opening intro</p>
          <p className="mt-2 text-sm leading-relaxed text-text-soft">
            On someone’s first visit, your opening lines fade in over the hero, then settle into your store.
            {introOn
              ? ' Keep it, change the words above, or turn it off.'
              : ' It’s off — your store loads straight to the hero every time.'}
          </p>
          <button
            type="button"
            onClick={() => toggleIntro(!introOn)}
            disabled={pending}
            className="mt-4 rounded-lg border border-white/12 px-4 py-2 text-sm text-text-soft transition-colors hover:border-honey/50 hover:text-honey-warm disabled:opacity-40"
          >
            {introOn ? 'Turn the intro off' : 'Turn the intro back on'}
          </button>
        </div>
      )}

      {/* Keep / turn-off — the resolutions besides an edit. Must-change sections
          (story, products) show neither; they can only be made yours. */}
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
