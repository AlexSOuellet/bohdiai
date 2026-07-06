import { describe, it, expect } from 'vitest';
import { MainStreetContentSchema } from './schemas';

function valid() {
  return {
    shopName: "June's Sourdough",
    identity: { wordmark: "June's Sourdough", nav: ['Shop', 'About', 'Find us'] },
    moment: {
      media: {
        kind: 'video',
        prompt: {
          composition: 'tight overhead on a single cracked sourdough loaf',
          subject: 'steam rising slowly off the crust',
          environment: 'a warm flour-dusted kitchen bench',
          atmosphere: 'quiet and unhurried',
          camera: 'locked off, shallow depth of field',
          lighting: 'soft low golden window light',
          style: 'photographic, warm, filmic grain',
        },
        alt: 'A loaf cooling',
      },
      story: ['It starts the night before', 'Folded by hand and left to rise slow', 'Pulled from the oven at first light'],
      eyebrow: 'Baked fresh every morning',
      brand: "June's Sourdough",
      ctaLabel: 'See the loaves',
    },
    goods: { title: 'Pulled from the oven this morning' },
    founder: {
      quote: 'I started with one cast-iron oven and a starter named Frank, and fourteen years on he still does most of the work',
      attribution: 'June Carter, founder and baker',
      photo: { prompt: 'A baker holding a loaf in a warm kitchen', alt: 'June in her kitchen' },
      findUs: {
        label: 'Find us this week',
        rows: [
          { day: 'Wed', where: 'Riverside Farmers Market', time: '8-1' },
          { day: 'Sat', where: 'Downtown Makers Market', time: '9-2' },
        ],
      },
    },
    close: { label: 'Come say hello', headline: 'Warm bread is on Main Street by seven', ctaLabel: 'Order for pickup' },
  };
}

describe('MainStreetContentSchema', () => {
  it('accepts a complete valid store', () => {
    expect(MainStreetContentSchema.safeParse(valid()).success).toBe(true);
  });

  it('accepts a store with findUs omitted', () => {
    const c = valid();
    delete (c.founder as Record<string, unknown>)['findUs'];
    expect(MainStreetContentSchema.safeParse(c).success).toBe(true);
  });

  it('requires at least one story line (a single line is valid — spotlight taglines)', () => {
    // one line is valid now (spotlight Moment lands a single tagline)
    const cOne = valid();
    cOne.moment.story = ['only one'];
    expect(MainStreetContentSchema.safeParse(cOne).success).toBe(true);
    // zero lines is never valid
    const cZero = valid();
    cZero.moment.story = [];
    expect(MainStreetContentSchema.safeParse(cZero).success).toBe(false);
  });

  it('accepts a long story line — no length cap, never fails the build (D53 sharpened)', () => {
    const c = valid();
    c.moment.story = ['x'.repeat(60), 'ok line'];
    expect(MainStreetContentSchema.safeParse(c).success).toBe(true);
  });

  it('accepts five or more story lines — no array cap; the renderer absorbs whatever was authored', () => {
    const c = valid();
    c.moment.story = ['line one', 'line two', 'line three', 'line four', 'line five'];
    expect(MainStreetContentSchema.safeParse(c).success).toBe(true);
  });

  it('accepts punctuation in a story line — the schema is permissive; the Copywriter normalize step strips bad characters at parse time, the build never fails on copy', () => {
    const c = valid();
    c.moment.story = ['Flour. Water. Salt. Time.', 'No shortcuts'];
    expect(MainStreetContentSchema.safeParse(c).success).toBe(true);
  });

  it('accepts commas in a story line at the schema layer — normalize-copy strips them before render', () => {
    const c = valid();
    c.moment.story = ['Made in small batches, every week', 'Real bread for real people'];
    expect(MainStreetContentSchema.safeParse(c).success).toBe(true);
  });

  it('allows apostrophes and intra-word hyphens in story lines', () => {
    const c = valid();
    c.moment.story = ["don't rush it", 'cut from full-grain hides'];
    expect(MainStreetContentSchema.safeParse(c).success).toBe(true);
  });

  it('rejects a hero media prompt authored as a bare string', () => {
    const c = valid();
    (c.moment as Record<string, unknown>)['media'] = { kind: 'video', prompt: 'steam rising off the crust, slow', alt: 'a loaf' };
    expect(MainStreetContentSchema.safeParse(c).success).toBe(false);
  });

  it('accepts a long alt on the hero media and founder photo — alt is non-structural copy and never fails the build (D53)', () => {
    const c = valid();
    c.moment.media.alt = 'A loaf cooling on a flour-dusted bench in the soft golden light of an unhurried morning '.repeat(4); // ~360 chars, well past the old 240 cap
    c.founder.photo.alt = 'June at her bench, hands deep in dough, the work of fourteen years in every fold '.repeat(4);
    expect(MainStreetContentSchema.safeParse(c).success).toBe(true);
  });

  it('accepts a still hero (kind still) with a structured scene', () => {
    const c = valid();
    (c.moment.media as Record<string, unknown>)['kind'] = 'still';
    expect(MainStreetContentSchema.safeParse(c).success).toBe(true);
  });

  it('accepts a Bohdi-authored goods treatment', () => {
    const c = valid();
    (c.goods as Record<string, unknown>)['treatment'] = 'marquee';
    expect(MainStreetContentSchema.safeParse(c).success).toBe(true);
  });

  it('silently drops an unknown goods treatment field — section variants come from the family, not content', () => {
    const c = valid();
    (c.goods as Record<string, unknown>)['treatment'] = 'mosaic';
    const parsed = MainStreetContentSchema.safeParse(c);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect((parsed.data.goods as Record<string, unknown>)['treatment']).toBeUndefined();
    }
  });

  it('accepts a single nav item (the renderer requires at least one entry)', () => {
    const c = valid();
    c.identity.nav = ['Shop'];
    expect(MainStreetContentSchema.safeParse(c).success).toBe(true);
  });

  it('accepts a long close headline — no length cap, the renderer absorbs any length', () => {
    const c = valid();
    c.close.headline = 'x'.repeat(80);
    expect(MainStreetContentSchema.safeParse(c).success).toBe(true);
  });

  it('carries a shared hero sub-line — the plain supporting sentence non-Story heroes use (the pile, not Story fading lines)', () => {
    const c = valid();
    (c.moment as Record<string, unknown>)['sub'] = 'Hand-poured in small batches and shipped the day they cure';
    const parsed = MainStreetContentSchema.safeParse(c);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.moment.sub).toBe('Hand-poured in small batches and shipped the day they cure');
    }
  });

  it('still accepts a hero with no sub-line (legacy content authored before the shared sub)', () => {
    const c = valid();
    expect('sub' in c.moment).toBe(false);
    expect(MainStreetContentSchema.safeParse(c).success).toBe(true);
  });

  it('carries the Collage shots — three still scenes the Collage hero shows (the pile ingredient that hero needs)', () => {
    const c = valid();
    const shot = (subject: string) => ({
      prompt: { composition: 'a', subject, environment: 'c', atmosphere: 'd', camera: 'e', lighting: 'f', style: 'g' },
      url: 'https://cdn.example.com/x.jpg',
      alt: subject,
    });
    (c.moment as Record<string, unknown>)['collageShots'] = [shot('one'), shot('two'), shot('three')];
    const parsed = MainStreetContentSchema.safeParse(c);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.moment.collageShots).toHaveLength(3);
  });

  it('accepts a collage shot with no resolved url yet (authored before generation runs)', () => {
    const c = valid();
    (c.moment as Record<string, unknown>)['collageShots'] = [
      { prompt: { composition: 'a', subject: 'b', environment: 'c', atmosphere: 'd', camera: 'e', lighting: 'f', style: 'g' }, alt: 'a shot' },
    ];
    expect(MainStreetContentSchema.safeParse(c).success).toBe(true);
  });

  it('still accepts a hero with no collage shots (every other hero ignores them)', () => {
    const c = valid();
    expect('collageShots' in c.moment).toBe(false);
    expect(MainStreetContentSchema.safeParse(c).success).toBe(true);
  });
});

