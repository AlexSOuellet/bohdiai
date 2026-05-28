import type { BlockMeta } from '@/lib/blocks';

const meta: BlockMeta = {
  key: 'hero-super-type',
  label: 'Super-Type Hero',
  sectionType: 'hero',
  description:
    'Typography-as-hero. A single ultra-large headline spans the full viewport width, broken across multiple lines with deliberate weight and style mixing — kicker line in italic, main line in heavy display. The image is pushed below the fold as a wide landscape strip rather than overlaid. No card panel, no overlay text on imagery. The typography itself is the content.',
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
      key: 'kicker',
      type: 'text',
      label: 'Italic kicker line above the main headline',
      required: false,
      aiGenerated: true,
      maxLength: 40,
    },
    {
      key: 'headline',
      type: 'text',
      label: 'Main display headline — renders at hero scale. MUST be short: 2-5 words, under 30 characters. Longer headlines break the layout. Pick a sharp short phrase.',
      required: true,
      aiGenerated: true,
      maxLength: 30,
    },
    {
      key: 'subheadline',
      type: 'text',
      label: 'Supporting line',
      required: false,
      aiGenerated: true,
      maxLength: 200,
    },
    {
      key: 'belowImageUrl',
      type: 'image',
      label: 'Wide landscape image below the typography',
      required: false,
      aiGenerated: false,
    },
  ],
};

export default meta;
