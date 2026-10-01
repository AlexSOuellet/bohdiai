import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const { uploadProductPhoto } = vi.hoisted(() => ({ uploadProductPhoto: vi.fn() }));
vi.mock('@/lib/backend/catalog/actions', () => ({ uploadProductPhoto }));

import { PhotosField } from './PhotosField';

const photos = [{ uploadId: 'a', url: 'https://x/a.webp' }, { uploadId: 'b', url: 'https://x/b.webp' }];
const pick = (input: HTMLElement, names: string[]) =>
  fireEvent.change(input, { target: { files: names.map((n) => new File(['x'], n, { type: 'image/jpeg' })) } });

beforeEach(() => vi.clearAllMocks());

describe('PhotosField', () => {
  it('marks the first photo as the main one and reorders and removes', () => {
    const onChange = vi.fn();
    render(<PhotosField photos={photos} onAdd={vi.fn()} onChange={onChange} onError={vi.fn()} />);
    expect(screen.getAllByText('Main photo')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Move photo 2 earlier' }));
    expect(onChange).toHaveBeenLastCalledWith([photos[1], photos[0]]);
    fireEvent.click(screen.getByRole('button', { name: 'Remove photo 1' }));
    expect(onChange).toHaveBeenLastCalledWith([photos[1]]);
  });
  it('uploads each picked photo and reports the ones that failed by name', async () => {
    uploadProductPhoto.mockResolvedValueOnce({ ok: true, uploadId: 'c', url: 'https://x/c.webp' }).mockResolvedValueOnce({ ok: false, error: 'Use a JPG, PNG or WebP photo.' });
    const onAdd = vi.fn();
    const onError = vi.fn();
    render(<PhotosField photos={[]} onAdd={onAdd} onChange={vi.fn()} onError={onError} />);
    pick(screen.getByLabelText('Add photos'), ['one.jpg', 'two.gif']);
    await waitFor(() => expect(onError).toHaveBeenCalledWith('two.gif: Use a JPG, PNG or WebP photo.'));
    expect(onAdd).toHaveBeenCalledWith({ uploadId: 'c', url: 'https://x/c.webp' });
  });
  it('says so when an upload throws', async () => {
    uploadProductPhoto.mockRejectedValueOnce(new Error('offline'));
    const onError = vi.fn();
    render(<PhotosField photos={[]} onAdd={vi.fn()} onChange={vi.fn()} onError={onError} />);
    pick(screen.getByLabelText('Add photos'), ['one.jpg']);
    await waitFor(() => expect(onError).toHaveBeenCalledWith('one.jpg: The photo couldn’t be uploaded. Check your connection and try again.'));
  });
  it('stops at the photo limit and says so', async () => {
    const twelve = Array.from({ length: 12 }, (_, i) => ({ uploadId: `p${i}`, url: `https://x/${i}.webp` }));
    const onError = vi.fn();
    render(<PhotosField photos={twelve} onAdd={vi.fn()} onChange={vi.fn()} onError={onError} />);
    pick(screen.getByLabelText('Add photos'), ['one.jpg']);
    await waitFor(() => expect(onError).toHaveBeenCalledWith('A product can have up to 12 photos. Remove one to add another.'));
    expect(uploadProductPhoto).not.toHaveBeenCalled();
  });
});
