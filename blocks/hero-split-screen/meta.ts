import type { BlockMeta } from '@/lib/blocks';

const meta: BlockMeta = {
  key: 'hero-split-screen',
  label: 'Split Screen Hero',
  sectionType: 'hero',
  description:
    'A bold, high-contrast split-viewport hero. Features a dramatic full-bleed landscape photo occupying the left side, and a solid-colored typography card panel with nested border dividers and high-fashion serif letterforms on the right. Perfect for Dark & Stormy, Rustic, Warm & Cozy, and Sunday Morning moods.',
  moodFit: ['dark-and-stormy', 'rustic', 'warm-and-cozy', 'sunday-morning'],
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
      label: 'Aesthetic Tagline / Location Kicker',
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
      label: 'Supporting Narrative Subheading',
      required: false,
      aiGenerated: true,
      maxLength: 160,
    },
    {
      key: 'backgroundImageUrl',
      type: 'image',
      label: 'Left Split Screen Image',
      required: true,
      aiGenerated: false,
    },
  ],
};

export default meta;
