/**
 * Business card — which design a site uses (bulletin board spec). The envelope's
 * content may name one; a site that names none keeps the original pinned prints.
 * A design is a choice for each site, never a rule for all of them.
 */
import { z } from 'zod';

export const CARD_DESIGNS = ['pinned', 'bulletin'] as const;
export type CardDesign = (typeof CARD_DESIGNS)[number];

/** The envelope's content: only the design, and that only when it isn't the default. */
export const CardContentSchema = z.object({ design: z.enum(CARD_DESIGNS).optional() }).strict();
export type CardContent = z.infer<typeof CardContentSchema>;

export function cardDesign(content: CardContent): CardDesign {
  return content.design ?? 'pinned';
}
