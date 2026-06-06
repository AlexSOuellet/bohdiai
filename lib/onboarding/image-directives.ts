/**
 * Image-prompt directives enforced by the engine (not left to Bohdi's free text):
 *  - every generated image is photo-realistic (never illustrated/3D/render);
 *  - a person in the image matches the maker's name (female name → a woman, etc.),
 *    via the shared name→gender helper. A heuristic with a known failure mode
 *    (unisex names, the maker isn't the face) — a sensible default the maker can
 *    override later in the editor; it never blocks a build.
 */
import { inferGenderFromName, personPhrase } from '@/lib/name-gender';

const PHOTO_REAL =
  'photorealistic photograph, natural lighting, real materials and textures, no illustration or 3D render';

export interface ImageDirectiveOpts {
  isPerson?: boolean | undefined;
  makerName?: string | undefined;
}

/** Append the enforced directives to an authored image prompt. */
export function withImageDirectives(prompt: string, opts: ImageDirectiveOpts): string {
  const parts = [prompt.trim()];
  if (opts.isPerson) {
    const phrase = personPhrase(inferGenderFromName(opts.makerName));
    parts.push(`the maker shown is ${phrase.noun}`);
  }
  parts.push(PHOTO_REAL);
  return parts.join('. ');
}
