'use client';

/**
 * Business card — the full-size photo viewer every design shares. A provider
 * holds which photo is open; any `Snapshot` inside it opens the viewer at its
 * photo. The viewer steps next/previous (buttons and arrow keys), closes on
 * Escape or a click outside the photo, and returns focus to the photo it opened from.
 */
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactElement, type ReactNode } from 'react';
import type { GalleryItem } from '@/lib/backend/gallery/gallery-form';
import { fill } from '@/lib/site-words/words';
import type { CardWords } from './words';

type Opener = (index: number, from: HTMLButtonElement) => void;

const ViewerContext = createContext<Opener | null>(null);

export function PhotoViewerProvider({ photos, w, children }: { photos: GalleryItem[]; w: CardWords['lightbox']; children: ReactNode }): ReactElement {
  const [open, setOpen] = useState<number | null>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const closeBtn = useRef<HTMLButtonElement | null>(null);

  const openAt = useCallback<Opener>((index, from) => {
    opener.current = from;
    setOpen(index);
  }, []);
  const close = useCallback(() => {
    setOpen(null);
    opener.current?.focus();
  }, []);
  const step = useCallback((by: number) => setOpen((i) => (i === null ? null : (i + by + photos.length) % photos.length)), [photos.length]);

  useEffect(() => {
    if (open === null) return undefined;
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close, step]);

  const shown = open === null ? undefined : photos[open];

  return (
    <ViewerContext.Provider value={openAt}>
      {children}
      {shown !== undefined && open !== null && (
        <div
          className="bc-lb"
          role="dialog"
          aria-modal="true"
          aria-label={w.label}
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <button ref={closeBtn} type="button" className="bc-lb__close" aria-label={w.close} onClick={close}>
            ✕
          </button>
          {photos.length > 1 && (
            <button type="button" className="bc-lb__prev" aria-label={w.prev} onClick={() => step(-1)}>
              ‹
            </button>
          )}
          <figure>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shown.url} alt={shown.caption} />
            <figcaption>
              {shown.caption !== '' ? `${shown.caption}${w.separator}` : ''}
              {fill(w.count, { n: open + 1, of: photos.length })}
            </figcaption>
          </figure>
          {photos.length > 1 && (
            <button type="button" className="bc-lb__next" aria-label={w.next} onClick={() => step(1)}>
              ›
            </button>
          )}
        </div>
      )}
    </ViewerContext.Provider>
  );
}

/** A photo button that opens the viewer at `index` (its place in the provider's photos). */
export function Snapshot({ index, className, children, label }: { index: number; className: string; children: ReactNode; label: string }): ReactElement {
  const openAt = useContext(ViewerContext);
  return (
    <button type="button" className={className} aria-label={label} onClick={(e) => openAt?.(index, e.currentTarget)}>
      {children}
    </button>
  );
}
