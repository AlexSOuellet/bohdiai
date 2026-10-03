import { describe, it, expect } from 'vitest';
import { FAQ_GROUPS, TOP_QUESTIONS, faqItem, faqJsonLd, allFaqItems } from './faq';

describe('faq', () => {
  it('leads with why the prices are so low', () => {
    expect(FAQ_GROUPS[0]?.items[0]?.id).toBe('why-so-low');
  });

  it('gives every group questions and every question an answer', () => {
    for (const g of FAQ_GROUPS) {
      expect(g.title).not.toBe('');
      expect(g.items.length).toBeGreaterThan(0);
      for (const item of g.items) {
        expect(item.q).not.toBe('');
        expect(item.a.length).toBeGreaterThan(0);
        for (const p of item.a) expect(p.trim()).not.toBe('');
      }
    }
  });

  it('uses each id once', () => {
    const ids = allFaqItems().map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('points each pricing page at three real questions', () => {
    for (const ids of Object.values(TOP_QUESTIONS)) {
      expect(ids).toHaveLength(3);
      for (const id of ids) expect(faqItem(id).id).toBe(id);
    }
  });

  it('takes its prices from the plans, and names the build time and custom work', () => {
    const text = allFaqItems()
      .flatMap((i) => i.a)
      .join(' ');
    expect(text).toContain('$5 a month for makers and $15 for contractors');
    expect(text).toContain('2 to 5 days');
    expect(faqItem('custom').a.join(' ')).toMatch(/quote/i);
  });

  it('tells the name story in the price answer', () => {
    expect(faqItem('why-so-low').a.join(' ')).toMatch(/Bodhi means awakening/);
    expect(faqItem('why-so-low').a.join(' ')).toMatch(/all of us are enriched/);
  });

  it('never talks about AI', () => {
    const text = allFaqItems()
      .flatMap((i) => [i.q, ...i.a])
      .join(' ')
      .replace(/BohdiAI/g, '');
    expect(text).not.toMatch(/\bAI\b|artificial intelligence/i);
  });

  it('describes every question for search engines', () => {
    const ld = faqJsonLd();
    expect(ld['@type']).toBe('FAQPage');
    expect(ld.mainEntity).toHaveLength(allFaqItems().length);
    expect(ld.mainEntity[0]).toMatchObject({ '@type': 'Question', acceptedAnswer: { '@type': 'Answer' } });
  });

  it('throws for an unknown question', () => {
    expect(() => faqItem('nope')).toThrow();
  });
});
