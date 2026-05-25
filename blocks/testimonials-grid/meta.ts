import type { BlockMeta } from '@/lib/blocks';

const meta: BlockMeta = {
  key: 'testimonials-grid',
  label: 'Testimonials',
  sectionType: 'testimonials',
  description:
    'Social proof section showing up to three customer quotes. At onboarding the AI generates representative placeholder testimonials in the voice of real customers for this niche. The maker replaces them with real reviews over time.',
  moodFit: ['warm-and-cozy', 'sunday-morning', 'rustic', 'summer-afternoon', 'bright-bazaar'],
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
