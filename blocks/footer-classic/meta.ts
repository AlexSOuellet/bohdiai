import type { BlockMeta } from '@/lib/blocks';

const meta: BlockMeta = {
  key: 'footer-classic',
  label: 'Classic Footer',
  sectionType: 'footer',
  description:
    'A classic site footer with the shop wordmark, primary navigation links, legal links, and a copyright + platform credit line. Spans the full width with mood-driven colors and typography.',
  moodFit: [
    'dark-and-stormy',
    'rustic',
    'warm-and-cozy',
    'summer-afternoon',
    'wild-meadow',
    'bright-bazaar',
    'sunday-morning',
  ],
  tenantTypeFit: ['seller', 'doer'],
  tier: 'free',
  status: 'active',
  pageTypes: ['system'],
  slots: [],
  contentSchema: [
    {
      key: 'shopName',
      type: 'text',
      label: 'Shop name (displayed in the footer wordmark)',
      required: true,
      aiGenerated: true,
      maxLength: 60,
    },
    {
      key: 'sections',
      type: 'text',
      label: 'Nav link keys as a JSON array — e.g. ["shop","about","contact"]. Valid keys: shop, about, contact, events, gallery.',
      required: false,
      aiGenerated: true,
    },
  ],
};

export default meta;
