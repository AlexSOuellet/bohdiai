import type { ReactElement } from 'react';
import type { ContractorContent } from '../schemas';
import { fill } from '@/lib/site-words/words';
import type { ContractorWords } from '../words';

type Month = NonNullable<ContractorContent['calendar']>['months'][number];
type CalendarWords = ContractorWords['calendar'];

/** The month spots in calendar order, January first. */
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'] as const;
/** The weekday spots in the grid's order, Sunday first. */
const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

/**
 * One month of the booked-days calendar: the authored booked days marked, the
 * rest open. It shows the months the content names, in that order; nothing is
 * hidden or derived from today's date — the owner keeps it current.
 */
export function BookedMonth({ month: m, words: w }: { month: Month; words: CalendarWords }): ReactElement {
  const spot = MONTHS[m.month - 1];
  const name = spot === undefined ? '' : w.months[spot];
  const lead = new Date(Date.UTC(m.year, m.month - 1, 1)).getUTCDay();
  const days = new Date(Date.UTC(m.year, m.month, 0)).getUTCDate();
  const booked = new Set(m.booked);
  return (
    <figure className="at-cal">
      <figcaption className="at-cal__name">{fill(w.monthTitle, { month: name, year: m.year })}</figcaption>
      <div className="at-cal__grid" role="list">
        {WEEKDAYS.map((d) => <span key={d} className="at-cal__head" aria-hidden="true">{w.weekdays[d]}</span>)}
        {Array.from({ length: lead }, (_, i) => <span key={`b${i}`} aria-hidden="true" />)}
        {Array.from({ length: days }, (_, i) => {
          const day = i + 1;
          const isBooked = booked.has(day);
          return (
            <span key={day} role="listitem" className={isBooked ? 'at-cal__day at-cal__day--booked' : 'at-cal__day'} aria-label={fill(isBooked ? w.dayBooked : w.dayOpen, { month: name, day })}>
              {day}
            </span>
          );
        })}
      </div>
    </figure>
  );
}
