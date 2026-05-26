import type { BlockMeta } from '@/lib/blocks';

const meta: BlockMeta = {
  key: 'about-maker',
  label: 'About the Maker',
  sectionType: 'about',
  description:
    'Maker story section. Headline, one or two paragraphs of prose, and an optional CTA button.',
  moodFit: ['dark-and-stormy', 'rustic', 'warm-and-cozy', 'summer-afternoon', 'wild-meadow', 'bright-bazaar', 'sunday-morning'],
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
