import { describe, it, expect } from 'vitest';
import { WALKTHROUGH_STEPS, placeholderSections, walkthroughProgress } from './walkthrough';
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

  it('marks reviews/collections/marquee optional and the structural sections not', () => {
    const optional = WALKTHROUGH_STEPS.filter((s) => s.optional).map((s) => s.section).sort();
    expect(optional).toEqual(['collections', 'marquee', 'reviews']);
    expect(WALKTHROUGH_STEPS.find((s) => s.section === 'hero')!.optional).toBe(false);
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
