/**
 * Archetype registry — the menu Bohdi chooses from and the engine/render share.
 * Each entry is a fully self-describing build spec. Adding an archetype = one
 * import here; the engine and StorefrontPage never name an archetype.
 */
import type { ArchetypeBuildSpec } from './builder';
import { MAIN_STREET_SPEC } from './main-street/builder';
import { GALLERY_SPEC } from './gallery/builder';

export const ARCHETYPE_SPECS: Record<string, ArchetypeBuildSpec> = {
  [MAIN_STREET_SPEC.key]: MAIN_STREET_SPEC as ArchetypeBuildSpec,
  [GALLERY_SPEC.key]: GALLERY_SPEC as ArchetypeBuildSpec,
};

export function archetypeSpec(key: string): ArchetypeBuildSpec | undefined {
  return ARCHETYPE_SPECS[key];
}

export function archetypeMenu(): ArchetypeBuildSpec[] {
  return Object.values(ARCHETYPE_SPECS);
}
