'use client';

/**
 * HeroPhotoPanel — the walk's hero-image controls (D73).
 *
 * Non-Cheerful families see the current hero media (still or video) and a single
 * "Replace with my own photo" upload. Uploading swaps `moment.media` to a still.
 *
 * Cheerful shows three collage-shot previews and two upload paths — "just my
 * featured shot" (1 file, keeps AI in the two supporting slots) or "all three of
 * my own" (multi-select, 3 files). Two-file uploads are intentionally excluded
 * because the visual mix doesn't balance (see D73).
 *
 * The panel handles UPLOAD only — keep-as-built and turn-section-off stay on the
 * host SectionEditor's existing controls. Every failure surfaces a maker-facing
 * message; nothing silent.
 */
import { useState, useTransition } from 'react';
import type { FamilyKey } from '@/lib/archetypes/main-street/families';

type UploadResult = { ok: true; uploadId: string; url: string } | { ok: false; error: string };
type ActionResult = { ok: boolean; error?: string | undefined };

export interface HeroMediaSummary {
  kind: 'still' | 'video';
  url: string;
  alt: string;
}

export interface CollageShotSummary {
  url: string;
  alt: string;
}

export interface HeroPhotoPanelProps {
  /** The current family — decides which upload UI shows (Cheerful gets collage). */
  readonly family: FamilyKey;
  /** Current `moment.media` (non-Cheerful hero source). Absent when nothing is set. */
  readonly media: HeroMediaSummary | undefined;
  /** Current `moment.collageShots` (Cheerful only). Absent when nothing is set. */
  readonly shots: readonly CollageShotSummary[] | undefined;
  /** Upload a single photo → returns the stored URL. Both paths use this. */
  readonly onUpload: (file: File) => Promise<UploadResult>;
  /** Non-Cheerful: set `moment.media` to a still with this URL. */
  readonly onSetHeroMedia: (url: string, alt: string) => Promise<ActionResult>;
  /** Cheerful: replace collage shots. Length 1 → featured slot only. Length 3 → all. */
  readonly onReplaceCollageShots: (shots: readonly { url: string; alt: string }[]) => Promise<ActionResult>;
  /** Report step resolution up so the host gates Next. Called with true on any
   *  successful upload commit; the panel never un-resolves (keep/off do that). */
  readonly onResolved: (resolved: boolean) => void;
  /** Ask the host to refresh the preview after a change. */
  readonly onChanged: () => void;
}

