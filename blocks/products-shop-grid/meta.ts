import type { BlockMeta } from '@/lib/blocks';

const meta: BlockMeta = {
  key: 'products-shop-grid',
  label: 'Shop Page Products Grid',
  sectionType: 'products',
  description:
    'The full product grid for the dedicated /shop page. Renders every active listing for the tenant in a responsive grid, sorted newest first. Used only on the shop page — not used in home-page assembly.',
  status: 'active',
  pageTypes: ['shop'],
  slots: [],
  contentSchema: [],
};

export default meta;
