/**
 * FOUNDER — the About-beat dispatcher.
 *
 * Beat 3 has four MAKER-ONLY bodies (quote / portrait / letter / card). BOHDI
 * picks which (founder.treatment), like the goods beat; when he hasn't (legacy
 * rows), it falls back to the quote. There is no mood→treatment rule — any body
 * fits any mood. The market calendar is its OWN beat (FindUsBeat), never here.
 */
import type { ArchetypeTheme } from '../types';
import type { MainStreetView } from './schemas';
import { selectFounderTreatment, type FounderTreatment } from './founder';
import {
  FounderQuote,
  FounderPortrait,
  FounderLetter,
  FounderCard,
  FounderWorkbench,
  FounderEditorial,
  FounderSignature,
  type FounderAbout,
} from './FounderBeats';
import { FounderCabinet } from './VintagePieces';
import type { FamilyWords } from './words';

export function FounderBeat({
  founder,
  skin,
  words,
  treatment,
  aboutHref = '/about',
  aboutPage,
  showAboutCue = true,
}: {
  founder: MainStreetView['founder'];
  skin: ArchetypeTheme;
  /** The site's words. */
  words: FamilyWords;
  /** Force a treatment (previews/tests). Otherwise Bohdi's pick, then the quote. */
  treatment?: FounderTreatment | undefined;
  /** Where the "about" cue points — the full bio page. */
  aboutHref?: string | undefined;
  /** The full About-page story — the editorial treatment surfaces it as a feature
   *  on the home. Absent for legacy rows; editorial then falls back to the quote. */
  aboutPage?: MainStreetView['about'] | undefined;
  /** The About page itself renders the beat as its hero — no "read the full story"
   *  cue then (you're already there). Defaults on for the home teaser. */
  showAboutCue?: boolean | undefined;
}) {
  // The family picks the founder treatment; caller passes it in. selectFounderTreatment
  // still guards for legacy render paths that don't thread one.
  const chosen = selectFounderTreatment(treatment);
  const about: FounderAbout | undefined = showAboutCue
    ? { href: aboutHref, label: founder.aboutLabel ?? words.fallbackReadFullStory }
    : undefined;

  switch (chosen) {
    case 'portrait':
      return <FounderPortrait founder={founder} skin={skin} about={about} />;
    case 'letter':
      return <FounderLetter founder={founder} skin={skin} words={words} about={about} />;
    case 'card':
      return <FounderCard founder={founder} skin={skin} about={about} />;
    case 'workbench':
      return <FounderWorkbench founder={founder} skin={skin} about={about} />;
    case 'editorial':
      return <FounderEditorial founder={founder} skin={skin} about={about} aboutPage={aboutPage} />;
    case 'signature':
      return <FounderSignature founder={founder} skin={skin} about={about} />;
    case 'cabinet-card':
      return <FounderCabinet founder={founder} skin={skin} about={about} />;
    default:
      return <FounderQuote founder={founder} skin={skin} about={about} />;
  }
}
