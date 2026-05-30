import { describe, it, expect } from 'vitest';
import {
  TextNodeSchema,
  ImageNodeSchema,
  ButtonNodeSchema,
  WordmarkNodeSchema,
  VideoNodeSchema,
  DividerNodeSchema,
  QuoteNodeSchema,
  ProductGridNodeSchema,
  FeaturedProductNodeSchema,
  CollectionGridNodeSchema,
  FeaturedCollectionNodeSchema,
  SubscriptionGridNodeSchema,
  FeaturedSubscriptionNodeSchema,
  ContactFormNodeSchema,
  CartNodeSchema,
  SocialLinksNodeSchema,
  NavLinksNodeSchema,
  EventsListNodeSchema,
  ContentNodeSchema,
  CONTENT_NODE_TYPES,
} from './content';

describe('TextNodeSchema', () => {
  it('accepts a minimal valid text node', () => {
    expect(TextNodeSchema.parse({ type: 'text', role: 'headline', content: 'hello' }).type).toBe('text');
  });
  it('accepts full text node', () => {
    expect(
      TextNodeSchema.parse({
        type: 'text', id: 'a', intent: { density: 'normal' }, role: 'eyebrow', content: 'x', align: 'center',
      }).align,
    ).toBe('center');
  });
  it('rejects empty content', () => {
    expect(TextNodeSchema.safeParse({ type: 'text', role: 'body', content: '' }).success).toBe(false);
  });
  it('rejects bad role', () => {
    expect(TextNodeSchema.safeParse({ type: 'text', role: 'wow', content: 'x' }).success).toBe(false);
  });
  it('rejects bad align', () => {
    expect(TextNodeSchema.safeParse({ type: 'text', role: 'body', content: 'x', align: 'left' }).success).toBe(false);
  });
  it('rejects extra keys', () => {
    expect(TextNodeSchema.safeParse({ type: 'text', role: 'body', content: 'x', extra: 1 }).success).toBe(false);
  });
});

describe('ImageNodeSchema', () => {
  it('accepts minimum', () => {
    expect(ImageNodeSchema.parse({ type: 'image', brief: 'b', alt: 'a' }).type).toBe('image');
  });
  it('accepts full node with focal/url', () => {
    expect(
      ImageNodeSchema.parse({
        type: 'image', brief: 'b', alt: 'a', aspect: '16:9',
        assetUrl: 'https://e.com/x.jpg', focal: { x: 50, y: 50 },
      }).aspect,
    ).toBe('16:9');
  });
  it('rejects bad aspect', () => {
    expect(ImageNodeSchema.safeParse({ type: 'image', brief: 'b', alt: 'a', aspect: '2:1' }).success).toBe(false);
  });
  it('rejects bad assetUrl', () => {
    expect(ImageNodeSchema.safeParse({ type: 'image', brief: 'b', alt: 'a', assetUrl: 'not-url' }).success).toBe(false);
  });
  it('rejects focal out of range', () => {
    expect(ImageNodeSchema.safeParse({ type: 'image', brief: 'b', alt: 'a', focal: { x: 101, y: 0 } }).success).toBe(false);
  });
  it('rejects missing brief', () => {
    expect(ImageNodeSchema.safeParse({ type: 'image', alt: 'a' }).success).toBe(false);
  });
});

describe('ButtonNodeSchema', () => {
  it('accepts minimal', () => {
    expect(ButtonNodeSchema.parse({ type: 'button', label: 'Go', href: '/x' }).label).toBe('Go');
  });
  it('accepts variant', () => {
    expect(ButtonNodeSchema.parse({ type: 'button', label: 'Go', href: '/x', variant: 'ghost' }).variant).toBe('ghost');
  });
  it('rejects empty label', () => {
    expect(ButtonNodeSchema.safeParse({ type: 'button', label: '', href: '/x' }).success).toBe(false);
  });
  it('rejects label over 80', () => {
    expect(ButtonNodeSchema.safeParse({ type: 'button', label: 'x'.repeat(81), href: '/x' }).success).toBe(false);
  });
  it('rejects bad variant', () => {
    expect(ButtonNodeSchema.safeParse({ type: 'button', label: 'x', href: '/x', variant: 'bold' }).success).toBe(false);
  });
});

