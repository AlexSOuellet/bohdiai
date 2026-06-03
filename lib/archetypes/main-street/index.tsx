/**
 * Main Street archetype — the complete artifact.
 *
 * The default maker shop: a hero, a featured selection of the maker's goods,
 * the maker's own story, optional supporting bands, and a footer. Ships a
 * curated family of complete arrangements (classic / goods-first / story-led)
 * the engine or the maker picks from. Familiar by design, composed in ways the
 * template builders never would. Niche-neutral by construction.
 *
 * Composition, typography, color pairs, spacing, the photo grade, motion,
 * content slots, theme hooks, and the arrangement family are all defined in this
 * module. A tenant supplies content matching the schema, a theme pick, and an
 * arrangement pick; the renderer produces a finished page. Bohdi cannot author
 * shape and cannot break the color/type guarantees.
 */
import type { Archetype, ArchetypeMeta } from '../types';
import { MainStreet } from './MainStreet';
import {
  MainStreetContentSchema,
  MainStreetThemeSchema,
  type MainStreetThemePick,
} from './schemas';
import { MAIN_STREET_THEMES } from './themes';
import { MAIN_STREET_ARRANGEMENTS, MAIN_STREET_DEFAULT_ARRANGEMENT } from './arrangements-meta';

const META: ArchetypeMeta = {
  key: 'main-street',
  label: 'Main Street',
  description:
    "The default maker shop: a hero, a featured selection of the maker's goods, the maker's own story, optional supporting bands, and a footer. Ships a curated family of complete arrangements the maker can switch between. Familiar by design, composed in ways the template builders never would. Niche-neutral by construction — any maker fills the same slots in their own voice.",
  suitableFor: {
    nicheKinds: ['bakery', 'candles', 'ceramics', 'soap', 'food', 'apparel', 'general'],
    moods: ['simple', 'cozy', 'rustic', 'modern'],
  },
};

export const mainStreetArchetype: Archetype<
  typeof MainStreetContentSchema,
  typeof MainStreetThemeSchema
> = {
  meta: META,
  contentSchema: MainStreetContentSchema,
  themeSchema: MainStreetThemeSchema,
  themes: MAIN_STREET_THEMES,
  arrangements: MAIN_STREET_ARRANGEMENTS,
  defaultArrangement: MAIN_STREET_DEFAULT_ARRANGEMENT,
  resolveTheme(pick: MainStreetThemePick) {
    const theme = MAIN_STREET_THEMES[pick.themeKey];
    if (!theme) {
      throw new Error(
        `Main Street archetype: unknown theme key "${pick.themeKey}". Valid keys: ${Object.keys(MAIN_STREET_THEMES).join(', ')}`,
      );
    }
    return theme;
  },
  // Contract render: catalog rows are wired by the engine at integration time.
  // Until then this renders the chrome with no featured rows; the test routes
  // call <MainStreet> directly with real ProductView fixtures.
  render: ({ content, theme, arrangement }) => (
    <MainStreet content={content} theme={theme} arrangement={arrangement} products={[]} />
  ),
};

export { MAIN_STREET_THEMES } from './themes';
export { MAIN_STREET_ARRANGEMENTS, MAIN_STREET_DEFAULT_ARRANGEMENT } from './arrangements-meta';
export {
  MainStreetContentSchema,
  MainStreetThemeSchema,
  MainStreetArrangementSchema,
  type MainStreetContent,
  type MainStreetThemePick,
  type MainStreetArrangementPick,
} from './schemas';
export { MainStreet } from './MainStreet';
export { MainStreetProduct } from './MainStreetProduct';
export type { ProductView, CatalogMedia, CatalogVariation } from '../content';
