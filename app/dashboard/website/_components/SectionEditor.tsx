'use client';

import { useMemo, useState, useTransition } from 'react';
import { getField, type EditableField } from '@/lib/editor/editable-fields';
import type { SectionKey } from '@/lib/archetypes/main-street/families';
import type { MomentPlayMode } from '@/lib/archetypes/main-street/moment-gate';
import type { SectionClass } from '@/lib/editor/walkthrough';
import type { SectionResolution } from '@/lib/editor/section-state';
import type { Turn } from '@/lib/editor/conversation';
import RowsEditor, { type RowColumn } from './RowsEditor';
import ProductsEditor, { type EditorProduct } from './ProductsEditor';
import CollectionsEditor, { type EditorCollection } from './CollectionsEditor';
import {
  converseSection,
  writeSectionFromConversation,
  setFieldValues,
  keepSection,
  toggleSection,
  setMomentPlayMode,
  setReviewQuotes,
  setFindUsRows,
  saveWalkProduct,
  updateWalkProduct,
  removeWalkProduct,
  uploadProductPhoto,
  draftProductCopyAction,
  createWalkCollection,
  updateWalkCollection,
  removeWalkCollection,
} from '../actions';

/** The two sections the maker fills with real ROWS rather than a conversation —
 *  testimonials they were sent, and the dates they'll be somewhere in person. Each
 *  is real-or-off (D70/D71): no "keep the fakes". */
const ROW_COLUMNS: Partial<Record<SectionKey, readonly RowColumn[]>> = {
  reviews: [
    { key: 'quote', label: 'What they said', kind: 'textarea', required: true, placeholder: 'Paste a real review a customer left you' },
    { key: 'author', label: 'Who said it', kind: 'text', required: true, placeholder: 'e.g. Dana R.' },
    { key: 'location', label: 'Where they’re from', kind: 'text', placeholder: 'e.g. Providence, RI' },
  ],
  findUs: [
    { key: 'where', label: 'Place / event', kind: 'text', required: true, placeholder: 'e.g. Providence Winter Market' },
    { key: 'date', label: 'Date', kind: 'date', required: true },
    { key: 'time', label: 'Time', kind: 'text', required: true, placeholder: 'e.g. 9am – 2pm' },
  ],
};

/** Map the section's current envelope value into the rows editor's seed rows. Reviews
 *  seed only once they're the maker's own (a made section on resume) — we never
 *  pre-fill the editor with the seeded fake quotes. Dates always seed from the current
 *  rows (the sample schedule is meant to be edited, D38). */
function seedRows(section: SectionKey, value: unknown, resolution: SectionResolution | undefined): Record<string, string>[] {
  if (!Array.isArray(value)) return [];
  if (section === 'reviews') {
    if (resolution !== 'made') return [];
    return value.map((r) => {
      const rec = (r ?? {}) as Record<string, unknown>;
      return {
        quote: typeof rec['quote'] === 'string' ? rec['quote'] : '',
        author: typeof rec['author'] === 'string' ? rec['author'] : '',
        location: typeof rec['location'] === 'string' ? rec['location'] : '',
      };
    });
  }
  // findUs
  return value.map((r) => {
    const rec = (r ?? {}) as Record<string, unknown>;
    return {
      where: typeof rec['where'] === 'string' ? rec['where'] : '',
      date: typeof rec['date'] === 'string' ? rec['date'] : '',
      time: typeof rec['time'] === 'string' ? rec['time'] : '',
    };
  });
}

/** Bohdi's opening for each section — he shows what he built and invites the maker in.
 *  Deep sections (opening, story) open a real conversation; light sections open a quick
 *  react-and-go. `placeholder` seeds the maker's reply box. The `hero` entry is the
 *  resting top of the store (the Hero step); the Moment step uses `MOMENT_INTRO`. */
