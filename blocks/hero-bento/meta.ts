import type { BlockMeta } from '@/lib/blocks';

const meta: BlockMeta = {
  key: 'hero-bento',
  label: 'Bento Hero',
  sectionType: 'hero',
  description:
    'A bento-box grid hero. Four cells arranged in an unequal 12-column grid: one large feature cell occupies the upper-left two-thirds with the headline and CTA overlaid on its image, flanked by a tall narrow cell on the right with a portrait photo, and two square cells filling the bottom row with supporting imagery. No single hero image — the layout itself is the focal point.',
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
      label: 'Tagline',
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
      maxLength: 60,
    },
    {
      key: 'subheadline',
      type: 'text',
      label: 'Supporting Line',
      required: false,
      aiGenerated: true,
      maxLength: 140,
    },
    {
      key: 'featureImageUrl',
      type: 'image',
      label: 'Feature cell image (large, top-left)',
      required: true,
      aiGenerated: false,
    },
    {
      key: 'portraitImageUrl',
      type: 'image',
      label: 'Tall portrait cell image (right column)',
      required: false,
      aiGenerated: false,
    },
    {
      key: 'detailImageUrl',
      type: 'image',
      label: 'Detail cell image (bottom-left)',
      required: false,
      aiGenerated: false,
    },
    {
      key: 'accentImageUrl',
      type: 'image',
      label: 'Accent cell image (bottom-middle)',
      required: false,
      aiGenerated: false,
    },
  ],
};

export default meta;
