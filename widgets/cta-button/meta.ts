import type { WidgetMeta } from '@/lib/blocks';

const meta: WidgetMeta = {
  key: 'cta-button',
  label: 'CTA Button',
  description:
    'A single call-to-action button. Drives traffic to a URL — typically the product catalog, a featured collection, or a custom-order form. Works in any CTA slot.',
  slotAccepts: ['primary-cta', 'secondary-cta', 'cta'],
  tenantTypeFit: ['seller', 'doer'],
  tier: 'free',
  status: 'active',
  contentSchema: [
    {
      key: 'label',
      type: 'text',
      label: 'Button Label',
      required: true,
      aiGenerated: true,
      maxLength: 40,
    },
    {
      key: 'href',
      type: 'url',
      label: 'Destination URL',
      required: true,
      aiGenerated: true,
    },
  ],
};

export default meta;
