import type { BlockMeta } from '@/lib/blocks';

const meta: BlockMeta = {
  key: 'cta-banner',
  label: 'CTA Banner',
  sectionType: 'cta',
  description:
    'A full-width call-to-action banner. Bold headline, supporting line, and one or two buttons. Used to drive a single high-intent action — "Shop the Collection", "Request a Custom Order", "See What\'s New". Works at any position but strongest near the bottom of the page.',
  moodFit: ['dark-and-stormy', 'bright-bazaar', 'summer-afternoon', 'wild-meadow', 'warm-and-cozy'],
  tenantTypeFit: ['seller', 'doer'],
  tier: 'free',
  status: 'active',
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