describe('WordmarkNodeSchema', () => {
  it('accepts text kind', () => {
    expect(WordmarkNodeSchema.parse({ type: 'wordmark', kind: 'text', content: 'Shop' }).kind).toBe('text');
  });
  it('rejects bad kind', () => {
    expect(WordmarkNodeSchema.safeParse({ type: 'wordmark', kind: 'svg', content: 'x' }).success).toBe(false);
  });
  it('rejects empty content', () => {
    expect(WordmarkNodeSchema.safeParse({ type: 'wordmark', kind: 'text', content: '' }).success).toBe(false);
  });
});

describe('VideoNodeSchema', () => {
  it('accepts minimum', () => {
    expect(VideoNodeSchema.parse({ type: 'video', assetUrl: 'https://e.com/v.mp4' }).type).toBe('video');
  });
  it('accepts full', () => {
    const n = VideoNodeSchema.parse({
      type: 'video', assetUrl: 'https://e.com/v.mp4', poster: 'https://e.com/p.jpg',
      autoplay: true, loop: true, muted: true, controls: false, aspect: '16:9',
    });
    expect(n.autoplay).toBe(true);
  });
  it('rejects bad url', () => {
    expect(VideoNodeSchema.safeParse({ type: 'video', assetUrl: 'no' }).success).toBe(false);
  });
  it('rejects bad poster', () => {
    expect(VideoNodeSchema.safeParse({ type: 'video', assetUrl: 'https://e.com/v', poster: 'x' }).success).toBe(false);
  });
});

describe('DividerNodeSchema', () => {
  it('accepts default', () => {
    expect(DividerNodeSchema.parse({ type: 'divider' }).type).toBe('divider');
  });
  it('accepts weight + style', () => {
    expect(DividerNodeSchema.parse({ type: 'divider', weight: 'thick', style: 'dotted' }).weight).toBe('thick');
  });
  it('rejects bad weight', () => {
    expect(DividerNodeSchema.safeParse({ type: 'divider', weight: 'huge' }).success).toBe(false);
  });
  it('rejects bad style', () => {
    expect(DividerNodeSchema.safeParse({ type: 'divider', style: 'wavy' }).success).toBe(false);
  });
});

describe('QuoteNodeSchema', () => {
  it('accepts minimum', () => {
    expect(QuoteNodeSchema.parse({ type: 'quote', body: 'A truth' }).type).toBe('quote');
  });
  it('accepts attribution + role', () => {
    expect(
      QuoteNodeSchema.parse({ type: 'quote', body: 'A', attribution: 'Bo', role: 'Founder' }).attribution,
    ).toBe('Bo');
  });
  it('rejects empty body', () => {
    expect(QuoteNodeSchema.safeParse({ type: 'quote', body: '' }).success).toBe(false);
  });
});

describe('ProductGridNodeSchema', () => {
  it('accepts minimum', () => {
    expect(ProductGridNodeSchema.parse({ type: 'productGrid' }).type).toBe('productGrid');
  });
  it('accepts full', () => {
    const n = ProductGridNodeSchema.parse({
      type: 'productGrid', count: 6, order: 'manual',
      filter: { collectionSlug: 'wax', tag: 'new' },
      manualIds: ['a', 'b'], columns: 3, mobileColumns: 2,
    });
    expect(n.order).toBe('manual');
  });
  it('rejects count > 48', () => {
    expect(ProductGridNodeSchema.safeParse({ type: 'productGrid', count: 49 }).success).toBe(false);
  });
  it('rejects count < 1', () => {
    expect(ProductGridNodeSchema.safeParse({ type: 'productGrid', count: 0 }).success).toBe(false);
  });
  it('rejects bad order', () => {
    expect(ProductGridNodeSchema.safeParse({ type: 'productGrid', order: 'random' }).success).toBe(false);
  });
  it('rejects mobileColumns over 3', () => {
    expect(ProductGridNodeSchema.safeParse({ type: 'productGrid', mobileColumns: 4 }).success).toBe(false);
  });
  it('rejects empty filter string', () => {
    expect(
      ProductGridNodeSchema.safeParse({ type: 'productGrid', filter: { collectionSlug: '' } }).success,
    ).toBe(false);
  });
  it('rejects manualIds > 48', () => {
    expect(
      ProductGridNodeSchema.safeParse({ type: 'productGrid', manualIds: Array(49).fill('a') }).success,
    ).toBe(false);
  });
});

