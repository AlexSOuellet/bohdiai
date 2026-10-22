import { describe, it, expect } from 'vitest';
import { isEventTab } from './event-tabs';

describe('isEventTab', () => {
  it('knows the four tabs and nothing else', () => {
    for (const t of ['details', 'bringing', 'sold', 'after']) expect(isEventTab(t)).toBe(true);
    for (const t of ['costs', '', undefined, ['sold']]) expect(isEventTab(t)).toBe(false);
  });
});
