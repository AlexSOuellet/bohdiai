/**
 * Image-prompt directives enforced by the engine (not left to Bohdi's free text).
 * The job is to GUARANTEE photorealism and, for a person, match the maker — without
 * degrading the authored prompt. Two craft rules learned the hard way:
 *
 *  1. Steer realism with POSITIVE cues (medium + camera/lens), never a negation.
 *     "no illustration or 3D render" makes image models attend to "illustration"
 *     and "3D render" and drift toward them — the opposite of the intent.
 *  2. Anchor the subject at the FRONT. A person's gender led the prompt as the
 *     subject is honored; the same words trailing as an afterthought get ignored
 *     (which is why a maker named for a man rendered as a woman).
 *
 * Gender is inferred from the maker's name (a heuristic; unisex/unknown names fall
 * back to the audience default, the maker can change the photo later). It never
 * blocks a build.
 */
import { inferGenderFromName, personPhrase } from '@/lib/name-gender';

/** Positive realism cues — medium + lens, no negations. */
const REALISM = 'Natural light, true textures, fine real-world detail, shot on a full-frame camera';

export interface ImageDirectiveOpts {
  isPerson?: boolean | undefined;
  makerName?: string | undefined;
}

/** Compose ONE coherent prompt from the authored prompt + enforced directives.
 *  Order matters: medium and subject lead, the authored scene follows, realism
 *  cues close. */
export function withImageDirectives(prompt: string, opts: ImageDirectiveOpts): string {
  const base = prompt.trim();
  if (opts.isPerson) {
    const phrase = personPhrase(inferGenderFromName(opts.makerName));
    // Lead with the gendered subject so the model anchors on it.
    return `Photorealistic portrait photograph of ${phrase.noun}. ${base}. ${REALISM} with an 85mm portrait lens.`;
  }
  return `Photorealistic photograph. ${base}. ${REALISM}.`;
}
