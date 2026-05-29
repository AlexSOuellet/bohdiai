import type { BlockMeta } from '@/lib/blocks';

const meta: BlockMeta = {
  key: 'products-split-carousel',
  label: 'Sticky Preview Split Grid',
  sectionType: 'products',
  description:
    'Split layout. Sticky left panel shows the hovered product image at full height. Right column lists all products as numbered rows with thin dividers — hover slides in product details. Interactive, no traditional card grid.',
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
      label: 'Section Subtitle / Narrative',
      required: false,
      aiGenerated: true,
      maxLength: 120,
    },
  ],
};

export default meta;
