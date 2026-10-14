import { describe, it, expect } from 'vitest';
import {
  storefrontOrigin,
  abbreviateAreas,
  joinAreas,
  buildTenantMetadata,
  tenantBusinessJsonLd,
  tenantProductJsonLd,
  type PageSeo,
  type TenantSeoFacts,
} from './seo';
import { keyWords } from '@/lib/site-words/words';
import { SHOP_WORD_SPOTS, SHOP_WORDS_PREFIX, type ShopWords } from './words';

// Each spot says its own key; the templates are marked so a test sees exactly
// which word put the pieces together, with no real words in the test.
const K = keyWords(SHOP_WORD_SPOTS, SHOP_WORDS_PREFIX);
const W: ShopWords = {
  ...K,
  seo: {
    ...K.seo,
    pageTitle: '{page}/{shop}',
    titleNicheAreas: '{shop}|{niche}@{areas}',
    titleNiche: '{shop}|{niche}',
    titleAreas: '{shop}|{areas}',
    serving: 'x:{areas}',
    tailJoin: '_',
    sentence: '{text}#',
    descriptionJoin: '~',
  },
  areas: { listJoin: ';', pair: '{first}+{last}', listLast: '{list};+{last}', shortJoin: ',', shortLast: '{list}&{last}' },
};
const meta = (facts: TenantSeoFacts, page: PageSeo) => buildTenantMetadata(facts, page, W);
const businessLd = (facts: TenantSeoFacts) => tenantBusinessJsonLd(facts, W);

const SHERI: TenantSeoFacts = {
  shopName: 'Soul Splatter',
  subdomain: 'soul-splatter',
  tagline: 'Art that moves with you',
  serviceAreas: ['Rhode Island', 'Connecticut', 'Massachusetts'],
  seoTitle: 'Soul Splatter — Body Marbling in RI, CT & MA',
  seoDescription:
    'Art that moves with you — live body marbling for parties, festivals, and corporate events across Rhode Island, Connecticut, and Massachusetts.',
};

describe('storefrontOrigin', () => {
  it('builds the canonical apex-subdomain origin', () => {
    expect(storefrontOrigin('soul-splatter')).toBe('https://soul-splatter.bohdiai.com');
  });
  it('lowercases the subdomain', () => {
    expect(storefrontOrigin('Soul-Splatter')).toBe('https://soul-splatter.bohdiai.com');
  });
});

describe('abbreviateAreas', () => {
  it('maps US state names to postal abbreviations', () => {
    expect(abbreviateAreas(['Rhode Island', 'Connecticut', 'Massachusetts'], W.areas)).toBe('RI,CT&MA');
  });
  it('passes through values it does not recognize', () => {
    expect(abbreviateAreas(['Providence', 'Connecticut'], W.areas)).toBe('Providence&CT');
  });
  it('returns empty string for no areas', () => {
    expect(abbreviateAreas([], W.areas)).toBe('');
  });
});

describe('joinAreas', () => {
  it('uses full names with an Oxford and', () => {
    expect(joinAreas(['Rhode Island', 'Connecticut', 'Massachusetts'], W.areas)).toBe(
      'Rhode Island;Connecticut;+Massachusetts',
    );
  });
  it('joins two with a plain and', () => {
    expect(joinAreas(['Rhode Island', 'Connecticut'], W.areas)).toBe('Rhode Island+Connecticut');
  });
  it('returns a single area unchanged', () => {
    expect(joinAreas(['Rhode Island'], W.areas)).toBe('Rhode Island');
  });
});

describe('buildTenantMetadata — home', () => {
  const md = meta(SHERI, { path: '/' });

  it('uses the authored SEO title verbatim when present', () => {
    expect(md.title).toBe('Soul Splatter — Body Marbling in RI, CT & MA');
  });
  it('uses the authored SEO description', () => {
    expect(md.description).toBe(SHERI.seoDescription);
  });
  it('sets a canonical at the shop origin', () => {
    expect(md.alternates?.canonical).toBe('https://soul-splatter.bohdiai.com/');
  });
  it('sets Open Graph to the shop, not BohdiAI', () => {
    expect(md.openGraph?.siteName).toBe('Soul Splatter');
    expect(md.openGraph?.url).toBe('https://soul-splatter.bohdiai.com/');
  });
  it('indexes by default', () => {
    expect(md.robots).toMatchObject({ index: true, follow: true });
  });
});

