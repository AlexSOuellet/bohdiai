import { describe, it, expect } from 'vitest';
import { TrajectorySchema } from './trajectory';

describe('TrajectorySchema', () => {
  const base = {
    feeling: 'f', customerWhy: 'w', visualWorld: 'v', momentConcept: 'm', register: 'restrained' as const,
  };
  it('requires momentKind to be video or spotlight', () => {
    expect(TrajectorySchema.safeParse({ ...base, momentKind: 'video' }).success).toBe(true);
    expect(TrajectorySchema.safeParse({ ...base, momentKind: 'spotlight' }).success).toBe(true);
    expect(TrajectorySchema.safeParse({ ...base, momentKind: 'image' }).success).toBe(false);
    expect(TrajectorySchema.safeParse(base).success).toBe(false);
  });
});
