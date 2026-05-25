import type { BlockMeta } from '@/lib/blocks';

const meta: BlockMeta = {
  key: 'hero-cinematic',
  label: 'Cinematic Hero',
  sectionType: 'hero',
  description:
    'An immersive, studio-grade cinematic hero section featuring dynamic full-viewport layout scales, rich depth gradients, oversized typography, and organic layout tension. Specially tailored to breathe life into Dark & Stormy and Rustic brand identities.',
  moodFit: ['dark-and-stormy', 'rustic'],
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
      label: 'Aesthetic Tagline / Location',
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
      label: 'Supporting Narrative Line',
      required: false,
      aiGenerated: true,
      maxLength: 180,
    },
    {
      key: 'backgroundImageUrl',
      type: 'image',
      label: 'Cinematic Background Image',
      required: false,
      aiGenerated: false,
    },
  ],
};

export default meta;
