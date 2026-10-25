import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';

const setMomentPhoto = vi.fn();
vi.mock('next/navigation', () => ({ unstable_rethrow: () => undefined }));
vi.mock('@/lib/backend/moment/actions', () => ({ setMomentPhoto }));

const { OpeningPhotoField } = await import('./OpeningPhotoField');
const notice = { showSaved: vi.fn(), showError: vi.fn(), clear: vi.fn(), clearSaved: vi.fn(), area: null } as unknown as Parameters<typeof OpeningPhotoField>[0]['notice'];
const file = (): File => new File(['x'], 'p.jpg', { type: 'image/jpeg' });

afterEach(() => {
  cleanup();
  setMomentPhoto.mockReset();
  vi.mocked(notice.showSaved).mockReset();
  vi.mocked(notice.showError).mockReset();
});

describe('OpeningPhotoField', () => {
  it('shows the opening photo and replaces it at once', async () => {
    setMomentPhoto.mockResolvedValue({ ok: true, url: 'https://cdn/new.webp' });
    render(<OpeningPhotoField initial={{ kind: 'image', url: 'https://cdn/old.webp', posterUrl: '' }} notice={notice} />);
    expect(screen.getByAltText('Your opening photo').getAttribute('src')).toBe('https://cdn/old.webp');
    expect(screen.getByText(/no words or logos in it/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Replace your opening photo'), { target: { files: [file()] } });
    await waitFor(() => expect(screen.getByAltText('Your opening photo').getAttribute('src')).toBe('https://cdn/new.webp'));
    expect(notice.showSaved).toHaveBeenCalled();
  });

  it('shows a video’s poster, says when it opens on a video without one, and when there’s nothing yet', () => {
    render(<OpeningPhotoField initial={{ kind: 'video', url: 'v.mp4', posterUrl: 'https://cdn/poster.webp' }} notice={notice} />);
    expect(screen.getByAltText('Your opening photo').getAttribute('src')).toBe('https://cdn/poster.webp');
    cleanup();
    render(<OpeningPhotoField initial={{ kind: 'video', url: 'v.mp4', posterUrl: '' }} notice={notice} />);
    expect(screen.getByText('Your site opens on a video.')).toBeTruthy();
    cleanup();
    render(<OpeningPhotoField initial={null} notice={notice} />);
    expect(screen.getByText('No opening photo yet.')).toBeTruthy();
  });

  it('says why a photo wasn’t taken, or that the server can’t be reached; ignores an empty pick', async () => {
    setMomentPhoto.mockResolvedValueOnce({ ok: false, error: 'Use a JPG, PNG or WebP photo.' }).mockRejectedValueOnce(new Error('offline'));
    render(<OpeningPhotoField initial={null} notice={notice} />);
    fireEvent.change(screen.getByLabelText('Replace your opening photo'), { target: { files: [] } });
    expect(setMomentPhoto).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Replace your opening photo'), { target: { files: [file()] } });
    await waitFor(() => expect(notice.showError).toHaveBeenCalledWith('Use a JPG, PNG or WebP photo.'));
    fireEvent.change(screen.getByLabelText('Replace your opening photo'), { target: { files: [file()] } });
    await waitFor(() => expect(notice.showError).toHaveBeenCalledWith(expect.stringContaining('Check your connection')));
  });
});
