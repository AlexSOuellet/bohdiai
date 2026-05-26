import type { BlockMeta } from '@/lib/blocks';

const meta: BlockMeta = {
  key: 'events-list',
  label: 'Upcoming Events',
  sectionType: 'events',
  description:
    'List of upcoming events pulled from the events table — craft shows, markets, popups. Renders nothing when no upcoming events exist.',
  moodFit: ['dark-and-stormy', 'rustic', 'warm-and-cozy', 'summer-afternoon', 'wild-meadow', 'bright-bazaar', 'sunday-morning'],
  tenantTypeFit: ['seller', 'doer'],
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
  ],
};

export default meta;
