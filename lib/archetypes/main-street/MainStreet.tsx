/**
 * Main Street archetype — home renderer.
 *
 * Dispatches on the arrangement key and composes the region components into one
 * of the curated, complete pages. The regions and chrome come from ./shared so
 * every arrangement and every page match. The arrangement family is fixed here;
 * Bohdi (and the maker, in the editor) can only PICK one — never recombine the
 * pieces. Content is identical across arrangements, so switching format is one
 * click with nothing to re-author.
 *
 * No specifics: every color is the palette or a derivation, every type value is
 * a named role, structure is the archetype's.
 */
import React from 'react';
import type { ArchetypeTheme } from '../types';
import type { ProductView } from '../content';
import type { MainStreetContent } from './schemas';
import { MAIN_STREET_DEFAULT_ARRANGEMENT } from './arrangements-meta';
import {
  MainStreetRoot,
  MainStreetHeader,
  MainStreetFooter,
  HeroRegion,
  FeaturedRegion,
  MakerRegion,
  SecondaryRegion,
  StayInTouchRegion,
} from './shared';

export interface MainStreetProps {
  content: MainStreetContent;
  theme: ArchetypeTheme;
  arrangement?: string | undefined;
  /** Catalog rows for the featured selection. The archetype never authors these. */
  products: ProductView[];
}

export function MainStreet({ content, theme, arrangement, products }: MainStreetProps) {
  const key = arrangement ?? MAIN_STREET_DEFAULT_ARRANGEMENT;

  const secondary = content.secondary ? <SecondaryRegion secondary={content.secondary} theme={theme} /> : null;
  const stay = content.stayInTouch ? <StayInTouchRegion stayInTouch={content.stayInTouch} theme={theme} /> : null;

  let body: React.ReactNode;
  if (key === 'goods-first') {
    body = (
      <>
        <FeaturedRegion featured={content.featured} products={products} theme={theme} variant="grid3" />
        <HeroRegion hero={content.hero} theme={theme} variant="band" />
        <MakerRegion maker={content.maker} theme={theme} variant="editorial" />
        {secondary}
        {stay}
      </>
    );
  } else if (key === 'story-led') {
    body = (
      <>
        <MakerRegion maker={content.maker} theme={theme} variant="editorial" />
        <FeaturedRegion featured={content.featured} products={products} theme={theme} variant="grid3" />
        <HeroRegion hero={content.hero} theme={theme} variant="closer" />
        {secondary}
        {stay}
      </>
    );
  } else {
    // classic (default)
    body = (
      <>
        <HeroRegion hero={content.hero} theme={theme} variant="bleed" />
        <FeaturedRegion featured={content.featured} products={products} theme={theme} variant="grid3" />
        <MakerRegion maker={content.maker} theme={theme} variant="dark" />
        {secondary}
        {stay}
      </>
    );
  }

  return (
    <MainStreetRoot theme={theme}>
      <MainStreetHeader identity={content.identity} theme={theme} variant="home" />
      {body}
      <MainStreetFooter shopName={content.shopName} footer={content.footer} theme={theme} />
    </MainStreetRoot>
  );
}
