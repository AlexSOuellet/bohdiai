/**
 * FOUNDER — the About-beat dispatcher.
 *
 * Beat 3 has four MAKER-ONLY bodies (quote / portrait / letter / card). BOHDI
 * picks which (founder.treatment), like the goods beat; when he hasn't, it is
 * selected from mood only — never from market-date count (we don't know it at
 * onboarding). The market calendar is its OWN beat (FindUsBeat), never here.
 */
import type { ArchetypeTheme } from '../types';
import type { MainStreetContent } from './schemas';
import { selectFounderTreatment, type FounderTreatment } from './founder';
import { FounderQuote, FounderPortrait, FounderLetter, FounderCard, type FounderAbout } from './FounderBeats';

const DEFAULT_ABOUT = 'Read the full story';

export function FounderBeat({
  founder,
  skin,
  mood,
  treatment,
  aboutHref = '/about',
}: {
  founder: MainStreetContent['founder'];
  skin: ArchetypeTheme;
  /** Mood lean — chooses how intimate/cinematic the band reads when Bohdi
   *  didn't pick. Optional. */
  mood?: string | undefined;
  /** Force a treatment (previews/tests). Otherwise Bohdi's pick, then selection. */
  treatment?: FounderTreatment | undefined;
  /** Where the "about" cue points — the full bio page. */
  aboutHref?: string | undefined;
}) {
  const chosen = selectFounderTreatment({ mood, pick: treatment ?? founder.treatment });
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
