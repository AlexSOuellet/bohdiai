/**
 * Archetype registry — the one lookup the engine and the live renderer share.
 * Maps an archetype key to its BUILD contract (how Bohdi authors it) and its
 * RENDER (how a stored store paints). Adding an archetype = one entry here; the
 * engine and StorefrontPage stay archetype-blind.
 */
import type { ReactElement } from 'react';
import type { ProductView } from './content';
import type { ArchetypeBuilder } from './builder';
import { MainStreet, mainStreetArchetype, type MainStreetContent } from './main-street';
import { MAIN_STREET_BUILDER } from './main-street/builder';

export interface ArchetypeEntry {
  key: string;
  /** Build-time: how Bohdi authors this archetype + what media it generates. */
  builder: ArchetypeBuilder<unknown>;
  /** Render-time: paint a stored store. Content is already validated by the
   *  builder; products come from the tenant's real listing rows. */
  renderStore(args: {
    content: unknown;
    skinKey: string;
    products: ProductView[];
    mood?: string | undefined;
  }): ReactElement;
}

export const ARCHETYPE_REGISTRY: Record<string, ArchetypeEntry> = {
  'main-street': {
    key: 'main-street',
    builder: MAIN_STREET_BUILDER as ArchetypeBuilder<unknown>,
    renderStore: ({ content, skinKey, products, mood }) => {
      const skin = mainStreetArchetype.resolveTheme({ skinKey });
      return (
        <MainStreet
          content={content as MainStreetContent}
          skin={skin}
          products={products}
          mood={mood}
        />
      );
    },
  },
};

export function archetypeEntry(key: string): ArchetypeEntry | undefined {
  return ARCHETYPE_REGISTRY[key];
}
