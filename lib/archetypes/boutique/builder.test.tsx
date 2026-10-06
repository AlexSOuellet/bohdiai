import { describe, it, expect, vi } from 'vitest';
import { isValidElement } from 'react';

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NOT_FOUND');
  },
}));
vi.mock('@/lib/supabase', () => ({ supabaseAdmin: () => ({}) }));

const { BOUTIQUE_SPEC } = await import('./builder');
const { archetypeSpec, archetypeMenu } = await import('../registry');

const product = {
  slug: 'theo',
  name: 'Theo',
  price: '$120',
  description: '',
  status: 'active' as const,
  media: [],
  variations: [],
};

describe('boutique build spec', () => {
  it('is registered, hand-built, off Bohdi’s menu, and shows a catalog with a nursery page', () => {
    expect(archetypeSpec('boutique')).toBe(BOUTIQUE_SPEC);
    expect(archetypeMenu()).not.toContain(BOUTIQUE_SPEC);
    expect(BOUTIQUE_SPEC.usesCatalog).toBe(true);
    expect(BOUTIQUE_SPEC.pages).toEqual(['shop']);
    expect(BOUTIQUE_SPEC.fitsCatalog(40)).toBe(true);
    expect(BOUTIQUE_SPEC.mediaJobs({ design: 'nursery' })).toEqual([]);
    expect(BOUTIQUE_SPEC.applyMedia({ design: 'nursery' }, {})).toEqual({ design: 'nursery' });
    expect(BOUTIQUE_SPEC.toPayload({ design: 'nursery' })).toEqual({
      content: { design: 'nursery' },
      products: [],
    });
  });

  it('accepts only a known design', () => {
    expect(BOUTIQUE_SPEC.parseSubmission({ design: 'nursery' })).toEqual({
      ok: true,
      authored: { design: 'nursery' },
    });
    const bad = BOUTIQUE_SPEC.parseSubmission({ design: 'castle' });
    expect(bad.ok).toBe(false);
  });

  it('paints the home, the nursery page, a certificate and a plain page for a known shop', () => {
    const args = {
      content: { design: 'nursery' },
      lookKey: 'boutique',
      products: [product],
      tenantId: 't1',
    };
    expect(isValidElement(BOUTIQUE_SPEC.render(args))).toBe(true);
    expect(isValidElement(BOUTIQUE_SPEC.render({ ...args, page: 'shop' }))).toBe(true);
    expect(
      isValidElement(
        BOUTIQUE_SPEC.renderProduct?.({
          content: { design: 'nursery' },
          lookKey: 'boutique',
          product,
          tenantId: 't1',
        }),
      ),
    ).toBe(true);
    expect(
      isValidElement(
        BOUTIQUE_SPEC.renderContentPage?.({
          content: { design: 'nursery' },
          lookKey: 'boutique',
          title: 'Terms',
          tenantId: 't1',
        }),
      ),
    ).toBe(true);
  });

  it('is a missing page when the envelope is malformed or the shop is unknown', () => {
    expect(() =>
      BOUTIQUE_SPEC.render({ content: {}, lookKey: 'boutique', products: [], tenantId: 't1' }),
    ).toThrow('NOT_FOUND');
    expect(() =>
      BOUTIQUE_SPEC.render({ content: { design: 'nursery' }, lookKey: 'boutique', products: [] }),
    ).toThrow('NOT_FOUND');
    expect(() =>
      BOUTIQUE_SPEC.renderProduct?.({
        content: { design: 'nursery' },
        lookKey: 'boutique',
        product,
      }),
    ).toThrow('NOT_FOUND');
    expect(() =>
      BOUTIQUE_SPEC.renderContentPage?.({ content: { design: 'nursery' }, lookKey: 'boutique' }),
    ).toThrow('NOT_FOUND');
  });
});