const INTRO: Record<SectionKey, { title: string; opener: string; placeholder: string }> = {
  hero: {
    title: 'The top of your store',
    opener:
      "Now the part that stays put: the very top of your store, where your shop name sits with a short line under it and a button. It’s what every visitor lands on. Read it over on the right — keep it if it’s right, or tell me what to change.",
    placeholder: 'e.g. a little warmer, or shorter',
  },
  founder: {
    title: 'Your story',
    opener:
      "This is the one part I can't write for you — it has to be true, so it has to come from you. Don't worry about saying it well, that's my job. I'll ask a few small things and pull the story out. First one: take me back to when you made your very first piece — where were you, and what got you started?",
    placeholder: 'e.g. it started at my kitchen table…',
  },
  goods: {
    title: 'Your goods',
    opener:
      "This is your shop floor — the part most visitors come for. Right now it's showing a few stand-ins I made up so you could picture it. Add your own real products below and they take their place. Upload a photo, set a price, and either write the words yourself or ask me to help. One is enough to move on — add as many as you like.",
    placeholder: '',
  },
  collections: {
    title: 'Your collections',
    opener:
      "Collections are groups of your products — seasonal scents, gift sets, best-sellers. Name a group and tick which of your products go in it, and it becomes its own section a shopper can browse. Don't group your work? Turn this off.",
    placeholder: '',
  },
  reviews: {
    title: 'Kind words',
    opener:
      "This is a curated wall of your actual reviews — real words from real customers, and you choose which ones to show. Paste them in below exactly as they came to you. It's fine to show only your best; what's not fine is making them up, so they have to be ones people genuinely sent you. No customers yet? Turn the section off for now — it can't go live with made-up reviews.",
    placeholder: 'e.g. call it "Loved by locals"',
  },
  marquee: {
    title: 'The scrolling line',
    opener:
      "A little band of short phrases scrolls across your store — small batch, poured by hand, that sort of thing — a quick banner of what makes yours yours. Here's what I wrote, on the right. Keep them, or tell me what they should say.",
    placeholder: 'e.g. small batch, poured by hand',
  },
  contact: {
    title: 'Getting in touch',
    opener:
      "This is where you invite people to get in touch — for a question, a custom order, or just to say hello. Here's how I've worded it, on the right. Keep it, or tell me how you'd like it to sound.",
    placeholder: 'e.g. friendly, happy to take custom orders',
  },
  close: {
    title: 'Your sign-off',
    opener:
      "The very bottom of your store — the last thing someone reads before they go. Here's my sign-off, on the right. Keep it, make it warmer or shorter, or put it in your own words.",
    placeholder: 'e.g. warm, come back soon',
  },
  findUs: {
    title: 'Where to find you',
    opener:
      "If you sell in person — markets, fairs, popups — this is where those dates show, so a shopper knows where to catch you. Put in your real ones below (the place name is what your store's “get directions” link points to), or turn the section off if you're online only. It can't go live with the sample dates.",
    placeholder: '',
  },
};

/** The Moment step opener — the Cozy-only fading opening lines. Its own copy (not
 *  keyed by section, since it shares the hero section with the resting Hero step). */
const MOMENT_INTRO = {
  opener:
    "These are the words that fade in when your store opens. Keep them as they are, or tell me what you'd rather they say?",
  placeholder: 'e.g. tell me what they should say',
} as const;

/** How often the Moment plays — the maker's choice on the Moment step, in plain
 *  words rather than a designer toggle (D54). */