describe('FeaturedProductNodeSchema', () => {
  it('accepts', () => {
    expect(FeaturedProductNodeSchema.parse({ type: 'featuredProduct', productId: 'p1' }).productId).toBe('p1');
  });
  it('accepts full', () => {
    expect(
      FeaturedProductNodeSchema.parse({
        type: 'featuredProduct', productId: 'p1', showPrice: true, showAddToCart: false,
      }).showPrice,
    ).toBe(true);
  });
  it('rejects empty productId', () => {
    expect(FeaturedProductNodeSchema.safeParse({ type: 'featuredProduct', productId: '' }).success).toBe(false);
  });
});

describe('CollectionGridNodeSchema', () => {
  it('accepts minimum', () => {
    expect(CollectionGridNodeSchema.parse({ type: 'collectionGrid' }).type).toBe('collectionGrid');
  });
  it('accepts full', () => {
    const n = CollectionGridNodeSchema.parse({
      type: 'collectionGrid', count: 6, order: 'manual', manualSlugs: ['a'], columns: 3, mobileColumns: 2,
    });
    expect(n.order).toBe('manual');
  });
  it('rejects count > 24', () => {
    expect(CollectionGridNodeSchema.safeParse({ type: 'collectionGrid', count: 25 }).success).toBe(false);
  });
  it('rejects bad order', () => {
    expect(CollectionGridNodeSchema.safeParse({ type: 'collectionGrid', order: 'price-asc' }).success).toBe(false);
  });
});

describe('FeaturedCollectionNodeSchema', () => {
  it('accepts minimum', () => {
    expect(
      FeaturedCollectionNodeSchema.parse({ type: 'featuredCollection', collectionSlug: 'wax' }).collectionSlug,
    ).toBe('wax');
  });
  it('accepts previewCount', () => {
    expect(
      FeaturedCollectionNodeSchema.parse({ type: 'featuredCollection', collectionSlug: 'w', previewCount: 4 }).previewCount,
    ).toBe(4);
  });
  it('rejects previewCount > 12', () => {
    expect(
      FeaturedCollectionNodeSchema.safeParse({ type: 'featuredCollection', collectionSlug: 'w', previewCount: 13 }).success,
    ).toBe(false);
  });
});

describe('SubscriptionGridNodeSchema', () => {
  it('accepts minimum', () => {
    expect(SubscriptionGridNodeSchema.parse({ type: 'subscriptionGrid' }).type).toBe('subscriptionGrid');
  });
  it('rejects count > 12', () => {
    expect(SubscriptionGridNodeSchema.safeParse({ type: 'subscriptionGrid', count: 13 }).success).toBe(false);
  });
  it('rejects columns > 4', () => {
    expect(SubscriptionGridNodeSchema.safeParse({ type: 'subscriptionGrid', columns: 5 }).success).toBe(false);
  });
  it('rejects mobileColumns > 2', () => {
    expect(SubscriptionGridNodeSchema.safeParse({ type: 'subscriptionGrid', mobileColumns: 3 }).success).toBe(false);
  });
});

describe('FeaturedSubscriptionNodeSchema', () => {
  it('accepts', () => {
    expect(
      FeaturedSubscriptionNodeSchema.parse({ type: 'featuredSubscription', subscriptionId: 's1' }).subscriptionId,
    ).toBe('s1');
  });
  it('rejects empty id', () => {
    expect(
      FeaturedSubscriptionNodeSchema.safeParse({ type: 'featuredSubscription', subscriptionId: '' }).success,
    ).toBe(false);
  });
});

describe('ContactFormNodeSchema', () => {
  it('accepts minimum', () => {
    expect(ContactFormNodeSchema.parse({ type: 'contactForm' }).type).toBe('contactForm');
  });
  it('accepts with fields', () => {
    const n = ContactFormNodeSchema.parse({
      type: 'contactForm',
      fields: [
        { name: 'email', label: 'Email', kind: 'email', required: true, placeholder: 'you@x' },
        { name: 'choice', label: 'Pick', kind: 'select', options: ['A', 'B'] },
      ],
      submitLabel: 'Send', successMessage: 'thanks',
    });
    expect(n.fields?.length).toBe(2);
  });
  it('rejects bad field kind', () => {
    expect(
      ContactFormNodeSchema.safeParse({
        type: 'contactForm', fields: [{ name: 'x', label: 'X', kind: 'password' }],
      }).success,
    ).toBe(false);
  });
  it('rejects empty fields array', () => {
    expect(ContactFormNodeSchema.safeParse({ type: 'contactForm', fields: [] }).success).toBe(false);
  });
  it('rejects > 12 fields', () => {
    const fields = Array(13).fill({ name: 'a', label: 'L', kind: 'text' });
    expect(ContactFormNodeSchema.safeParse({ type: 'contactForm', fields }).success).toBe(false);
  });
});

