import { describe, it, expect } from 'vitest';
import { demoMarketDay, nearestSaturday } from './demo-days';

describe('nearestSaturday', () => {
  it('keeps a Saturday and moves every other day to the nearest one', () => {
    expect(nearestSaturday('2026-10-17')).toBe('2026-10-17'); // Saturday
    expect(nearestSaturday('2026-10-14')).toBe('2026-10-17'); // Wednesday, three ahead
    expect(nearestSaturday('2026-10-15')).toBe('2026-10-17'); // Thursday
    expect(nearestSaturday('2026-10-13')).toBe('2026-10-10'); // Tuesday, three back
    expect(nearestSaturday('2026-10-18')).toBe('2026-10-17'); // Sunday
    expect(nearestSaturday('2026-12-31')).toBe('2027-01-02'); // across a year
  });
});

describe('demoMarketDay', () => {
  it('keeps today’s market today and puts the others on Saturdays', () => {
    expect(demoMarketDay('2026-10-14', 0)).toBe('2026-10-14');
    expect(demoMarketDay('2026-10-14', 21)).toBe('2026-11-07');
    expect(demoMarketDay('2026-10-14', -352)).toBe('2025-10-25');
    for (const offset of [-352, -330, -310, -120, -96, -21, 21, 45]) {
      expect(new Date(`${demoMarketDay('2026-10-14', offset)}T00:00:00Z`).getUTCDay()).toBe(6);
    }
  });
});
