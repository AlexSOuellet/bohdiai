import type { ReactElement } from 'react';
import type { ContractorContent } from '../schemas';
import { CONTRACTOR_STRINGS as S } from '../strings';

type Month = NonNullable<ContractorContent['calendar']>['months'][number];

/**
 * One month of the booked-days calendar: the authored booked days marked, the
 * rest open. It shows the months the content names, in that order; nothing is
 * hidden or derived from today's date — the owner keeps it current.
 */
export function BookedMonth({ month: m }: { month: Month }): ReactElement {
  const name = S.calendar.monthNames[m.month - 1] ?? '';
  const lead = new Date(Date.UTC(m.year, m.month - 1, 1)).getUTCDay();
  const days = new Date(Date.UTC(m.year, m.month, 0)).getUTCDate();
  const booked = new Set(m.booked);
  return (
    <figure className="at-cal">
      <figcaption className="at-cal__name">{name} {m.year}</figcaption>
      <div className="at-cal__grid" role="list">
        {S.calendar.weekdays.map((d, i) => <span key={`h${i}`} className="at-cal__head" aria-hidden="true">{d}</span>)}
        {Array.from({ length: lead }, (_, i) => <span key={`b${i}`} aria-hidden="true" />)}
        {Array.from({ length: days }, (_, i) => {
          const day = i + 1;
          const isBooked = booked.has(day);
          return (
            <span key={day} role="listitem" className={isBooked ? 'at-cal__day at-cal__day--booked' : 'at-cal__day'} aria-label={S.calendar.dayLabel(name, day, isBooked)}>
              {day}
            </span>
          );
        })}
      </div>
    </figure>
  );
}