describe('buildTenantMetadata — composed title (no authored override)', () => {
  it('composes shopName — niche in ABBREV when a niche + areas exist', () => {
    const md = meta(
      { shopName: 'Maple & Wick', subdomain: 'maple-wick', nicheLabel: 'Candles', serviceAreas: ['Vermont'] },
      { path: '/' },
    );
    expect(md.title).toBe('Maple & Wick|Candles@VT');
  });
  it('falls back to just the shop name when nothing else is known', () => {
    const md = meta({ shopName: 'Plain Co', subdomain: 'plain-co' }, { path: '/' });
    expect(md.title).toBe('Plain Co');
  });
  it('derives a description from the tagline + areas when none is authored', () => {
    const md = meta(
      { shopName: 'Maple & Wick', subdomain: 'maple-wick', tagline: 'Poured by hand', nicheLabel: 'Candles', serviceAreas: ['Vermont'] },
      { path: '/' },
    );
    expect(md.description).toContain('Poured by hand');
    expect(md.description).toContain('Vermont');
    expect(md.description).toBe('Poured by hand~Candles_x:Vermont#');
  });
});

describe('buildTenantMetadata — sub-pages', () => {
  it('titles a named sub-page under the shop', () => {
    const md = meta(SHERI, { path: '/about', titleSpot: 'about' });
    expect(md.title).toBe(`${K.pages.about}/Soul Splatter`);
    expect(md.alternates?.canonical).toBe('https://soul-splatter.bohdiai.com/about');
  });
  it('uses a page-specific description when given (product page)', () => {
    const md = meta(SHERI, {
      path: '/listings/festival-package',
      pageName: 'Festival Package',
      description: 'A full-day body marbling station for your festival.',
    });
    expect(md.title).toBe('Festival Package/Soul Splatter');
    expect(md.description).toBe('A full-day body marbling station for your festival.');
  });
  it('names a page by its content before its route spot', () => {
    const md = meta(SHERI, { path: '/collections/a', pageName: 'Spring', titleSpot: 'collection' });
    expect(md.title).toBe('Spring/Soul Splatter');
  });
  it('can mark a page noindex (cart/checkout)', () => {
    const md = meta(SHERI, { path: '/cart', titleSpot: 'cart', noindex: true });
    expect(md.robots).toMatchObject({ index: false });
  });
});

describe('tenantBusinessJsonLd', () => {
  it('is a LocalBusiness with areaServed when service areas exist', () => {
    const ld = businessLd(SHERI);
    expect(ld['@type']).toBe('LocalBusiness');
    expect(ld.name).toBe('Soul Splatter');
    expect(ld.url).toBe('https://soul-splatter.bohdiai.com');
    expect(ld.areaServed).toEqual(['Rhode Island', 'Connecticut', 'Massachusetts']);
  });
  it('is a Store (no areaServed) when there are no service areas', () => {
    const ld = businessLd({ shopName: 'Plain Co', subdomain: 'plain-co' });
    expect(ld['@type']).toBe('Store');
    expect(ld.areaServed).toBeUndefined();
  });
  it('includes contact + image when known', () => {
    const ld = businessLd({
      ...SHERI,
      phone: '+14013747008',
      contactEmail: 'soulsplatter444@gmail.com',
      imageUrl: 'https://x/y.png',
    });
    expect(ld.telephone).toBe('+14013747008');
    expect(ld.email).toBe('soulsplatter444@gmail.com');
    expect(ld.image).toBe('https://x/y.png');
  });
});

describe('tenantProductJsonLd', () => {
  it('builds a Product with an Offer and the shop as seller', () => {
    const ld = tenantProductJsonLd(SHERI, {
      name: 'Festival Package',
      slug: 'festival-package',
      description: 'A full-day station.',
      priceCents: 50000,
      imageUrl: 'https://x/p.png',
    });
    expect(ld['@type']).toBe('Product');
    expect(ld.name).toBe('Festival Package');
    expect(ld.image).toBe('https://x/p.png');
    expect(ld.offers).toMatchObject({
      '@type': 'Offer',
      price: '500.00',
      priceCurrency: 'USD',
      url: 'https://soul-splatter.bohdiai.com/listings/festival-package',
    });
    expect((ld.offers as { seller: { name: string } }).seller.name).toBe('Soul Splatter');
  });
});

