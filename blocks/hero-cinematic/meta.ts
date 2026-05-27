import type { BlockMeta } from '@/lib/blocks';

const meta: BlockMeta = {
  key: 'hero-cinematic',
  label: 'Cinematic Hero',
  sectionType: 'hero',
  description:
    'Full-bleed image hero. The image fills the entire viewport. Headline and subheadline overlay the image directly, anchored left, protected by dark gradients. Tagline kicker above the headline. CTA below.',
  moodFit: ['dark-and-stormy', 'rustic', 'warm-and-cozy', 'summer-afternoon', 'wild-meadow', 'bright-bazaar', 'sunday-morning'],
  tenantTypeFit: ['seller', 'doer'],
  tier: 'free',
  status: 'active',
  pageTypes: ['home'],
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
