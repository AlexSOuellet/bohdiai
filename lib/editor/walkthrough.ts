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

export interface WalkthroughStep {
  /** Stable step id. */
  readonly id: string;
  /** The maker-facing step title. */
  readonly title: string;
  /** The home section this step covers. */
  readonly section: SectionKey;
  /** The editable text/lines field ids this step rewrites (items excluded). */
  readonly fieldIds: readonly string[];
  /** Personal content (story/founder) — needs the maker's real input; no
   *  feeling-only generation (D68). */
  readonly personal: boolean;
  /** An optional section that can be switched off (off-switch wired in Phase 3). */
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
  personal: boolean;
  optional: boolean;
  questions?: readonly string[];
}> = [
  { id: 'welcome', title: 'Your welcome', section: 'hero', personal: false, optional: false },
  { id: 'story', title: 'Your story', section: 'founder', personal: true, optional: false, questions: STORY_QUESTIONS },
  { id: 'goods', title: 'Your goods', section: 'goods', personal: false, optional: false },
  { id: 'collections', title: 'Your collections', section: 'collections', personal: false, optional: true },
  { id: 'reviews', title: 'Kind words', section: 'reviews', personal: false, optional: true },
  { id: 'marquee', title: 'The scrolling line', section: 'marquee', personal: false, optional: true },
  { id: 'contact', title: 'Getting in touch', section: 'contact', personal: false, optional: false },
  { id: 'close', title: 'Your sign-off', section: 'close', personal: false, optional: false },
];

export const WALKTHROUGH_STEPS: readonly WalkthroughStep[] = STEP_META.map((m) => ({
  ...m,
  fieldIds: fieldsForSection(m.section)
    .filter((f) => f.kind !== 'items')
    .map((f) => f.id),
}));

/** The sections a walkthrough covers (one per step). */
const WALKTHROUGH_SECTIONS: readonly SectionKey[] = WALKTHROUGH_STEPS.map((s) => s.section);

function readSectionList(env: Record<string, unknown>, key: string): readonly string[] {
  const root = env['root'];
  const content = root != null && typeof root === 'object' ? (root as Record<string, unknown>)['content'] : undefined;
  const list = content != null && typeof content === 'object' ? (content as Record<string, unknown>)[key] : undefined;
  return Array.isArray(list) ? (list as string[]) : [];
}

/** Sections still placeholder — not made-yours and not hidden. */
export function placeholderSections(env: Record<string, unknown>): SectionKey[] {
  const made = new Set(readSectionList(env, 'madeYours'));
  const hidden = new Set(readSectionList(env, 'hiddenSections'));
  return WALKTHROUGH_SECTIONS.filter((s) => !made.has(s) && !hidden.has(s));
}

/** Progress across the walk — a section counts done once it's made-yours OR hidden. */
export function walkthroughProgress(env: Record<string, unknown>): { done: number; total: number } {
  const made = new Set(readSectionList(env, 'madeYours'));
  const hidden = new Set(readSectionList(env, 'hiddenSections'));
  const done = WALKTHROUGH_SECTIONS.filter((s) => made.has(s) || hidden.has(s)).length;
  return { done, total: WALKTHROUGH_SECTIONS.length };
}
