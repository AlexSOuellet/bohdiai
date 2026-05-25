import type { BlockMeta } from '@/lib/blocks';

const meta: BlockMeta = {
  key: 'about-maker',
  label: 'About the Maker',
  sectionType: 'about',
  description:
    'The maker\'s story told in their own voice. Headline, a paragraph or two of prose, and an optional CTA. Story-first — the person behind the shop matters more than the product catalog here.',
  moodFit: ['dark-and-stormy', 'rustic', 'warm-and-cozy', 'sunday-morning', 'wild-meadow'],
  tenantTypeFit: ['seller', 'doer'],
  tier: 'free',
  status: 'active',
  slots: [
    {
      key: 'primary-cta',
      label: 'Call to Action',
      accepts: ['cta-button'],
      required: false,
    },
  ],
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
      key: 'body',
      type: 'richtext',
      label: 'Maker Story',
      required: true,
      aiGenerated: true,
      maxLength: 600,
    },
  ],
};

export default meta;
