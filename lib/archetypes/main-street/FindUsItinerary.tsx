/**
 * FIND US — the itinerary (the "stitched route line" treatment).
 *
 * The season as a travel-log: appearances strung down a dashed route line, stop
 * after stop, town after town — each a node carrying its date, venue, an optional
 * kind pill, and hours. Where the maker is headed. The Rustic default; skin-agnostic.
 *
 * Class-only: the route line, the nodes, and the stops live in `skinVarsCss` under
 * `.ms-fu-itin-*`; colors are `--ms-*` vars, type is named roles.
 */
import type { ArchetypeTheme } from '../types';
import { Type } from './Type';
import { type FindUsSection, type FindUsEvent, parseFindUsDate } from './findus';
import type { FamilyWords } from './words';
import { fill } from '@/lib/site-words/words';

/** A stop's date in the site's words: "Sat, Jul 12". */
function stopDate(e: FindUsEvent, w: FamilyWords): string {
  const p = parseFindUsDate(e.date, w.dateLocale);
  return p ? fill(w.itineraryDay, { weekday: p.weekdayShort, month: p.monthShort, day: p.dayNum }) : e.day;
}

export function FindUsItinerary({
  section,
  events,
  skin: _skin,
  words,
  viewAll,
}: {
  section: FindUsSection;
  events: FindUsEvent[];
  skin: ArchetypeTheme;
  /** The site's words. */
  words: FamilyWords;
  viewAll?: { href: string; label: string } | undefined;
}) {
  return (
    <section id="find-us" className="ms-fu-section ms-fu-itin">
      <div className="ms-wrap">
        <Type as="h2" role="goodsHead" className="ms-fu-itin-head">
          {section.label}
        </Type>
        <div className="ms-fu-itin-route">
          {events.map((e, i) => (
            <div key={i} data-ms-fu-item="" className="ms-fu-itin-stop">
              <span className="ms-fu-itin-node" aria-hidden />
              <Type as="span" role="day" className="ms-fu-itin-dt">
                {stopDate(e, words)}
              </Type>
              <Type as="h3" role="cardTitle" className="ms-fu-itin-where">
                {e.where}
              </Type>
              <Type as="p" role="where" className="ms-fu-itin-time">
                {e.time}
              </Type>
            </div>
          ))}
        </div>
        {viewAll && (
          <Type as="a" role="navLabel" href={viewAll.href} data-ms-fu-viewall="" className="ms-fu-itin-viewall">
            {viewAll.label} &rarr;
          </Type>
        )}
      </div>
    </section>
  );
}
