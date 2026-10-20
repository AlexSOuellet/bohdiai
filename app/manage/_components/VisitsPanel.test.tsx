import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { VisitsPanel } from './VisitsPanel';
import type { VisitsView } from '@/lib/visits/home';

afterEach(cleanup);

const numbers = (over: Partial<Extract<VisitsView, { kind: 'numbers' }>> = {}): VisitsView => ({
  kind: 'numbers',
  week: { visits: 1200, pageViews: 30 },
  lastWeek: { visits: 1000, pageViews: 30 },
  topPages: [{ name: 'Home page', count: 9 }],
  sources: [{ name: 'Your QR codes', count: 3 }],
  months: null,
  ...over,
});

describe('VisitsPanel', () => {
  it('shows this week against last, and the two lists', () => {
    render(<VisitsPanel view={numbers()} />);
    expect(screen.getByText('1,200')).toBeInTheDocument();
    expect(screen.getByText('Up 200 from last week (1,000)')).toBeInTheDocument();
    expect(screen.getByText('Same as last week (30)')).toBeInTheDocument();
    expect(screen.getByText('Home page')).toBeInTheDocument();
    expect(screen.getByText('9 views')).toBeInTheDocument();
    expect(screen.getByText('3 visits')).toBeInTheDocument();
    expect(screen.queryByText('Month by month')).toBeNull();
  });
  it('says when it is down, or nothing either week, and when the lists are empty', () => {
    render(<VisitsPanel view={numbers({ week: { visits: 2, pageViews: 0 }, lastWeek: { visits: 5, pageViews: 0 }, topPages: [], sources: [] })} />);
    expect(screen.getByText('Down 3 from last week (5)')).toBeInTheDocument();
    expect(screen.getByText('None last week either')).toBeInTheDocument();
    expect(screen.getByText('Nothing seen yet in the last 30 days.')).toBeInTheDocument();
    expect(screen.getByText('No visits yet in the last 30 days.')).toBeInTheDocument();
  });
  it('lists the saved months on Full, or says they will be saved', () => {
    render(<VisitsPanel view={numbers({ months: [{ month: '2026-09-01', visits: 3, pageViews: 9, topPages: [], sources: [] }] })} />);
    expect(screen.getByText('September 2026')).toBeInTheDocument();
    expect(screen.getByText('3 visits · 9 pages seen')).toBeInTheDocument();
    cleanup();
    render(<VisitsPanel view={numbers({ months: [] })} />);
    expect(screen.getByText(/for as long as you’re on Full/)).toBeInTheDocument();
  });
  it('says why there are no numbers', () => {
    render(<VisitsPanel view={{ kind: 'draft' }} />);
    expect(screen.getByText(/start the day your site goes live/)).toBeInTheDocument();
    cleanup();
    render(<VisitsPanel view={{ kind: 'off' }} />);
    expect(screen.getByText(/aren’t switched on yet/)).toBeInTheDocument();
    cleanup();
    render(<VisitsPanel view={{ kind: 'failed' }} />);
    expect(screen.getByRole('alert')).toHaveTextContent('couldn’t load');
  });
});
