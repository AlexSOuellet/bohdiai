import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
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
  it('renders a month grid with a marked event cell when rows carry dates', () => {
    const { container } = render(<FindUsCalendar section={section} events={[dated]} skin={skin} viewAll={viewAll} />);
    expect(container.querySelector('.ms-fu-cal-month')).toBeTruthy();
    expect(container.querySelector('.ms-fu-cal-ev')).toBeTruthy();
    expect(container.querySelector('.ms-fu-cal-dot')).toBeTruthy();
  });

  it('falls back to an agenda when no row carries a date', () => {
    const { container, getByText } = render(<FindUsCalendar section={section} events={[undatedRow]} skin={skin} />);
    expect(container.querySelector('.ms-fu-cal-month')).toBeNull();
    expect(getByText('Hope St Market')).toBeTruthy();
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
  it('spotlights the first row and trails the rest', () => {
    const second: FindUsEvent = { date: '2025-08-15', day: 'Fri, Aug 15', where: 'WaterFire', time: '7–11pm' };
    const { container, getByText } = render(<FindUsNextStop section={section} events={[dated, second]} skin={skin} viewAll={viewAll} />);
    expect(getByText('Saturday')).toBeTruthy(); // weekday of the spotlight date
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