const PLAY_OPTIONS: readonly { mode: MomentPlayMode; label: string }[] = [
  { mode: 'once', label: 'The first time someone visits' },
  { mode: 'always', label: 'Every time someone visits' },
  { mode: 'off', label: 'Don’t play it — open straight to my shop' },
];

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
  /** The maker-facing step title (shown as the heading). */
  title: string;
  /** How this section may be resolved (drives the keep / turn-off controls). */
  cls: SectionClass;
  /** Whether "keep as built" is offered (false for reviews — D70). */
  keepable: boolean;
  /** The editable text field ids this step rewrites (the "write it myself" path, and
   *  the scope of a conversation write). */
  fieldIds: readonly string[];
  /** id → current value, seeding the "write it myself" fields. */
  values: Record<string, unknown>;
  /** Goods step only — the maker's real products so far (seeds the products editor).
   *  Also passed to the collections step as the pool of products to group. */
  initialProducts?: readonly EditorProduct[] | undefined;
  /** Collections step only — the maker's real collections so far. */
  initialCollections?: readonly EditorCollection[] | undefined;
  /** Whether the section is currently turned off (seeds the control state). */
  hidden?: boolean | undefined;
  /** The section's resolution in the draft, so a section the maker already finished in
   *  an earlier sitting opens marked completed (with its content + make-changes controls
   *  still there), rather than looking untouched. Defaults to unresolved (a fresh step). */
  resolution?: SectionResolution | undefined;
  /** The Moment step — the Cozy-only opening play. Shows the how-often-it-plays
   *  control + the feeling explanation instead of the plain section controls. */
  isMoment?: boolean | undefined;
  /** How often the Moment currently plays (seeds the Moment step's control). */
  momentPlayMode?: MomentPlayMode | undefined;
  /** The maker's public feeling label (e.g. "Cozy"), named in the Moment explanation. */
  moodLabel?: string | undefined;
  /** Reviews step only — whether the maker's feeling uses the star-RATING layout (the
   *  only one that shows an overall number). True → the reviews step offers optional
   *  real-rating fields; false → no rating field (the other layouts have no number). */
  reviewsShowsRating?: boolean | undefined;
  /** Reviews step only — the current overall rating on the store, to seed the rating
   *  fields when the maker has already made them theirs. */
  reviewsSummary?: { score?: string | undefined; count?: string | undefined } | undefined;
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
  title,
  cls,
  keepable,
  fieldIds,
  values,
  initialProducts = [],
  initialCollections = [],
  hidden,
  resolution,
  isMoment = false,
  momentPlayMode,
  moodLabel,
  reviewsShowsRating = false,
  reviewsSummary,
  onResolved,
  onChanged,
}: SectionEditorProps) {
  const intro = isMoment ? MOMENT_INTRO : INTRO[section];
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
  // Seed the control state from the draft: a section finished earlier opens marked
  // completed (made → wrote, kept → kept, hidden → off) so the maker sees it's done and
  // can make changes, rather than a blank slate. `hidden` stays a fallback for callers
  // that don't pass a resolution.
  const initialStatus: Status =
    resolution === 'made'
      ? 'wrote'
      : resolution === 'kept'
        ? 'kept'
        : resolution === 'hidden' || hidden
          ? 'off'
          : 'none';
  const [status, setStatus] = useState<Status>(initialStatus);
  const [playMode, setPlayMode] = useState<MomentPlayMode>(momentPlayMode ?? 'once');
  // Reviews rating (star-rating layout only): the maker's real overall figure. Seed
  // from the current summary ONLY when reviews are already the maker's own — never
  // prefill a build-time invented rating.
  const seededSummary = resolution === 'made' ? reviewsSummary : undefined;
  const [ratingScore, setRatingScore] = useState(seededSummary?.score ?? '');
  const [ratingCount, setRatingCount] = useState(seededSummary?.count ?? '');
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const saidSomething = convo.some((t) => t.speaker === 'maker');
  const wrote = status === 'wrote';

  // The Moment's opening lines, read from the "write it myself" working copy so the
  // maker can always READ what fades in (in the preview the lines fade away, leaving
  // nothing to decide against). Reflects verbatim edits live.
  const momentLines = Array.isArray(local['moment.story']) ? (local['moment.story'] as string[]) : [];

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
      const res = await writeSectionFromConversation(section, convo, fieldIds);
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

  // Moment step only — set how often the opening plays (once / always / off). Any
  // choice is a deliberate resolution of the Moment step (D54).
  function choosePlay(mode: MomentPlayMode) {
    setMessage(null);
    startTransition(async () => {
      const res = await setMomentPlayMode(mode);
      if (res.ok) {
        setPlayMode(mode);
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
        <h1 className="font-serif text-2xl text-text">{title}</h1>
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

  // Goods — the maker's real products (their own photos, D68). Not a Bohdi conversation
  // and not the rows editor: its own products manager. Saving the first real product
  // clears the AI placeholders (server-side) and resolves the step.
  if (section === 'goods') {
    return (
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-serif text-2xl text-text">{title}</h1>
          {initialStatus !== 'none' && (
            <span className="rounded-full border border-honey/40 bg-honey/10 px-2.5 py-0.5 text-[11px] text-honey-warm">
              ✓ Completed
            </span>
          )}
        </div>
        <p className="mt-3 text-sm leading-relaxed text-text-soft">{intro.opener}</p>
        <ProductsEditor
          initialProducts={initialProducts}
          onUpload={(file) => {
            const fd = new FormData();
            fd.set('file', file);
            return uploadProductPhoto(fd);
          }}
          onSave={(form) => saveWalkProduct(form)}
          onUpdate={(id, form) => updateWalkProduct(id, form)}
          onRemove={(id) => removeWalkProduct(id)}
          onDraftCopy={(name, hint) => draftProductCopyAction(name, hint)}
          onResolved={onResolved}
          onChanged={onChanged}
        />
        {message && <p className="mt-4 text-sm text-text-soft">{message}</p>}
      </div>
    );
  }

  // Collections — the maker groups their real products into their own collections
  // (real-or-off). Making the first real one clears the seeded ones server-side.
  if (section === 'collections') {
    return (
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-serif text-2xl text-text">{title}</h1>
          {initialStatus !== 'none' && (
            <span className="rounded-full border border-honey/40 bg-honey/10 px-2.5 py-0.5 text-[11px] text-honey-warm">
              ✓ Completed
            </span>
          )}
        </div>
        <p className="mt-3 text-sm leading-relaxed text-text-soft">{intro.opener}</p>
        <CollectionsEditor
          initialCollections={initialCollections}
          availableProducts={initialProducts.map((p) => ({ id: p.id, name: p.name, imageUrl: p.imageUrl }))}
          onSave={(form) => createWalkCollection(form)}
          onUpdate={(id, form) => updateWalkCollection(id, form)}
          onRemove={(id) => removeWalkCollection(id)}
          onResolved={onResolved}
          onChanged={onChanged}
        />
        {message && <p className="mt-4 text-sm text-text-soft">{message}</p>}
        {canTurnOff && (
          <div className="mt-6 border-t border-white/8 pt-5">
            <button
              type="button"
              onClick={() => setOff(true)}
              disabled={pending}
              className="text-sm text-muted underline-offset-4 transition-colors hover:text-text-soft hover:underline disabled:opacity-40"
            >
              I don’t group my work — turn this section off
            </button>
          </div>
        )}
      </div>
    );
  }

  // Reviews + find-us are made of real ROWS the maker types (real-or-off, D70/D71),
  // not a Bohdi conversation. Render the rows editor + a turn-off, and nothing else.
  const rowColumns = ROW_COLUMNS[section];
  if (rowColumns !== undefined) {
    const seedId = section === 'reviews' ? 'reviews.items' : 'findUs.rows';
    // Reviews on a star-rating layout also carry an OPTIONAL real overall rating; every
    // other layout (and find-us) has no such number. A blank/partial rating saves as
    // none, which strips any build-time invented figure.
    const showRating = section === 'reviews' && reviewsShowsRating;
    const onSaveRows =
      section === 'reviews'
        ? (rows: Record<string, string>[]) => setReviewQuotes(rows, showRating ? { score: ratingScore, count: ratingCount } : undefined)
        : (rows: Record<string, string>[]) => setFindUsRows(rows);
    return (
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-serif text-2xl text-text">{title}</h1>
          {initialStatus !== 'none' && (
            <span className="rounded-full border border-honey/40 bg-honey/10 px-2.5 py-0.5 text-[11px] text-honey-warm">
              ✓ Completed
            </span>
          )}
        </div>
        <p className="mt-3 text-sm leading-relaxed text-text-soft">{intro.opener}</p>

        {showRating && (
          <div className="mt-4 rounded-xl border border-white/12 bg-bg-2/40 p-4">
            <p className="text-[11px] uppercase tracking-wider text-muted">Your overall rating (optional)</p>
            <p className="mt-1 text-sm leading-relaxed text-text-soft">
              Your store’s look shows a star rating up top. If you have a real one — your Etsy or Google
              score — put it here. Leave both blank and it just shows stars over your quotes, no number.
            </p>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-[11px] uppercase tracking-wider text-muted">Rating</span>
                <input
                  type="text"
                  value={ratingScore}
                  placeholder="e.g. 4.9 out of 5"
                  onChange={(e) => setRatingScore(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/12 bg-bg-2/60 px-3 py-2 text-sm text-text placeholder:text-muted focus:border-honey/50 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="text-[11px] uppercase tracking-wider text-muted">How many reviews</span>
                <input
                  type="text"
                  value={ratingCount}
                  placeholder="e.g. 200+ happy customers"
                  onChange={(e) => setRatingCount(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/12 bg-bg-2/60 px-3 py-2 text-sm text-text placeholder:text-muted focus:border-honey/50 focus:outline-none"
                />
              </label>
            </div>
          </div>
        )}

        <RowsEditor
          columns={rowColumns}
          initialRows={seedRows(section, values[seedId], resolution)}
          addLabel={section === 'reviews' ? 'Add another review' : 'Add another date'}
          saveLabel={section === 'reviews' ? 'Save my reviews' : 'Save my dates'}
          onSave={onSaveRows}
          onSaved={() => {
            setStatus('wrote');
            onResolved(true);
            onChanged();
          }}
        />

        {message && <p className="mt-4 text-sm text-text-soft">{message}</p>}

        {canTurnOff && (
          <div className="mt-6 border-t border-white/8 pt-5">
            <button
              type="button"
              onClick={() => setOff(true)}
              disabled={pending}
              className="text-sm text-muted underline-offset-4 transition-colors hover:text-text-soft hover:underline disabled:opacity-40"
            >
              I don’t have any yet — turn this section off
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-serif text-2xl text-text">{title}</h1>
        {/* A section finished in an earlier sitting opens marked done — the maker can
            breeze past it or make changes right here. */}
        {initialStatus !== 'none' && (
          <span className="rounded-full border border-honey/40 bg-honey/10 px-2.5 py-0.5 text-[11px] text-honey-warm">
            ✓ Completed
          </span>
        )}
      </div>

      {/* Moment step — explain why it's here (tied to the feeling), then tell the
          maker plainly what to do so it's direction, not a bare menu. */}
      {isMoment && (
        <>
          <p className="mt-3 text-sm leading-relaxed text-text-soft">
            {moodLabel
              ? `Because you picked the ${moodLabel} feel, your store opens with a little moment — your first words fade in, one line at a time, then the shop settles into view. It’s the one thing the ${moodLabel} feel does that the others don’t.`
              : 'Your store opens with a little moment — your first words fade in, one line at a time, then the shop settles into view.'}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-text-soft">
            Most makers keep it. If the lines below don’t sound like you, reword them — then choose how
            often it plays. Watch it any time with “Play it again” on the right.
          </p>
        </>
      )}

      {/* Moment step — the current lines, always readable (in the preview they fade
          away and leave nothing to decide against). */}
      {isMoment && (
        <div className="mt-4 rounded-lg border border-white/10 bg-bg-2/40 px-4 py-3">
          <p className="text-[11px] uppercase tracking-wider text-muted">Right now it opens with</p>
          <div className="mt-2 space-y-1">
            {momentLines.length > 0 ? (
              momentLines.map((line, i) => (
                <p key={i} className="font-serif text-base italic leading-relaxed text-text">
                  “{line}”
                </p>
              ))
            ) : (
              <p className="text-sm text-text-soft">No opening lines yet.</p>
            )}
          </div>
        </div>
      )}

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

      {/* Moment step only — how often the opening plays (D54). Keep/reword the lines
          above; this sets the frequency, and any choice resolves the Moment step. */}
      {isMoment && (
        <div className="mt-6 border-t border-white/8 pt-5">
          <p className="text-[11px] uppercase tracking-wider text-muted">How often it plays</p>
          <div className="mt-3 flex flex-col gap-2">
            {PLAY_OPTIONS.map((opt) => {
              const active = playMode === opt.mode;
              return (
                <button
                  key={opt.mode}
                  type="button"
                  onClick={() => choosePlay(opt.mode)}
                  disabled={pending}
                  aria-pressed={active}
                  className={
                    active
                      ? 'rounded-lg border border-honey/60 bg-honey/10 px-4 py-2.5 text-left text-sm text-honey-warm transition-colors disabled:opacity-40'
                      : 'rounded-lg border border-white/12 px-4 py-2.5 text-left text-sm text-text-soft transition-colors hover:border-honey/50 hover:text-honey-warm disabled:opacity-40'
                  }
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
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
