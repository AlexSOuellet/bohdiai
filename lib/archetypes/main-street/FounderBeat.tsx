/**
 * FOUNDER — the beat dispatcher.
 *
 * Beat 3 has four bodies (quote / portrait / letter / findus). Which renders is
 * SELECTED from the maker's in-person cadence + mood — never a maker choice. It
 * resolves the treatment (or takes an explicit one for previews), guards the
 * calendar-only treatment, and renders it with the "about" teaser cue.
 */
import type { ArchetypeTheme } from '../types';
import type { MainStreetContent } from './schemas';
import { selectFounderTreatment, type FounderTreatment } from './founder';
import { FounderQuote, FounderPortrait, FounderLetter, FounderFindUs, type FounderAbout } from './FounderBeats';

const DEFAULT_ABOUT = 'Read the full story';

export function FounderBeat({
  founder,
  skin,
  mood,
  treatment,
  aboutHref = '/about',
  eventsHref = '/events',
}: {
  founder: MainStreetContent['founder'];
  skin: ArchetypeTheme;
  /** Mood lean — chooses how intimate/cinematic the band reads. Optional. */
  mood?: string | undefined;
  /** Force a treatment (previews/tests). When omitted it is selected. */
  treatment?: FounderTreatment | undefined;
  /** Where the "about" cue points — the full bio page. */
  aboutHref?: string | undefined;
  /** Where the calendar's events cue points — the full Events page. */
  eventsHref?: string | undefined;
}) {
  const rows = founder.findUs?.rows.length ?? 0;
  const wanted = treatment ?? selectFounderTreatment({ mood, findUsRows: rows });
  // findus leads with the calendar — fall back if the maker does no events.
  const chosen: FounderTreatment = wanted === 'findus' && rows === 0 ? 'quote' : wanted;
  const about: FounderAbout = { href: aboutHref, label: founder.aboutLabel ?? DEFAULT_ABOUT };

  switch (chosen) {
    case 'portrait':
      return <FounderPortrait founder={founder} skin={skin} about={about} eventsHref={eventsHref} />;
    case 'letter':
      return <FounderLetter founder={founder} skin={skin} about={about} eventsHref={eventsHref} />;
    case 'findus':
      return <FounderFindUs founder={founder} skin={skin} about={about} eventsHref={eventsHref} />;
    default:
      return <FounderQuote founder={founder} skin={skin} about={about} eventsHref={eventsHref} />;
  }
}
