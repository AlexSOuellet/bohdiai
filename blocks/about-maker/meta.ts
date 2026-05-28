import type { BlockMeta } from '@/lib/blocks';

const meta: BlockMeta = {
  key: 'about-maker',
  label: 'About the Maker',
  sectionType: 'about',
  description:
    'Maker story section. Two-column layout — headline + one or two paragraphs of prose alongside a photo of the maker at work (workshop scene, hands on tools, materials in the foreground). Optional CTA button below.',
  status: 'active',
  pageTypes: ['home'],
  slots: [
    {
      key: 'primary-cta',
      label: 'Call to Action',
      accepts: ['cta-button'],
      required: false,
    },
  ],
  contentSchema: [
    {
      key: 'headline',
      type: 'text',
      label: 'Section Headline',
      required: true,
      aiGenerated: true,
      maxLength: 60,
    },
    {
      key: 'body',
      type: 'richtext',
      label: 'Maker Story',
      required: true,
      aiGenerated: true,
      maxLength: 600,
    },
    {
      key: 'imageUrl',
      type: 'image',
      label: 'Photo (injected at generation time — workshop scene per niche)',
      required: false,
      aiGenerated: false,
    },
  ],
};

export default meta;
