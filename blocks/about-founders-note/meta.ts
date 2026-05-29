import type { BlockMeta } from '@/lib/blocks';

const meta: BlockMeta = {
  key: 'about-founders-note',
  label: 'Founder\'s Note',
  sectionType: 'about',
  description:
    'Personal note from the maker. Left side holds a portrait photo of the maker (square or tall-portrait aspect). Right side holds a short direct quote (1-3 sentences in first person) followed by a stylized signature line. Compact, intimate, signed personally.',
  status: 'active',
  pageTypes: ['home'],
  slots: [],
  contentSchema: [
    {
      key: 'eyebrow',
      type: 'text',
      label: 'Small label above the quote (e.g. "From the maker")',
      required: false,
      aiGenerated: true,
      maxLength: 40,
    },
    {
      key: 'quote',
      type: 'richtext',
      label: 'Direct quote from the maker (1-3 sentences, first person)',
      required: true,
      aiGenerated: true,
      maxLength: 320,
    },
    {
      key: 'signatureName',
      type: 'text',
      label: 'Signature name (typically the maker\'s first name)',
      required: true,
      aiGenerated: true,
      maxLength: 40,
    },
    {
      key: 'signatureRole',
      type: 'text',
      label: 'Optional role line under signature',
      required: false,
      aiGenerated: true,
      maxLength: 60,
    },
    {
      key: 'portraitImageUrl',
      type: 'image',
      label: 'Portrait of the maker',
      required: false,
      aiGenerated: false,
    },
  ],
};

export default meta;
