import type { BlockMeta } from '@/lib/blocks';

const meta: BlockMeta = {
  key: 'products-bloom-grid',
  label: 'Bloom Asymmetric Grid',
  sectionType: 'products',
  description:
    'A lush, maximalist asymmetric product grid built for Wild Meadow and Bright Bazaar storefronts. Breaks the uniform card template completely — products scatter across a botanical-inspired masonry layout with oversized feature cells, dramatically varied aspect ratios, bold organic rounded frames, and floating accent badges. Images are expected to be full-bleed editorial photographs. Choose this over products-editorial-grid when the brand is light, alive, and joyful rather than dark and editorial.',
  moodFit: ['wild-meadow', 'bright-bazaar'],
  tenantTypeFit: ['seller'],
  tier: 'free',
  status: 'active',
  slots: [],
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
      key: 'subtitle',
      type: 'text',
      label: 'Section Subtitle',
      required: false,
      aiGenerated: true,
      maxLength: 120,
    },
  ],
};

export default meta;
