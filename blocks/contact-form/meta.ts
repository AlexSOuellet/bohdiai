import type { BlockMeta } from '@/lib/blocks';

const meta: BlockMeta = {
  key: 'contact-form',
  label: 'Contact Form',
  sectionType: 'custom',
  description:
    'A simple contact form (name, email, message) that posts to the platform contact API and sends an email to the shop owner. Renders an intro heading, a short subheading, the form, and a small confirmation message after a successful send.',
  status: 'active',
  pageTypes: ['contact'],
  slots: [],
  contentSchema: [
    {
      key: 'heading',
      type: 'text',
      label: 'Page heading (e.g. "Get in Touch", "Say Hello")',
      required: true,
      aiGenerated: true,
      maxLength: 60,
    },
    {
      key: 'subheading',
      type: 'text',
      label: 'One-line invitation under the heading.',
      required: true,
      aiGenerated: true,
      maxLength: 200,
    },
    {
      key: 'buttonLabel',
      type: 'text',
      label: 'Submit button label (e.g. "Send Message", "Reach Out")',
      required: false,
      aiGenerated: true,
      maxLength: 30,
    },
  ],
};

export default meta;
