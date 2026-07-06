/**
 * COLLECTIONS — the portals (Dark family).
 *
 * Tall lit doorways emerging from shadow. Vertical columns, dim, with an ember
 * glow pooling at the floor of each — moody and a little mysterious. The shopper
 * doesn't browse a row of cards; they look down a row of doorways and step into
 * one. Each portal is a tall photo column with the collection name in caps over a
 * thin accent rule and the count beneath, all anchored low where the glow lifts it.
 *
 * Skin-agnostic and class-only. The "emerging from shadow" look does NOT depend on
 * the page being dark: a black gradient scrim is painted OVER each cover (clear at
 * the eye line, sinking to black at top and bottom), so the doorway reads on any
 * skin. The ember floor-glow is a radial wash in `--ms-accent`; the band field is
 * `--ms-bg`; the rule under each name is `--ms-accent`. Text over the cover uses
 * the fixed `--ms-on-media` near-white (legible on any photo), the count its muted
 * companion. All placement, the scrim, the glow, the hover lift, and the mobile
 * single-column collapse live in skinVarsCss under `.ms-portal-*` — never inline.
 */
import type { ArchetypeTheme } from '../types';
import type { CollectionView, CollectionsSection } from './collections';
import { Media } from './chrome';
import { Type } from './Type';
import { DEFAULT_COUNTS } from './defaults';

export function CollectionsPortals({
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
    <section id="collections" className="ms-coll-section ms-portal">
      <div className="ms-wrap">
        <div className="ms-portal-head">
          {section.label && (
            <Type as="span" role="eyebrow" className="ms-portal-eyebrow">
              {section.label}
            </Type>
          )}
          <Type as="h2" role="goodsHead" className="ms-portal-title">
            {section.title}
          </Type>
        </div>
        <div className="ms-portal-grid">
          {items.map((c) => (
            <a key={c.slug} href={`/collections/${c.slug}`} data-ms-coll-item="" className="ms-portal-item">
              <span className="ms-portal-cover">
                <Media media={c.cover ?? { kind: 'image', alt: c.name }} />
              </span>
              <span className="ms-portal-scrim" aria-hidden />
              <span className="ms-portal-glow" aria-hidden />
              <span className="ms-portal-cap">
                <Type as="span" role="cardTitle" className="ms-portal-name">
                  {c.name}
                </Type>
                <span className="ms-portal-rule" aria-hidden />
                <Type as="span" role="legal" className="ms-portal-count">
                  {DEFAULT_COUNTS.pieces(c.count)}
                </Type>
              </span>
            </a>
          ))}
        </div>
        {viewAll && (
          <a href={viewAll.href} data-ms-coll-viewall="" className="ms-portal-viewall">
            <Type as="span" role="eyebrow">
              {viewAll.label}
            </Type>
          </a>
        )}
      </div>
    </section>
  );
}
