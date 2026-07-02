/**
 * FIND US — the poster (the "printed broadside" treatment).
 *
 * One framed sheet — a printed poster where the whole run of dates IS the artwork:
 * the heading set large, an ornament, then the appearances as a playbill list (date,
 * venue, hours). The season on a single sheet. The Cozy default; skin-agnostic.
 *
 * Class-only: the framed sheet, the double rule, the ornament, and the playbill rows
 * live in `skinVarsCss` under `.ms-fu-poster-*`; colors are `--ms-*` vars, type is
 * named roles.
 */
import type { ArchetypeTheme } from '../types';
import { Type } from './Type';
import { type FindUsSection, type FindUsEvent, parseFindUsDate } from './findus';

function posterDate(e: FindUsEvent): string {
  const p = parseFindUsDate(e.date);
  return p ? `${p.weekdayShort} ${p.monthShort} ${p.dayNum}` : e.day;
}

export function FindUsPoster({
  section,
  events,
  skin: _skin,
  viewAll,
}: {
  section: FindUsSection;
  events: FindUsEvent[];
  skin: ArchetypeTheme;
  viewAll?: { href: string; label: string } | undefined;
}) {
  return (
    <section id="find-us" className="ms-fu-section ms-fu-poster">
      <div className="ms-wrap">
        <div className="ms-fu-poster-sheet">
          <Type as="h2" role="closeHead" className="ms-fu-poster-title">
            {section.label}
          </Type>
          <div className="ms-fu-poster-orn" aria-hidden>
            <span>&#10086;</span>
          </div>
          <div className="ms-fu-poster-dates">
            {events.map((e, i) => (
              <div key={i} data-ms-fu-item="" className="ms-fu-poster-ln">
                <Type as="span" role="day" className="ms-fu-poster-dd">
                  {posterDate(e)}
                </Type>
                <Type as="span" role="cardTitle" className="ms-fu-poster-de">
                  {e.where}
                  <Type as="span" role="where" className="ms-fu-poster-place">
                    {e.time}
                  </Type>
                </Type>
              </div>
            ))}
          </div>
          {viewAll && (
            <Type as="a" role="navLabel" href={viewAll.href} data-ms-fu-viewall="" className="ms-fu-poster-foot">
              {viewAll.label} &rarr;
            </Type>
          )}
        </div>
      </div>
    </section>
  );
}
