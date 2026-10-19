'use client';

/**
 * GALLERY — the added gallery section (Project-Docs/Plan-Backends.md, the gallery
 * section): photos of the maker's work with their names, no prices. Every photo
 * keeps its real shape, uncropped (handmade work is photographed every which way);
 * each family hangs them its own way through `[data-ms-family]` rules in
 * gallery-styles.ts. A photo opens the shared full-size viewer. Class-only.
 */
import type { ReactElement } from 'react';
import type { MainStreetView } from './schemas';
import { PhotoViewerProvider, Snapshot } from '../card/PhotoViewer';
import { fill } from '@/lib/site-words/words';
import { Type } from './Type';
import type { FamilyWords } from './words';

type Gallery = NonNullable<MainStreetView['gallery']>;

export function GalleryBeat({ gallery, words }: { gallery: Gallery; words: FamilyWords }): ReactElement | null {
  if (gallery.items.length === 0) return null;
  const photos = gallery.items.map((g) => ({ id: g.key, url: g.url, caption: g.name }));
  return (
    <section id="gallery" className="ms-gal-section">
      <div className="ms-wrap">
        {gallery.title !== '' && (
          <div className="ms-gal-head">
            <Type as="h2" role="goodsHead" className="ms-gal-title">
              {gallery.title}
            </Type>
            {gallery.label && (
              <Type as="p" role="caption" className="ms-gal-lede">
                {gallery.label}
              </Type>
            )}
          </div>
        )}
        <PhotoViewerProvider photos={photos} w={words.gallery.lightbox}>
          <ul className="ms-gal-wall" data-count={Math.min(gallery.items.length, 4)}>
            {gallery.items.map((g, i) => (
              <li key={g.key} className="ms-gal-item">
                <Snapshot
                  index={i}
                  className="ms-gal-piece"
                  label={g.name === '' ? fill(words.gallery.openNumbered, { n: i + 1 }) : fill(words.gallery.open, { caption: g.name })}
                >
                  <span className="ms-gal-frame">
                    {/* The maker's own upload, already shrunk at upload: a plain img like the other maker-photo spots. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={g.url} alt={g.alt} loading={i < 4 ? 'eager' : 'lazy'} />
                  </span>
                  {g.name !== '' && (
                    <Type as="span" role="cardTitle" className="ms-gal-name">
                      {g.name}
                    </Type>
                  )}
                </Snapshot>
              </li>
            ))}
          </ul>
        </PhotoViewerProvider>
      </div>
    </section>
  );
}
