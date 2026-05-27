import { describe, it, expect } from 'vitest';
import { BLOCKS_MANIFEST } from '@/lib/blocks-manifest.generated';

// Mirrors the filter inside generate-page.ts. If that filter changes, update
// this constant to match — the assertions below pin the behavior of the home-page
// block pool, which is load-bearing for the AI's choices at generation time.
const homePool = BLOCKS_MANIFEST.filter(
  (b) => b.status === 'active' && b.pageTypes.includes('home'),
);

describe('home-page block pool (pageTypes filter)', () => {
  it('every block in the manifest declares pageTypes', () => {
    for (const b of BLOCKS_MANIFEST) {
      expect(b.pageTypes.length, `${b.key} has empty pageTypes`).toBeGreaterThan(0);
    }
  });

  it('system blocks (nav, footer) are excluded from the home pool', () => {
    const keys = homePool.map((b) => b.key);
    expect(keys).not.toContain('nav-split');
    expect(keys).not.toContain('footer-classic');
  });

  it('secondary-page blocks (shop grid, contact form, page intro) are excluded from the home pool', () => {
    const keys = homePool.map((b) => b.key);
    expect(keys).not.toContain('products-shop-grid');
    expect(keys).not.toContain('contact-form');
    expect(keys).not.toContain('page-intro');
  });

  it('collections-row IS available in the home pool (AI may pick it, runtime strips it if no real collections exist)', () => {
    const keys = homePool.map((b) => b.key);
    expect(keys).toContain('collections-row');
  });

  it('home pool contains at least one hero variant and one products variant', () => {
    const sectionTypes = homePool.map((b) => b.sectionType);
    expect(sectionTypes).toContain('hero');
    expect(sectionTypes).toContain('products');
  });

  it('every block in the home pool is status:active', () => {
    for (const b of homePool) {
      expect(b.status).toBe('active');
    }
  });

  it('nav-split and footer-classic are tagged as system', () => {
    const nav = BLOCKS_MANIFEST.find((b) => b.key === 'nav-split');
    const footer = BLOCKS_MANIFEST.find((b) => b.key === 'footer-classic');
    expect(nav?.pageTypes).toEqual(['system']);
    expect(footer?.pageTypes).toEqual(['system']);
  });

  it('products-shop-grid is tagged for the shop page only', () => {
    const shopGrid = BLOCKS_MANIFEST.find((b) => b.key === 'products-shop-grid');
    expect(shopGrid?.pageTypes).toEqual(['shop']);
  });

  it('contact-form is tagged for the contact page only', () => {
    const form = BLOCKS_MANIFEST.find((b) => b.key === 'contact-form');
    expect(form?.pageTypes).toEqual(['contact']);
  });
});
