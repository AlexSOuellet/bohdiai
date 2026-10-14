import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { EMPTY_PROFILE } from '@/lib/backend/profile/profile-form';

const { saveProfile, uploadPortrait, removePortrait } = vi.hoisted(() => ({ saveProfile: vi.fn(), uploadPortrait: vi.fn(), removePortrait: vi.fn() }));
vi.mock('@/lib/backend/profile/actions', () => ({ saveProfile, uploadPortrait, removePortrait }));
vi.mock('next/navigation', () => ({ unstable_rethrow: () => undefined }));

import { marqueeSlots, ProfileEditor } from './ProfileEditor';

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn(); // jsdom has no layout
  saveProfile.mockReset().mockResolvedValue({ ok: true });
  uploadPortrait.mockReset().mockResolvedValue({ ok: true, url: 'https://cdn.example/portrait.webp' });
  removePortrait.mockReset().mockResolvedValue({ ok: true });
});
afterEach(cleanup);

function editor() {
  render(<ProfileEditor initial={{ ...EMPTY_PROFILE, headline: 'Old' }} portraitUrl={null} siteUrl="https://rustic-rhody.bohdiai.com" />);
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

  it('edits the three things the maker makes and saves them', async () => {
    render(<ProfileEditor initial={{ ...EMPTY_PROFILE, makes: ['Burned-wood flags'] }} portraitUrl={null} siteUrl="https://rustic-rhody.bohdiai.com" />);
    expect((screen.getByLabelText('Thing you make 1') as HTMLInputElement).value).toBe('Burned-wood flags');
    expect((screen.getByLabelText('Thing you make 3') as HTMLInputElement).value).toBe('');
    fireEvent.change(screen.getByLabelText('Thing you make 2'), { target: { value: 'Carved signs' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(saveProfile).toHaveBeenCalled());
    expect(saveProfile.mock.calls[0]?.[0].makes).toEqual(['Burned-wood flags', 'Carved signs', '']);
  });

  it('counts characters against each limit and links to the live site', () => {
    editor();
    expect(screen.getByText(/One sentence under your name.*3\/160/)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'View your site' }).getAttribute('href')).toBe('https://rustic-rhody.bohdiai.com');
  });

  it('saves the quote and who it is from', async () => {
    editor();
    fireEvent.change(screen.getByLabelText('Your quote'), { target: { value: 'Every board starts as a tree' } });
    fireEvent.change(screen.getByLabelText('Who it’s from'), { target: { value: 'June, founder' } });
    expect(screen.getByText(/Something you’d say about your work\. 28\/600/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(saveProfile).toHaveBeenCalled());
    expect(saveProfile.mock.calls[0]?.[0]).toMatchObject({ quote: 'Every board starts as a tree', quoteAttribution: 'June, founder' });
  });

  it('stops a name for the quote without the quote', async () => {
    editor();
    fireEvent.change(screen.getByLabelText('Who it’s from'), { target: { value: 'June' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('Add the quote, or clear who it’s from.'));
    expect(saveProfile).not.toHaveBeenCalled();
  });

  it('grows a new marquee box as the last one fills, and saves the phrases in order', async () => {
    render(<ProfileEditor initial={{ ...EMPTY_PROFILE, marqueePhrases: ['Small batch'] }} portraitUrl={null} siteUrl="https://x.bohdiai.com" />);
    expect((screen.getByLabelText('Marquee phrase 1') as HTMLInputElement).value).toBe('Small batch');
    expect(screen.queryByLabelText('Marquee phrase 3')).toBeNull();
    fireEvent.change(screen.getByLabelText('Marquee phrase 2'), { target: { value: 'Poured by hand' } });
    expect(screen.getByLabelText('Marquee phrase 3')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(saveProfile).toHaveBeenCalled());
    expect(saveProfile.mock.calls[0]?.[0].marqueePhrases).toEqual(['Small batch', 'Poured by hand']);
  });

  it('counts clearing a new marquee phrase back out as no change', () => {
    render(<ProfileEditor initial={{ ...EMPTY_PROFILE, marqueePhrases: ['Small batch'] }} portraitUrl={null} siteUrl="https://x.bohdiai.com" />);
    fireEvent.change(screen.getByLabelText('Marquee phrase 2'), { target: { value: 'x' } });
    expect(screen.getByText('Unsaved changes')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Marquee phrase 2'), { target: { value: '' } });
    expect(screen.queryByText('Unsaved changes')).toBeNull();
  });

  it('uploads a portrait straight away and shows it', async () => {
    editor();
    expect(screen.getByText('No portrait yet.')).toBeTruthy();
    const file = new File(['x'], 'me.jpg', { type: 'image/jpeg' });
    fireEvent.change(screen.getByLabelText('Add a portrait'), { target: { files: [file] } });
    await waitFor(() => expect(screen.getByText('Your portrait is saved. Your site shows it now.')).toBeTruthy());
    expect((uploadPortrait.mock.calls[0]?.[0] as FormData).get('file')).toBe(file);
    expect(screen.getByRole('img', { name: 'Your portrait' }).getAttribute('src')).toBe('https://cdn.example/portrait.webp');
    expect(screen.getByLabelText('Replace your portrait')).toBeTruthy();
  });

  it('shows why a portrait upload failed, and a plain message when the call fails', async () => {
    editor();
    uploadPortrait.mockResolvedValueOnce({ ok: false, error: 'That photo is over 20MB. Pick a smaller one.' });
    fireEvent.change(screen.getByLabelText('Add a portrait'), { target: { files: [new File(['x'], 'a.jpg', { type: 'image/jpeg' })] } });
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('That photo is over 20MB. Pick a smaller one.'));
    uploadPortrait.mockRejectedValueOnce(new Error('offline'));
    fireEvent.change(screen.getByLabelText('Add a portrait'), { target: { files: [new File(['x'], 'b.jpg', { type: 'image/jpeg' })] } });
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('The photo couldn’t be uploaded. Check your connection and try again.'));
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('removes the portrait after a confirm, and shows a failure plainly', async () => {
    render(<ProfileEditor initial={EMPTY_PROFILE} portraitUrl="https://cdn.example/old.webp" siteUrl="https://x.bohdiai.com" />);
    removePortrait.mockResolvedValueOnce({ ok: false, error: 'The portrait couldn’t be removed. Try again in a moment.' });
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes, remove it' }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('The portrait couldn’t be removed. Try again in a moment.'));
    removePortrait.mockRejectedValueOnce(new Error('offline'));
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes, remove it' }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('The portrait couldn’t be removed. Check your connection and try again.'));
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes, remove it' }));
    await waitFor(() => expect(screen.getByText('Your portrait is removed.')).toBeTruthy());
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByText('No portrait yet.')).toBeTruthy();
  });
});

describe('marqueeSlots', () => {
  it('adds one empty box after the last phrase, drops trailing blanks, and stops at the limit', () => {
    expect(marqueeSlots([])).toEqual(['']);
    expect(marqueeSlots(['a', '', ''])).toEqual(['a', '']);
    expect(marqueeSlots(['a', '', 'b'])).toEqual(['a', '', 'b', '']);
    const full = Array.from({ length: 12 }, (_, i) => `p${i}`);
    expect(marqueeSlots(full)).toEqual(full);
  });
});
