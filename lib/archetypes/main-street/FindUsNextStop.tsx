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
import { MarketName } from './MarketName';
import type { ArchetypeTheme } from '../types';
import { Type } from './Type';
import { type FindUsSection, type FindUsEvent, parseFindUsDate } from './findus';
import type { FamilyWords } from './words';
import { fill } from '@/lib/site-words/words';

/** A trailing appearance: its short date, venue, and time on one line. */
function alsoLabel(e: FindUsEvent, w: FamilyWords): string {
  const p = parseFindUsDate(e.date, w.dateLocale);
  return p ? fill(w.nextStopDay, { month: p.monthShort, day: p.dayNum }) : e.day;
}

/** The spotlight's supporting accent: the full date and the hours, in the site's words. */
function dateAccent(e: FindUsEvent, w: FamilyWords): string {
  const p = parseFindUsDate(e.date, w.dateLocale);
  const when = p ? fill(w.nextStopWhen, { weekday: p.weekday, month: p.monthShort, day: p.dayNum }) : e.day;
  return fill(w.nextStopAccent, { when, time: e.time });
}

export function FindUsNextStop({
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
  const [spotlight, ...rest] = events;
  if (!spotlight) return null;
  return (
    <section id="find-us" className="ms-fu-section ms-fu-next">
      <div className="ms-wrap">
        <Type as="span" role="eyebrow" className="ms-fu-next-eyebrow">
          {section.label}
        </Type>
        <Type as="span" role="day" className="ms-fu-next-date">
          {dateAccent(spotlight, words)}
        </Type>
        <Type as="p" role="closeHead" className="ms-fu-next-where">
          <MarketName e={spotlight} />
        </Type>
        {viewAll && (
          <Type as="a" role="navLabel" href={viewAll.href} data-ms-fu-viewall="" className="ms-fu-next-cta">
            {viewAll.label} &rarr;
          </Type>
        )}
        {rest.length > 0 && (
          <div className="ms-fu-next-also">
            <Type as="span" role="day" className="ms-fu-next-also-lbl">
              {words.findUsAlsoComingUp}
            </Type>
            <div className="ms-fu-next-strip">
              {rest.map((e, i) => (
                <div key={i} data-ms-fu-item="" className="ms-fu-next-s">
                  <Type as="span" role="day" className="ms-fu-next-sd">
                    {alsoLabel(e, words)}
                  </Type>
                  <Type as="span" role="where" className="ms-fu-next-sv">
                    <MarketName e={e} />
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
