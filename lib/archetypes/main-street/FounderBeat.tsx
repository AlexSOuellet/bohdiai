/**
 * FOUNDER — the About-beat dispatcher.
 *
 * Beat 3 has four MAKER-ONLY bodies (quote / portrait / letter / card). BOHDI
 * picks which (founder.treatment), like the goods beat; when he hasn't (legacy
 * rows), it falls back to the quote. There is no mood→treatment rule — any body
 * fits any mood. The market calendar is its OWN beat (FindUsBeat), never here.
 */
import type { ArchetypeTheme } from '../types';
import type { MainStreetContent } from './schemas';
import { selectFounderTreatment, type FounderTreatment } from './founder';
import { FounderQuote, FounderPortrait, FounderLetter, FounderCard, type FounderAbout } from './FounderBeats';

const DEFAULT_ABOUT = 'Read the full story';

export function FounderBeat({
  founder,
  skin,
  treatment,
  aboutHref = '/about',
}: {
  founder: MainStreetContent['founder'];
  skin: ArchetypeTheme;
  /** Force a treatment (previews/tests). Otherwise Bohdi's pick, then the quote. */
  treatment?: FounderTreatment | undefined;
  /** Where the "about" cue points — the full bio page. */
  aboutHref?: string | undefined;
}) {
  const chosen = selectFounderTreatment(treatment ?? founder.treatment);
  const about: FounderAbout = { href: aboutHref, label: founder.aboutLabel ?? DEFAULT_ABOUT };

  switch (chosen) {
    case 'portrait':
      return <FounderPortrait founder={founder} skin={skin} about={about} />;
    case 'letter':
      return <FounderLetter founder={founder} skin={skin} about={about} />;
    case 'card':
      return <FounderCard founder={founder} skin={skin} about={about} />;
    default:
      return <FounderQuote founder={founder} skin={skin} about={about} />;
  }
}
