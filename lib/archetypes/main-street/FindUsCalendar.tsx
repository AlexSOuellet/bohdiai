'use client';
/**
 * FIND US — the calendar (the "month grid" treatment).
 *
 * A REAL calendar: it opens on the current month (passed from the server so it tracks
 * today, not the maker's soonest date) and pages forward and back. Each appearance is
 * dropped onto its real day cell; an agenda of that month's appearances sits alongside.
 * A month with nothing shows a friendly check-back line — the maker keeps the dates
 * current, we don't hide or recompute them. The Modern default; skin-agnostic.
 *
 * Class-only: the grid, cells, markers, nav arrows, and agenda live in `skinVarsCss`
 * under `.ms-fu-cal-*` — never inline.
 */
import { useState } from 'react';
import { Type } from './Type';
import { type FindUsSection, type FindUsEvent, FINDUS_WEEKDAY_HEADERS, buildFindUsMonth } from './findus';

/** The agenda column — the shown month's appearances in full. */
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
  viewAll,
  year,
  month,
}: {
  section: FindUsSection;
  /** The month the calendar opens on — the current real month (server-computed). */
  year: number;
  month: number;
  viewAll?: { href: string; label: string } | undefined;
}) {
  const [view, setView] = useState({ year, month });
  const step = (delta: number) =>
    setView((v) => {
      const m = v.month + delta;
      if (m < 1) return { year: v.year - 1, month: 12 };
      if (m > 12) return { year: v.year + 1, month: 1 };
      return { year: v.year, month: m };
    });

  const grid = buildFindUsMonth(section.rows, view);
  const hasEvents = grid.events.length > 0;

  return (
    <section id="find-us" className="ms-fu-section ms-fu-cal">
      <div className="ms-wrap">
        <div className="ms-fu-cal-grid2">
          <div className="ms-fu-cal-main">
            <Type as="span" role="eyebrow" className="ms-fu-cal-eyebrow">
              {section.label}
            </Type>
            <div className="ms-fu-cal-nav">
              <button type="button" aria-label="Previous month" className="ms-fu-cal-arrow" onClick={() => step(-1)}>
                &larr;
              </button>
              <Type as="h2" role="goodsHead" className="ms-fu-cal-title">
                {grid.title}
              </Type>
              <button type="button" aria-label="Next month" className="ms-fu-cal-arrow" onClick={() => step(1)}>
                &rarr;
              </button>
            </div>
            <div className="ms-fu-cal-dows" aria-hidden>
              {FINDUS_WEEKDAY_HEADERS.map((d) => (
                <Type as="span" role="day" key={d} className="ms-fu-cal-dow">
                  {d}
                </Type>
              ))}
            </div>
            <div className="ms-fu-cal-month">
              {grid.cells.map((cell, i) =>
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
          </div>
          <div className="ms-fu-cal-side">
            <Type as="h3" role="day" className="ms-fu-cal-side-head">
              This month
            </Type>
            {hasEvents ? (
              <Agenda events={grid.events} />
            ) : (
              <Type as="p" role="body" className="ms-fu-cal-empty">
                No dates this month — check back soon.
              </Type>
            )}
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
