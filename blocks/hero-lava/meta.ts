import type { BlockMeta } from '@/lib/blocks';

const meta: BlockMeta = {
  key: 'hero-lava',
  label: 'Lava Hero',
  sectionType: 'hero',
  description:
    'Organic contour layout. Three irregular blob-shaped cells with rounded organic borders flow across the viewport — a large primary blob on the left holds the image, a mid-size blob upper-right holds the headline and CTA, a smaller blob lower-right holds a supporting image or color fill. Cells overlap slightly and are shaped with extreme border-radius values (cells are not rectangles). The negative space between blobs is part of the composition.',
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
      key: 'primaryImageUrl',
      type: 'image',
      label: 'Primary blob image (large, left)',
      required: true,
      aiGenerated: false,
    },
    {
      key: 'secondaryImageUrl',
      type: 'image',
      label: 'Secondary blob image (small, lower-right)',
      required: false,
      aiGenerated: false,
    },
  ],
};

export default meta;
