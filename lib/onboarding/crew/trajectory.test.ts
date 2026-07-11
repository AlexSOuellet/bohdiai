import { describe, it, expect } from 'vitest';
import { TrajectorySchema } from './trajectory';

describe('TrajectorySchema', () => {
  const base = {
    feeling: 'f', customerWhy: 'w', visualWorld: 'v', heroConcept: 'm', register: 'restrained' as const,
  };
  it('requires heroKind to be video or still', () => {
    expect(TrajectorySchema.safeParse({ ...base, heroKind: 'video' }).success).toBe(true);
    expect(TrajectorySchema.safeParse({ ...base, heroKind: 'still' }).success).toBe(true);
    expect(TrajectorySchema.safeParse({ ...base, heroKind: 'image' }).success).toBe(false);
    expect(TrajectorySchema.safeParse(base).success).toBe(false);
  });
});
