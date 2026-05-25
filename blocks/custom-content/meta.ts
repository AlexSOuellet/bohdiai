import type { BlockMeta } from '@/lib/blocks';

const meta: BlockMeta = {
  key: 'custom-content',
  label: 'Custom Content',
  sectionType: 'custom',
  description:
    'A freeform text section for anything the maker wants to say that doesn\'t fit another block — a seasonal announcement, a studio note, a care guide, a policy summary. AI generates a relevant opening; the maker edits freely.',
  moodFit: ['dark-and-stormy', 'rustic', 'warm-and-cozy', 'sunday-morning', 'wild-meadow', 'summer-afternoon', 'bright-bazaar'],
  tenantTypeFit: ['seller', 'doer'],
  tier: 'free',
  status: 'active',
  slots: [
    {
      key: 'primary-cta',
      label: 'Call to Action',
      accepts: ['cta-button'],
      required: false,
    },
  ],
  contentSchema: [
    {
      key: 'headline',
      type: 'text',
      label: 'Section Headline',
      required: true,
      aiGenerated: true,
      maxLength: 80,
    },
    {
      key: 'body',
      type: 'richtext',
      label: 'Body Copy',
      required: true,
      aiGenerated: true,
      maxLength: 800,
    },
  ],
};

export default meta;
