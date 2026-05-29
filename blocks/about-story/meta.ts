import type { BlockMeta } from '@/lib/blocks';

const meta: BlockMeta = {
  key: 'about-story',
  label: 'About Story (Expanded)',
  sectionType: 'about',
  description:
    'Full-length About page content. Magazine-style story layout designed for the dedicated /about route — not the home page. Hero image at the top, then eyebrow + headline + lead paragraph, then the long body story (multiple paragraphs, no truncation), then an optional signature line at the bottom. The body field accepts rich text and is expected to be substantially longer than home-page about blocks — this is where the maker tells the real story.',
  status: 'active',
  pageTypes: ['about'],
  slots: [],
  contentSchema: [
    {
      key: 'eyebrow',
      type: 'text',
      label: 'Small label above the headline (e.g. "Our Story", "The Maker")',
      required: false,
      aiGenerated: true,
      maxLength: 40,
    },
    {
      key: 'headline',
      type: 'text',
      label: 'Page-level headline — the title of the about page',
      required: true,
      aiGenerated: true,
      maxLength: 80,
    },
    {
      key: 'intro',
      type: 'richtext',
      label: 'Lead paragraph — 1-2 sentences that set up the story (300-500 chars)',
      required: true,
      aiGenerated: true,
      maxLength: 500,
    },
    {
      key: 'body',
      type: 'richtext',
      label: 'Long-form body of the about page — the full story (1500-3500 chars). Multiple paragraphs. Should NOT repeat the home about block — this is the expanded version.',
      required: true,
      aiGenerated: true,
      maxLength: 3500,
    },
    {
      key: 'signatureName',
      type: 'text',
      label: 'Optional signature name at the bottom (typically the maker\'s first name)',
      required: false,
      aiGenerated: true,
      maxLength: 40,
    },
    {
      key: 'signatureRole',
      type: 'text',
      label: 'Optional role line under the signature',
      required: false,
      aiGenerated: true,
      maxLength: 60,
    },
    {
      key: 'imageUrl',
      type: 'image',
      label: 'Hero image at the top of the about page (workshop scene, maker at work, materials in the foreground)',
      required: false,
      aiGenerated: false,
    },
  ],
};

export default meta;
