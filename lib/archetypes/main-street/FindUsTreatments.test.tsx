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
import { keyWords } from '@/lib/site-words/words';
import { FAMILY_WORD_SPOTS, FAMILY_WORDS_PREFIX } from './words';

/** Test words: every spot says its own key, the dates read in en-US, and each date
 *  shape marks its blanks so a test sees which shape a treatment used. */
const W = {
  ...keyWords(FAMILY_WORD_SPOTS, FAMILY_WORDS_PREFIX),
  dateLocale: 'en-US',
  posterDay: 'poster:{weekday}/{month}/{day}',
  nextStopDay: 'also:{month}/{day}',
  nextStopWhen: 'when:{weekday}/{month}/{day}',
  nextStopAccent: '{when}+{time}',
  itineraryDay: 'stop:{weekday}/{month}/{day}',
};

const skin = MAIN_STREET_SKINS['main-street-ember']!;
const section: FindUsSection = { label: 'Find us in person', eventsLabel: 'Every date', rows: [] };
const dated: FindUsEvent = { date: '2025-08-02', day: 'Sat, Aug 2', where: 'Wickford Festival', time: '10–5' };
const undatedRow: FindUsEvent = { day: 'Every Saturday', where: 'Hope St Market', time: '9–1' };
const viewAll = { href: '/events', label: 'Every date' };

afterEach(cleanup);

describe('FindUsBoard', () => {
  it('splits an ISO date into a weekday / number / month block', () => {
    const { container, getByText } = render(<FindUsBoard words={W} section={section} events={[dated]} skin={skin} viewAll={viewAll} />);
    expect(container.querySelector('.ms-fu-board-num')!.textContent).toBe('2');
    expect(getByText('Sat')).toBeTruthy();
  });

  it('falls back to the authored day string when a row has no ISO date', () => {
    const { container, getByText } = render(<FindUsBoard words={W} section={section} events={[undatedRow]} skin={skin} />);
    expect(container.querySelector('.ms-fu-board-day')).toBeTruthy();
    expect(getByText('Every Saturday')).toBeTruthy();
    expect(container.querySelector('[data-ms-fu-viewall]')).toBeNull();
  });
});

describe('FindUsCalendar', () => {
  // `dated` is 2025-08-02.
  const august: FindUsSection = { ...section, rows: [dated] };

  it('grids the given month and marks the cell for an event that falls in it', () => {
    const { container } = render(<FindUsCalendar words={W} section={august} viewAll={viewAll} year={2025} month={8} />);
    expect(container.querySelector('.ms-fu-cal-month')).toBeTruthy();
    expect(container.querySelector('.ms-fu-cal-ev')).toBeTruthy();
    expect(container.querySelector('.ms-fu-cal-dot')).toBeTruthy();
  });

  it('shows the check-back empty state for a month with no events, still gridding it', () => {
    const { container, getByText } = render(<FindUsCalendar words={W} section={august} year={2025} month={10} />);
    expect(container.querySelector('.ms-fu-cal-month')).toBeTruthy(); // real calendar still renders
    expect(getByText(W.emptyMonth)).toBeTruthy();
  });

  it('pages forward and back through the months', () => {
    const { getByText, getByLabelText } = render(<FindUsCalendar words={W} section={august} year={2025} month={8} />);
    expect(getByText('August 2025')).toBeTruthy();
    fireEvent.click(getByLabelText(W.ariaNextMonth));
    expect(getByText('September 2025')).toBeTruthy();
    fireEvent.click(getByLabelText(W.ariaPreviousMonth));
    expect(getByText('August 2025')).toBeTruthy();
  });

  it('wraps the year at the December/January boundary', () => {
    const { getByText, getByLabelText } = render(<FindUsCalendar words={W} section={august} year={2025} month={12} />);
    fireEvent.click(getByLabelText(W.ariaNextMonth));
    expect(getByText('January 2026')).toBeTruthy();
  });
});

describe('FindUsPasses', () => {
  it('shows the day number for a dated row and an empty stub for an undated one', () => {
    const { container } = render(<FindUsPasses words={W} section={section} events={[dated]} skin={skin} />);
    expect(container.querySelector('.ms-fu-pass-num')!.textContent).toBe('2');
    cleanup();
    const { container: c2 } = render(<FindUsPasses words={W} section={section} events={[undatedRow]} skin={skin} />);
    expect(c2.querySelector('.ms-fu-pass-num')).toBeNull();
    expect(c2.querySelector('.ms-fu-pass-stub-l')!.textContent).toBe('');
  });
});

describe('FindUsNextStop', () => {
  it('leads with the venue as the hero and shows date+time as an accent, trailing the rest', () => {
    const second: FindUsEvent = { date: '2025-08-15', day: 'Fri, Aug 15', where: 'WaterFire', time: '7–11pm' };
    const { container, getByText } = render(<FindUsNextStop words={W} section={section} events={[dated, second]} skin={skin} viewAll={viewAll} />);
    // the venue is the hero, not a lone derived weekday
    expect(container.querySelector('.ms-fu-next-where')!.textContent).toBe('Wickford Festival');
    expect(container.querySelector('.ms-fu-next-when')).toBeNull();
    const accent = container.querySelector('.ms-fu-next-date')!.textContent!;
    expect(accent).toBe('when:Saturday/Aug/2+10–5');
    expect(container.querySelector('.ms-fu-next-also')).toBeTruthy();
    expect(getByText('also:Aug/15')).toBeTruthy();
    expect(getByText('WaterFire')).toBeTruthy();
  });

  it('renders nothing when there are no events, and no trailing strip for a lone date', () => {
    const { container } = render(<FindUsNextStop words={W} section={section} events={[]} skin={skin} />);
    expect(container.querySelector('#find-us')).toBeNull();
    cleanup();
    const { container: c2 } = render(<FindUsNextStop words={W} section={section} events={[undatedRow]} skin={skin} />);
    expect(c2.querySelector('.ms-fu-next-also')).toBeNull();
  });
});

describe('FindUsItinerary', () => {
  it('lists each stop with its date, place and hours, and no tag', () => {
    const workshop: FindUsEvent = { date: '2025-07-24', day: 'Thu, Jul 24', where: 'Pouring Workshop', time: '6–8pm' };
    const { container } = render(<FindUsItinerary words={W} section={section} events={[workshop]} skin={skin} viewAll={viewAll} />);
    expect(container.querySelector('.ms-fu-itin-where')!.textContent).toBe('Pouring Workshop');
    expect(container.querySelector('.ms-fu-itin-time')!.textContent).toBe('6–8pm');
    expect(container.querySelector('[data-ms-fu-kind]')).toBeNull();
    expect(container.textContent).toContain('stop:Thu/Jul/24');
  });
});

describe('FindUsPoster', () => {
  it('sets the run of dates as a playbill, falling back to the day string when undated', () => {
    const { container, getByText } = render(<FindUsPoster words={W} section={section} events={[dated, undatedRow]} skin={skin} viewAll={viewAll} />);
    expect(container.querySelectorAll('.ms-fu-poster-ln')).toHaveLength(2);
    expect(getByText('poster:Sat/Aug/2')).toBeTruthy();
    expect(getByText('Every Saturday')).toBeTruthy();
  });
});
