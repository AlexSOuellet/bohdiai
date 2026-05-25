import type { BlockMeta } from '@/lib/blocks';

const meta: BlockMeta = {
  key: 'products-grid',
  label: 'Products Grid',
  sectionType: 'products',
  description:
    'A grid of product cards pulled from the tenant\'s active listings. The primary commerce section — leads with a headline and subtitle, then shows the catalog. Best placed early on product-forward storefronts.',
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
