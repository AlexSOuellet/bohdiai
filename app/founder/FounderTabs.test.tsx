import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';

const nav = vi.hoisted(() => ({ path: '/founder' }));
vi.mock('next/navigation', () => ({ usePathname: () => nav.path }));
import { FounderTabs } from './FounderTabs';

afterEach(cleanup);

describe('the admin’s tabs show what’s new (Alex, 2026-11-16)', () => {
  it('puts the number of new messages, reports and feedback on their tabs', () => {
    nav.path = '/founder';
    render(<FounderTabs counts={{ messages: 2, reports: 1, feedback: 0 }} />);
    expect(
      within(screen.getByRole('link', { name: /Messages/ })).getByLabelText('2 new'),
    ).toBeTruthy();
    expect(
      within(screen.getByRole('link', { name: /Reports/ })).getByLabelText('1 new'),
    ).toBeTruthy();
    expect(
      within(screen.getByRole('link', { name: /Feedback/ })).queryByLabelText(/new/),
    ).toBeNull();
  });

  it('shows no number on the tab that’s open', () => {
    nav.path = '/founder/reports';
    render(<FounderTabs counts={{ messages: 2, reports: 3, feedback: 0 }} />);
    expect(
      within(screen.getByRole('link', { name: /Reports/ })).queryByLabelText(/new/),
    ).toBeNull();
    expect(
      within(screen.getByRole('link', { name: /Messages/ })).getByLabelText('2 new'),
    ).toBeTruthy();
  });

  it('a tab opened on this visit keeps its number cleared after moving on', () => {
    nav.path = '/founder/messages';
    const { rerender } = render(<FounderTabs counts={{ messages: 2, reports: 0, feedback: 0 }} />);
    nav.path = '/founder';
    rerender(<FounderTabs counts={{ messages: 2, reports: 0, feedback: 0 }} />);
    expect(
      within(screen.getByRole('link', { name: /Messages/ })).queryByLabelText(/new/),
    ).toBeNull();
  });

  it('still works with no numbers when they couldn’t be read', () => {
    nav.path = '/founder';
    render(<FounderTabs counts={null} />);
    expect(screen.getByRole('link', { name: 'Messages' })).toBeTruthy();
  });
});
