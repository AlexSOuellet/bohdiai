import type { BlockMeta } from '@/lib/blocks';

const meta: BlockMeta = {
  key: 'hero-editorial',
  label: 'Editorial Hero',
  sectionType: 'hero',
  description:
    'A full-width, typography-forward hero. Large headline leads; subheadline below. The maker story comes before the product. Best when the brand identity is the draw — not the catalog.',
  moodFit: ['dark-and-stormy', 'rustic', 'warm-and-cozy', 'summer-afternoon', 'wild-meadow', 'bright-bazaar', 'sunday-morning'],
  tenantTypeFit: ['seller', 'doer'],
  tier: 'free',
  status: 'active',
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
