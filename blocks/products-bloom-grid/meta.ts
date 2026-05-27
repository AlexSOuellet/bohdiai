import type { BlockMeta } from '@/lib/blocks';

const meta: BlockMeta = {
  key: 'products-bloom-grid',
  label: 'Bloom Asymmetric Grid',
  sectionType: 'products',
  description:
    'Asymmetric masonry grid. Products alternate between wide 2-column feature cells and tall 1-column portrait cells. Full-bleed images with product name and price overlaid at the bottom of each card behind a dark gradient. Organic rounded frames.',
  moodFit: ['dark-and-stormy', 'rustic', 'warm-and-cozy', 'summer-afternoon', 'wild-meadow', 'bright-bazaar', 'sunday-morning'],
  tenantTypeFit: ['seller'],
  tier: 'free',
  status: 'active',
  pageTypes: ['home'],
  slots: [],
  contentSchema: [
    {
      key: 'headline',
      type: 'text',
      label: 'Section Headline',
      required: true,
      aiGenerated: true,
      maxLength: 60,
    },
    {
      key: 'subtitle',
      type: 'text',
      label: 'Section Subtitle',
      required: false,
      aiGenerated: true,
      maxLength: 120,
    },
  ],
};

export default meta;
