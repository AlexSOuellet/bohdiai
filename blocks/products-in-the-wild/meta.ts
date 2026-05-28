import type { BlockMeta } from '@/lib/blocks';

const meta: BlockMeta = {
  key: 'products-in-the-wild',
  label: 'Products In the Wild',
  sectionType: 'products',
  description:
    'Products shown only in their environment — no card frames, no white background, no traditional grid cells. Each product image fills its area edge-to-edge as if it were a lifestyle photograph, with name and price floating in the lower corner over a soft gradient. The viewer sees products inhabiting a setting rather than catalog tiles.',
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
      maxLength: 140,
    },
  ],
};

export default meta;
