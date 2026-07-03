/**
 * FIND US — the next stop (the "spotlight the next appearance" treatment).
 *
 * The next appearance blown up VENUE-FIRST — the place is the hero at display scale,
 * with the date and hours as a supporting accent line above it and a "see all dates"
 * call to action below — the remaining appearances trailing small underneath. Where
 * the maker is is the point, not the weekday. The Dark default; skin-agnostic.
 *
 * Class-only: the spotlight, the CTA, and the trailing strip live in `skinVarsCss`
 * under `.ms-fu-next-*`; colors are `--ms-*` vars, type is named roles. The rows
 * render in configured order — the first is the spotlight; we don't recompute "next".
 */
import type { ArchetypeTheme } from '../types';
import { Type } from './Type';
import { type FindUsSection, type FindUsEvent, parseFindUsDate } from './findus';

/** A trailing appearance: its short date, venue, and time on one line. */
function alsoLabel(e: FindUsEvent): string {
  const p = parseFindUsDate(e.date);
  return p ? `${p.monthShort} ${p.dayNum}` : e.day;
}

/** The spotlight's supporting accent: the full date and the hours. */
function dateAccent(e: FindUsEvent): string {
  const p = parseFindUsDate(e.date);
  const when = p ? `${p.weekday}, ${p.monthShort} ${p.dayNum}` : e.day;
  return `${when} · ${e.time}`;
}

export function FindUsNextStop({
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
  const [spotlight, ...rest] = events;
  if (!spotlight) return null;
  return (
    <section id="find-us" className="ms-fu-section ms-fu-next">
      <div className="ms-wrap">
        <Type as="span" role="eyebrow" className="ms-fu-next-eyebrow">
          {section.label}
        </Type>
        <Type as="span" role="day" className="ms-fu-next-date">
          {dateAccent(spotlight)}
        </Type>
        <Type as="p" role="closeHead" className="ms-fu-next-where">
          {spotlight.where}
        </Type>
        {viewAll && (
          <Type as="a" role="navLabel" href={viewAll.href} data-ms-fu-viewall="" className="ms-fu-next-cta">
            {viewAll.label} &rarr;
          </Type>
        )}
        {rest.length > 0 && (
          <div className="ms-fu-next-also">
            <Type as="span" role="day" className="ms-fu-next-also-lbl">
              Also coming up
            </Type>
            <div className="ms-fu-next-strip">
              {rest.map((e, i) => (
                <div key={i} data-ms-fu-item="" className="ms-fu-next-s">
                  <Type as="span" role="day" className="ms-fu-next-sd">
                    {alsoLabel(e)}
                  </Type>
                  <Type as="span" role="where" className="ms-fu-next-sv">
                    {e.where}
                  </Type>
                  <Type as="span" role="price" className="ms-fu-next-st">
                    {e.time}
                  </Type>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