describe('area helpers — edge cases', () => {
  it('abbreviates a single area on its own', () => {
    expect(abbreviateAreas([' texas '], W.areas)).toBe('TX');
  });
  it('drops blank entries', () => {
    expect(abbreviateAreas(['  ', 'Maine'], W.areas)).toBe('ME');
    expect(joinAreas(['', '  '], W.areas)).toBe('');
  });
});

describe('buildTenantMetadata — composition fallbacks', () => {
  it('titles with just the niche when there are no areas', () => {
    const md = meta({ shopName: 'Maple & Wick', subdomain: 'mw', nicheLabel: 'Candles' }, { path: '/' });
    expect(md.title).toBe('Maple & Wick|Candles');
    expect(md.description).toBe('Candles#');
  });

  it('titles with just the areas when there is no niche', () => {
    const md = meta(
      { shopName: 'Cut-Pro', subdomain: 'cut-pro', serviceAreas: ['Rhode Island'] },
      { path: '/' },
    );
    expect(md.title).toBe('Cut-Pro|RI');
    expect(md.description).toBe('X:Rhode Island#');
  });

  it('ignores a blank authored title and description', () => {
    const md = meta(
      { shopName: 'Plain Co', subdomain: 'plain-co', seoTitle: '   ', seoDescription: '  ', tagline: 'Made slow' },
      { path: '/' },
    );
    expect(md.title).toBe('Plain Co');
    expect(md.description).toBe('Made slow');
  });

  it('omits every description and uses a small twitter card when nothing is known', () => {
    const md = meta({ shopName: 'Plain Co', subdomain: 'plain-co' }, { path: '/' });
    expect('description' in md).toBe(false);
    expect(md.openGraph && 'description' in md.openGraph).toBe(false);
    expect(md.openGraph && 'images' in md.openGraph).toBe(false);
    expect(md.twitter).toEqual({ card: 'summary', title: 'Plain Co' });
  });

  it('uses a large twitter card and the shop image when one is known', () => {
    const md = meta({ ...SHERI, imageUrl: 'https://x/shop.png' }, { path: '/' });
    expect(md.twitter).toMatchObject({ card: 'summary_large_image', images: [{ url: 'https://x/shop.png' }] });
    expect(md.openGraph).toMatchObject({ images: [{ url: 'https://x/shop.png' }] });
  });

  it('prefers the page image over the shop image', () => {
    const md = meta(
      { ...SHERI, imageUrl: 'https://x/shop.png' },
      { path: '/listings/a', pageName: 'A', imageUrl: 'https://x/product.png' },
    );
    expect(md.openGraph).toMatchObject({ images: [{ url: 'https://x/product.png' }] });
  });

  it('falls back to the shop description when the page description is blank', () => {
    const md = meta(SHERI, { path: '/about', titleSpot: 'about', description: '   ' });
    expect(md.description).toBe(SHERI.seoDescription);
  });

  it('titles an unnamed sub-page with just the shop name', () => {
    const md = meta(SHERI, { path: '/somewhere' });
    expect(md.title).toBe('Soul Splatter');
  });
});

describe('tenantBusinessJsonLd — sparse facts', () => {
  it('leaves out description, image and contact when none are known', () => {
    const ld = businessLd({ shopName: 'Plain Co', subdomain: 'plain-co' });
    expect(ld).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Store',
      name: 'Plain Co',
      url: 'https://plain-co.bohdiai.com',
    });
  });
});

describe('tenantProductJsonLd — options', () => {
  it('marks out-of-stock, honors the currency, and leaves out blank description / missing image', () => {
    const ld = tenantProductJsonLd(SHERI, {
      name: 'Gift Card',
      slug: 'gift-card',
      description: '   ',
      priceCents: 2550,
      currency: 'CAD',
      inStock: false,
    });
    expect(ld.offers.priceCurrency).toBe('CAD');
    expect(ld.offers.price).toBe('25.50');
    expect(ld.offers.availability).toBe('https://schema.org/OutOfStock');
    expect('description' in ld).toBe(false);
    expect('image' in ld).toBe(false);
  });

  it('is in stock by default and trims the description', () => {
    const ld = tenantProductJsonLd(SHERI, { name: 'A', slug: 'a', description: '  Nice  ', priceCents: 100, inStock: true });
    expect(ld.offers.availability).toBe('https://schema.org/InStock');
    expect(ld.description).toBe('Nice');
  });
});
