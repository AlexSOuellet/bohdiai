/**
 * The HERO CATALOG — the swap mechanism for Main Street's hero slot.
 *
 * Main Street used to hard-code one hero (`<MomentHero/>`). The modular upgrade
 * (see project-docs/Family-Layout-Model.md) replaces that fixed reference with a
 * RECIPE entry: a variant KEY the renderer resolves against this catalog. The
 * page names a key ("story", "split"); `resolveHero` returns the component;
 * swapping the hero is changing the key, not editing the page.
 *
 * Every hero reads the SAME shared content contract (`HeroProps`: identity +
 * the hero content "pile" + skin + the per-shop moment key), so any key flows
 * the same content in. Per-variant structural knobs (Split's media side) are
 * fixed inside each catalog entry, not exposed to the recipe — the recipe only
 * ever picks a key.
 *
 * SCOPE (Session 53): only the HERO slot is catalog-driven so far. The other
 * Main Street sections (goods, founder, find-us, close, footer) are still the
 * fixed assembly in MainStreet.tsx — they each have one design today, so there
 * is nothing to swap yet. The full-page recipe over every section comes when
 * those sections get their own variants (their designs are still open in the
 * family docs).
 *
 * FUNCTIONAL FLOOR: an unknown or missing key resolves to the default hero
 * rather than nothing, so a recipe can never render an empty hero. Taste is the
 * maker's; a bad key can never break the page.
 */
import type { ReactElement } from 'react';
import type { ArchetypeTheme } from '../types';
import type { MainStreetContent } from './schemas';
import { MomentHero } from './MomentHero';
import { SplitHero } from './SplitHero';
import { StackedHero } from './StackedHero';

/** The shared shape every hero variant is handed — the hero content contract. */
export interface HeroProps {
  identity: MainStreetContent['identity'];
  moment: MainStreetContent['moment'];
  skin: ArchetypeTheme;
  /** Per-shop key (tenant id) for the Story hero's seen-cookie. Heroes that have
   *  no play-through (Split, etc.) ignore it. */
  momentKey?: string | undefined;
}

/** The hero variant keys a recipe can name. Grows as heroes are built (Stacked,
 *  Typographic, Collage, Floating card, Editorial cover, Carousel). */
export type HeroVariantKey = 'story' | 'split' | 'split-left' | 'stacked';

/** What the auto-build uses when a tenant has not chosen a hero. */
export const DEFAULT_HERO_VARIANT: HeroVariantKey = 'story';

/** key → a render function over the shared HeroProps. Each entry pins its own
 *  structural knobs (e.g. Split's media side) so the recipe only picks a key. */
export const HERO_CATALOG: Record<HeroVariantKey, (props: HeroProps) => ReactElement> = {
  story: (p) => <MomentHero identity={p.identity} moment={p.moment} skin={p.skin} momentKey={p.momentKey} />,
  split: (p) => <SplitHero identity={p.identity} moment={p.moment} skin={p.skin} mediaSide="right" />,
  'split-left': (p) => <SplitHero identity={p.identity} moment={p.moment} skin={p.skin} mediaSide="left" />,
  stacked: (p) => <StackedHero identity={p.identity} moment={p.moment} skin={p.skin} />,
};

/** Resolve a (possibly unknown) variant key to a hero render function. Falls
 *  back to the default hero so the slot is never empty. */
export function resolveHero(key: string | undefined): (props: HeroProps) => ReactElement {
  return HERO_CATALOG[(key as HeroVariantKey)] ?? HERO_CATALOG[DEFAULT_HERO_VARIANT];
}
