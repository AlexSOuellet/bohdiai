import { describe, it, expect } from 'vitest';
import { EDITABLE_FIELDS, fieldsForSection, getFieldValue, setFieldValue } from './editable-fields';

const ENV = () => ({ root: { kind: 'archetype', content: {
  shopName: 'Aurora',
  moment: { eyebrow: 'Hand-poured', story: ['a', 'b'], brand: 'Aurora', ctaLabel: 'Shop' },
  goods: { title: 'The candles', viewAllLabel: 'See all' },
  reviews: { title: 'Kind words', label: 'Reviews', items: [{ quote: 'Lovely', author: 'Sam' }] },
  about: { heading: 'Our story', story: ['p1'] },
} } });

describe('editable-fields', () => {
  it('excludes what is not ours to rewrite: shop name, images, structure', () => {
    const ids = EDITABLE_FIELDS.map((f) => f.id);
    expect(ids).not.toContain('shopName');
    expect(ids).not.toContain('moment.brand');
    expect(ids.some((i) => i.includes('media') || i.includes('photo') || i.includes('logo'))).toBe(false);
  });
  it('includes the small generated labels', () => {
    const ids = EDITABLE_FIELDS.map((f) => f.id);
    expect(ids).toContain('goods.viewAllLabel');
    expect(ids).toContain('reviews.label');
  });
  it('reads text and lines by id', () => {
    expect(getFieldValue(ENV(), 'moment.eyebrow')).toBe('Hand-poured');
    expect(getFieldValue(ENV(), 'about.story')).toEqual(['p1']);
  });
  it('sets a field without mutating the input', () => {
    const env = ENV();
    const next = setFieldValue(env, 'moment.eyebrow', 'Made by hand');
    expect(getFieldValue(next, 'moment.eyebrow')).toBe('Made by hand');
    expect(getFieldValue(env, 'moment.eyebrow')).toBe('Hand-poured');
  });
  it('groups by section', () => {
    expect(fieldsForSection('hero').map((f) => f.id)).toContain('moment.story');
  });
});
