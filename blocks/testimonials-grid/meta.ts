import type { BlockMeta } from '@/lib/blocks';

const meta: BlockMeta = {
  key: 'testimonials-grid',
  label: 'Testimonials',
  sectionType: 'testimonials',
  description:
    'Up to three customer quotes in a grid. AI generates placeholder testimonials at onboarding; the maker replaces them with real reviews.',
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
    {
      key: 'testimonial_1_text',
      type: 'text',
      label: 'First Testimonial Quote',
      required: true,
      aiGenerated: true,
      maxLength: 200,
    },
    {
      key: 'testimonial_1_author',
      type: 'text',
      label: 'First Testimonial Author',
      required: true,
      aiGenerated: true,
      maxLength: 60,
    },
    {
      key: 'testimonial_2_text',
      type: 'text',
      label: 'Second Testimonial Quote',
      required: false,
      aiGenerated: true,
      maxLength: 200,
    },
    {
      key: 'testimonial_2_author',
      type: 'text',
      label: 'Second Testimonial Author',
      required: false,
      aiGenerated: true,
      maxLength: 60,
    },
    {
      key: 'testimonial_3_text',
      type: 'text',
      label: 'Third Testimonial Quote',
      required: false,
      aiGenerated: true,
      maxLength: 200,
    },
    {
      key: 'testimonial_3_author',
      type: 'text',
      label: 'Third Testimonial Author',
      required: false,
      aiGenerated: true,
      maxLength: 60,
    },
  ],
};

export default meta;