describe('CartNodeSchema', () => {
  it('accepts icon variant', () => {
    expect(CartNodeSchema.parse({ type: 'cart', variant: 'icon' }).variant).toBe('icon');
  });
  it('accepts page variant', () => {
    expect(CartNodeSchema.parse({ type: 'cart', variant: 'page' }).variant).toBe('page');
  });
  it('rejects bad variant', () => {
    expect(CartNodeSchema.safeParse({ type: 'cart', variant: 'drawer' }).success).toBe(false);
  });
  it('rejects missing variant', () => {
    expect(CartNodeSchema.safeParse({ type: 'cart' }).success).toBe(false);
  });
});

describe('SocialLinksNodeSchema', () => {
  it('accepts minimum', () => {
    expect(SocialLinksNodeSchema.parse({ type: 'socialLinks' }).type).toBe('socialLinks');
  });
  it('accepts full', () => {
    expect(
      SocialLinksNodeSchema.parse({ type: 'socialLinks', platforms: ['ig'], style: 'both' }).style,
    ).toBe('both');
  });
  it('rejects bad style', () => {
    expect(SocialLinksNodeSchema.safeParse({ type: 'socialLinks', style: 'big' }).success).toBe(false);
  });
  it('rejects > 12 platforms', () => {
    expect(
      SocialLinksNodeSchema.safeParse({ type: 'socialLinks', platforms: Array(13).fill('x') }).success,
    ).toBe(false);
  });
});

describe('NavLinksNodeSchema', () => {
  it('accepts minimum', () => {
    expect(NavLinksNodeSchema.parse({ type: 'navLinks' }).type).toBe('navLinks');
  });
  it('accepts full', () => {
    expect(
      NavLinksNodeSchema.parse({
        type: 'navLinks', order: 'manual', manualOrder: ['/a'], style: 'pill',
      }).style,
    ).toBe('pill');
  });
  it('rejects bad style', () => {
    expect(NavLinksNodeSchema.safeParse({ type: 'navLinks', style: 'square' }).success).toBe(false);
  });
});

describe('EventsListNodeSchema', () => {
  it('accepts minimum', () => {
    expect(EventsListNodeSchema.parse({ type: 'eventsList' }).type).toBe('eventsList');
  });
  it('accepts full', () => {
    const n = EventsListNodeSchema.parse({
      type: 'eventsList', count: 5, upcoming: false, layout: 'grid',
    });
    expect(n.layout).toBe('grid');
  });
  it('rejects bad layout', () => {
    expect(EventsListNodeSchema.safeParse({ type: 'eventsList', layout: 'masonry' }).success).toBe(false);
  });
  it('rejects count > 24', () => {
    expect(EventsListNodeSchema.safeParse({ type: 'eventsList', count: 25 }).success).toBe(false);
  });
});

describe('ContentNodeSchema discriminated union + CONTENT_NODE_TYPES', () => {
  it('parses each member type', () => {
    const samples: Array<{ type: string; [k: string]: unknown }> = [
      { type: 'text', role: 'body', content: 'x' },
      { type: 'image', brief: 'b', alt: 'a' },
      { type: 'button', label: 'L', href: '/x' },
      { type: 'wordmark', kind: 'text', content: 'C' },
      { type: 'video', assetUrl: 'https://e.com/v.mp4' },
      { type: 'divider' },
      { type: 'quote', body: 'b' },
      { type: 'productGrid' },
      { type: 'featuredProduct', productId: 'p' },
      { type: 'collectionGrid' },
      { type: 'featuredCollection', collectionSlug: 's' },
      { type: 'subscriptionGrid' },
      { type: 'featuredSubscription', subscriptionId: 's' },
      { type: 'contactForm' },
      { type: 'cart', variant: 'icon' },
      { type: 'socialLinks' },
      { type: 'navLinks' },
      { type: 'eventsList' },
    ];
    for (const s of samples) {
      const r = ContentNodeSchema.safeParse(s);
      expect(r.success, `failed for ${s.type}`).toBe(true);
    }
  });

  it('rejects unknown type', () => {
    expect(ContentNodeSchema.safeParse({ type: 'mystery' }).success).toBe(false);
  });

  it('CONTENT_NODE_TYPES contains all 18 type strings', () => {
    expect(CONTENT_NODE_TYPES).toHaveLength(18);
  });
});
