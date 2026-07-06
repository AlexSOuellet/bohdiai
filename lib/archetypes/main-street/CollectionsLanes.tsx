/**
 * COLLECTIONS — the color lanes (Cheerful family).
 *
 * Full-width candy-colored bands stacked down the band, each a punched circular
 * cover, a big bold collection name, a small count, and a chunky arrow. Bold,
 * blocky, color-positive — the store that smiles back. A collections band shows
 * GROUPS the shopper walks into, never the goods themselves, so it never rhymes
 * with the goods treatments.
 *
 * Skin-agnostic and class-only: the three lanes carry DIFFERENT band colors in the
 * mockup (three accents), but a skin owns ONE `--ms-accent`. The three distinct
 * bands are DERIVED in CSS from that one accent via `nth-child` + `color-mix`; the
 * real multi-accent palette arrives with the family layer. Text on the saturated
 * bands reads from `--ms-on-accent`, the circular cover's ring is the same on-accent
 * color — no literal ever leaves the mockup. Type is named roles; imagery is graded
 * by the skin's `.archetype-photo` filter. The hover slide and all placement live in
 * skinVarsCss under `.ms-lane*` — never inline; the confetti wallpaper is the family
 * layer's job, not this shape's.
 */
import type { ArchetypeTheme } from '../types';
import { Media } from './chrome';
import { Type } from './Type';
import { DEFAULT_COUNTS } from './defaults';
import type { CollectionView, CollectionsSection } from './collections';

export function CollectionsLanes({
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
    <section id="collections" className="ms-coll-section ms-lane-band">
      <div className="ms-wrap">
        <div className="ms-lane-head">
          {section.label && (
            <Type as="span" role="eyebrow" className="ms-lane-eyebrow">
              {section.label}
            </Type>
          )}
          <Type as="h2" role="goodsHead" className="ms-lane-title">
            {section.title}
          </Type>
        </div>
        <div className="ms-lanes">
          {items.map((c) => (
            <a
              key={c.slug}
              href={`/collections/${c.slug}`}
              data-ms-coll-item=""
              className="ms-lane"
            >
              <span className="ms-lane-pic">
                <Media media={c.cover ?? { kind: 'image', alt: c.name }} />
              </span>
              <Type as="span" role="cardTitle" className="ms-lane-name">
                {c.name}
              </Type>
              <Type as="span" role="legal" className="ms-lane-count">
                {DEFAULT_COUNTS.items(c.count)}
              </Type>
              <Type as="span" role="legal" className="ms-lane-arr" aria-hidden="true">
                →
              </Type>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
