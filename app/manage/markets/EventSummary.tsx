import Link from 'next/link';
import type { Route } from 'next';
import { formatPrice } from '@/lib/storefront/catalog';
import { signedMoney } from '@/lib/backend/markets/results';
import { marketDays } from './MarketList';

export type EventSummaryProps = {
  eventId: string;
  date: string;
  endDate: string;
  town: string;
  canceled: boolean;
  /** Paid sales and their total; null where the plan has no market shop (Showcase). */
  took: { count: number; cents: number } | null;
  /** What she logged on the After tab; null where the plan has no records. */
  costsCents: number | null;
  /** The event is on today, so the market day opens from here. */
  onToday: boolean;
  /** It's over, so "nothing sold" is worth saying. */
  past: boolean;
};

/** Across the top of an event (Alex, 2026-10-22): when and where, then what it took
 *  in and what was left after costs, said as a sentence; the market day on the day. */
export function EventSummary({ eventId, date, endDate, town, canceled, took, costsCents, onToday, past }: EventSummaryProps): React.ReactElement {
  const sold = took !== null && took.count > 0;
  return (
    <section className="bk-event-summary" aria-label="This event at a glance">
      <div>
        <p className="bk-event-summary-when">
          {marketDays({ date, endDate })}
          {town !== '' && `, ${town}`}
          {canceled && <span className="bk-pill">Canceled</span>}
        </p>
        {sold && (
          <p className="bk-event-summary-took">
            Took in <strong>{formatPrice(took.cents)}</strong> from {took.count === 1 ? 'one sale' : `${took.count} sales`}.
            {costsCents !== null && costsCents > 0 && (
              <>
                {' '}
                After {formatPrice(costsCents)} in costs, <strong>{signedMoney(took.cents - costsCents)}</strong> was left.
              </>
            )}
          </p>
        )}
        {took !== null && !sold && past && !canceled && <p className="bk-event-summary-took">Nothing was sold here through BohdiAI.</p>}
      </div>
      {onToday && !canceled && (
        <Link className="bk-btn" href={`/manage/markets/${eventId}/day` as Route}>
          Open market day
        </Link>
      )}
    </section>
  );
}
