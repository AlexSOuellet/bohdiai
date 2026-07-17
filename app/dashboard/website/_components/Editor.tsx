'use client';

import { useMemo, useState, useTransition } from 'react';
import type { MoodKey } from '@/lib/moods';
import { FEELINGS, feelingShelf } from '@/lib/editor/look-shelf';
import { previewUrl } from '@/lib/dashboard/storefront-url';
import type { StoredTexture } from '@/lib/editor/texture';
import { isLookDirty } from '@/lib/editor/look-dirty';
import StyleSheetCard from './StyleSheetCard';
import { commitLook } from '../actions';

interface EditorProps {
  /** The skin currently live on the store. */
  currentSkin: string;
  /** The feeling currently live on the store. */
  currentFeeling: MoodKey;
  /** Origin of this tenant's storefront, e.g. https://ember.bohdiai.com. */
  previewOrigin: string;
  /** The live family's own wallpaper strength (0–1). Seeds the opacity dial so it
   *  starts where the family default actually sits instead of jumping on first drag. */
  defaultTextureOpacity: number;
  /** The texture setting currently saved on the store. Absent → family default. */
  savedTexture?: StoredTexture | undefined;
}

export default function Editor({ currentSkin, currentFeeling, previewOrigin, defaultTextureOpacity, savedTexture }: EditorProps) {
  const liveTextureInit: StoredTexture = savedTexture ?? { mode: 'default', opacity: null };

  // What's actually saved on the store (updates only when "Use this look" lands).
  const [liveSkin, setLiveSkin] = useState(currentSkin);
  const [liveFeeling, setLiveFeeling] = useState<MoodKey>(currentFeeling);
  const [liveTexture, setLiveTexture] = useState<StoredTexture>(liveTextureInit);
  // What the maker is trying on right now.
  const [selectedFeeling, setSelectedFeeling] = useState<MoodKey>(currentFeeling);
  const [selectedSkin, setSelectedSkin] = useState(currentSkin);
  // Door 2 texture state: `null` = the family's default wallpaper, `'none'` = no
  // texture at all. The per-niche shelf was removed (D63); the blend engine in the
  // renderer is kept for a future curated library but nothing wires it here.
  const [selectedTextureKey, setSelectedTextureKey] = useState<'none' | null>(
    liveTextureInit.mode === 'none' ? 'none' : null,
  );
  // Door 2 opacity override. `null` = leave the family's own strength alone (the
  // slider still shows it, seeded from defaultTextureOpacity); a number overrides it.
  const [textureOpacity, setTextureOpacity] = useState<number | null>(
    liveTextureInit.mode === 'default' ? liveTextureInit.opacity : null,
  );
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

  const isFamilyDefault = selectedTextureKey === null;
  // The texture setting the maker is currently trying on.
  const selectedTexture: StoredTexture = isFamilyDefault
    ? { mode: 'default', opacity: textureOpacity }
    : { mode: 'none', opacity: null };
  const dirty = isLookDirty(
    { skin: selectedSkin, feeling: selectedFeeling, texture: selectedTexture },
    { skin: liveSkin, feeling: liveFeeling, texture: liveTexture },
  );

  function commit() {
    setMessage(null);
    startTransition(async () => {
      const result = await commitLook(selectedSkin, selectedFeeling, selectedTexture);
      if (result.ok) {
        setLiveSkin(selectedSkin);
        setLiveFeeling(selectedFeeling);
        setLiveTexture(selectedTexture);
        setMessage('Published — this is your store now.');
      } else {
        setMessage(result.error);
      }
    });
  }

  // Preview params. The editor always sends an explicit texture so the preview
  // reflects the maker's selection and overrides any saved setting: 'default' for the
  // family wallpaper (with an opacity override when dialed), 'none' for no texture.
  const selectedTextureUrl = isFamilyDefault ? 'default' : 'none';
  const effectiveOpacity = isFamilyDefault && textureOpacity !== null ? textureOpacity : undefined;
  // Carry the feeling too, so the preview shows the whole selected family (layout,
  // wallpaper, nav), not just the skin. `src` is both the inline preview iframe and
  // the target of the full-size Preview button.
  const src = previewUrl(previewOrigin, selectedSkin, selectedTextureUrl, effectiveOpacity, selectedFeeling);

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
            const isLive = feeling.key === liveFeeling;
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

        {/* Door 2 — texture. The per-niche shelf was removed (D63): it was unproven.
            What stays is the family's own wallpaper, a plain no-texture option, and a
            dial for the default's strength. The blend engine in the renderer is kept
            for a future curated, tested cross-family library. */}
        <div className="mt-8 border-t border-white/8 pt-6">
          <h2 className="font-serif text-lg text-text">Texture</h2>
          <p className="mt-1.5 text-xs text-muted">
            Your feeling comes with a subtle wallpaper behind every section. Keep it and dial it
            up or down, or turn it off for a plain color.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4">
            <button
              type="button"
              onClick={() => { setSelectedTextureKey(null); setMessage(null); }}
              className={[
                'flex aspect-square flex-col items-center justify-center rounded-md border text-[10px] uppercase tracking-wider transition-colors',
                isFamilyDefault
                  ? 'border-honey bg-honey/10 text-honey-warm'
                  : 'border-white/12 text-text-soft hover:border-white/30 hover:text-text',
              ].join(' ')}
              aria-pressed={isFamilyDefault}
              title="Family default wallpaper"
            >
              Family
              <br />
              default
            </button>
            <button
              type="button"
              onClick={() => { setSelectedTextureKey('none'); setMessage(null); }}
              className={[
                'flex aspect-square flex-col items-center justify-center rounded-md border text-[10px] uppercase tracking-wider transition-colors',
                selectedTextureKey === 'none'
                  ? 'border-honey bg-honey/10 text-honey-warm'
                  : 'border-white/12 text-text-soft hover:border-white/30 hover:text-text',
              ].join(' ')}
              aria-pressed={selectedTextureKey === 'none'}
              title="No texture — plain color"
            >
              No
              <br />
              texture
            </button>
          </div>

          <div className="mt-3 text-xs text-text-soft">
            {isFamilyDefault
              ? <span className="text-muted">Family default wallpaper</span>
              : <span className="text-muted">No texture — plain color</span>}
          </div>

          {/* Opacity dial — live on the family default, moot when No texture. */}
          <div className="mt-4">
            <div className="flex items-baseline justify-between">
              <label htmlFor="tex-opacity" className={[
                'text-xs',
                isFamilyDefault ? 'text-text-soft' : 'text-muted',
              ].join(' ')}>
                Opacity
              </label>
              <span className="text-xs text-muted">
                {isFamilyDefault
                  ? `${Math.round((textureOpacity ?? defaultTextureOpacity) * 100)}%`
                  : '—'}
              </span>
            </div>
            <input
              id="tex-opacity"
              type="range"
              min={5}
              max={100}
              step={1}
              value={Math.round((textureOpacity ?? defaultTextureOpacity) * 100)}
              onChange={(e) => { setTextureOpacity(Number.parseInt(e.target.value, 10) / 100); setMessage(null); }}
              disabled={!isFamilyDefault}
              className="mt-2 w-full disabled:opacity-40"
            />
          </div>
        </div>
      </div>

      {/* Live preview */}
      <div className="relative flex min-h-[60vh] flex-col bg-bg-2/40 md:min-h-0">
        <div className="flex items-center justify-between gap-3 border-b border-white/8 px-5 py-3">
          <span className="text-xs text-muted">
            {dirty ? 'Unpublished changes' : 'Everything published'}
          </span>
          <div className="flex items-center gap-3">
            {message && <span className="text-xs text-text-soft">{message}</span>}
            {/* Preview — opens the current staged look full-size in a reused tab.
                When nothing is staged this is just the live store. */}
            <a
              href={src}
              target="bohdi-preview"
              rel="noreferrer"
              className="rounded-lg border border-white/12 px-4 py-1.5 text-sm text-text-soft transition-colors hover:border-honey/50 hover:text-honey-warm"
            >
              Preview
            </a>
            {/* Publish — writes the staged look to the live store. */}
            <button
              type="button"
              onClick={commit}
              disabled={!dirty || pending}
              className="rounded-lg bg-honey px-4 py-1.5 text-sm font-medium text-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
            >
              {pending ? 'Publishing…' : 'Publish'}
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
