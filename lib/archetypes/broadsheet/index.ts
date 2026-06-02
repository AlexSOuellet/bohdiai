/**
 * Broadsheet archetype — the complete artifact.
 *
 * Composition, typography, color pairs, spacing, atmosphere, motion, content
 * slots, and theme hooks are all defined here. A tenant supplies content
 * matching the schema and a theme pick from the curated set; the renderer
 * produces a finished page. The archetype guarantees the failure modes Bohdi
 * keeps producing — section-stack slop, font readability, lost color
 * contrast, blind composition — cannot happen through this archetype.
 */
import type { Archetype, ArchetypeMeta } from '../types';
import { Broadsheet } from './Broadsheet';
import {
  BroadsheetContentSchema,
  BroadsheetThemeSchema,
  type BroadsheetThemePick,
} from './schemas';
import { BROADSHEET_THEMES } from './themes';

const META: ArchetypeMeta = {
  key: 'broadsheet',
  label: 'Broadsheet',
  description:
    'A 19th-century village newspaper. Masthead, lead story with drop cap, weekly schedule, news column, classifieds, appearances list, founder note, colophon. Replaces the AI-builder section stack with a print-newspaper vocabulary. Niche-neutral by construction — any maker fills the same slots in their own voice.',
  suitableFor: {
    nicheKinds: [
      'apothecary',
      'bakery',
      'farm-stand',
      'press',
      'small-press',
      'vintage',
      'woodwork',
    ],
    moods: ['cozy', 'dark', 'rustic', 'simple'],
  },
};

export const broadsheetArchetype: Archetype<
  typeof BroadsheetContentSchema,
  typeof BroadsheetThemeSchema
> = {
  meta: META,
  contentSchema: BroadsheetContentSchema,
  themeSchema: BroadsheetThemeSchema,
  themes: BROADSHEET_THEMES,
  resolveTheme(pick: BroadsheetThemePick) {
    const theme = BROADSHEET_THEMES[pick.themeKey];
    if (!theme) {
      throw new Error(
        `Broadsheet archetype: unknown theme key "${pick.themeKey}". Valid keys: ${Object.keys(BROADSHEET_THEMES).join(', ')}`,
      );
    }
    return theme;
  },
  render: Broadsheet,
};

export { BROADSHEET_THEMES } from './themes';
export {
  BroadsheetContentSchema,
  BroadsheetThemeSchema,
  type BroadsheetContent,
  type BroadsheetThemePick,
} from './schemas';
export { Broadsheet } from './Broadsheet';
