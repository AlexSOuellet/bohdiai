import { describe, it, expect } from 'vitest';
import { buildDateRow, byDay, isCalendarDate } from './dates-form';

describe('isCalendarDate', () => {
  it('takes real days written YYYY-MM-DD and nothing else', () => {
    expect(isCalendarDate('2026-10-11')).toBe(true);
    expect(isCalendarDate('2028-02-29')).toBe(true);
    expect(isCalendarDate('2026-02-29')).toBe(false);
    expect(isCalendarDate('2026-13-01')).toBe(false);
    expect(isCalendarDate('10/11/2026')).toBe(false);
    expect(isCalendarDate('')).toBe(false);
  });
});

describe('buildDateRow', () => {
  it('tidies the words and keeps an empty town as no town', () => {
    expect(buildDateRow({ date: '2026-10-11', endDate: '', name: '  Wickford   Art Festival ', town: ' Wickford ' })).toEqual({
      ok: true,
      row: { event_date: '2026-10-11', end_date: null, name: 'Wickford Art Festival', location: 'Wickford' },
    });
    expect(buildDateRow({ date: '2026-10-11', endDate: '', name: 'Fair', town: '  ' })).toEqual({ ok: true, row: { event_date: '2026-10-11', end_date: null, name: 'Fair', location: null } });
  });

  it('asks for the day and the market’s name', () => {
    expect(buildDateRow({ date: '', endDate: '', name: 'Fair', town: '' })).toEqual({ ok: false, error: 'Pick the day of the market.' });
    expect(buildDateRow({ date: '2026-10-11', endDate: '', name: ' ', town: '' })).toEqual({ ok: false, error: 'Add the market’s name.' });
  });

  it('says how long a too-long name or town is', () => {
    expect(buildDateRow({ date: '2026-10-11', endDate: '', name: 'x'.repeat(61), town: '' })).toEqual({ ok: false, error: 'The market’s name is 61 characters. Keep it to 60.' });
    expect(buildDateRow({ date: '2026-10-11', endDate: '', name: 'Fair', town: 'y'.repeat(41) })).toEqual({ ok: false, error: 'The town is 41 characters. Keep it to 40.' });
  });
});

describe('byDay', () => {
  it('puts the earliest market first', () => {
    const d = (id: string, date: string) => ({ id, date, endDate: '', name: id, town: '' });
    expect([d('b', '2026-11-01'), d('a', '2026-10-11'), d('c', '2027-01-03')].sort(byDay).map((x) => x.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('markets over several days', () => {
  const base = { date: '2026-11-21', name: 'Holly Fair', town: 'Johnston' };
  it('keeps the last day', () => {
    expect(buildDateRow({ ...base, endDate: '2026-11-22' })).toEqual({
      ok: true,
      row: { event_date: '2026-11-21', end_date: '2026-11-22', name: 'Holly Fair', location: 'Johnston' },
    });
  });
  it('treats a last day equal to the first as one day', () => {
    expect(buildDateRow({ ...base, endDate: '2026-11-21' })).toMatchObject({ ok: true, row: { end_date: null } });
  });
  it('refuses a last day before the first, or a run past the limit', () => {
    expect(buildDateRow({ ...base, endDate: '2026-11-20' })).toEqual({ ok: false, error: 'The last day comes before the first day. Check the two days.' });
    expect(buildDateRow({ ...base, endDate: '2026-12-21' }).ok).toBe(false);
    expect(buildDateRow({ ...base, endDate: '2026-02-30' }).ok).toBe(false);
  });
});
