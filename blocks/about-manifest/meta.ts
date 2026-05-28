import type { BlockMeta } from '@/lib/blocks';

const meta: BlockMeta = {
  key: 'about-manifest',
  label: 'Manifest',
  sectionType: 'about',
  description:
    'Typographic mission statement. A single short manifesto (3-6 short lines or one paragraph) rendered as oversized display type, no imagery. High contrast, wide section padding, a small numbered or bulleted set of guiding principles below the manifesto. The block is text-only.',
  status: 'active',
  pageTypes: ['home'],
  slots: [],
  contentSchema: [
    {
      key: 'eyebrow',
      type: 'text',
      label: 'Small label above the manifesto (e.g. "What we believe")',
      required: false,
      aiGenerated: true,
      maxLength: 40,
    },
    {
      key: 'manifest',
      type: 'richtext',
      label: 'Manifesto body — short, declarative, first-person plural',
      required: true,
      aiGenerated: true,
      maxLength: 400,
    },
    {
      key: 'principle1',
      type: 'text',
      label: 'Principle 1',
      required: false,
      aiGenerated: true,
      maxLength: 80,
    },
    {
      key: 'principle2',
      type: 'text',
      label: 'Principle 2',
      required: false,
      aiGenerated: true,
      maxLength: 80,
    },
    {
      key: 'principle3',
      type: 'text',
      label: 'Principle 3',
      required: false,
      aiGenerated: true,
      maxLength: 80,
    },
    {
      key: 'principle4',
      type: 'text',
      label: 'Principle 4',
      required: false,
      aiGenerated: true,
      maxLength: 80,
    },
  ],
};

export default meta;
