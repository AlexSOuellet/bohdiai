'use client';

import { useMemo, useRef, useState, useTransition } from 'react';
import type { MoodKey } from '@/lib/moods';
import { FEELINGS, feelingShelf } from '@/lib/editor/look-shelf';
import type { StoredTexture } from '@/lib/editor/texture';
import { isLookDirty } from '@/lib/editor/look-dirty';
import StyleSheetCard from './StyleSheetCard';
import Walkthrough from './Walkthrough';
import { stageLook, publishStore, resetStore } from '../actions';

interface EditorProps {
  /** The skin currently live (published) on the store. */
  currentSkin: string;
  /** The feeling currently live (published) on the store. */
  currentFeeling: MoodKey;
  /** The look staged in the draft, if the maker has an unpublished draft. Absent →
   *  no draft yet, so the editor opens on the live look. */
  stagedLook?: { skin: string; feeling: MoodKey; texture?: StoredTexture | undefined } | null;
  /** Signed token authorising the draft preview for this tenant. */
  previewToken: string;
  /** Origin of this tenant's storefront, e.g. https://ember.bohdiai.com. */
  previewOrigin: string;
  /** The live family's own wallpaper strength (0–1). Seeds the opacity dial so it
   *  starts where the family default actually sits instead of jumping on first drag. */
  defaultTextureOpacity: number;
  /** The texture setting currently saved (published) on the store. Absent → family default. */
  savedTexture?: StoredTexture | undefined;
  /** Nothing made-yours yet — auto-launch the "Make It Yours" walk on mount. */
  firstRun: boolean;
  /** id → current word value, seeding the walk's "write it myself" fields. */
  walkValues: Record<string, unknown>;
}

/** One complete look selection. Every editing change produces a new one and stages
 *  it; the preview and the dirty check are both views of it. */
interface Selection {
  skin: string;
  feeling: MoodKey;
  /** `null` = the family's default wallpaper, `'none'` = no texture at all. */
  textureKey: 'none' | null;
  /** Opacity override for the family default (`null` = leave the family strength alone). */
  opacity: number | null;
}

/** The StoredTexture a selection stages/persists. */
function toStoredTexture(sel: Selection): StoredTexture {
  return sel.textureKey === null ? { mode: 'default', opacity: sel.opacity } : { mode: 'none', opacity: null };
}

/** Turn a saved/staged StoredTexture into the editor's texture selection fields. */
function textureFields(texture: StoredTexture | undefined): Pick<Selection, 'textureKey' | 'opacity'> {
  const t: StoredTexture = texture ?? { mode: 'default', opacity: null };
  return { textureKey: t.mode === 'none' ? 'none' : null, opacity: t.mode === 'default' ? t.opacity : null };
}

