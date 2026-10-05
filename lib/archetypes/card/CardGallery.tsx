'use client';

/**
 * Business site — the work, as a wall of taped prints with their captions
 * handwritten underneath. A print opens the shared full-size viewer.
 */
import type { ReactElement } from 'react';
import type { GalleryItem } from '@/lib/backend/gallery/gallery-form';
import { CARD_STRINGS as S } from './strings';
import { PhotoViewerProvider, Snapshot } from './PhotoViewer';

export function CardGallery({ photos }: { photos: GalleryItem[] }): ReactElement {
  return (
    <PhotoViewerProvider photos={photos}>
      <ul className="bc-grid">
        {photos.map((p, i) => (
          <li key={p.id}>
            <Snapshot index={i} className="bc-tile" label={S.work.open(p.caption, i + 1)}>
              <span className="bc-print">
                {/* The owner's own upload, already shrunk at upload — a plain img like the other maker-photo spots. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={p.caption} loading={i < 3 ? 'eager' : 'lazy'} />
              </span>
              {p.caption !== '' && <span className="bc-tile__cap">{p.caption}</span>}
            </Snapshot>
          </li>
        ))}
      </ul>
    </PhotoViewerProvider>
  );
}
