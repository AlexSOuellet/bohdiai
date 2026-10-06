'use client';

/**
 * Boutique, nursery design — a baby's photos on the certificate page: the big
 * arched photo and a row of round thumbnails that swap it. Works without script
 * (the first photo shows; thumbnails are plain buttons).
 */
import { useState, type ReactElement } from 'react';
import type { CatalogMedia } from '@/lib/archetypes/content';
import { NURSERY_STRINGS as S } from './strings';

export function NurseryPhotos({
  name,
  media,
}: {
  name: string;
  media: CatalogMedia[];
}): ReactElement | null {
  const photos = media.filter((m) => m.kind === 'image' && m.url !== undefined);
  const [current, setCurrent] = useState(0);
  const shown = photos[current] ?? photos[0];
  if (shown === undefined) return null;
  return (
    <div className="nn-photos">
      <div className="nn-photos__main">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={shown.url}
          alt={shown.alt === '' ? S.certificate.photo(name, current + 1) : shown.alt}
        />
      </div>
      {photos.length > 1 && (
        <div className="nn-thumbs">
          {photos.map((p, i) => (
            <button
              key={`${p.url ?? ''}-${i}`}
              type="button"
              className="nn-thumb"
              aria-current={i === current ? 'true' : 'false'}
              aria-label={S.certificate.showPhoto(i + 1)}
              onClick={() => setCurrent(i)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
