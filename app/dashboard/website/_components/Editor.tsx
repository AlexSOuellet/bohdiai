'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import type { MoodKey } from '@/lib/moods';
import { FEELINGS, feelingShelf } from '@/lib/editor/look-shelf';
import { previewUrl } from '@/lib/dashboard/storefront-url';
import type { NicheTexture } from '@/lib/editor/load-niche-textures';
import StyleSheetCard from './StyleSheetCard';
import { commitLook } from '../actions';

interface EditorProps {
  /** The skin currently live on the store. */
  currentSkin: string;
  /** The feeling currently live on the store. */
  currentFeeling: MoodKey;
  /** Origin of this tenant's storefront, e.g. https://ember.bohdiai.com. */
  previewOrigin: string;
  /** Door 2 texture shelf — the maker's niche curated textures. Empty when the
   *  niche has no style sheet yet; the picker just doesn't render in that case. */
  nicheTextures: readonly NicheTexture[];
}

export default function Editor({ currentSkin, currentFeeling, previewOrigin, nicheTextures }: EditorProps) {
  // What's actually saved on the store (updates only when "Use this look" lands).
  const [liveSkin, setLiveSkin] = useState(currentSkin);
  // What the maker is trying on right now.
  const [selectedFeeling, setSelectedFeeling] = useState<MoodKey>(currentFeeling);
  const [selectedSkin, setSelectedSkin] = useState(currentSkin);
  // Door 2 — the texture the maker is previewing, keyed. `null` means the
  // family default wallpaper (no niche override).
  const [selectedTextureKey, setSelectedTextureKey] = useState<string | null>(null);
  // Door 2 — opacity dial, 0.05 to 1.0. `null` means "use the family default"
  // (0.15–0.30 depending on family). The slider unlocks when a texture is picked.
  const [textureOpacity, setTextureOpacity] = useState<number | null>(null);
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
  // Three texture states: null = family default, 'none' = no texture at all,
  // otherwise the picked niche texture's URL.
  const selectedTextureUrl =
    selectedTextureKey === null ? undefined
    : selectedTextureKey === 'none' ? 'none'
    : nicheTextures.find((t) => t.key === selectedTextureKey)?.sourceUrl;
  const isRealTexture = selectedTextureKey !== null && selectedTextureKey !== 'none';
  const effectiveOpacity = !isRealTexture || textureOpacity === null ? undefined : textureOpacity;
  const src = previewUrl(previewOrigin, selectedSkin, selectedTextureUrl, effectiveOpacity);

  // Publish the current try-on to localStorage so the dashboard header's
  // "View live site" button can carry the preview params into the live-site tab.
  // Cleared when the editor unmounts so a stale try-on doesn't leak into other pages.
  useEffect(() => {
    try {
      window.localStorage.setItem(
        'bohdiai-editor-preview',
        JSON.stringify({
          skinKey: selectedSkin,
          textureUrl: selectedTextureUrl ?? null,
          textureOpacity: effectiveOpacity ?? null,
        }),
      );
    } catch { /* localStorage may be blocked; harmless */ }
    return () => {
      try { window.localStorage.removeItem('bohdiai-editor-preview'); } catch { /* noop */ }
    };
  }, [selectedSkin, selectedTextureUrl, effectiveOpacity]);

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

        {/* Door 2 — niche texture shelf. Renders only when the niche has a style
            sheet with textures on disk; otherwise the maker just sees Door 1. */}
        {nicheTextures.length > 0 && (
          <div className="mt-8 border-t border-white/8 pt-6">
            <h2 className="font-serif text-lg text-text">Try a texture</h2>
            <p className="mt-1.5 text-xs text-muted">
              Curated for your craft. Sits behind every section — the family default is what
              you have now; a niche texture swaps in as an override.
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4">
              <button
                type="button"
                onClick={() => setSelectedTextureKey(null)}
                className={[
                  'flex aspect-square flex-col items-center justify-center rounded-md border text-[10px] uppercase tracking-wider transition-colors',
                  selectedTextureKey === null
                    ? 'border-honey bg-honey/10 text-honey-warm'
                    : 'border-white/12 text-text-soft hover:border-white/30 hover:text-text',
                ].join(' ')}
                aria-pressed={selectedTextureKey === null}
                title="Family default wallpaper"
              >
                Family
                <br />
                default
              </button>
              <button
                type="button"
                onClick={() => setSelectedTextureKey('none')}
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
              {nicheTextures.map((t) => {
                const active = t.key === selectedTextureKey;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setSelectedTextureKey(t.key)}
                    aria-pressed={active}
                    title={t.note ?? t.name}
                    style={{ backgroundColor: '#ece3d1' }}
                    className={[
                      'group relative flex aspect-square flex-col overflow-hidden rounded-md border transition-colors',
                      active
                        ? 'border-honey ring-1 ring-honey/60'
                        : 'border-white/12 hover:border-white/30',
                    ].join(' ')}
                  >
                    {/* PNG is black-ink-on-transparent; the light backing above
                        lets the pattern read the way it will over a real page. */}
                    <img
                      src={t.sourceUrl}
                      alt={t.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    <span className="absolute inset-x-0 bottom-0 truncate bg-black/55 px-1 py-0.5 text-center text-[8px] font-medium uppercase tracking-wide text-white/95">
                      {t.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Full texture name shown below (not clipped inside the swatch) */}
            <div className="mt-3 text-xs text-text-soft">
              {selectedTextureKey === null
                ? <span className="text-muted">Family default</span>
                : selectedTextureKey === 'none'
                ? <span className="text-muted">No texture — plain color</span>
                : <span>{nicheTextures.find((t) => t.key === selectedTextureKey)?.name}</span>
              }
            </div>

            {/* Opacity slider — active only when a real niche texture is picked */}
            <div className="mt-4">
              <div className="flex items-baseline justify-between">
                <label htmlFor="tex-opacity" className={[
                  'text-xs',
                  isRealTexture ? 'text-text-soft' : 'text-muted',
                ].join(' ')}>
                  Opacity
                </label>
                <span className="text-xs text-muted">
                  {!isRealTexture
                    ? '—'
                    : `${Math.round((textureOpacity ?? 0.5) * 100)}%`}
                </span>
              </div>
              <input
                id="tex-opacity"
                type="range"
                min={5}
                max={100}
                step={1}
                value={Math.round((textureOpacity ?? 0.5) * 100)}
                onChange={(e) => setTextureOpacity(Number.parseInt(e.target.value, 10) / 100)}
                disabled={!isRealTexture}
                className="mt-2 w-full disabled:opacity-40"
              />
            </div>
          </div>
        )}
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
