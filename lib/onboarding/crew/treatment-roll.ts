/**
 * The treatment roll — the dice the crew reads.
 *
 * Models converge: asked to "pick the treatment that fits," the copywriter lands
 * on the same goods body and the same About body nearly every build, so shops in
 * one niche read alike. The fix keeps the CHOICE with Bohdi but breaks the rut:
 * code rolls a treatment and hands it to him as his starting hand. He plays it
 * unless it genuinely fights the shop, in which case he picks another and says
 * why (see the copywriter prompt). Code supplies the entropy; Bohdi keeps the veto.
 *
 * Pure and deterministic for a given random source so the pipeline is testable
 * and a given number always lands on the same face.
 */
import { GOODS_TREATMENTS, type GoodsTreatment } from '@/lib/archetypes/main-street/goods';
import { FOUNDER_TREATMENTS } from '@/lib/archetypes/main-street/schemas';

type FounderTreatment = (typeof FOUNDER_TREATMENTS)[number];

/** Pick one option uniformly. `rand` returns a float in [0, 1); the clamp guards
 *  the (degenerate) case of a source returning exactly 1. */
export function rollTreatment<T>(options: readonly T[], rand: () => number = Math.random): T {
  const i = Math.min(options.length - 1, Math.floor(rand() * options.length));
  return options[i]!;
}

/** Roll a goods treatment then a founder treatment — two independent draws from
 *  the real sets, in that order. */
export function rollTreatments(rand: () => number = Math.random): {
  goods: GoodsTreatment;
  founder: FounderTreatment;
} {
  return {
    goods: rollTreatment(GOODS_TREATMENTS, rand),
    founder: rollTreatment(FOUNDER_TREATMENTS, rand),
  };
}
