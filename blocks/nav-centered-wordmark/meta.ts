import type { BlockMeta } from '@/lib/blocks';

const meta: BlockMeta = {
  key: 'nav-centered-wordmark',
  label: 'Centered Wordmark Nav',
  sectionType: 'nav',
  description:
    'Navigation bar with the shop wordmark large and centered. Navigation links split symmetrically around the wordmark — first half left, second half right. Cart icon anchored far-right. The wordmark uses the storefront heading font at a deliberately large size so it reads as the focal element of the bar.',
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
