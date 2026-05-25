import type { BlockMeta } from '@/lib/blocks';

const meta: BlockMeta = {
  key: 'events-list',
  label: 'Upcoming Events',
  sectionType: 'events',
  description:
    'Lists the maker\'s upcoming craft shows, markets, and popup events pulled from the events table. Lets customers know where to find the maker in person. Renders nothing when no upcoming events exist — safe to include on any page.',
  moodFit: ['rustic', 'warm-and-cozy', 'wild-meadow', 'summer-afternoon', 'sunday-morning'],
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
