import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BookedMonth } from './BookedCalendar';
import { keyWords } from '@/lib/site-words/words';
import { CONTRACTOR_WORD_SPOTS, CONTRACTOR_WORDS_PREFIX } from '../words';

const W = keyWords(CONTRACTOR_WORD_SPOTS, CONTRACTOR_WORDS_PREFIX).calendar;

describe('booked-days calendar', () => {
  it('lays out the month from the right weekday and marks only the booked days', () => {
    const { container } = render(<BookedMonth month={{ year: 2026, month: 10, booked: [1, 2, 19] }} words={W} />);
    // The month's title is the site's word; its weekday heads are the site's words in Sunday-first order.
    expect(container.querySelector('.at-cal__name')?.textContent).toBe('contractor.calendar.monthTitle');
    expect([...container.querySelectorAll('.at-cal__head')].map((h) => h.textContent)).toEqual(
      ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].map((d) => `contractor.calendar.weekdays.${d}`),
    );
    // October 1, 2026 is a Thursday: four blank cells after the seven weekday heads.
    const cells = [...container.querySelectorAll('.at-cal__grid > span')];
    expect(cells.slice(7, 11).every((c) => c.textContent === '')).toBe(true);
    expect(cells[11]?.textContent).toBe('1');
    expect(screen.getAllByRole('listitem')).toHaveLength(31);
    expect(container.querySelectorAll('.at-cal__day--booked')).toHaveLength(3);
    const day = (n: number) => screen.getAllByRole('listitem')[n - 1];
    expect(day(19)).toHaveAttribute('aria-label', 'contractor.calendar.dayBooked');
    expect(day(20)).toHaveAttribute('aria-label', 'contractor.calendar.dayOpen');
  });

  it('puts the month’s own word, the year and the day into the blanks', () => {
    const { container } = render(<BookedMonth month={{ year: 2026, month: 10, booked: [19] }} words={{ ...W, monthTitle: '{month} {year}', dayBooked: '{month} {day}' }} />);
    expect(container.querySelector('.at-cal__name')?.textContent).toBe('contractor.calendar.months.oct 2026');
    expect(screen.getAllByRole('listitem')[18]).toHaveAttribute('aria-label', 'contractor.calendar.months.oct 19');
  });

  it('knows February has 28 days in 2027', () => {
    render(<BookedMonth month={{ year: 2027, month: 2, booked: [] }} words={W} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(28);
  });
});
