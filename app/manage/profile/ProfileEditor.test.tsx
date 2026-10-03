import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { EMPTY_PROFILE } from '@/lib/backend/profile/profile-form';

const saveProfile = vi.hoisted(() => vi.fn());
vi.mock('@/lib/backend/profile/actions', () => ({ saveProfile }));
vi.mock('next/navigation', () => ({ unstable_rethrow: () => undefined }));

import { ProfileEditor } from './ProfileEditor';

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn(); // jsdom has no layout
  saveProfile.mockReset().mockResolvedValue({ ok: true });
});
afterEach(cleanup);

function editor() {
  render(<ProfileEditor initial={{ ...EMPTY_PROFILE, headline: 'Old' }} siteUrl="https://rustic-rhody.bohdiai.com" />);
}

describe('ProfileEditor', () => {
  it('saves the edited words and says so', async () => {
    editor();
    const save = screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Headline'), { target: { value: 'Burned-wood flags' } });
    expect(screen.getByText('Unsaved changes')).toBeTruthy();
    fireEvent.click(save);
    await waitFor(() => expect(screen.getByText('Saved. Your site shows the changes now.')).toBeTruthy());
    expect(saveProfile).toHaveBeenCalledWith(expect.objectContaining({ headline: 'Burned-wood flags' }));
    expect(screen.queryByText('Unsaved changes')).toBeNull();
  });

  it('stops a bad phone number before saving', async () => {
    editor();
    fireEvent.change(screen.getByLabelText('Phone'), { target: { value: 'call me' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('That phone number doesn’t look right'));
    expect(saveProfile).not.toHaveBeenCalled();
  });

  it('shows the server’s refusal and a plain message when the call itself fails', async () => {
    editor();
    fireEvent.change(screen.getByLabelText('Headline'), { target: { value: 'New' } });
    saveProfile.mockResolvedValueOnce({ ok: false, error: 'You don’t have access to change this site.' });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('You don’t have access to change this site.'));
    saveProfile.mockRejectedValueOnce(new Error('offline'));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('Something went wrong. Check your connection and try again.'));
  });

  it('counts characters against each limit and links to the live site', () => {
    editor();
    expect(screen.getByText(/One sentence under your name.*3\/160/)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'View your site' }).getAttribute('href')).toBe('https://rustic-rhody.bohdiai.com');
  });
});
