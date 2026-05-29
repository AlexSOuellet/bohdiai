import type { BlockMeta } from '@/lib/blocks';

const meta: BlockMeta = {
  key: 'nav-split',
  label: 'Split Nav',
  sectionType: 'nav',
  description:
    'A split navigation bar with nav links flanking a centered shop-name wordmark. Starts large and transparent over the hero; shrinks to a compact solid bar on scroll.',
  status: 'active',
  pageTypes: ['system'],
  slots: [],
  contentSchema: [
    {
      key: 'shopName',
      type: 'text',
      label: 'Shop name (displayed as the centered wordmark)',
      required: true,
      aiGenerated: true,
      maxLength: 60,
    },
    {
      key: 'sections',
      type: 'text',
      label: 'Nav link keys as a JSON array — e.g. ["shop","about","collections"]. Valid keys: shop, about, collections, events, contact.',
      required: false,
      aiGenerated: true,
    },
    {
      key: 'logoUrl',
      type: 'text',
      label: 'Public URL of the tenant\'s uploaded logo. Empty string = render the typographic wordmark instead.',
      required: false,
      aiGenerated: false,
    },
  ],
};

export default meta;
