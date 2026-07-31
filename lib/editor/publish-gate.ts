/**
 * The publish honesty gate (D68 / D70). A store must not go live while it still
 * shows content that's ours, not the maker's — the About we wrote, placeholder
 * products, AI-seeded reviews, or seeded sample dates. This is separate from walk
 * completeness: it also guards later editor edits (a maker who turns reviews back
 * on without adding real ones, or un-makes the About, is blocked at Publish).
 *
 * The gate reuses the walk's per-section resolution (`sectionResolved`): the four
 * honesty-sensitive sections must be made-real, or — where allowed — turned off.
 * (Products' real-vs-placeholder check strengthens here when the listings build
 * lands; for now `goods` resolves on its heading like the other must-change work.)
 */
import type { SectionKey } from '@/lib/archetypes/main-street/families';
import { sectionResolved } from './walkthrough';

export interface PublishBlocker {
  readonly section: SectionKey;
  /** Maker-facing name of what's still unfinished. */
  readonly label: string;
}

/** The honesty-sensitive sections, in the order they'd read to a maker. */
const HONESTY_SECTIONS: readonly PublishBlocker[] = [
  { section: 'founder', label: 'your story' },
  { section: 'goods', label: 'your products' },
  { section: 'reviews', label: 'your reviews' },
  { section: 'findUs', label: 'your dates' },
];

/** The honesty sections that still block Publish — unresolved (or, for reviews /
 *  find-us, still showing the fakes). Empty means the store is honest to publish. */
export function publishBlockers(env: Record<string, unknown>): PublishBlocker[] {
  return HONESTY_SECTIONS.filter((h) => !sectionResolved(env, h.section));
}
