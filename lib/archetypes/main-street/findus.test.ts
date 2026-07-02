import { describe, it, expect } from 'vitest';
import {
  FINDUS_TREATMENTS,
  DEFAULT_FINDUS_TREATMENT,
  FINDUS_TREATMENT_MENU,
  HOME_FINDUS_SAMPLE,
  sampleEvents,
  parseFindUsDate,
  formatFindUsMonthTitle,
  buildFindUsMonth,
  seedPreviewFindUs,
  type FindUsEvent,
} from './findus';

const row = (over: Partial<FindUsEvent> = {}): FindUsEvent => ({
  day: 'Sat, Jul 12',
  where: 'Providence Flea',
  time: '10–4',
  ...over,
});

describe('findus registry', () => {
  it('the default is a member of the treatment tuple', () => {
    expect(FINDUS_TREATMENTS).toContain(DEFAULT_FINDUS_TREATMENT);
  });

  it('every treatment carries a one-line menu description', () => {
    for (const t of FINDUS_TREATMENTS) {
      expect(FINDUS_TREATMENT_MENU[t].length).toBeGreaterThan(0);
    }
  });

  it('trims to the home handful, preserving order', () => {
    const many = Array.from({ length: HOME_FINDUS_SAMPLE + 3 }, (_, i) => row({ where: `Stop ${i}` }));
    const shown = sampleEvents(many);
    expect(shown).toHaveLength(HOME_FINDUS_SAMPLE);
    expect(shown[0]!.where).toBe('Stop 0');
  });

  it('returns fewer than the cap untouched', () => {
    expect(sampleEvents([row(), row()])).toHaveLength(2);
  });
});

describe('parseFindUsDate', () => {
  it('reads an ISO date into its display pieces without timezone drift', () => {
    const p = parseFindUsDate('2025-07-12');
    expect(p).toEqual({
      year: 2025,
      month: 7,
      dayNum: 12,
      weekday: 'Saturday',
      weekdayShort: 'Sat',
      monthShort: 'Jul',
    });
  });

  it('returns undefined for a missing or malformed date (never throws)', () => {
    expect(parseFindUsDate(undefined)).toBeUndefined();
    expect(parseFindUsDate('')).toBeUndefined();
    expect(parseFindUsDate('Sat, Jul 12')).toBeUndefined();
    expect(parseFindUsDate('2025-13-01')).toBeUndefined();
    expect(parseFindUsDate('2025-02-40')).toBeUndefined();
  });
});

describe('formatFindUsMonthTitle', () => {
  it('renders the month name and year', () => {
    expect(formatFindUsMonthTitle(2025, 8)).toBe('August 2025');
  });
});

describe('buildFindUsMonth', () => {
  it('grids the soonest dated month, dropping events into their cells', () => {
    const month = buildFindUsMonth([
      row({ date: '2025-08-15', where: 'WaterFire' }),
      row({ date: '2025-08-02', where: 'Wickford Festival' }),
      row({ date: '2025-09-06', where: 'Next month' }),
    ]);
    expect(month).toBeDefined();
    expect(month!.title).toBe('August 2025');
    // August 2025: 31 days, the 1st is a Friday → 5 leading pad cells.
    const pads = month!.cells.filter((c) => c.dayNum === null);
    expect(pads).toHaveLength(5);
    const days = month!.cells.filter((c) => c.dayNum !== null);
    expect(days).toHaveLength(31);
    const day2 = month!.cells.find((c) => c.dayNum === 2);
    expect(day2!.events[0]!.where).toBe('Wickford Festival');
    // Only August events feed the agenda — the September one is a different month.
    expect(month!.events).toHaveLength(2);
  });

  it('returns undefined when no row carries a parseable date (legacy fallback)', () => {
    expect(buildFindUsMonth([row(), row({ date: 'not-a-date' })])).toBeUndefined();
  });
});

describe('seedPreviewFindUs', () => {
  it('seeds plausible dated rows with kinds for the preview', () => {
    const seed = seedPreviewFindUs();
    expect(seed.rows.length).toBeGreaterThan(0);
    for (const r of seed.rows) {
      expect(parseFindUsDate(r.date)).toBeDefined();
    }
    expect(seed.rows.some((r) => r.kind === 'workshop')).toBe(true);
  });
});
