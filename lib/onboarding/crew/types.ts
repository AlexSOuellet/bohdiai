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

export interface CrewBrief extends AuthoringBrief {
  moodKey: MoodKey;
}

/** The three artifacts the crew produces, before media generation. The pipeline
 *  assembles these into the engine's MainStreetAuthored envelope. */
export interface CrewOutput {
  copy: CopywriterDraft;
  moment: MomentScene;
  look: GraphicSpec;
}
