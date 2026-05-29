import type { BlockMeta } from '@/lib/blocks';

const meta: BlockMeta = {
  key: 'page-intro',
  label: 'Page Intro',
  sectionType: 'custom',
  description:
    'A small header block used at the top of secondary pages (shop, gallery, etc.). Renders an optional eyebrow label, a heading, and a short subheading. No imagery — purely typographic.',
  status: 'active',
  pageTypes: ['shop', 'gallery'],
  slots: [],
  contentSchema: [
    {
      key: 'eyebrow',
      type: 'text',
      label: 'Small eyebrow label above the heading (optional, e.g. "The Shop", "All Work")',
      required: false,
      aiGenerated: true,
      maxLength: 40,
    },
    {
      key: 'heading',
      type: 'text',
      label: 'Page heading',
      required: true,
      aiGenerated: true,
      maxLength: 80,
    },
    {
      key: 'subheading',
      type: 'text',
      label: 'One- or two-line subheading',
      required: false,
      aiGenerated: true,
      maxLength: 240,
    },
  ],
};

export default meta;
