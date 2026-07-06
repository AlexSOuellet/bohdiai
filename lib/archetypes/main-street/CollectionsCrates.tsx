/**
 * COLLECTIONS — the crates (Rustic family).
 *
 * Stacked wooden crates, names stenciled on the wood. An asymmetric grid — one
 * tall crate beside two smaller ones stacked — so the band reads hand-built and
 * weathered rather than a tidy row of cards. Each crate is a dark wood box (the
 * skin's contrast surface), a cover photo inside, and a label band riding over
 * the photo at the bottom: the collection name stenciled, the count scrawled.
 *
 * Skin-agnostic and class-only. A crate is a dark wood box regardless of skin,
 * so the field is `--ms-contrast-bg`; the stenciled label rides a black scrim
 * over the photo (legible on any cover); the scrawled count is `--ms-accent`.
 * All placement — the tall-first asymmetry, the mobile collapse — lives in
 * skinVarsCss under `.ms-crate-*`, never inline.
 */
import type { ArchetypeTheme } from '../types';
import type { CollectionView, CollectionsSection } from './collections';
import { Media } from './chrome';
import { Type } from './Type';

export function CollectionsCrates({
  section,
  items,
  skin: _skin,
  viewAll,
}: {
  section: CollectionsSection;
  items: CollectionView[];
  skin: ArchetypeTheme;
  viewAll?: { href: string; label: string } | undefined;
}) {
  return (
    <section id="collections" className="ms-coll-section ms-crate">
      <div className="ms-wrap">
        <div className="ms-crate-head">
          {section.label && (
            <Type as="span" role="eyebrow" className="ms-crate-eyebrow">
              {section.label}
            </Type>
          )}
          <Type as="h2" role="goodsHead" className="ms-crate-title">
            {section.title}
          </Type>
        </div>
        <div className="ms-crate-grid">
          {items.map((c, i) => (
            <a
              key={c.slug}
              href={`/collections/${c.slug}`}
              data-ms-coll-item=""
              className={i === 0 ? 'ms-crate-item ms-crate-item--tall' : 'ms-crate-item'}
            >
              <span className="ms-crate-cover">
                <Media media={c.cover ?? { kind: 'image', alt: c.name }} />
              </span>
              <span className="ms-crate-label">
                <Type as="span" role="cardTitle" className="ms-crate-name">
                  {c.name}
                </Type>
                <Type as="span" role="legal" className="ms-crate-count">
                  {c.count}
                </Type>
              </span>
            </a>
          ))}
        </div>
        {viewAll && (
          <a href={viewAll.href} data-ms-coll-viewall="" className="ms-crate-viewall">
            <Type as="span" role="eyebrow">
              {viewAll.label}
            </Type>
          </a>
        )}
      </div>
    </section>
  );
}
