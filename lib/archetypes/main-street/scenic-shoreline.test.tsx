import { describe, it, expect } from 'vitest';
import { isValidElement } from 'react';
import { MAIN_STREET_SPEC } from './builder';

/** Scenic is drawn by the shoreline design (Alex, 2026-10-21): every page of a Scenic site goes to it. */
describe('the Scenic mood draws with the shoreline design', () => {
  const base = { content: {}, lookKey: 'main-street-saltmarsh', mood: 'scenic', tenantId: 't1', products: [], catalogSize: 0 } as never;
  it('sends every page through it', () => {
    const el = MAIN_STREET_SPEC.render(base);
    expect(isValidElement(el)).toBe(true);
    expect((el as { type: { name: string } }).type.name).toBe('ScenicLook');
    for (const r of [
      MAIN_STREET_SPEC.renderProduct?.({ ...(base as object), product: { slug: 'x' } } as never),
      MAIN_STREET_SPEC.renderCart?.({ ...(base as object), cart: { lines: [] } } as never),
      MAIN_STREET_SPEC.renderMarket?.({ ...(base as object), market: {} } as never),
      MAIN_STREET_SPEC.renderContentPage?.({ ...(base as object), title: 'Privacy' } as never),
    ])
      expect((r as { type: { name: string } }).type.name).toBe('ScenicLook');
  });
  it('leaves the other moods as they are', () => {
    const el = MAIN_STREET_SPEC.render({ ...(base as object), mood: 'cozy', lookKey: 'main-street-ember' } as never);
    expect((el as { type: { name: string } }).type.name).not.toBe('ScenicLook');
  });
});
