import type { BlockMeta } from '@/lib/blocks';

const meta: BlockMeta = {
  key: 'hero-split-gallery',
  label: 'Asymmetrical Split Gallery',
  sectionType: 'hero',
  description:
    'Asymmetric 50/50 split. Tall portrait image on the left fills the full height. Text panel on the right sits on a solid background — tagline, headline, subheadline, CTA. Optional secondary landscape photo overlaps the bottom-left corner.',
  status: 'draft',
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
