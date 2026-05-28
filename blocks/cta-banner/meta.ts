import type { BlockMeta } from '@/lib/blocks';

const meta: BlockMeta = {
  key: 'cta-banner',
  label: 'CTA Banner',
  sectionType: 'cta',
  description:
    'Full-width banner with a bold headline, an optional supporting line, and one or two CTA buttons.',
  status: 'active',
  pageTypes: ['home'],
  slots: [
    {
      key: 'primary-cta',
      label: 'Primary Button',
      accepts: ['cta-button'],
      required: true,
    },
    {
      key: 'secondary-cta',
      label: 'Secondary Button',
      accepts: ['cta-button'],
      required: false,
    },
  ],
  contentSchema: [
    {
      key: 'headline',
      type: 'text',
      label: 'Banner Headline',
      required: true,
      aiGenerated: true,
      maxLength: 80,
    },
    {
      key: 'subheadline',
      type: 'text',
      label: 'Supporting Line',
      required: false,
      aiGenerated: true,
      maxLength: 160,
    },
  ],
};

export default meta;