describe('authored link destinations (D46)', () => {
  it('accepts nav items authored as { label, target } pairs', () => {
    const c = valid();
    (c.identity as Record<string, unknown>)['nav'] = [
      { label: 'Breads', target: 'shop' },
      { label: 'Our story', target: 'about' },
      { label: 'Find us', target: 'events' },
    ];
    expect(MainStreetContentSchema.safeParse(c).success).toBe(true);
  });

  it('still accepts legacy string nav (old stored rows)', () => {
    // valid() already uses string nav; assert it explicitly here.
    const c = valid();
    c.identity.nav = ['Shop', 'About'];
    expect(MainStreetContentSchema.safeParse(c).success).toBe(true);
  });

  it('rejects a nav item whose target is not a real page', () => {
    const c = valid();
    (c.identity as Record<string, unknown>)['nav'] = [
      { label: 'Blog', target: 'blog' },
      { label: 'Shop', target: 'shop' },
    ];
    expect(MainStreetContentSchema.safeParse(c).success).toBe(false);
  });

  it('accepts authored hero CTA targets', () => {
    const c = valid();
    Object.assign(c.moment, { ctaTarget: 'shop', secondaryCtaLabel: 'Our story', secondaryCtaTarget: 'about' });
    expect(MainStreetContentSchema.safeParse(c).success).toBe(true);
  });

  it('rejects an unknown hero CTA target', () => {
    const c = valid();
    (c.moment as Record<string, unknown>)['ctaTarget'] = 'newsletter';
    expect(MainStreetContentSchema.safeParse(c).success).toBe(false);
  });

  it('accepts an authored close CTA target', () => {
    const c = valid();
    (c.close as Record<string, unknown>)['ctaTarget'] = 'shop';
    expect(MainStreetContentSchema.safeParse(c).success).toBe(true);
  });

  it('still accepts a close with no CTA target (legacy rows)', () => {
    expect(MainStreetContentSchema.safeParse(valid()).success).toBe(true);
  });
});

describe('founder — About treatment + card fields', () => {
  it('accepts an authored About treatment and optional eyebrow/heading', () => {
    const c = valid();
    Object.assign(c.founder, { treatment: 'card', eyebrow: 'Since 2019', heading: 'Meet June' });
    expect(MainStreetContentSchema.safeParse(c).success).toBe(true);
  });

  it('still accepts a founder with no treatment (treatment optional)', () => {
    expect(MainStreetContentSchema.safeParse(valid()).success).toBe(true);
  });

  it('silently drops an unknown About treatment field — section variants come from the family, not content', () => {
    const c = valid();
    (c.founder as Record<string, unknown>)['treatment'] = 'findus';
    const parsed = MainStreetContentSchema.safeParse(c);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect((parsed.data.founder as Record<string, unknown>)['treatment']).toBeUndefined();
    }
  });
});
