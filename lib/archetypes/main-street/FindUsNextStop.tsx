/**
 * FIND US — the next stop (the "spotlight the nearest date" treatment).
 *
 * The soonest appearance blown up huge — a big when (the weekday, when dated), a
 * date/time tag, the venue at display scale, then a "see all dates" call to action —
 * with the remaining appearances trailing small underneath. For the maker who wants
 * everyone at the very next date. The Dark default; skin-agnostic.
 *
 * Class-only: the spotlight, the CTA, and the trailing strip live in `skinVarsCss`
 * under `.ms-fu-next-*`; colors are `--ms-*` vars, type is named roles. The rows are
 * assumed chronological (the copywriter seeds them in date order); the first is the
 * spotlight.
 */
import type { ArchetypeTheme } from '../types';
import { Type } from './Type';
import { type FindUsSection, type FindUsEvent, parseFindUsDate } from './findus';

/** A trailing appearance: its short date, venue, and time on one line. */
function alsoLabel(e: FindUsEvent): string {
  const p = parseFindUsDate(e.date);
  return p ? `${p.monthShort} ${p.dayNum}` : e.day;
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
  const parts = parseFindUsDate(spotlight.date);
  const when = parts ? parts.weekday : spotlight.day;
  const tag = parts ? `${parts.monthShort} ${parts.dayNum} · ${spotlight.time}` : spotlight.time;
  return (
    <section id="find-us" className="ms-fu-section ms-fu-next">
      <div className="ms-wrap">
        <Type as="span" role="eyebrow" className="ms-fu-next-eyebrow">
          {section.label}
        </Type>
        <div className="ms-fu-next-now">
          <Type as="span" role="closeHead" className="ms-fu-next-when">
            {when}
          </Type>
          <Type as="span" role="day" className="ms-fu-next-tag">
            {tag}
          </Type>
        </div>
        <Type as="p" role="goodsHead" className="ms-fu-next-where">
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
