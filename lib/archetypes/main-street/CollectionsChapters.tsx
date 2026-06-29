'use client';

/**
 * COLLECTIONS — the chapters (Luxury / Elegant family).
 *
 * A couture lookbook contents page: each collection is a chapter on a single
 * stacked list — a big roman numeral in gold, the collection name, a quiet count
 * line, and one refined plate to the side. Gold hairlines divide the chapters,
 * generous air around them. A collections band shows GROUPS the shopper walks
 * into, never the goods themselves, so it never rhymes with the goods treatments.
 *
 * Skin-agnostic and class-only: the band surface, the gold numeral + hairlines,
 * the muted count line and the plate shadow all derive from the skin's own
 * `--ms-*` vars — no literal ever leaves the mockup. Type is named roles; imagery
 * is graded by the skin's `.archetype-photo` filter. All placement, the divider
 * rules and the plate hover live in skinVarsCss under `.ms-chapter-*` — never
 * inline.
 *
 * (The mockup shows an italic descriptor line; no descriptor field exists, so the
 * supporting line is the collection's count — `N pieces` — through the `caption`
 * role. The marble wallpaper is the family layer's, not ours.)
 */
import type { ArchetypeTheme } from '../types';
import { Media } from './chrome';
import { Type } from './Type';
import type { CollectionView, CollectionsSection } from './collections';

/** Tiny roman-numeral helper — chapters only ever number a handful, so a simple
 *  subtractive table covers every realistic catalog without a library. */
function toRoman(n: number): string {
  const table: ReadonlyArray<[number, string]> = [
    [1000, 'M'],
    [900, 'CM'],
    [500, 'D'],
    [400, 'CD'],
    [100, 'C'],
    [90, 'XC'],
    [50, 'L'],
    [40, 'XL'],
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ];
  let remaining = n;
  let out = '';
  for (const [value, glyph] of table) {
    while (remaining >= value) {
      out += glyph;
      remaining -= value;
    }
  }
  return out;
}

export function CollectionsChapters({
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
    <section id="collections" className="ms-coll-section ms-chapter">
      <div className="ms-wrap">
        <div className="ms-chapter-head">
          {section.label && (
            <Type as="span" role="eyebrow" className="ms-chapter-eyebrow">
              {section.label}
            </Type>
          )}
          <Type as="h2" role="goodsHead" className="ms-chapter-title">
            {section.title}
          </Type>
        </div>
        <div className="ms-chapter-list">
          {items.map((c, i) => (
            <a
              key={c.slug}
              href={`/collections/${c.slug}`}
              data-ms-coll-item=""
              className="ms-chapter-row"
            >
              <Type as="span" role="title" className="ms-chapter-roman">
                {toRoman(i + 1)}
              </Type>
              <span className="ms-chapter-txt">
                <Type as="span" role="cardTitle" className="ms-chapter-name">
                  {c.name}
                </Type>
                <Type as="span" role="caption" className="ms-chapter-count">
                  {`${c.count} pieces`}
                </Type>
              </span>
              <span className="ms-chapter-plate">
                <Media media={c.cover ?? { kind: 'image', alt: c.name }} />
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
