import type { BlockMeta } from '@/lib/blocks';

const meta: BlockMeta = {
  key: 'products-bento-grid',
  label: 'Products Bento Grid',
  sectionType: 'products',
  description:
    'Asymmetric varying-sized product cards. One hero product card spans two columns and two rows (large feature). Two medium cards each span one column and one row. Several small cards span one column and one row. The grid is intentionally uneven — products do not all get equal visual weight. Best for makers with a signature item and supporting line.',
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
