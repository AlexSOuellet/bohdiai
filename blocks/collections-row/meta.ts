import type { BlockMeta } from '@/lib/blocks';

const meta: BlockMeta = {
  key: 'collections-row',
  label: 'Collections Row',
  sectionType: 'collections',
  description:
    'A horizontal row of collection cards linking to the tenant\'s active collections. Helps shoppers browse by category. Best placed after the hero or after the product grid.',
  moodFit: ['bright-bazaar', 'summer-afternoon', 'warm-and-cozy', 'sunday-morning', 'rustic'],
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
  ],
};

export default meta;
