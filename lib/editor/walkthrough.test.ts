import { describe, it, expect } from 'vitest';
import { WALKTHROUGH_STEPS, placeholderSections, walkthroughProgress, walkComplete, sectionClass, sectionResolved } from './walkthrough';
import { markSectionMade, markSectionKept, setSectionHidden } from './section-state';
import { EDITABLE_FIELDS } from './editable-fields';

const IDS = new Set(EDITABLE_FIELDS.map((f) => f.id));
const ENV = (madeYours: string[] = [], hidden: string[] = []) => ({
  root: { kind: 'archetype', content: { madeYours, hiddenSections: hidden } },
});

describe('walkthrough', () => {
  it('runs top-to-bottom: hero first, close last', () => {
    expect(WALKTHROUGH_STEPS[0]!.section).toBe('hero');
    expect(WALKTHROUGH_STEPS[WALKTHROUGH_STEPS.length - 1]!.section).toBe('close');
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
