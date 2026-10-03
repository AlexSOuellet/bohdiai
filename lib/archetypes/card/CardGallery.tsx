'use client';

/**
 * Business site — the work, as a wall of taped prints with their captions
 * handwritten underneath, and the full-size photo viewer. The viewer opens on click with
 * next/previous and Escape, and returns focus to the photo it opened from.
 */
import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react';
import type { GalleryItem } from '@/lib/backend/gallery/gallery-form';
import { CARD_STRINGS as S } from './strings';

export function CardGallery({ photos }: { photos: GalleryItem[] }): ReactElement {
  const [open, setOpen] = useState<number | null>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const closeBtn = useRef<HTMLButtonElement | null>(null);

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
    <>
      <ul className="bc-grid">
        {photos.map((p, i) => (
          <li key={p.id}>
            <button
              type="button"
              className="bc-tile"
              aria-label={S.work.open(p.caption, i + 1)}
              onClick={(e) => {
                opener.current = e.currentTarget;
                setOpen(i);
              }}
            >
              <span className="bc-print">
                {/* The owner's own upload, already shrunk at upload — a plain img like the other maker-photo spots. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={p.caption} loading={i < 3 ? 'eager' : 'lazy'} />
              </span>
              {p.caption !== '' && <span className="bc-tile__cap">{p.caption}</span>}
            </button>
          </li>
        ))}
      </ul>

      {shown !== undefined && open !== null && (
        <div
          className="bc-lb"
          role="dialog"
          aria-modal="true"
          aria-label={S.lightbox.label}
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <button ref={closeBtn} type="button" className="bc-lb__close" aria-label={S.lightbox.close} onClick={close}>
            ✕
          </button>
          {photos.length > 1 && (
            <button type="button" className="bc-lb__prev" aria-label={S.lightbox.prev} onClick={() => step(-1)}>
              ‹
            </button>
          )}
          <figure>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shown.url} alt={shown.caption} />
            <figcaption>
              {shown.caption !== '' ? `${shown.caption} · ` : ''}
              {S.lightbox.count(open + 1, photos.length)}
            </figcaption>
          </figure>
          {photos.length > 1 && (
            <button type="button" className="bc-lb__next" aria-label={S.lightbox.next} onClick={() => step(1)}>
              ›
            </button>
          )}
        </div>
      )}
    </>
  );
}
