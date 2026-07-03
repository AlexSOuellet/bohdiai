import { describe, it, expect } from 'vitest';
import { normalizeCopy, slugify } from './normalize-copy';
import type { CopywriterDraft } from './copywriter-schema';

const full = {
  shopName: '  Evening Shadow  ',
  identity: { wordmark: ' ES ', nav: [{ label: ' Shop ', target: 'shop' }] },
  moment: {
    story: ['Lines, with punctuation.', '   ', 'Another!'],
    eyebrow: ' eyebrow ',
    brand: ' Brand ',
    sub: ' sub ',
    ctaLabel: ' Shop ',
    ctaTarget: 'shop',
    secondaryCtaLabel: ' More ',
    secondaryCtaTarget: 'about',
  },
  goods: { title: 'Our goods.', treatment: 'marquee', label: ' new ', viewAllLabel: ' all ' },
  marquee: { voice: ['Small batch.', ' Made to last! ', '   '] },
  founder: {
    quote: ' q ',
    attribution: ' me ',
    treatment: 'card',
    eyebrow: ' meet ',
    heading: 'Meet June.',
    aboutLabel: ' about ',
    findUs: { label: ' find ', eventsLabel: ' events ', rows: [{ day: ' Sat ', where: ' Market ', time: ' 9-1 ', date: '2025-08-02', kind: 'market' }] },
  },
  close: { label: ' l ', headline: 'Come by!', ctaLabel: ' c ', ctaTarget: 'shop' },
  about: { heading: 'Our story.', story: [' a ', ' b '] },
  contact: { heading: 'Say hi!', intro: ' intro ' },
  products: [{ name: ' P ', slug: 'My Product Name!', shortDescription: ' s ', description: ' d ', basePriceCents: 100 }],
} as unknown as CopywriterDraft;

const minimal = {
  shopName: 'S',
  identity: { wordmark: 'S', nav: [{ label: 'Shop', target: 'shop' }] },
  moment: { story: ['One'], eyebrow: 'e', brand: 'b', sub: 's', ctaLabel: 'c', ctaTarget: 'shop' },
  goods: { title: 'Goods', treatment: 'marquee' },
  marquee: { voice: ['One'] },
  founder: { quote: 'q', attribution: 'a', treatment: 'quote' },
  close: { label: 'l', headline: 'Close', ctaLabel: 'c', ctaTarget: 'shop' },
  about: { heading: 'About', story: ['x'] },
  contact: { heading: 'Contact', intro: 'i' },
  products: [{ name: 'P', slug: 'p', shortDescription: 's', description: 'd', basePriceCents: 100 }],
} as unknown as CopywriterDraft;

describe('normalizeCopy', () => {
  it('trims, strips headline/story punctuation, slugifies, and folds in every optional field when present', () => {
    const out = normalizeCopy(full);
    expect(out.shopName).toBe('Evening Shadow');
    // story: forbidden punctuation removed; the whitespace-only line dropped
    expect(out.moment.story).toEqual(['Lines with punctuation', 'Another']);
    expect(out.goods.title).toBe('Our goods'); // headline period stripped
    expect(out.founder.heading).toBe('Meet June');
    expect(out.close.headline).toBe('Come by');
    expect(out.about.heading).toBe('Our story');
    expect(out.contact.heading).toBe('Say hi');
    expect(out.products[0]!.slug).toBe('my-product-name');
    // optionals carried through, trimmed
    expect(out.moment.secondaryCtaLabel).toBe('More');
    expect(out.moment.secondaryCtaTarget).toBe('about');
    expect(out.goods.label).toBe('new');
    expect(out.goods.viewAllLabel).toBe('all');
    // marquee voice: terminal punctuation stripped, the whitespace-only phrase dropped
    expect(out.marquee.voice).toEqual(['Small batch', 'Made to last']);
    expect(out.founder.eyebrow).toBe('meet');
    expect(out.founder.aboutLabel).toBe('about');
    expect(out.founder.findUs?.eventsLabel).toBe('events');
    // date + kind survive normalization (the build stamps real dates over the date later)
    expect(out.founder.findUs?.rows[0]).toEqual({ day: 'Sat', where: 'Market', time: '9-1', date: '2025-08-02', kind: 'market' });
  });

  it('omits optional fields the draft did not include', () => {
    const out = normalizeCopy(minimal);
    expect('secondaryCtaLabel' in out.moment).toBe(false);
    expect('secondaryCtaTarget' in out.moment).toBe(false);
    expect('label' in out.goods).toBe(false);
    expect('eyebrow' in out.founder).toBe(false);
    expect('heading' in out.founder).toBe(false);
    expect('findUs' in out.founder).toBe(false);
  });
});

describe('slugify', () => {
  it('lowercases, hyphenates non-alphanumeric runs, and trims edge hyphens', () => {
    expect(slugify('My Product Name!')).toBe('my-product-name');
    expect(slugify('--Hello, World--')).toBe('hello-world');
  });

  it('soft-caps a very long slug at 80 chars with no trailing hyphen', () => {
    const out = slugify('word-'.repeat(20)); // 100 chars
    expect(out.length).toBeLessThanOrEqual(80);
    expect(out.endsWith('-')).toBe(false);
  });
});
