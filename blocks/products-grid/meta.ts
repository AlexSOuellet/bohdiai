import type { BlockMeta } from '@/lib/blocks';

const meta: BlockMeta = {
  key: 'products-grid',
  label: 'Products Grid',
  sectionType: 'products',
  description:
    'Uniform grid of product cards. Auto-filling columns at 240px minimum width. Each card: square image on top, product name, short description, and price below on a solid background.',
  moodFit: ['dark-and-stormy', 'rustic', 'warm-and-cozy', 'summer-afternoon', 'wild-meadow', 'bright-bazaar', 'sunday-morning'],
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
      label: 'Section Subtitle',
      required: false,
      aiGenerated: true,
      maxLength: 120,
    },
  ],
};

export default meta;
