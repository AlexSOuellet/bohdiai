import type { BlockMeta } from '@/lib/blocks';

const meta: BlockMeta = {
  key: 'events-list',
  label: 'Upcoming Events',
  sectionType: 'events',
  description:
    'List of upcoming events pulled from the events table — craft shows, markets, popups. Renders nothing when no upcoming events exist.',
  status: 'active',
  pageTypes: ['home'],
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
