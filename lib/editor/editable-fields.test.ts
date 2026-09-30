import { describe, it, expect } from 'vitest';
import { EDITABLE_FIELDS, fieldsForSection, getField, getFieldValue, setFieldValue } from './editable-fields';

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

describe('editable-fields — lookup edges', () => {
  it('getField returns undefined for an id that is not in the registry', () => {
    expect(getField('shopName')).toBeUndefined();
  });

  it('getFieldValue is undefined for an unknown id', () => {
    expect(getFieldValue(ENV(), 'moment.brand')).toBeUndefined();
  });

  it('getFieldValue is undefined when the envelope has no root/content, or the path runs into a non-object', () => {
    expect(getFieldValue({}, 'moment.eyebrow')).toBeUndefined();
    expect(getFieldValue({ root: null }, 'moment.eyebrow')).toBeUndefined();
    expect(getFieldValue({ root: { content: { moment: 'flat string' } } }, 'moment.eyebrow')).toBeUndefined();
    // A missing intermediate section also resolves to undefined, never throws.
    expect(getFieldValue(ENV(), 'findUs.rows')).toBeUndefined();
  });

  it('reads a field whose path is nested deeper than its id (find-us rows live under founder)', () => {
    const rows = [{ where: 'Market', day: 'Sat' }];
    expect(getFieldValue({ root: { content: { founder: { findUs: { rows } } } } }, 'findUs.rows')).toEqual(rows);
  });
});

describe('editable-fields — setFieldValue builds missing structure', () => {
  it('returns an unchanged clone for an unknown id', () => {
    const env = ENV();
    const next = setFieldValue(env, 'shopName', 'Hijacked');
    expect(next).toEqual(env);
    expect(next).not.toBe(env);
  });

  it('creates root and content when the envelope has neither', () => {
    const next = setFieldValue({} as Record<string, unknown>, 'moment.eyebrow', 'Hi');
    expect(next).toEqual({ root: { content: { moment: { eyebrow: 'Hi' } } } });
  });

  it('creates content under an existing root that lacks it', () => {
    const next = setFieldValue({ root: { kind: 'archetype' } }, 'close.headline', 'Come by');
    expect(next).toEqual({ root: { kind: 'archetype', content: { close: { headline: 'Come by' } } } });
  });

  it('creates every missing intermediate object for a deep path, replacing a non-object in the way', () => {
    const env = { root: { content: { founder: { quote: 'q', findUs: 'junk' } } } };
    const rows = [{ where: 'Market' }];
    const next = setFieldValue(env, 'findUs.rows', rows);
    expect(next).toEqual({ root: { content: { founder: { quote: 'q', findUs: { rows } } } } });
    // input untouched
    expect(env.root.content.founder.findUs).toBe('junk');
  });
});
