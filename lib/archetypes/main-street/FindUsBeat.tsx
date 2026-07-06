/**
 * FIND US — the beat dispatcher.
 *
 * The find-us beat is a SHARED POOL of six treatments (board / calendar / passes /
 * next-stop / itinerary / poster) — a store wears ONE, families double up (like the
 * reviews pool + the nav registers). Which one renders is a family-level look choice
 * authored as `findUs.treatment` (an explicit override wins for previews/tests); the
 * documented default is the fallback until the family layer wires per-family defaults.
 * The home shows only a HANDFUL of dates; the full list lives on the Events page.
 * Renders nothing when the shop has no dates (guarded by MainStreet).
 */
import type { ArchetypeTheme } from '../types';
import {
  type FindUsSection,
  type FindUsTreatment,
  DEFAULT_FINDUS_TREATMENT,
  sampleEvents,
  currentYearMonth,
} from './findus';
import { FindUsBoard } from './FindUsBoard';
import { FindUsCalendar } from './FindUsCalendar';
import { FindUsPasses } from './FindUsPasses';
import { FindUsNextStop } from './FindUsNextStop';
import { FindUsItinerary } from './FindUsItinerary';
import { FindUsPoster } from './FindUsPoster';
import { DEFAULT_STRINGS } from './defaults';

export function FindUsBeat({
  findUs,
  skin,
  treatment,
  eventsHref = '/events',
  full = false,
}: {
  findUs: FindUsSection;
  skin: ArchetypeTheme;
  /** Force a treatment (the ?findus= preview / tests). When omitted the authored
   *  `findUs.treatment` wins, then the documented default. */
  treatment?: FindUsTreatment | undefined;
  eventsHref?: string | undefined;
  /** The full Events page wears the SAME treatment as the home teaser, but with
   *  every date (not the home handful) and no "see all" cue — you're already here. */
  full?: boolean | undefined;
}) {
  if (findUs.rows.length === 0) return null;
  const chosen = treatment ?? findUs.treatment ?? DEFAULT_FINDUS_TREATMENT;
  const events = full ? findUs.rows : sampleEvents(findUs.rows);
  const viewAll = full ? undefined : { href: eventsHref, label: findUs.eventsLabel ?? DEFAULT_STRINGS.fallbackSeeAllDates };
  const props = { section: findUs, events, skin, viewAll };

  switch (chosen) {
    case 'calendar': {
      // A real calendar opens on the current month (server-computed so it tracks
      // today) and pages from there over the shop's full date list — not the handful.
      const { year, month } = currentYearMonth(new Date());
      return <FindUsCalendar section={findUs} viewAll={viewAll} year={year} month={month} />;
    }
    case 'passes':
      return <FindUsPasses {...props} />;
    case 'next-stop':
      return <FindUsNextStop {...props} />;
    case 'itinerary':
      return <FindUsItinerary {...props} />;
    case 'poster':
      return <FindUsPoster {...props} />;
    case 'board':
    default:
      return <FindUsBoard {...props} />;
  }
}
