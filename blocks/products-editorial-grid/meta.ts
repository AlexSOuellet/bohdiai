import type { BlockMeta } from '@/lib/blocks';

const meta: BlockMeta = {
  key: 'products-editorial-grid',
  label: 'Editorial Products Grid',
  sectionType: 'products',
  description:
    'An elite, art-gallery-inspired product display variant. Completely avoids uniform grid cards, opting instead for a highly asymmetrical, staggered layout where alternating products use massive portrait and offset landscape aspect ratios, dramatic visual framing, and floating price tags. Optimized for Dark & Stormy, Rustic, Sunday Morning, and Wild Meadow moods.',
  moodFit: ['dark-and-stormy', 'rustic', 'sunday-morning', 'wild-meadow'],
  tenantTypeFit: ['seller'],
  tier: 'free',
  status: 'active',
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
      label: 'Section Subtitle / Description',
      required: false,
      aiGenerated: true,
      maxLength: 120,
    },
  ],
};

export default meta;
