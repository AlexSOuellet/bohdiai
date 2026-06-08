/**
 * Image-prompt directives enforced by the engine (not left to Bohdi's free text).
 * The job is to GUARANTEE photorealism without degrading the authored prompt.
 * One craft rule learned the hard way:
 *
 *   Steer realism with POSITIVE cues (medium + camera/lens), never a negation.
 *   "no illustration or 3D render" makes image models attend to "illustration"
 *   and "3D render" and drift toward them — the opposite of the intent.
 *
 * A person is framed gender-neutrally — by hands, work, and bench — never a
 * guessed gender, until the maker uploads a real photo (D42). The engine does
 * not infer gender from a name.
 */

/** Positive realism cues — medium + lens, no negations. */
const REALISM = 'Natural light, true textures, fine real-world detail, shot on a full-frame camera';

export interface ImageDirectiveOpts {
  isPerson?: boolean | undefined;
  makerName?: string | undefined; // retained for callers; not used to guess gender
}

/** Compose ONE coherent prompt from the authored prompt + enforced directives.
 *  A person is framed gender-neutrally — by hands, work, and bench — never a
 *  guessed gender, until the maker uploads a real photo (D42). */
export function withImageDirectives(prompt: string, opts: ImageDirectiveOpts): string {
  const base = prompt.trim();
  if (opts.isPerson) {
    return `Photorealistic photograph of the maker at work — framed on their hands and their craft at the workbench, face not the subject. ${base}. ${REALISM} with a 50mm lens.`;
  }
  return `Photorealistic photograph. ${base}. ${REALISM}.`;
}
