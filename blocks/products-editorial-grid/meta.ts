import type { BlockMeta } from '@/lib/blocks';

const meta: BlockMeta = {
  key: 'products-editorial-grid',
  label: 'Editorial Products Grid',
  sectionType: 'products',
  description:
    'Staggered editorial grid. Alternating products use portrait and landscape aspect ratios with vertical offsets, creating a broken asymmetric layout. Images sit above text — name, description, price, and a view-details link below each photo.',
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
      label: 'Section Subtitle / Description',
      required: false,
      aiGenerated: true,
      maxLength: 120,
    },
  ],
};

export default meta;
