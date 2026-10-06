import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BookedMonth } from './BookedCalendar';

describe('booked-days calendar', () => {
  it('lays out the month from the right weekday and marks only the booked days', () => {
    const { container } = render(<BookedMonth month={{ year: 2026, month: 10, booked: [1, 2, 19] }} />);
    expect(screen.getByText('October 2026')).toBeInTheDocument();
    // October 1, 2026 is a Thursday: four blank cells after the seven weekday heads.
    const cells = [...container.querySelectorAll('.at-cal__grid > span')];
    expect(cells.slice(7, 11).every((c) => c.textContent === '')).toBe(true);
    expect(cells[11]?.textContent).toBe('1');
    expect(screen.getAllByRole('listitem')).toHaveLength(31);
    expect(container.querySelectorAll('.at-cal__day--booked')).toHaveLength(3);
    expect(screen.getByLabelText('October 19: booked')).toBeInTheDocument();
    expect(screen.getByLabelText('October 20: open')).toBeInTheDocument();
  });

  it('knows February has 28 days in 2027', () => {
    render(<BookedMonth month={{ year: 2027, month: 2, booked: [] }} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(28);
  });
});
