/**
 * COLLECTIONS — the cascade (Modern / Minimalist family).
 *
 * A diagonal of overlapping covers stepping across the band: each collection is a
 * wide image step, offset down and right from the one before, overlapping with soft
 * depth — image-forward and quiet, never rows, columns, or a grid. The collection
 * name sits on the cover over a bottom scrim, the count a small mono figure beside
 * it. A collections band shows GROUPS the shopper walks into, never the goods
 * themselves, so it never rhymes with the goods treatments.
 *
 * Skin-agnostic and class-only: the band surface, the heading text, the muted
 * eyebrow and the step's depth shadow all derive from the skin's own `--ms-*` vars
 * — no literal ever leaves the mockup (the over-photo scrim is a black gradient,
 * allowed because it sits ON the photo; the label reads `--ms-on-media`). Type is
 * named roles; imagery is graded by the skin's `.archetype-photo` filter. The
 * diagonal placement (the three `:nth-child` steps) and the hover lift live in
 * skinVarsCss under `.ms-cascade-*` — never inline. This is the MODERN family, so
 * type stays modest and the move is quiet. The concrete wallpaper is the family
 * layer's, not ours.
 */
import type { ArchetypeTheme } from '../types';
import { Media } from './chrome';
import { Type } from './Type';
import type { CollectionView, CollectionsSection } from './collections';

export function CollectionsCascade({
  section,
  items,
  skin: _skin,
  viewAll: _viewAll,
}: {
  section: CollectionsSection;
  items: CollectionView[];
  skin: ArchetypeTheme;
  viewAll?: { href: string; label: string } | undefined;
}) {
  return (
    <section id="collections" className="ms-coll-section ms-cascade">
      <div className="ms-wrap">
        <div className="ms-cascade-head">
          {section.label && (
            <Type as="span" role="eyebrow" className="ms-cascade-eyebrow">
              {section.label}
            </Type>
          )}
          <Type as="h2" role="goodsHead" className="ms-cascade-title">
            {section.title}
          </Type>
        </div>
        <div className="ms-cascade-stage">
          {items.map((c) => (
            <a
              key={c.slug}
              href={`/collections/${c.slug}`}
              data-ms-coll-item=""
              className="ms-cascade-step"
            >
              <span className="ms-cascade-cover">
                <Media media={c.cover ?? { kind: 'image', alt: c.name }} />
              </span>
              <span className="ms-cascade-lab">
                <Type as="span" role="cardTitle" className="ms-cascade-name">
                  {c.name}
                </Type>
                <Type as="span" role="legal" className="ms-cascade-count">
                  {c.count}
                </Type>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
