import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { FeedbackList } from './FeedbackList';
import { tally } from '@/lib/tool-feedback/feedback';

afterEach(cleanup);

describe('the Feedback tab (Alex, 2026-11-15)', () => {
  it('says when there’s nothing yet', () => {
    render(<FeedbackList view={{ entries: [], counts: tally([]), total: 0 }} />);
    expect(screen.getByText(/No feedback yet/)).toBeTruthy();
  });
  it('shows what people want built, then each response', () => {
    const entries = [
      { id: 'a', message: 'Love Print it', wants: ['tags', 'cards'], name: 'Pat', email: 'pat@example.com', makes: 'candles', sent: '2026-11-15T10:00:00Z' },
      { id: 'b', message: '', wants: ['cards'], name: '', email: '', makes: '', sent: '2026-11-14T10:00:00Z' },
    ];
    render(<FeedbackList view={{ entries, counts: tally(entries), total: 2 }} />);
    expect(screen.getByText('2 responses so far.')).toBeTruthy();
    const rows = screen.getAllByRole('listitem').slice(0, 2).map((li) => li.textContent);
    expect(rows).toEqual(['Care cards and thank-you cards2 people', 'Price tags and labels1 person']);
    expect(screen.getByText('Love Print it')).toBeTruthy();
    expect(screen.getByText('Would use: Price tags and labels, Care cards and thank-you cards')).toBeTruthy();
    expect(screen.getByText('No name given')).toBeTruthy();
  });
});
