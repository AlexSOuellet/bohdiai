/**
 * COLLECTIONS — the beat dispatcher.
 *
 * The collections beat has six bands, one unique SHAPE per family (cupboard /
 * crates / portals / chapters / lanes / cascade). Which one renders is a
 * family-level look choice authored as `collections.treatment` (an explicit
 * override wins for previews); the documented default is the fallback until the
 * family layer wires per-family defaults. The home shows only a SAMPLING — two or
 * three collections as a teaser — and the band's covers point at the Collections
 * page. Renders nothing when the shop has no collections.
 */
import type { ArchetypeTheme } from '../types';
import {
  type CollectionView,
  type CollectionsSection,
  type CollectionsTreatment,
  DEFAULT_COLLECTIONS_TREATMENT,
  sampleCollections,
} from './collections';
import { CollectionsCupboard } from './CollectionsCupboard';
import { CollectionsCrates } from './CollectionsCrates';
import { CollectionsPortals } from './CollectionsPortals';
import { CollectionsChapters } from './CollectionsChapters';
import { CollectionsLanes } from './CollectionsLanes';
import { CollectionsCascade } from './CollectionsCascade';

export function CollectionsBeat({
  section,
  items,
  skin,
  treatment,
  viewAll,
  full = false,
}: {
  section: CollectionsSection;
  items: CollectionView[];
  skin: ArchetypeTheme;
  /** Force a treatment (the ?collections= preview / tests). When omitted the
   *  authored `section.treatment` wins, then the documented default. */
  treatment?: CollectionsTreatment | undefined;
  viewAll?: { href: string; label: string } | undefined;
  /** The Collections page wears the SAME treatment as the home teaser, but with
   *  every collection (not the home sampling) and no "see all" cue. */
  full?: boolean | undefined;
}) {
  if (items.length === 0) return null;
  const chosen = treatment ?? section.treatment ?? DEFAULT_COLLECTIONS_TREATMENT;
  const shown = full ? items : sampleCollections(items);
  const effectiveViewAll = full ? undefined : viewAll;
  const props = { section, items: shown, skin, viewAll: effectiveViewAll };

  switch (chosen) {
    case 'crates':
      return <CollectionsCrates {...props} />;
    case 'portals':
      return <CollectionsPortals {...props} />;
    case 'chapters':
      return <CollectionsChapters {...props} />;
    case 'lanes':
      return <CollectionsLanes {...props} />;
    case 'cascade':
      return <CollectionsCascade {...props} />;
    case 'cupboard':
    default:
      return <CollectionsCupboard {...props} />;
  }
}
