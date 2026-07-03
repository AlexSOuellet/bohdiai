import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { MAIN_STREET_SKINS } from './skins';
import type { FindUsSection, FindUsEvent } from './findus';
import { FindUsBoard } from './FindUsBoard';
import { FindUsCalendar } from './FindUsCalendar';
import { FindUsPasses } from './FindUsPasses';
import { FindUsNextStop } from './FindUsNextStop';
import { FindUsItinerary } from './FindUsItinerary';
import { FindUsPoster } from './FindUsPoster';

const skin = MAIN_STREET_SKINS['main-street-ember']!;
const section: FindUsSection = { label: 'Find us in person', eventsLabel: 'See all dates', rows: [] };
const dated: FindUsEvent = { date: '2025-08-02', day: 'Sat, Aug 2', where: 'Wickford Festival', time: '10–5', kind: 'market' };
const undatedRow: FindUsEvent = { day: 'Every Saturday', where: 'Hope St Market', time: '9–1' };
const viewAll = { href: '/events', label: 'See all dates' };

afterEach(cleanup);

describe('FindUsBoard', () => {
  it('splits an ISO date into a weekday / number / month block and shows the kind pill', () => {
    const { container, getByText } = render(<FindUsBoard section={section} events={[dated]} skin={skin} viewAll={viewAll} />);
    expect(container.querySelector('.ms-fu-board-num')!.textContent).toBe('2');
    expect(getByText('Sat')).toBeTruthy();
    expect(container.querySelector('[data-ms-fu-kind="market"]')).toBeTruthy();
  });

  it('falls back to the authored day string when a row has no ISO date', () => {
    const { container, getByText } = render(<FindUsBoard section={section} events={[undatedRow]} skin={skin} />);
    expect(container.querySelector('.ms-fu-board-day')).toBeTruthy();
    expect(getByText('Every Saturday')).toBeTruthy();
    expect(container.querySelector('[data-ms-fu-viewall]')).toBeNull();
  });
});

describe('FindUsCalendar', () => {
  // `dated` is 2025-08-02.
  const august: FindUsSection = { ...section, rows: [dated] };

  it('grids the given month and marks the cell for an event that falls in it', () => {
    const { container } = render(<FindUsCalendar section={august} viewAll={viewAll} year={2025} month={8} />);
    expect(container.querySelector('.ms-fu-cal-month')).toBeTruthy();
    expect(container.querySelector('.ms-fu-cal-ev')).toBeTruthy();
    expect(container.querySelector('.ms-fu-cal-dot')).toBeTruthy();
  });

  it('shows the check-back empty state for a month with no events, still gridding it', () => {
    const { container, getByText } = render(<FindUsCalendar section={august} year={2025} month={10} />);
    expect(container.querySelector('.ms-fu-cal-month')).toBeTruthy(); // real calendar still renders
    expect(getByText(/check back/i)).toBeTruthy();
  });

  it('pages forward and back through the months', () => {
    const { getByText, getByLabelText } = render(<FindUsCalendar section={august} year={2025} month={8} />);
    expect(getByText('August 2025')).toBeTruthy();
    fireEvent.click(getByLabelText(/next month/i));
    expect(getByText('September 2025')).toBeTruthy();
    fireEvent.click(getByLabelText(/previous month/i));
    expect(getByText('August 2025')).toBeTruthy();
  });

  it('wraps the year at the December/January boundary', () => {
    const { getByText, getByLabelText } = render(<FindUsCalendar section={august} year={2025} month={12} />);
    fireEvent.click(getByLabelText(/next month/i));
    expect(getByText('January 2026')).toBeTruthy();
  });
});

describe('FindUsPasses', () => {
  it('shows the day number for a dated row and the kind on the stub for an undated one', () => {
    const { container } = render(<FindUsPasses section={section} events={[dated]} skin={skin} />);
    expect(container.querySelector('.ms-fu-pass-num')!.textContent).toBe('2');
    cleanup();
    const undatedWithKind: FindUsEvent = { ...undatedRow, kind: 'workshop' };
    const { container: c2 } = render(<FindUsPasses section={section} events={[undatedWithKind]} skin={skin} />);
    expect(c2.querySelector('.ms-fu-pass-num')).toBeNull();
    expect(c2.querySelector('.ms-fu-pass-stub-l')!.textContent).toBe('workshop');
  });
});

describe('FindUsNextStop', () => {
  it('leads with the venue as the hero and shows date+time as an accent, trailing the rest', () => {
    const second: FindUsEvent = { date: '2025-08-15', day: 'Fri, Aug 15', where: 'WaterFire', time: '7–11pm' };
    const { container, getByText } = render(<FindUsNextStop section={section} events={[dated, second]} skin={skin} viewAll={viewAll} />);
    // the venue is the hero, not a lone derived weekday
    expect(container.querySelector('.ms-fu-next-where')!.textContent).toBe('Wickford Festival');
    expect(container.querySelector('.ms-fu-next-when')).toBeNull();
    const accent = container.querySelector('.ms-fu-next-date')!.textContent!;
    expect(accent).toContain('Aug 2');
    expect(accent).toContain('10–5');
    expect(container.querySelector('.ms-fu-next-also')).toBeTruthy();
    expect(getByText('WaterFire')).toBeTruthy();
  });

  it('renders nothing when there are no events, and no trailing strip for a lone date', () => {
    const { container } = render(<FindUsNextStop section={section} events={[]} skin={skin} />);
    expect(container.querySelector('#find-us')).toBeNull();
    cleanup();
    const { container: c2 } = render(<FindUsNextStop section={section} events={[undatedRow]} skin={skin} />);
    expect(c2.querySelector('.ms-fu-next-also')).toBeNull();
  });
});

describe('FindUsItinerary', () => {
  it('marks a workshop node and renders the kind pill', () => {
    const workshop: FindUsEvent = { date: '2025-07-24', day: 'Thu, Jul 24', where: 'Pouring Workshop', time: '6–8pm', kind: 'workshop' };
    const { container } = render(<FindUsItinerary section={section} events={[workshop]} skin={skin} viewAll={viewAll} />);
    expect(container.querySelector('.ms-fu-itin-wk')).toBeTruthy();
    expect(container.querySelector('[data-ms-fu-kind="workshop"]')).toBeTruthy();
  });
});

describe('FindUsPoster', () => {
  it('sets the run of dates as a playbill, falling back to the day string when undated', () => {
    const { container, getByText } = render(<FindUsPoster section={section} events={[dated, undatedRow]} skin={skin} viewAll={viewAll} />);
    expect(container.querySelectorAll('.ms-fu-poster-ln')).toHaveLength(2);
    expect(getByText('Sat Aug 2')).toBeTruthy();
    expect(getByText('Every Saturday')).toBeTruthy();
  });
});
