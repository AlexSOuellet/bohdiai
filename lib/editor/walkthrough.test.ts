import { describe, it, expect } from 'vitest';
import { WALKTHROUGH_STEPS, walkUiSteps, placeholderSections, walkthroughProgress, walkComplete, sectionClass, sectionResolved } from './walkthrough';
import { markSectionMade, markSectionKept, setSectionHidden } from './section-state';
import { EDITABLE_FIELDS } from './editable-fields';

const IDS = new Set(EDITABLE_FIELDS.map((f) => f.id));
const ENV = (madeYours: string[] = [], hidden: string[] = []) => ({
  root: { kind: 'archetype', content: { madeYours, hiddenSections: hidden } },
});

describe('walkthrough', () => {
  it('runs finishable-first, then the tail in dependency order (…goods → collections → marquee)', () => {
    expect(WALKTHROUGH_STEPS[0]!.section).toBe('hero');
    // The row/build-dependent sections are the tail, in dependency order.
    const tail = WALKTHROUGH_STEPS.slice(-5).map((s) => s.section);
    expect(tail).toEqual(['reviews', 'findUs', 'goods', 'collections', 'marquee']);
    const order = WALKTHROUGH_STEPS.map((s) => s.section);
    // Collections groups the products, so it follows goods.
    expect(order.indexOf('collections')).toBeGreaterThan(order.indexOf('goods'));
    // The scrolling line is built from the maker's events + collections, so it's last.
    expect(order.indexOf('marquee')).toBeGreaterThan(order.indexOf('findUs'));
    expect(order.indexOf('marquee')).toBeGreaterThan(order.indexOf('collections'));
  });

  it('every step field id is a real editable text field, and the testimonial items are excluded', () => {
    for (const s of WALKTHROUGH_STEPS) {
      for (const id of s.fieldIds) expect(IDS.has(id)).toBe(true);
    }
    // Testimonials are real-or-off (D68), never Bohdi-written — not in the reviews step.
    const reviews = WALKTHROUGH_STEPS.find((s) => s.section === 'reviews')!;
    expect(reviews.fieldIds).not.toContain('reviews.items');
  });

  it('the story step is personal and carries the targeted questions; it is the only personal step', () => {
    const story = WALKTHROUGH_STEPS.find((s) => s.section === 'founder')!;
    expect(story.personal).toBe(true);
    expect(story.questions?.length ?? 0).toBeGreaterThan(1);
    // it gathers both the founder beat and the full About page
    expect(story.fieldIds).toContain('founder.quote');
    expect(story.fieldIds).toContain('about.story');
    expect(WALKTHROUGH_STEPS.filter((s) => s.personal).length).toBe(1);
  });

  it('walkUiSteps keeps one hero step for a non-Moment feeling, holding every hero field', () => {
    const steps = walkUiSteps('rustic');
    const hero = steps.filter((s) => s.section === 'hero');
    expect(hero).toHaveLength(1);
    expect(hero[0]!.fieldIds).toContain('moment.story');
    expect(hero[0]!.fieldIds).toContain('moment.ctaLabel');
    expect(steps.some((s) => s.isMoment)).toBe(false);
  });

  it('walkUiSteps splits the hero into a Moment step then a Hero step for the Cozy feeling', () => {
    const steps = walkUiSteps('cozy');
    const momentIdx = steps.findIndex((s) => s.isMoment);
    expect(momentIdx).toBeGreaterThanOrEqual(0);
    const moment = steps[momentIdx]!;
    const hero = steps[momentIdx + 1]!;
    expect(moment.section).toBe('hero');
    expect(moment.fieldIds).toEqual(['moment.story']);
    expect(hero.section).toBe('hero');
    expect(hero.isMoment).toBeFalsy();
    expect(hero.fieldIds).toContain('moment.ctaLabel');
    expect(hero.fieldIds).not.toContain('moment.story');
  });

  it('walkUiSteps adds exactly one step for Cozy versus a non-Moment feeling', () => {
    expect(walkUiSteps('cozy').length).toBe(walkUiSteps('rustic').length + 1);
  });

  it('walkUiSteps falls back to Cozy behaviour for a missing feeling (matches the renderer)', () => {
    expect(walkUiSteps(null).some((s) => s.isMoment)).toBe(true);
  });

  it('walkUiSteps orders the Moment step before the Hero step, both before the story step', () => {
    const steps = walkUiSteps('cozy');
    const momentIdx = steps.findIndex((s) => s.isMoment);
    const heroIdx = steps.findIndex((s) => !s.isMoment && s.section === 'hero');
    const storyIdx = steps.findIndex((s) => s.section === 'founder');
    expect(momentIdx).toBeLessThan(heroIdx);
    expect(heroIdx).toBeLessThan(storyIdx);
  });

  it('classes: goods + founder must-change; four sections optional; the rest keep-or-change', () => {
    expect(sectionClass('goods')).toBe('must-change');
    expect(sectionClass('founder')).toBe('must-change');
    expect(sectionClass('hero')).toBe('keep-or-change');
    expect(sectionClass('contact')).toBe('keep-or-change');
    const optional = WALKTHROUGH_STEPS.filter((s) => s.cls === 'optional').map((s) => s.section).sort();
    expect(optional).toEqual(['collections', 'findUs', 'marquee', 'reviews']);
  });

  it('a must-change section is not resolved by keep or hide — only by an edit', () => {
    expect(walkComplete(markSectionKept({ root: { content: {} } }, 'founder'))).toBe(false);
    expect(walkComplete(setSectionHidden({ root: { content: {} } }, 'goods', true))).toBe(false);
  });

  it('reviews and find-us are not keepable — keeping the fakes never resolves them', () => {
    expect(sectionResolved(markSectionKept({ root: { content: {} } }, 'reviews'), 'reviews')).toBe(false);
    expect(sectionResolved(markSectionKept({ root: { content: {} } }, 'findUs'), 'findUs')).toBe(false);
    // but turning them off or making them real does resolve them
    expect(sectionResolved(setSectionHidden({ root: { content: {} } }, 'reviews', true), 'reviews')).toBe(true);
    expect(sectionResolved(markSectionMade({ root: { content: {} } }, 'findUs'), 'findUs')).toBe(true);
  });

  it('walk is complete only when every section is resolved by its allowed states', () => {
    let env: Record<string, unknown> = { root: { content: {} } };
    expect(walkComplete(env)).toBe(false);
    for (const s of WALKTHROUGH_STEPS) {
      env = s.cls === 'must-change' ? markSectionMade(env, s.section)
          : s.cls === 'optional' ? setSectionHidden(env, s.section, true)
          : markSectionKept(env, s.section);
    }
    expect(walkComplete(env)).toBe(true);
  });

  it('placeholderSections lists sections not made-yours and not hidden', () => {
    const ph = placeholderSections(ENV(['hero'], ['reviews']));
    expect(ph).not.toContain('hero'); // made yours
    expect(ph).not.toContain('reviews'); // hidden
    expect(ph).toContain('close'); // untouched
  });

  it('progress: done counts made-yours + hidden; all handled → done === total', () => {
    expect(walkthroughProgress(ENV())).toEqual({ done: 0, total: WALKTHROUGH_STEPS.length });
    const allSections = WALKTHROUGH_STEPS.map((s) => s.section);
    const p = walkthroughProgress(ENV(allSections));
    expect(p.done).toBe(p.total);
  });
});
