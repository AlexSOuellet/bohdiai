import { describe, it, expect } from 'vitest';
import { publishBlockers } from './publish-gate';
import { markSectionMade, setSectionHidden } from './section-state';

const sections = (env: Record<string, unknown>) => publishBlockers(env).map((b) => b.section).sort();

describe('publish-gate', () => {
  it('a fresh store blocks on all four honesty sections', () => {
    expect(sections({ root: { content: {} } })).toEqual(['findUs', 'founder', 'goods', 'reviews']);
  });

  it('turning off reviews and find-us clears their blockers', () => {
    let env: Record<string, unknown> = setSectionHidden({ root: { content: {} } }, 'reviews', true);
    env = setSectionHidden(env, 'findUs', true);
    expect(sections(env)).toEqual(['founder', 'goods']);
  });

  it('making the story and products real clears their blockers', () => {
    let env: Record<string, unknown> = markSectionMade({ root: { content: {} } }, 'founder');
    env = markSectionMade(env, 'goods');
    expect(sections(env)).toEqual(['findUs', 'reviews']);
  });

  it('a fully-resolved store has no blockers', () => {
    let env: Record<string, unknown> = markSectionMade({ root: { content: {} } }, 'founder');
    env = markSectionMade(env, 'goods');
    env = setSectionHidden(env, 'reviews', true);
    env = setSectionHidden(env, 'findUs', true);
    expect(publishBlockers(env)).toEqual([]);
  });

  it('a blocker carries a maker-facing label', () => {
    const first = publishBlockers({ root: { content: {} } })[0];
    expect(typeof first?.label).toBe('string');
    expect((first?.label.length ?? 0) > 0).toBe(true);
  });
});
