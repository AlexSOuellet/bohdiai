import type { BlockMeta } from '@/lib/blocks';

const meta: BlockMeta = {
  key: 'hero-split-screen',
  label: 'Split Screen Hero',
  sectionType: 'hero',
  description:
    'Clean 50/50 split. Wide landscape image on the left. Solid bordered card panel on the right — tagline, mixed-weight headline, divider line, subheadline, CTA.',
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
      label: 'Split Screen Image',
      required: true,
      aiGenerated: false,
    },
    {
      key: 'layout',
      type: 'text',
      label: 'Layout — "image-left" or "image-right"',
      required: false,
      aiGenerated: true,
      maxLength: 12,
    },
  ],
};

export default meta;