export default function HeroPhotoPanel({
  family,
  media,
  shots,
  onUpload,
  onSetHeroMedia,
  onReplaceCollageShots,
  onResolved,
  onChanged,
}: HeroPhotoPanelProps) {
  const isCheerful = family === 'cheerful';
  const [error, setError] = useState<string | null>(null);
  const [busyKind, setBusyKind] = useState<null | 'single' | 'featured' | 'triple'>(null);
  const [, startTransition] = useTransition();

  function handleSingle(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    setBusyKind('single');
    void onUpload(file)
      .then((res) => {
        if (!res.ok) {
          setError(res.error);
          return;
        }
        return onSetHeroMedia(res.url, 'the maker’s hero photo').then((set) => {
          if (!set.ok) {
            setError(set.error ?? 'Could not save that photo.');
            return;
          }
          startTransition(() => {
            onResolved(true);
            onChanged();
          });
        });
      })
      .catch(() => setError('That photo didn’t upload — try again.'))
      .finally(() => setBusyKind(null));
  }

  function handleFeatured(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    setBusyKind('featured');
    void onUpload(file)
      .then((res) => {
        if (!res.ok) {
          setError(res.error);
          return;
        }
        return onReplaceCollageShots([{ url: res.url, alt: 'the maker’s featured shot' }]).then((set) => {
          if (!set.ok) {
            setError(set.error ?? 'Could not save that photo.');
            return;
          }
          startTransition(() => {
            onResolved(true);
            onChanged();
          });
        });
      })
      .catch(() => setError('That photo didn’t upload — try again.'))
      .finally(() => setBusyKind(null));
  }

  function handleTriple(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;
    setError(null);
    if (files.length !== 3) {
      setError('Pick three photos at once — or use “just my featured shot” to replace only the biggest one.');
      return;
    }
    setBusyKind('triple');
    (async () => {
      const uploaded: { url: string; alt: string }[] = [];
      for (const file of files) {
        const res = await onUpload(file);
        if (!res.ok) {
          setError(res.error);
          return;
        }
        uploaded.push({ url: res.url, alt: 'the maker’s photo' });
      }
      const set = await onReplaceCollageShots(uploaded);
      if (!set.ok) {
        setError(set.error ?? 'Could not save those photos.');
        return;
      }
      startTransition(() => {
        onResolved(true);
        onChanged();
      });
    })()
      .catch(() => setError('Those photos didn’t upload — try again.'))
      .finally(() => setBusyKind(null));
  }

  return (
    <section
      data-hero-photo-panel
      className="rounded-2xl border border-white/10 bg-bg-2/40 p-4"
    >
      <header className="mb-3">
        <p className="text-[11px] uppercase tracking-[0.18em] text-honey-warm">
          {isCheerful ? 'Your collage photos' : 'Your hero photo'}
        </p>
        <p className="mt-1 text-xs text-muted">
          {isCheerful
            ? 'The three shots that sit beside your headline. Keep these, put your own in the featured spot, or upload all three.'
            : 'The photo behind the top of your store. Keep this one or upload your own.'}
        </p>
      </header>

      {/* Preview */}
      <div data-hero-photo-panel-preview className="mb-3">
        {isCheerful ? (
          <div className="grid grid-cols-3 gap-2">
            {(shots ?? []).slice(0, 3).map((s, i) => (
              <div
                key={i}
                className="aspect-square overflow-hidden rounded-lg border border-white/8 bg-black/20"
              >
                {typeof s.url === 'string' && s.url.length > 0 ? (
                  <img src={s.url} alt={s.alt} className="h-full w-full object-cover" />
                ) : null}
              </div>
            ))}
          </div>
        ) : media ? (
          <div className="aspect-[16/9] overflow-hidden rounded-lg border border-white/8 bg-black/20">
            {media.kind === 'video' ? (
              <video
                src={media.url}
                autoPlay
                loop
                muted
                playsInline
                className="h-full w-full object-cover"
              />
            ) : (
              <img src={media.url} alt={media.alt} className="h-full w-full object-cover" />
            )}
          </div>
        ) : (
          <div className="aspect-[16/9] rounded-lg border border-dashed border-white/12 bg-black/20" />
        )}
      </div>

      {/* Upload controls */}
      <div className="flex flex-wrap gap-2">
        {isCheerful ? (
          <>
            <label className="cursor-pointer rounded-lg border border-white/12 px-3 py-2 text-xs text-text-soft transition-colors hover:border-honey/50 hover:text-honey-warm">
              {busyKind === 'featured' ? 'Uploading…' : 'Upload just my featured shot'}
              <input
                data-hero-photo-panel-upload="featured"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFeatured}
                disabled={busyKind !== null}
              />
            </label>
            <label className="cursor-pointer rounded-lg border border-white/12 px-3 py-2 text-xs text-text-soft transition-colors hover:border-honey/50 hover:text-honey-warm">
              {busyKind === 'triple' ? 'Uploading…' : 'Upload all three of my own'}
              <input
                data-hero-photo-panel-upload="triple"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={handleTriple}
                disabled={busyKind !== null}
              />
            </label>
          </>
        ) : (
          <label className="cursor-pointer rounded-lg border border-white/12 px-3 py-2 text-xs text-text-soft transition-colors hover:border-honey/50 hover:text-honey-warm">
            {busyKind === 'single' ? 'Uploading…' : 'Replace with my own photo'}
            <input
              data-hero-photo-panel-upload="single"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleSingle}
              disabled={busyKind !== null}
            />
          </label>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-3 text-xs text-red-300">
          {error}
        </p>
      )}
    </section>
  );
}