export default function Editor({ currentSkin, currentFeeling, stagedLook, previewToken, previewOrigin, defaultTextureOpacity, savedTexture, firstRun, walkValues }: EditorProps) {
  const liveInit: Selection = { skin: currentSkin, feeling: currentFeeling, ...textureFields(savedTexture) };
  const stagedInit: Selection = stagedLook
    ? { skin: stagedLook.skin, feeling: stagedLook.feeling, ...textureFields(stagedLook.texture) }
    : liveInit;

  // What's published on the store (updates only when Publish lands).
  const [live, setLive] = useState<Selection>(liveInit);
  // What the maker is trying on — also exactly what's in the draft (every change stages).
  const [selected, setSelected] = useState<Selection>(stagedInit);
  // Prior staged selections, for step-back Undo.
  const [undoStack, setUndoStack] = useState<Selection[]>([]);
  // The opacity the preview is currently showing. Discrete changes update the preview
  // instantly; the opacity slider only reloads the preview on release (via this),
  // so dragging the dial doesn't reload the iframe on every tick.
  const [previewOpacity, setPreviewOpacity] = useState<number | null>(stagedInit.opacity);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  // The "Make It Yours" walk auto-opens on a first run; a maker can re-enter it later.
  const [walkOpen, setWalkOpen] = useState(firstRun);
  // Bumped after any staged content change to force the preview iframe to re-fetch
  // the draft (a content edit doesn't change the look params, so the src alone won't).
  const [previewNonce, setPreviewNonce] = useState(0);
  // The selection at the start of an opacity drag, so one drag is one undo step.
  const dragStartRef = useRef<Selection | null>(null);

  const shelf = useMemo(() => feelingShelf(selected.feeling), [selected.feeling]);
  const isFamilyDefault = selected.textureKey === null;
  const dirty = isLookDirty(
    { skin: selected.skin, feeling: selected.feeling, texture: toStoredTexture(selected) },
    { skin: live.skin, feeling: live.feeling, texture: toStoredTexture(live) },
  );

  /** Apply a new selection. The preview updates immediately from `selected` (no wait
   *  on the server); the draft save runs in the background for persistence. On success
   *  the prior selection is pushed onto the undo stack; on failure we revert. */
  function stage(next: Selection, prior: Selection = selected) {
    setSelected(next);
    setPreviewOpacity(next.opacity);
    setMessage(null);
    startTransition(async () => {
      const result = await stageLook(next.skin, next.feeling, toStoredTexture(next));
      if (result.ok) {
        setUndoStack((s) => [...s, prior]);
      } else {
        setSelected(prior);
        setPreviewOpacity(prior.opacity);
        setMessage(result.error);
      }
    });
  }

  function pickFeeling(feeling: MoodKey) {
    const next = feelingShelf(feeling);
    // Keep the current skin if it lives in this feeling; else lead with the first.
    const stay = next.find((s) => s.key === selected.skin);
    const skin = stay ? stay.key : (next[0]?.key ?? selected.skin);
    stage({ ...selected, feeling, skin });
  }

  function undo() {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    if (prev === undefined) return;
    const prior = selected;
    setUndoStack((s) => s.slice(0, -1));
    setSelected(prev);
    setPreviewOpacity(prev.opacity);
    setMessage(null);
    startTransition(async () => {
      const result = await stageLook(prev.skin, prev.feeling, toStoredTexture(prev));
      if (!result.ok) {
        setUndoStack((s) => [...s, prev]);
        setSelected(prior);
        setPreviewOpacity(prior.opacity);
        setMessage(result.error);
      }
    });
  }

  function publish() {
    setMessage(null);
    startTransition(async () => {
      const result = await publishStore();
      if (result.ok) {
        setLive(selected);
        setUndoStack([]);
        setMessage('Published — this is your store now.');
      } else {
        setMessage(result.error);
      }
    });
  }

  function reset() {
    setMessage(null);
    startTransition(async () => {
      const result = await resetStore();
      if (result.ok) {
        setSelected(live);
        setPreviewOpacity(live.opacity);
        setUndoStack([]);
        setMessage('Back to your published look.');
      } else {
        setMessage(result.error);
      }
    });
  }

  // The preview shows the selected look immediately via URL params (so it never waits
  // on the background draft save), carrying the token so it renders the maker's own
  // draft content underneath rather than the public store. `src` changes the instant
  // the selection changes, so the iframe reloads right away. Also the full-size Preview.
  const previewTextureUrl = isFamilyDefault ? 'default' : 'none';
  const srcParams = new URLSearchParams({
    previewToken,
    previewLook: selected.skin,
    previewMood: selected.feeling,
    previewTexture: previewTextureUrl,
  });
  if (isFamilyDefault && previewOpacity !== null) srcParams.set('previewTextureOpacity', String(previewOpacity));
  const src = `${previewOrigin}/?${srcParams.toString()}`;
  // The inline pane is a static snapshot — scroll-in reveals don't fire in it, which
  // would leave reveal-gated sections (products especially) invisible. `previewStill`
  // tells the storefront to render those reveals already resolved. The full-size
  // Preview link keeps the real scroll animation (it works in a real tab).
  const iframeSrc = `${src}&previewStill=1&n=${previewNonce}`;
  const opacityPct = Math.round((selected.opacity ?? defaultTextureOpacity) * 100);

  return (
    <div className="grid h-[calc(100dvh-65px)] grid-cols-1 md:grid-cols-[minmax(380px,440px)_1fr]">
      {/* Load the real type faces for every skin on the current shelf. */}
      {shelf.map((s) => (
        <link key={s.key} rel="stylesheet" href={s.fontHref} />
      ))}

      {/* Left column — the "Make It Yours" walk, or the look editor. */}
      {walkOpen ? (
        <div className="min-h-0 overflow-y-auto border-b border-white/8 md:border-b-0 md:border-r">
          <Walkthrough
            values={walkValues}
            firstRun={firstRun}
            onChanged={() => setPreviewNonce((n) => n + 1)}
            onExit={() => setWalkOpen(false)}
          />
        </div>
      ) : (
      <div className="min-h-0 overflow-y-auto border-b border-white/8 px-6 py-8 md:border-b-0 md:border-r">
        <button
          type="button"
          onClick={() => setWalkOpen(true)}
          className="mb-6 w-full rounded-lg border border-honey/30 bg-honey/5 px-4 py-2.5 text-sm text-honey-warm transition-colors hover:border-honey/50 hover:bg-honey/10"
        >
          Walk me through my store again
        </button>
        <h1 className="font-serif text-2xl text-text">Try a different feeling</h1>
        <p className="mt-2 text-sm text-muted">
          See your store in another feeling — same products, same words, a new look. Everything you
          change is saved to a private draft and only goes public when you choose{' '}
          <span className="text-text-soft">Publish</span>.
        </p>

        {/* Feeling radios */}
        <div className="mt-6 flex flex-wrap gap-2" role="radiogroup" aria-label="Feeling">
          {FEELINGS.map((feeling) => {
            const active = feeling.key === selected.feeling;
            const isLive = feeling.key === live.feeling;
            return (
              <button
                key={feeling.key}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={pending}
                onClick={() => pickFeeling(feeling.key)}
                className={[
                  'rounded-full border px-3.5 py-1.5 text-sm transition-colors disabled:opacity-50',
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
              selected={sheet.key === selected.skin}
              current={sheet.key === live.skin}
              onSelect={(key) => stage({ ...selected, skin: key })}
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
              disabled={pending}
              onClick={() => stage({ ...selected, textureKey: null })}
              className={[
                'flex aspect-square flex-col items-center justify-center rounded-md border text-[10px] uppercase tracking-wider transition-colors disabled:opacity-50',
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
              disabled={pending}
              onClick={() => stage({ ...selected, textureKey: 'none' })}
              className={[
                'flex aspect-square flex-col items-center justify-center rounded-md border text-[10px] uppercase tracking-wider transition-colors disabled:opacity-50',
                selected.textureKey === 'none'
                  ? 'border-honey bg-honey/10 text-honey-warm'
                  : 'border-white/12 text-text-soft hover:border-white/30 hover:text-text',
              ].join(' ')}
              aria-pressed={selected.textureKey === 'none'}
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

          {/* Opacity dial — live on the family default, moot when No texture. The thumb
              tracks on change; one drag stages once on release (pointer/key up). */}
          <div className="mt-4">
            <div className="flex items-baseline justify-between">
              <label htmlFor="tex-opacity" className={['text-xs', isFamilyDefault ? 'text-text-soft' : 'text-muted'].join(' ')}>
                Opacity
              </label>
              <span className="text-xs text-muted">{isFamilyDefault ? `${opacityPct}%` : '—'}</span>
            </div>
            <input
              id="tex-opacity"
              type="range"
              min={5}
              max={100}
              step={1}
              value={opacityPct}
              onPointerDown={() => { dragStartRef.current = selected; }}
              onChange={(e) => {
                const opacity = Number.parseInt(e.target.value, 10) / 100;
                setSelected((s) => ({ ...s, opacity }));
              }}
              onPointerUp={() => {
                if (dragStartRef.current !== null) { stage(selected, dragStartRef.current); dragStartRef.current = null; }
              }}
              onKeyUp={() => {
                if (dragStartRef.current !== null) { stage(selected, dragStartRef.current); dragStartRef.current = null; }
                else stage(selected);
              }}
              onKeyDown={() => { if (dragStartRef.current === null) dragStartRef.current = selected; }}
              disabled={!isFamilyDefault || pending}
              className="mt-2 w-full disabled:opacity-40"
            />
          </div>
        </div>
      </div>
      )}

      {/* Live preview */}
      <div className="relative flex min-h-[60vh] flex-col bg-bg-2/40 md:min-h-0">
        <div className="flex items-center justify-between gap-3 border-b border-white/8 px-5 py-3">
          <span className="text-xs text-muted">
            {dirty ? 'Unpublished changes' : 'Everything published'}
          </span>
          <div className="flex items-center gap-3">
            {message && <span className="text-xs text-text-soft">{message}</span>}
            {/* Undo — step back through staged changes. */}
            <button
              type="button"
              onClick={undo}
              disabled={undoStack.length === 0 || pending}
              className="rounded-lg border border-white/12 px-3 py-1.5 text-sm text-text-soft transition-colors hover:border-white/30 hover:text-text disabled:cursor-not-allowed disabled:opacity-30"
            >
              Undo
            </button>
            {/* Reset — discard the draft, back to the published look. */}
            <button
              type="button"
              onClick={reset}
              disabled={!dirty || pending}
              className="rounded-lg border border-white/12 px-3 py-1.5 text-sm text-text-soft transition-colors hover:border-white/30 hover:text-text disabled:cursor-not-allowed disabled:opacity-30"
            >
              Reset
            </button>
            {/* Preview — opens the staged draft full-size in a reused tab. */}
            <a
              href={src}
              target="bohdi-preview"
              rel="noreferrer"
              className="rounded-lg border border-white/12 px-4 py-1.5 text-sm text-text-soft transition-colors hover:border-honey/50 hover:text-honey-warm"
            >
              Preview
            </a>
            {/* Publish — writes the staged draft to the live store. */}
            <button
              type="button"
              onClick={publish}
              disabled={!dirty || pending}
              className="rounded-lg bg-honey px-4 py-1.5 text-sm font-medium text-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
            >
              {pending ? 'Working…' : 'Publish'}
            </button>
          </div>
        </div>
        <iframe
          key={iframeSrc}
          src={iframeSrc}
          title="Storefront preview"
          className="min-h-0 w-full flex-1 border-0 bg-white"
        />
      </div>
    </div>
  );
}
