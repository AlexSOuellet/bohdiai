'use client';

/**
 * COLLECTIONS — the cupboard (Cozy family).
 *
 * Wide labeled shelves stacked full-width down the band, each a cover photo with a
 * paper slip pinned over it — a number-and-count line, the collection name, and a
 * script "explore" flourish. Warm and domestic, like collections lined up in a
 * cupboard. A collections band shows GROUPS the shopper walks into, never the goods
 * themselves, so it never rhymes with the goods treatments.
 *
 * Skin-agnostic and class-only: the shelf, the slip (a surface lighter than the
 * band), the pin and the script flourish all derive from the skin's own `--ms-*`
 * vars — no literal ever leaves the mockup. Type is named roles; imagery is graded
 * by the skin's `.archetype-photo` filter. The hover lift and all placement live in
 * skinVarsCss under `.ms-cup-*` — never inline.
 *
 * (The mockup's Pinyon "explore" is rendered through the `sig` role, the closest
 * existing voice; the family's own script font lands with the family layer.)
 */
import type { ArchetypeTheme } from '../types';
import { Media } from './chrome';
import { Type } from './Type';
import type { CollectionView, CollectionsSection } from './collections';

export function CollectionsCupboard({
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
    <section id="collections" className="ms-coll-section ms-cup">
      <div className="ms-wrap">
        <div className="ms-cup-head">
          {section.label && (
            <Type as="span" role="eyebrow" className="ms-cup-eyebrow">
              {section.label}
            </Type>
          )}
          <Type as="h2" role="goodsHead" className="ms-cup-title">
            {section.title}
          </Type>
        </div>
        <div className="ms-cup-shelves">
          {items.map((c, i) => (
            <a
              key={c.slug}
              href={`/collections/${c.slug}`}
              data-ms-coll-item=""
              className="ms-cup-shelf"
            >
              <span className="ms-cup-cover">
                <Media media={c.cover ?? { kind: 'image', alt: c.name }} />
              </span>
              <span className="ms-cup-slip">
                <Type as="span" role="legal" className="ms-cup-num">
                  {`${String(i + 1).padStart(2, '0')} — ${c.count} items`}
                </Type>
                <Type as="span" role="cardTitle" className="ms-cup-name">
                  {c.name}
                </Type>
                <Type as="span" role="sig" className="ms-cup-go">
                  {viewAll?.label ?? 'Explore'}
                </Type>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
