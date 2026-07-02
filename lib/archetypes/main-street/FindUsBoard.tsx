/**
 * FIND US — the board (the "tour-dates list" treatment).
 *
 * Chronological rows, date-led: a compact date block on the left (weekday / big day
 * number / month, derived from the row's ISO date — falling back to the authored
 * `day` string when there's no date), the venue and hours across the middle, an
 * optional kind pill on the right. The editorial workhorse; reads fine with two
 * dates or twenty. The Luxury default (a refined appointments list) but skin-agnostic.
 *
 * Class-only and skin-agnostic: there are no photos here, so no scrims — every value
 * derives from the skin's own `--ms-*` vars, and type is named roles (day / title /
 * where / price / eyebrow). Placement, the row rule, and the date block all live in
 * `skinVarsCss` under `.ms-fu-board-*` — never inline.
 */
import type { ArchetypeTheme } from '../types';
import { Type } from './Type';
import { type FindUsSection, type FindUsEvent, parseFindUsDate } from './findus';

export function FindUsBoard({
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
    <section id="find-us" className="ms-fu-section ms-fu-board">
      <div className="ms-wrap">
        <Type as="h2" role="goodsHead" className="ms-fu-board-head">
          {section.label}
        </Type>
        <div className="ms-fu-board-rows">
          {events.map((e, i) => {
            const parts = parseFindUsDate(e.date);
            return (
              <div key={i} data-ms-fu-item="" className="ms-fu-board-row">
                <div className="ms-fu-board-date">
                  {parts ? (
                    <>
                      <Type as="span" role="day" className="ms-fu-board-dow">
                        {parts.weekdayShort}
                      </Type>
                      <Type as="span" role="title" className="ms-fu-board-num">
                        {parts.dayNum}
                      </Type>
                      <Type as="span" role="day" className="ms-fu-board-mon">
                        {parts.monthShort}
                      </Type>
                    </>
                  ) : (
                    <Type as="span" role="day" className="ms-fu-board-day">
                      {e.day}
                    </Type>
                  )}
                </div>
                <div className="ms-fu-board-venue">
                  <Type as="h3" role="cardTitle" className="ms-fu-board-where">
                    {e.where}
                  </Type>
                  <Type as="p" role="price" className="ms-fu-board-time">
                    {e.time}
                  </Type>
                </div>
                {e.kind && (
                  <Type as="span" role="eyebrow" data-ms-fu-kind={e.kind} className="ms-fu-board-kind">
                    {e.kind}
                  </Type>
                )}
              </div>
            );
          })}
        </div>
        {viewAll && (
          <Type as="a" role="navLabel" href={viewAll.href} data-ms-fu-viewall="" className="ms-fu-board-viewall">
            {viewAll.label} &rarr;
          </Type>
        )}
      </div>
    </section>
  );
}
