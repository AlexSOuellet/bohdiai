import { describe, it, expect } from 'vitest';
import { FAQ_GROUPS, TOP_QUESTIONS, faqItem, faqJsonLd, allFaqItems, faqGroupsFor } from './faq';

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

  it('points each page at three or four real questions of its own, Free first for makers', () => {
    for (const [audience, ids] of Object.entries(TOP_QUESTIONS)) {
      expect(ids.length).toBeGreaterThanOrEqual(3);
      expect(ids.length).toBeLessThanOrEqual(4);
      for (const id of ids) expect([undefined, audience]).toContain(faqItem(id).audience);
    }
    expect(TOP_QUESTIONS.maker[0]).toBe('what-is-free');
  });

  it('shows makers only their own and the shared answers, and keeps the service ones apart (Session 117)', () => {
    const maker = faqGroupsFor('maker').flatMap((g) => g.items);
    expect(maker.every((i) => i.audience !== 'contractor')).toBe(true);
    expect(maker.map((i) => [i.q, ...i.a]).flat().join(' ')).not.toMatch(/contractor|service business|small crews|Sheri|Chris/i);
    expect(faqGroupsFor('maker').map((g) => g.title)).not.toContain('For contractors');
    expect(faqGroupsFor('contractor').flatMap((g) => g.items).map((i) => i.id)).toContain('pay-for-leads');
  });

  it('says what Free gives and that it costs nothing, without promising a site', () => {
    const free = [...faqItem('what-is-free').a, ...faqItem('free-catch').a].join(' ');
    expect(free).toMatch(/costs you to make/);
    expect(free).toMatch(/30 a month/);
    expect(free).toMatch(/No card/);
    expect(free).toMatch(/Free has no website/);
  });

  it('takes its prices from the plans, and names the build time and custom work', () => {
    const text = allFaqItems()
      .flatMap((i) => i.a)
      .join(' ');
    expect(text).toContain('starting at $10 a month');
    expect(text).toContain('starting at $5 a month, from the day you sign up');
    expect(faqItem('when-billing-starts').a[0]).toMatch(/Free never bills you/);
    expect(faqItem('when-billing-starts').a[0]).toMatch(/pay from the day you sign up/);
    expect(text).toContain('2 to 5 days');
    expect(faqItem('custom').a.join(' ')).toMatch(/quote/i);
  });

  it('offers Showcase, never Maker Market, when a maker cancels, and only as a choice', () => {
    const cancel = faqItem('cancel').a.join(' ');
    expect(cancel).toMatch(/move to Showcase/);
    expect(cancel).not.toMatch(/Maker Market/);
    expect(cancel).toMatch(/never automatic/);
  });

  it('describes the maker path as the form and Publish, not a hand build (Session 108)', () => {
    const how = faqItem('how-it-works').a;
    expect(how[0]).toMatch(/fill in the short form/);
    expect(how[0]).toMatch(/Publish/);
    expect(how[0]).not.toMatch(/I build/);
    expect(faqItem('cheap-not-good').a.join(' ')).not.toMatch(/designed and built by me/);
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
    expect(ld.mainEntity).toHaveLength(faqGroupsFor('maker').flatMap((g) => g.items).length);
    expect(ld.mainEntity[0]).toMatchObject({ '@type': 'Question', acceptedAnswer: { '@type': 'Answer' } });
  });

  it('throws for an unknown question', () => {
    expect(() => faqItem('nope')).toThrow();
  });
});
