import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react';

const actions = vi.hoisted(() => ({ addMarketDate: vi.fn(), updateMarketDate: vi.fn(), removeMarketDate: vi.fn() }));
vi.mock('@/lib/backend/dates/actions', () => actions);
vi.mock('next/navigation', () => ({ unstable_rethrow: () => undefined }));

import { DatesManager } from './DatesManager';

const d = (id: string, date: string, name: string, town = '', endDate = '') => ({ id, date, endDate, name, town });

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn(); // jsdom has no layout
  actions.addMarketDate.mockReset();
  actions.updateMarketDate.mockReset();
  actions.removeMarketDate.mockReset().mockResolvedValue({ ok: true });
});
afterEach(cleanup);

function manager(initial = [d('b', '2026-11-01', 'Holiday Fair'), d('a', '2026-10-11', 'Wickford Art Festival', 'Wickford')]) {
  render(<DatesManager initial={initial} siteUrl="https://x.bohdiai.com" />);
}

const rows = (): string[] => within(screen.getByRole('list', { name: 'Market dates' })).getAllByRole('listitem').map((li) => li.querySelector('.bk-list-name')?.textContent ?? '');

describe('DatesManager', () => {
  it('lists the dates earliest first, with the town when there is one', () => {
    manager();
    expect(rows()).toEqual(['Sun, Oct 11, 2026 · Wickford Art Festival · Wickford', 'Sun, Nov 1, 2026 · Holiday Fair']);
  });

  it('adds a date into its place and clears the form', async () => {
    actions.addMarketDate.mockResolvedValueOnce({ ok: true, item: d('c', '2026-10-18', 'Apple Fest', 'Foster') });
    manager();
    fireEvent.change(screen.getByLabelText('Day', { selector: '#new-date' }), { target: { value: '2026-10-18' } });
    fireEvent.change(screen.getByLabelText('Market', { selector: '#new-name' }), { target: { value: 'Apple Fest' } });
    fireEvent.change(screen.getByLabelText(/Town/, { selector: '#new-town' }), { target: { value: 'Foster' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add date' }));
    await waitFor(() => expect(screen.getByText('Date added. Your site shows it now.')).toBeTruthy());
    expect(actions.addMarketDate).toHaveBeenCalledWith({ date: '2026-10-18', endDate: '', name: 'Apple Fest', town: 'Foster' });
    expect(rows()[1]).toBe('Sun, Oct 18, 2026 · Apple Fest · Foster');
    expect((screen.getByLabelText('Market', { selector: '#new-name' }) as HTMLInputElement).value).toBe('');
  });

  it('says what’s missing before sending anything', () => {
    manager();
    fireEvent.click(screen.getByRole('button', { name: 'Add date' }));
    expect(screen.getByRole('alert').textContent).toBe('Pick the day of the market.');
    expect(actions.addMarketDate).not.toHaveBeenCalled();
  });

  it('changes a date in place', async () => {
    actions.updateMarketDate.mockResolvedValueOnce({ ok: true, item: d('a', '2026-10-11', 'Wickford Art Fest', 'Wickford') });
    manager();
    fireEvent.click(screen.getByRole('button', { name: 'Change Wickford Art Festival on Sun, Oct 11, 2026' }));
    fireEvent.change(screen.getByLabelText('Market', { selector: '#e-a-name' }), { target: { value: 'Wickford Art Fest' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(screen.getByText('Saved. Your site shows the change now.')).toBeTruthy());
    expect(actions.updateMarketDate).toHaveBeenCalledWith('a', { date: '2026-10-11', endDate: '', name: 'Wickford Art Fest', town: 'Wickford' });
    expect(rows()[0]).toBe('Sun, Oct 11, 2026 · Wickford Art Fest · Wickford');
  });

  it('removes a date after a confirm, and shows a failure when it can’t', async () => {
    manager();
    fireEvent.click(screen.getAllByRole('button', { name: 'Remove' })[0] as HTMLElement);
    fireEvent.click(screen.getByRole('button', { name: 'Yes, remove it' }));
    await waitFor(() => expect(screen.getByText('Date removed.')).toBeTruthy());
    expect(actions.removeMarketDate).toHaveBeenCalledWith('a');

    actions.removeMarketDate.mockRejectedValueOnce(new Error('offline'));
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes, remove it' }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('Something went wrong. Check your connection and try again.'));
    expect(rows()).toEqual(['Sun, Nov 1, 2026 · Holiday Fair']);
  });

  it('stops adding at the limit', () => {
    manager(Array.from({ length: 20 }, (_, i) => d(`p${i}`, `2026-12-${String(i + 1).padStart(2, '0')}`, `Fair ${i}`)));
    expect(screen.queryByRole('button', { name: 'Add date' })).toBeNull();
    expect(screen.getByText('You have 20 dates, the most a site lists. Remove a past one to add another.')).toBeTruthy();
  });
});
