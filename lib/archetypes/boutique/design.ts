/**
 * Boutique — a hand-built maker shop with a catalog. Its words come from the
 * owner's About you, its babies/pieces from the catalog, its dates from Market
 * dates — all edited in the backend. The envelope names only the design.
 */
import { z } from 'zod';

export const BOUTIQUE_DESIGNS = ['nursery'] as const;
export type BoutiqueDesign = (typeof BOUTIQUE_DESIGNS)[number];

export const BoutiqueContentSchema = z.object({ design: z.enum(BOUTIQUE_DESIGNS) }).strict();
export type BoutiqueContent = z.infer<typeof BoutiqueContentSchema>;
