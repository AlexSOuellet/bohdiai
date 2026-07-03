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
  currentYearMonth,
  stampFindUsDates,
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

describe('currentYearMonth', () => {
  it('reads the 1-based month and year off a date', () => {
    expect(currentYearMonth(new Date(Date.UTC(2026, 6, 3)))).toEqual({ year: 2026, month: 7 });
    expect(currentYearMonth(new Date(Date.UTC(2026, 11, 31)))).toEqual({ year: 2026, month: 12 });
  });
});

describe('buildFindUsMonth', () => {
  it('grids the REQUESTED month, dropping only that month\'s events into their cells', () => {
    const month = buildFindUsMonth(
      [
        row({ date: '2026-07-20', where: 'WaterFire' }),
        row({ date: '2026-07-05', where: 'Wickford Festival' }),
        row({ date: '2026-08-06', where: 'Next month' }),
      ],
      { year: 2026, month: 7 },
    );
    expect(month.title).toBe('July 2026');
    // July 2026: 31 days, the 1st is a Wednesday → 3 leading pad cells (Sunday-first).
    const pads = month.cells.filter((c) => c.dayNum === null);
    expect(pads).toHaveLength(3);
    const days = month.cells.filter((c) => c.dayNum !== null);
    expect(days).toHaveLength(31);
    const day5 = month.cells.find((c) => c.dayNum === 5);
    expect(day5!.events[0]!.where).toBe('Wickford Festival');
    // Only July events feed the agenda, in date order — the August one is elsewhere.
    expect(month.events.map((e) => e.where)).toEqual(['Wickford Festival', 'WaterFire']);
  });

  it('still grids a month with no events (the empty-state case), never undefined', () => {
    const month = buildFindUsMonth([row({ date: '2026-07-05', where: 'A' })], { year: 2026, month: 9 });
    expect(month.title).toBe('September 2026');
    expect(month.events).toHaveLength(0);
    // September 2026 has 30 days — a full grid still renders under the empty state.
    expect(month.cells.filter((c) => c.dayNum !== null)).toHaveLength(30);
  });

  it('ignores rows with no parseable date when placing cells', () => {
    const month = buildFindUsMonth([row({ date: undefined }), row({ date: '2026-07-05', where: 'A' })], {
      year: 2026,
      month: 7,
    });
    expect(month.events).toHaveLength(1);
  });
});

describe('stampFindUsDates', () => {
  const today = new Date(Date.UTC(2026, 6, 3)); // Fri, Jul 3 2026

  it('stamps ascending near-future dates from today, first ones within the week', () => {
    const out = stampFindUsDates(
      [
        { day: 'x', where: 'A', time: '10–4', kind: 'market' },
        { day: 'x', where: 'B', time: '9–1' },
      ],
      today,
    );
    expect(out[0]!.date).toBe('2026-07-05');
    expect(out[1]!.date).toBe('2026-07-08');
    // ascending
    expect(out[0]!.date! < out[1]!.date!).toBe(true);
  });

  it('rewrites the day echo to match the stamped date and keeps where/time/kind', () => {
    const out = stampFindUsDates([{ day: 'stale', where: 'A', time: '10–4', kind: 'market' }], today);
    expect(out[0]!.day).toBe('Sun, Jul 5');
    expect(out[0]!.where).toBe('A');
    expect(out[0]!.time).toBe('10–4');
    expect(out[0]!.kind).toBe('market');
  });

  it('handles more rows than the offset table without collision', () => {
    const rows = Array.from({ length: 8 }, (_, i) => ({ day: 'x', where: `S${i}`, time: '10–4' }));
    const out = stampFindUsDates(rows, today);
    const dates = out.map((r) => r.date!);
    expect(new Set(dates).size).toBe(8); // all distinct
    // still ascending
    for (let i = 1; i < dates.length; i += 1) expect(dates[i - 1]! < dates[i]!).toBe(true);
  });
});

describe('seedPreviewFindUs', () => {
  it('seeds dated rows with kinds relative to today so every treatment previews live', () => {
    const today = new Date(Date.UTC(2026, 6, 3));
    const seed = seedPreviewFindUs(today);
    expect(seed.rows.length).toBeGreaterThan(0);
    for (const r of seed.rows) {
      expect(parseFindUsDate(r.date)).toBeDefined();
      expect(r.date! >= '2026-07-03').toBe(true); // never in the past
    }
    expect(seed.rows.some((r) => r.kind === 'workshop')).toBe(true);
  });
});
