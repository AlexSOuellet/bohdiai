import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { EventSummary, type EventSummaryProps } from './EventSummary';
import { EventsPanel } from '../_components/EventsPanel';

afterEach(cleanup);

const props = (over: Partial<EventSummaryProps> = {}): EventSummaryProps => ({
  eventId: 'e1',
  date: '2026-10-18',
  endDate: '',
  town: 'Bristol',
  canceled: false,
  took: { count: 9, cents: 28400 },
  costsCents: 6500,
  onToday: false,
  past: true,
  ...over,
});

describe('EventSummary', () => {
  it('says when and where, what it took in and what was left after costs', () => {
    const { container } = render(<EventSummary {...props()} />);
    expect(screen.getByText('Sun, Oct 18, 2026, Bristol')).toBeTruthy();
    expect(container.textContent).toContain('Took in $284 from 9 sales. After $65 in costs, $219 was left.');
    expect(screen.queryByRole('link', { name: 'Open market day' })).toBeNull();
  });

  it('leaves out costs when none were logged or the plan has no records, and says when nothing sold', () => {
    const { container, rerender } = render(<EventSummary {...props({ costsCents: null, took: { count: 1, cents: 2400 } })} />);
    expect(container.textContent).toContain('Took in $24 from one sale.');
    expect(container.textContent).not.toContain('costs');
    rerender(<EventSummary {...props({ took: { count: 0, cents: 0 } })} />);
    expect(screen.getByText('Nothing was sold here through BohdiAI.')).toBeTruthy();
    rerender(<EventSummary {...props({ took: { count: 0, cents: 0 }, past: false })} />);
    expect(screen.queryByText(/Nothing was sold/)).toBeNull();
    rerender(<EventSummary {...props({ took: null })} />);
    expect(container.textContent).not.toContain('Took in');
  });

  it('opens the market day on the day, never for a canceled event', () => {
    const { rerender } = render(<EventSummary {...props({ onToday: true, past: false })} />);
    expect(screen.getByRole('link', { name: 'Open market day' }).getAttribute('href')).toBe('/manage/markets/e1/day');
    rerender(<EventSummary {...props({ onToday: true, past: false, canceled: true })} />);
    expect(screen.queryByRole('link', { name: 'Open market day' })).toBeNull();
    expect(screen.getByText('Canceled')).toBeTruthy();
  });
});

describe('EventsPanel', () => {
  const next = { id: 'n1', name: 'Holly Fair', date: '2026-11-21', endDate: '', town: 'Johnston', today: false };
  const last = { id: 'l1', name: 'Market on the Common', date: '2026-10-18', endDate: '', town: 'Bristol', sales: 9, takingsCents: 28400, costsCents: 6500 };
  const year = { year: 2026, markets: 7, takingsCents: 140000, profitCents: 98000, lastYearProfitCents: 80000, lastYearMarkets: 5 };

  it('links the next event, the last one’s How it sold, and the year’s Results', () => {
    render(<EventsPanel view={{ next, last, year }} />);
    expect(screen.getByRole('link', { name: /Holly Fair/ }).getAttribute('href')).toBe('/manage/markets/n1');
    const lastLink = screen.getByRole('link', { name: /Market on the Common/ });
    expect(lastLink.getAttribute('href')).toBe('/manage/markets/l1?tab=sold');
    expect(lastLink.textContent).toContain('Took in $284 from 9 sales, $219 after costs.');
    const yearLink = screen.getByRole('link', { name: /2026 so far/ });
    expect(yearLink.getAttribute('href')).toBe('/manage/markets/results');
    expect(yearLink.textContent).toContain('7 events took in $1400, $980 after costs. Last year: $800 after costs.');
  });

  it('opens the market day when an event is on today', () => {
    render(<EventsPanel view={{ next: { ...next, today: true }, last: null, year: null }} />);
    expect(screen.getByRole('link', { name: /Today/ }).getAttribute('href')).toBe('/manage/markets/n1/day');
    expect(screen.queryByRole('link', { name: /so far/ })).toBeNull();
  });

  it('points to adding an event when nothing is coming, and says when the last sold nothing', () => {
    render(<EventsPanel view={{ next: null, last: { ...last, sales: 0, takingsCents: 0 }, year: { ...year, markets: 0, lastYearMarkets: 0 } }} />);
    expect(screen.getByRole('link', { name: /Nothing coming up/ }).getAttribute('href')).toBe('/manage/markets/new');
    expect(screen.getByText(/Nothing sold through BohdiAI/)).toBeTruthy();
    expect(screen.getByText('No events yet this year.')).toBeTruthy();
  });
});
