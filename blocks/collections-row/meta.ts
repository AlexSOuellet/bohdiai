import type { BlockMeta } from '@/lib/blocks';

const meta: BlockMeta = {
  key: 'collections-row',
  label: 'Collections Row',
  sectionType: 'collections',
  description:
    'Horizontal row of collection cards. Each card links to one of the tenant\'s active collections — a category grouping of related products.',
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
  ],
};

export default meta;
