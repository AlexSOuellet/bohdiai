/**
 * Preview-only catalog rows shared by the Main Street home + shop test routes.
 * Stand-ins for real DB listings, so the goods beat and the full-catalog page
 * read true before assets/onboarding exist. Scaffolding only — the archetype
 * renderer never sees these directly.
 */
import type { ProductView } from '@/lib/archetypes/main-street';

const COUNTRY = '/storefronts/country.webp';
const SEEDED = '/storefronts/seeded.webp';
const CINNAMON = '/storefronts/cinnamon.webp';

const SEED = [
  { name: 'Country sourdough', price: '$9', shortDescription: '48-hour cold ferment, cracked crust', url: COUNTRY },
  { name: 'Seeded rye', price: '$8', shortDescription: 'Caraway, molasses, a dense honest loaf', url: SEEDED },
  { name: 'Cinnamon morning bun', price: '$6', shortDescription: 'Saturdays only, gone by ten', url: CINNAMON },
  { name: 'Sesame semolina', price: '$9', shortDescription: 'Golden crumb, toasted sesame crust', url: COUNTRY },
  { name: 'Olive levain', price: '$10', shortDescription: 'Castelvetrano and rosemary, slow proofed', url: SEEDED },
  { name: 'Honey oat', price: '$8', shortDescription: 'Rolled oats, a little local honey', url: CINNAMON },
  { name: 'Walnut wheat', price: '$10', shortDescription: 'Stoneground wheat, toasted walnuts', url: COUNTRY },
  { name: 'Buttermilk bun', price: '$5', shortDescription: 'Soft, square, made for sandwiches', url: SEEDED },
  { name: 'Dark pumpernickel', price: '$9', shortDescription: 'All day in the oven, deep and sweet', url: CINNAMON },
];

export const PREVIEW_PRODUCTS: ProductView[] = SEED.map((s, i) => ({
  slug: `loaf-${i}`,
  name: s.name,
  price: s.price,
  shortDescription: s.shortDescription,
  description: '',
  status: 'active',
  media: [{ kind: 'image', url: s.url, alt: s.name }],
  variations: [],
}));
