/**
 * FIND US — the calendar (the "month grid" treatment).
 *
 * A real month grid: the month of the soonest appearance, its days padded to a
 * Sunday-first grid, each date dropped into its cell with a marker, plus an agenda
 * list of that month's appearances alongside. The view a maker with a recurring
 * schedule (weekly markets, standing workshops) leans on — a pattern at a glance,
 * not a long list. The Modern default; skin-agnostic.
 *
 * When no row carries a parseable ISO date (a legacy store), there's no grid to
 * build, so it falls back to a plain agenda so the beat always renders.
 *
 * Class-only: every value is a `--ms-*` var, type is named roles. The grid, cells,
 * markers, and agenda all live in `skinVarsCss` under `.ms-fu-cal-*` — never inline.
 */
import type { ArchetypeTheme } from '../types';
import { Type } from './Type';
import {
  type FindUsSection,
  type FindUsEvent,
  FINDUS_WEEKDAY_HEADERS,
  buildFindUsMonth,
} from './findus';

/** The agenda column — the shown appearances in full, shared by the grid + fallback. */
function Agenda({ events }: { events: FindUsEvent[] }) {
  return (
    <div className="ms-fu-cal-agenda">
      {events.map((e, i) => (
        <div key={i} data-ms-fu-item="" className="ms-fu-cal-ag">
          <Type as="span" role="day" className="ms-fu-cal-ag-day">
            {e.day}
          </Type>
          <div className="ms-fu-cal-ag-body">
            <Type as="span" role="where" className="ms-fu-cal-ag-where">
              {e.where}
            </Type>
            <Type as="span" role="price" className="ms-fu-cal-ag-time">
              {e.time}
            </Type>
          </div>
        </div>
      ))}
    </div>
  );
}

export function FindUsCalendar({
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
  const month = buildFindUsMonth(events);
  return (
    <section id="find-us" className="ms-fu-section ms-fu-cal">
      <div className="ms-wrap">
        <div className="ms-fu-cal-grid2">
          <div className="ms-fu-cal-main">
            <Type as="span" role="eyebrow" className="ms-fu-cal-eyebrow">
              {section.label}
            </Type>
            {month ? (
              <>
                <Type as="h2" role="goodsHead" className="ms-fu-cal-title">
                  {month.title}
                </Type>
                <div className="ms-fu-cal-dows" aria-hidden>
                  {FINDUS_WEEKDAY_HEADERS.map((d) => (
                    <Type as="span" role="day" key={d} className="ms-fu-cal-dow">
                      {d}
                    </Type>
                  ))}
                </div>
                <div className="ms-fu-cal-month">
                  {month.cells.map((cell, i) =>
                    cell.dayNum === null ? (
                      <div key={i} className="ms-fu-cal-cell ms-fu-cal-pad" />
                    ) : (
                      <div key={i} className={`ms-fu-cal-cell${cell.events.length > 0 ? ' ms-fu-cal-ev' : ''}`}>
                        <Type as="span" role="caption" className="ms-fu-cal-d">
                          {cell.dayNum}
                        </Type>
                        {cell.events[0] && (
                          <>
                            <span className="ms-fu-cal-dot" aria-hidden />
                            <Type as="span" role="legal" className="ms-fu-cal-ev-l">
                              {cell.events[0].where}
                            </Type>
                          </>
                        )}
                      </div>
                    ),
                  )}
                </div>
              </>
            ) : (
              <Type as="h2" role="goodsHead" className="ms-fu-cal-title">
                Upcoming
              </Type>
            )}
          </div>
          <div className="ms-fu-cal-side">
            <Type as="h3" role="day" className="ms-fu-cal-side-head">
              {month ? 'This month' : 'Upcoming'}
            </Type>
            <Agenda events={month ? month.events : events} />
            {viewAll && (
              <Type as="a" role="navLabel" href={viewAll.href} data-ms-fu-viewall="" className="ms-fu-cal-viewall">
                {viewAll.label} &rarr;
              </Type>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
