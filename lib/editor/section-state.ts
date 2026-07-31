/**
 * Section resolution state — the pure lever behind the "Make It Yours" walk's
 * completeness (D69). Every store section ends the walk in one of three resolved
 * states, tracked as string lists on `root.content`:
 *
 *   - `madeYours`      — the maker edited it (Bohdi wrote it or they typed it)
 *   - `kept`           — the maker looked at it and kept it as built
 *   - `hiddenSections` — the maker turned it off
 *
 * A section in none of the lists is still `unresolved` (an untouched placeholder).
 * Precedence when a section somehow lands in more than one list: made > hidden >
 * kept > unresolved (editing is the strongest signal; a hidden edited section is
 * still "made" underneath, so un-hiding restores real content).
 *
 * All functions are pure: they `structuredClone` the tree and never mutate the
 * input. `actions.ts` calls these to stage state onto the draft; `walkthrough.ts`
 * reads `sectionState` to decide completeness.
 */
import type { SectionKey } from '@/lib/archetypes/main-street/families';

export type SectionResolution = 'made' | 'kept' | 'hidden' | 'unresolved';

type Tree = Record<string, unknown>;

/** Read `root.content` as a record, or `undefined` if the shape isn't there. */
function readContent(tree: Tree): Record<string, unknown> | undefined {
  const root = tree['root'];
  if (root == null || typeof root !== 'object') return undefined;
  const content = (root as Record<string, unknown>)['content'];
  return content != null && typeof content === 'object' ? (content as Record<string, unknown>) : undefined;
}

/** Read one of the section lists from the tree (empty if absent). */
function readList(tree: Tree, key: string): readonly string[] {
  const list = readContent(tree)?.[key];
  return Array.isArray(list) ? (list as string[]) : [];
}

/** Return `root.content` on a fresh clone, creating the path if needed. */
function ensureContent(tree: Tree): { next: Tree; content: Record<string, unknown> } {
  const next = structuredClone(tree);
  const root = ((next['root'] as Record<string, unknown> | undefined) ?? (next['root'] = {})) as Record<string, unknown>;
  const content = ((root['content'] as Record<string, unknown> | undefined) ?? (root['content'] = {})) as Record<string, unknown>;
  return { next, content };
}

/** Add `section` to a list (idempotent), returning a new tree. */
function addTo(tree: Tree, key: string, section: SectionKey): Tree {
  const { next, content } = ensureContent(tree);
  const cur = Array.isArray(content[key]) ? (content[key] as string[]) : [];
  if (!cur.includes(section)) content[key] = [...cur, section];
  return next;
}

/** Remove `section` from a list, returning a new tree. */
function removeFrom(tree: Tree, key: string, section: SectionKey): Tree {
  const { next, content } = ensureContent(tree);
  const cur = Array.isArray(content[key]) ? (content[key] as string[]) : [];
  content[key] = cur.filter((s) => s !== section);
  return next;
}

/** Mark a section made-yours (an edit landed). Clears any "kept" for it, since a
 *  real edit supersedes an accept-as-built. */
export function markSectionMade(tree: Tree, section: SectionKey): Tree {
  return removeFrom(addTo(tree, 'madeYours', section), 'kept', section);
}

/** Mark a section kept-as-built. */
export function markSectionKept(tree: Tree, section: SectionKey): Tree {
  return addTo(tree, 'kept', section);
}

/** Turn a section off (`hidden`) or back on. Turning back on returns it to whatever
 *  state its other lists imply (unresolved if never edited/kept). */
export function setSectionHidden(tree: Tree, section: SectionKey, hidden: boolean): Tree {
  return hidden ? addTo(tree, 'hiddenSections', section) : removeFrom(tree, 'hiddenSections', section);
}

/** The resolution state of a section, by list precedence: made > hidden > kept. */
export function sectionState(tree: Tree, section: SectionKey): SectionResolution {
  if (readList(tree, 'madeYours').includes(section)) return 'made';
  if (readList(tree, 'hiddenSections').includes(section)) return 'hidden';
  if (readList(tree, 'kept').includes(section)) return 'kept';
  return 'unresolved';
}
