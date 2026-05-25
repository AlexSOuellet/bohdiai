import type { BlockMeta } from '@/lib/blocks';

const meta: BlockMeta = {
  key: 'hero-split-gallery',
  label: 'Asymmetrical Split Gallery',
  sectionType: 'hero',
  description:
    'An elegant, studio-grade asymmetrical split-screen hero layout. Dominates one half of the viewport with a massive vertical image, while the other half layers staggered typography over a secondary horizontal card. Best for Summer Afternoon, Wild Meadow, Sunday Morning, and Bright Bazaar moods.',
  moodFit: ['summer-afternoon', 'wild-meadow', 'sunday-morning', 'bright-bazaar'],
  tenantTypeFit: ['seller', 'doer'],
  tier: 'free',
  status: 'active',
  slots: [
    {
      key: 'primary-cta',
      label: 'Primary Call to Action',
      accepts: ['cta-button'],
      required: false,
    },
  ],
  contentSchema: [
    {
      key: 'tagline',
      type: 'text',
      label: 'Aesthetic Tagline / Brand Kicker',
      required: false,
      aiGenerated: true,
      maxLength: 40,
    },
    {
      key: 'headline',
      type: 'text',
      label: 'Main Headline',
      required: true,
      aiGenerated: true,
      maxLength: 80,
    },
    {
      key: 'subheadline',
      type: 'text',
      label: 'Supporting Editorial Prose',
      required: false,
      aiGenerated: true,
      maxLength: 160,
    },
    {
      key: 'primaryImageUrl',
      type: 'image',
      label: 'Main Portrait Feature Image',
      required: true,
      aiGenerated: false,
    },
    {
      key: 'secondaryImageUrl',
      type: 'image',
      label: 'Secondary Landscape Image (Overlapping)',
      required: false,
      aiGenerated: false,
    },
  ],
};

export default meta;
