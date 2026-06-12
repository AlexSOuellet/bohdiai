/**
 * Shared input for the crew pipeline. Everything the Director and the three
 * specialists need about the maker. Extends the archetype's AuthoringBrief with
 * the raw mood key, which the Graphic Artist needs to gate skin selection to the
 * mood-aligned subset (D41).
 */
import type { AuthoringBrief } from '@/lib/archetypes/builder';
import type { MoodKey } from '@/lib/moods';
import type { CopywriterDraft } from './copywriter-schema';
import type { MomentScene } from './cinematographer';
import type { GraphicSpec } from './graphic-artist';
import type { VisionPerPhoto } from '@/app/onboarding/_components/types';

export interface CrewBrief extends AuthoringBrief {
  moodKey: MoodKey;
  /** Per-photo Vision read of the maker's uploaded product photos, one entry per
   *  upload in upload order. Undefined or empty when photos were skipped. The
   *  Copywriter uses these as a starting hand for products 1..N. */
  visionPerPhoto?: VisionPerPhoto[];
  /** Cross-photo Vision summary — 2-3 sentences on what this maker actually
   *  makes. Threaded into the Director's and Cinematographer's prompts.
   *  Undefined/empty when no photos were uploaded. */
  makerWork?: string;
}

/** The three artifacts the crew produces, before media generation. The pipeline
 *  assembles these into the engine's MainStreetAuthored envelope. */
export interface CrewOutput {
  copy: CopywriterDraft;
  moment: MomentScene;
  look: GraphicSpec;
}
