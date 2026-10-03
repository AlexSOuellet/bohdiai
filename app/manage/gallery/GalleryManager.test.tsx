import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';

const actions = vi.hoisted(() => ({ uploadGalleryPhoto: vi.fn(), saveGallery: vi.fn(), removeGalleryPhoto: vi.fn() }));
vi.mock('@/lib/backend/gallery/actions', () => actions);
vi.mock('next/navigation', () => ({ unstable_rethrow: () => undefined }));

import { GalleryManager } from './GalleryManager';

const item = (id: string, caption = '') => ({ id, url: `https://cdn/${id}.webp`, caption });

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn(); // jsdom has no layout
  actions.uploadGalleryPhoto.mockReset();
  actions.saveGallery.mockReset().mockResolvedValue({ ok: true });
  actions.removeGalleryPhoto.mockReset().mockResolvedValue({ ok: true });
});
afterEach(cleanup);

function manager(initial = [item('a'), item('b')]) {
  render(<GalleryManager initial={initial} siteUrl="https://x.bohdiai.com" />);
}

function choose(files: File[]): void {
  fireEvent.change(screen.getByLabelText('Add photos'), { target: { files } });
}

const jpg = (name: string) => new File(['x'], name, { type: 'image/jpeg' });

describe('GalleryManager', () => {
  it('reorders and captions, then saves both together', async () => {
    manager();
    fireEvent.click(screen.getByRole('button', { name: 'Move photo 2 earlier' }));
    fireEvent.change(screen.getAllByLabelText(/Caption/)[0] as HTMLElement, { target: { value: 'Army flag' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(screen.getByText('Saved. Your site shows the new order now.')).toBeTruthy());
    expect(actions.saveGallery).toHaveBeenCalledWith([
      { id: 'b', caption: 'Army flag' },
      { id: 'a', caption: '' },
    ]);
  });

  it('adds uploaded photos at the end, already saved', async () => {
    actions.uploadGalleryPhoto.mockResolvedValueOnce({ ok: true, item: item('c') });
    manager();
    choose([jpg('c.jpg')]);
    await waitFor(() => expect(screen.getByText('Photo added.')).toBeTruthy());
    expect(screen.getByText('Your photos (3 of 12)')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('names each photo that failed, and says how many fit when too many are picked', async () => {
    actions.uploadGalleryPhoto.mockResolvedValueOnce({ ok: false, error: 'Use a JPG, PNG or WebP photo.' });
    manager(Array.from({ length: 11 }, (_, i) => item(`p${i}`)));
    choose([jpg('one.jpg'), jpg('two.jpg')]);
    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toBe(
        'Your gallery holds up to 12 photos, so 0 of the 2 you picked were added. one.jpg: Use a JPG, PNG or WebP photo.',
      ),
    );
    expect(actions.uploadGalleryPhoto).toHaveBeenCalledTimes(1);
  });

  it('turns adding off when the gallery is full', () => {
    manager(Array.from({ length: 12 }, (_, i) => item(`p${i}`)));
    expect((screen.getByLabelText('Add photos') as HTMLInputElement).disabled).toBe(true);
    expect(screen.getByText('Your gallery is full. Remove a photo to add another.')).toBeTruthy();
  });

  it('removes a photo after a confirm, and shows a failure when it can’t', async () => {
    manager();
    fireEvent.click(screen.getAllByRole('button', { name: 'Remove' })[0] as HTMLElement);
    fireEvent.click(screen.getByRole('button', { name: 'Yes, remove it' }));
    await waitFor(() => expect(screen.getByText('Photo removed.')).toBeTruthy());
    expect(actions.removeGalleryPhoto).toHaveBeenCalledWith('a');
    expect(screen.getByText('Your photos (1 of 12)')).toBeTruthy();

    actions.removeGalleryPhoto.mockRejectedValueOnce(new Error('offline'));
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes, remove it' }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('Something went wrong. Check your connection and try again.'));
    expect(screen.getByText('Your photos (1 of 12)')).toBeTruthy();
  });
});
