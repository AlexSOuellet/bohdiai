import { describe, it, expect } from 'vitest';
import {
  storefrontOrigin,
  abbreviateAreas,
  joinAreas,
  buildTenantMetadata,
  tenantBusinessJsonLd,
  tenantProductJsonLd,
  type TenantSeoFacts,
} from './seo';

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
    expect(abbreviateAreas(['Rhode Island', 'Connecticut', 'Massachusetts'])).toBe('RI, CT & MA');
  });
  it('passes through values it does not recognize', () => {
    expect(abbreviateAreas(['Providence', 'Connecticut'])).toBe('Providence & CT');
  });
  it('returns empty string for no areas', () => {
    expect(abbreviateAreas([])).toBe('');
  });
});

describe('joinAreas', () => {
  it('uses full names with an Oxford and', () => {
    expect(joinAreas(['Rhode Island', 'Connecticut', 'Massachusetts'])).toBe(
      'Rhode Island, Connecticut, and Massachusetts',
    );
  });
  it('joins two with a plain and', () => {
    expect(joinAreas(['Rhode Island', 'Connecticut'])).toBe('Rhode Island and Connecticut');
  });
  it('returns a single area unchanged', () => {
    expect(joinAreas(['Rhode Island'])).toBe('Rhode Island');
  });
});

describe('buildTenantMetadata — home', () => {
  const md = buildTenantMetadata(SHERI, { path: '/' });

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
    const md = buildTenantMetadata(
      { shopName: 'Maple & Wick', subdomain: 'maple-wick', nicheLabel: 'Candles', serviceAreas: ['Vermont'] },
      { path: '/' },
    );
    expect(md.title).toBe('Maple & Wick — Candles in VT');
  });
  it('falls back to just the shop name when nothing else is known', () => {
    const md = buildTenantMetadata({ shopName: 'Plain Co', subdomain: 'plain-co' }, { path: '/' });
    expect(md.title).toBe('Plain Co');
  });
  it('derives a description from the tagline + areas when none is authored', () => {
    const md = buildTenantMetadata(
      { shopName: 'Maple & Wick', subdomain: 'maple-wick', tagline: 'Poured by hand', nicheLabel: 'Candles', serviceAreas: ['Vermont'] },
      { path: '/' },
    );
    expect(md.description).toContain('Poured by hand');
    expect(md.description).toContain('Vermont');
  });
});

describe('buildTenantMetadata — sub-pages', () => {
  it('titles a named sub-page under the shop', () => {
    const md = buildTenantMetadata(SHERI, { path: '/about', pageName: 'About' });
    expect(md.title).toBe('About — Soul Splatter');
    expect(md.alternates?.canonical).toBe('https://soul-splatter.bohdiai.com/about');
  });
  it('uses a page-specific description when given (product page)', () => {
    const md = buildTenantMetadata(SHERI, {
      path: '/listings/festival-package',
      pageName: 'Festival Package',
      description: 'A full-day body marbling station for your festival.',
    });
    expect(md.title).toBe('Festival Package — Soul Splatter');
    expect(md.description).toBe('A full-day body marbling station for your festival.');
  });
  it('can mark a page noindex (cart/checkout)', () => {
    const md = buildTenantMetadata(SHERI, { path: '/cart', pageName: 'Cart', noindex: true });
    expect(md.robots).toMatchObject({ index: false });
  });
});

describe('tenantBusinessJsonLd', () => {
  it('is a LocalBusiness with areaServed when service areas exist', () => {
    const ld = tenantBusinessJsonLd(SHERI);
    expect(ld['@type']).toBe('LocalBusiness');
    expect(ld.name).toBe('Soul Splatter');
    expect(ld.url).toBe('https://soul-splatter.bohdiai.com');
    expect(ld.areaServed).toEqual(['Rhode Island', 'Connecticut', 'Massachusetts']);
  });
  it('is a Store (no areaServed) when there are no service areas', () => {
    const ld = tenantBusinessJsonLd({ shopName: 'Plain Co', subdomain: 'plain-co' });
    expect(ld['@type']).toBe('Store');
    expect(ld.areaServed).toBeUndefined();
  });
  it('includes contact + image when known', () => {
    const ld = tenantBusinessJsonLd({
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
