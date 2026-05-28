import type { BlockMeta } from '@/lib/blocks';

const meta: BlockMeta = {
  key: 'hero-editorial',
  label: 'Editorial Hero',
  sectionType: 'hero',
  description:
    'Full-width centered text hero. Large headline and subheadline centered on the page, CTA below. Background image optional — renders as pure typography without one, or with the image behind a dark overlay when provided.',
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
      label: 'Supporting Line',
      required: false,
      aiGenerated: true,
      maxLength: 160,
    },
    {
      key: 'backgroundImageUrl',
      type: 'image',
      label: 'Background Image',
      required: false,
      aiGenerated: false,
    },
  ],
};

export default meta;
