/**
 * FIND US — the passes (the "ticket stubs" treatment).
 *
 * Each appearance is a torn admission ticket in a horizontal rail: a vertical stub
 * (the weekday, when dated), then the big day number, the month, the venue, and the
 * hours. Tactile, "grab a spot" energy — the Cheerful default; skin-agnostic.
 *
 * Class-only: the ticket, the perforated stub edge, and the rail all live in
 * `skinVarsCss` under `.ms-fu-pass-*`; colors are `--ms-*` vars, type is named roles.
 */
import type { ArchetypeTheme } from '../types';
import { Type } from './Type';
import { type FindUsSection, type FindUsEvent, parseFindUsDate } from './findus';

export function FindUsPasses({
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
    <section id="find-us" className="ms-fu-section ms-fu-passes">
      <div className="ms-wrap">
        <Type as="h2" role="goodsHead" className="ms-fu-pass-head">
          {section.label}
        </Type>
        <div className="ms-fu-pass-rail">
          {events.map((e, i) => {
            const parts = parseFindUsDate(e.date);
            return (
              <div key={i} data-ms-fu-item="" className="ms-fu-pass-ticket">
                <div className="ms-fu-pass-stub" aria-hidden>
                  <Type as="span" role="day" className="ms-fu-pass-stub-l">
                    {parts ? parts.weekdayShort : e.kind ?? ''}
                  </Type>
                </div>
                <div className="ms-fu-pass-body">
                  {parts ? (
                    <>
                      <Type as="span" role="title" className="ms-fu-pass-num">
                        {parts.dayNum}
                      </Type>
                      <Type as="span" role="day" className="ms-fu-pass-mon">
                        {parts.monthShort}
                      </Type>
                    </>
                  ) : (
                    <Type as="span" role="day" className="ms-fu-pass-mon">
                      {e.day}
                    </Type>
                  )}
                  <Type as="h3" role="cardTitle" className="ms-fu-pass-where">
                    {e.where}
                  </Type>
                  <Type as="p" role="price" className="ms-fu-pass-time">
                    {e.time}
                  </Type>
                </div>
              </div>
            );
          })}
        </div>
        {viewAll && (
          <Type as="a" role="navLabel" href={viewAll.href} data-ms-fu-viewall="" className="ms-fu-pass-viewall">
            {viewAll.label} &rarr;
          </Type>
        )}
      </div>
    </section>
  );
}
