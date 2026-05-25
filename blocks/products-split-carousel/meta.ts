import type { BlockMeta } from '@/lib/blocks';

const meta: BlockMeta = {
  key: 'products-split-carousel',
  label: 'Sticky Preview Split Grid',
  sectionType: 'products',
  description:
    'A highly interactive, split-layout products block. Features a sticky left-hand portrait preview frame displaying the hovered product in massive cinematic scale, while the right-hand column lists products with oversized numbers, thin dividers, and interactive slide-in details. Best for Bright Bazaar, Summer Afternoon, Warm & Cozy, and Sunday Morning moods.',
  moodFit: ['bright-bazaar', 'summer-afternoon', 'warm-and-cozy', 'sunday-morning'],
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
      label: 'Section Subtitle / Narrative',
      required: false,
      aiGenerated: true,
      maxLength: 120,
    },
  ],
};

export default meta;
