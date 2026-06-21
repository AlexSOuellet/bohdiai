'use client';

import { useMemo, useState, useTransition } from 'react';
import type { MoodKey } from '@/lib/moods';
import { FEELINGS, feelingShelf } from '@/lib/editor/look-shelf';
import { previewUrl } from '@/lib/dashboard/storefront-url';
import StyleSheetCard from './StyleSheetCard';
import { commitLook } from '../actions';

interface EditorProps {
  /** The skin currently live on the store. */
  currentSkin: string;
  /** The feeling currently live on the store. */
  currentFeeling: MoodKey;
  /** Origin of this tenant's storefront, e.g. https://ember.bohdiai.com. */
  previewOrigin: string;
}

export default function Editor({ currentSkin, currentFeeling, previewOrigin }: EditorProps) {
  // What's actually saved on the store (updates only when "Use this look" lands).
  const [liveSkin, setLiveSkin] = useState(currentSkin);
  // What the maker is trying on right now.
  const [selectedFeeling, setSelectedFeeling] = useState<MoodKey>(currentFeeling);
  const [selectedSkin, setSelectedSkin] = useState(currentSkin);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const shelf = useMemo(() => feelingShelf(selectedFeeling), [selectedFeeling]);

  function pickFeeling(feeling: MoodKey) {
    setSelectedFeeling(feeling);
    const next = feelingShelf(feeling);
    // Keep the live skin selected if it lives in this feeling; else lead with the first.
    const stay = next.find((s) => s.key === liveSkin);
    setSelectedSkin(stay ? stay.key : (next[0]?.key ?? selectedSkin));
    setMessage(null);
  }

  function commit() {
    setMessage(null);
    startTransition(async () => {
      const result = await commitLook(selectedSkin, selectedFeeling);
      if (result.ok) {
        setLiveSkin(selectedSkin);
        setMessage('Saved — this is your store now.');
      } else {
        setMessage(result.error);
      }
    });
  }

  const dirty = selectedSkin !== liveSkin;
  const src = previewUrl(previewOrigin, selectedSkin);

  return (
    <div className="grid h-[calc(100dvh-65px)] grid-cols-1 md:grid-cols-[minmax(380px,440px)_1fr]">
      {/* Load the real type faces for every skin on the current shelf. */}
      {shelf.map((s) => (
        <link key={s.key} rel="stylesheet" href={s.fontHref} />
      ))}

      {/* Controls */}
      <div className="min-h-0 overflow-y-auto border-b border-white/8 px-6 py-8 md:border-b-0 md:border-r">
        <h1 className="font-serif text-2xl text-text">Try a different feeling</h1>
        <p className="mt-2 text-sm text-muted">
          See your store in another feeling — same products, same words, a new look. Nothing changes
          until you choose <span className="text-text-soft">Use this look</span>.
        </p>

        {/* Feeling radios */}
        <div className="mt-6 flex flex-wrap gap-2" role="radiogroup" aria-label="Feeling">
          {FEELINGS.map((feeling) => {
            const active = feeling.key === selectedFeeling;
            const isLive = feeling.key === currentFeeling;
            return (
              <button
                key={feeling.key}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => pickFeeling(feeling.key)}
                className={[
                  'rounded-full border px-3.5 py-1.5 text-sm transition-colors',
                  active
                    ? 'border-honey bg-honey/15 text-honey-warm'
                    : 'border-white/12 text-text-soft hover:border-white/30 hover:text-text',
                ].join(' ')}
              >
                {feeling.label}
                {isLive && <span className="ml-1.5 text-[10px] text-muted">· now</span>}
              </button>
            );
          })}
        </div>

        {/* Style-sheet shelf for the selected feeling */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
          {shelf.map((sheet) => (
            <StyleSheetCard
              key={sheet.key}
              sheet={sheet}
              selected={sheet.key === selectedSkin}
              current={sheet.key === liveSkin}
              onSelect={(key) => {
                setSelectedSkin(key);
                setMessage(null);
              }}
            />
          ))}
        </div>
      </div>

      {/* Live preview */}
      <div className="relative flex min-h-[60vh] flex-col bg-bg-2/40 md:min-h-0">
        <div className="flex items-center justify-between gap-3 border-b border-white/8 px-5 py-3">
          <span className="text-xs text-muted">
            {dirty ? 'Preview — not saved yet' : 'Your live store'}
          </span>
          <div className="flex items-center gap-3">
            {message && <span className="text-xs text-text-soft">{message}</span>}
            <button
              type="button"
              onClick={commit}
              disabled={!dirty || pending}
              className="rounded-lg bg-honey px-4 py-1.5 text-sm font-medium text-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
            >
              {pending ? 'Saving…' : 'Use this look'}
            </button>
          </div>
        </div>
        <iframe
          key={src}
          src={src}
          title="Storefront preview"
          className="min-h-0 w-full flex-1 border-0 bg-white"
        />
      </div>
    </div>
  );
}
