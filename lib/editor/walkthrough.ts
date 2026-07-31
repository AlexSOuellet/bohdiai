/**
 * Walkthrough state — pure logic for the "Make It Yours" first-run walk (Phase 1,
 * Words). Each step is one home section: its title, the editable TEXT fields it
 * rewrites (derived from the registry so it can't drift), whether it's a personal
 * step (D68 — needs the maker's real input, gathered through targeted questions),
 * and whether it's an optional section (switchable off — the off-switch itself
 * lands in Phase 3).
 *
 * Step order is the store's top-to-bottom order (Decision 3): welcome → story →
 * goods → collections → kind words → the scrolling line → getting in touch →
 * sign-off. (Photo replacement and the reviews/find-us "or switch it off" affordances
 * light up in Phases 2 and 3; this file is the word skeleton they extend.)
 *
 * "Placeholder" = a section not yet made-yours and not hidden. We mark a section
 * made-yours on any edit (pragmatic completeness, not per-field diffing).
 */
import type { SectionKey } from '@/lib/archetypes/main-street/families';
import { fieldsForSection } from './editable-fields';
import { sectionState } from './section-state';

/** How a section is allowed to be resolved in the walk (D69):
 *   - must-change   — only by an edit (About/story, goods). No keep, no skip.
 *   - keep-or-change — spine sections; keep-as-built or change, never off.
 *   - optional      — keep, change, or turn off. */
export type SectionClass = 'must-change' | 'keep-or-change' | 'optional';

export interface WalkthroughStep {
  /** Stable step id. */
  readonly id: string;
  /** The maker-facing step title. */
  readonly title: string;
  /** The home section this step covers. */
  readonly section: SectionKey;
  /** The editable text/lines field ids this step rewrites (items excluded). */
  readonly fieldIds: readonly string[];
  /** How this section may be resolved (drives the walk's controls + gate). */
  readonly cls: SectionClass;
  /** Personal content (story/founder) — needs the maker's real input; no
   *  feeling-only generation (D68). */
  readonly personal: boolean;
  /** Convenience: `cls === 'optional'` (a section the maker can switch off). */
  readonly optional: boolean;
  /** For a personal step, the targeted questions that draw out the real material. */
  readonly questions?: readonly string[];
}

/** The story step's questions — a few asks that pull the maker's real story out,
 *  so Bohdi shapes what they gave rather than inventing a life (D68). */
const STORY_QUESTIONS = [
  'How did this start — what made you begin?',
  'What do you make, in your own words?',
  'What makes yours yours — what do you care about most?',
  'Who is it for?',
] as const;

/** Section metadata in top-to-bottom order. Field ids are derived from the registry
 *  (text/lines only — the testimonial and collection ITEMS aren't Bohdi-written in
 *  this phase). `founder` naturally carries the About-page fields too (the registry
 *  groups them there), so the story step covers the whole personal beat. */
const STEP_META: ReadonlyArray<{
  id: string;
  title: string;
  section: SectionKey;
  cls: SectionClass;
  personal: boolean;
  questions?: readonly string[];
}> = [
  { id: 'welcome', title: 'Your welcome', section: 'hero', cls: 'keep-or-change', personal: false },
  { id: 'story', title: 'Your story', section: 'founder', cls: 'must-change', personal: true, questions: STORY_QUESTIONS },
  { id: 'goods', title: 'Your goods', section: 'goods', cls: 'must-change', personal: false },
  { id: 'collections', title: 'Your collections', section: 'collections', cls: 'optional', personal: false },
  { id: 'reviews', title: 'Kind words', section: 'reviews', cls: 'optional', personal: false },
  { id: 'marquee', title: 'The scrolling line', section: 'marquee', cls: 'optional', personal: false },
  { id: 'findUs', title: 'Where to find you', section: 'findUs', cls: 'optional', personal: false },
  { id: 'contact', title: 'Getting in touch', section: 'contact', cls: 'keep-or-change', personal: false },
  { id: 'close', title: 'Your sign-off', section: 'close', cls: 'keep-or-change', personal: false },
];

export const WALKTHROUGH_STEPS: readonly WalkthroughStep[] = STEP_META.map((m) => ({
  ...m,
  optional: m.cls === 'optional',
  fieldIds: fieldsForSection(m.section)
    .filter((f) => f.kind !== 'items')
    .map((f) => f.id),
}));

/** The class of a section (how it may be resolved). Sections outside the walk
 *  default to keep-or-change (never auto-hidden). */
export function sectionClass(section: SectionKey): SectionClass {
  return WALKTHROUGH_STEPS.find((s) => s.section === section)?.cls ?? 'keep-or-change';
}

/** Whether a step is resolved for the gate, per its class:
 *   must-change → an edit landed; optional → touched at all (made/kept/hidden);
 *   keep-or-change → made-yours or kept (can't be turned off). */
function stepResolved(env: Record<string, unknown>, step: WalkthroughStep): boolean {
  const st = sectionState(env, step.section);
  if (step.cls === 'must-change') return st === 'made';
  if (step.cls === 'optional') return st !== 'unresolved';
  return st === 'made' || st === 'kept';
}

/** The walk is complete — and the editor door opens — when every section is
 *  resolved by its allowed states (D69). */
export function walkComplete(env: Record<string, unknown>): boolean {
  return WALKTHROUGH_STEPS.every((s) => stepResolved(env, s));
}

/** Sections not yet resolved (per their class) — the walk's remaining work. */
export function placeholderSections(env: Record<string, unknown>): SectionKey[] {
  return WALKTHROUGH_STEPS.filter((s) => !stepResolved(env, s)).map((s) => s.section);
}

/** Progress across the walk — a section counts done once it's resolved for its class. */
export function walkthroughProgress(env: Record<string, unknown>): { done: number; total: number } {
  const done = WALKTHROUGH_STEPS.filter((s) => stepResolved(env, s)).length;
  return { done, total: WALKTHROUGH_STEPS.length };
}
