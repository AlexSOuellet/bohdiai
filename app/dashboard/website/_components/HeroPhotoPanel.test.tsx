/**
 * HeroPhotoPanel — the walk's hero-image controls (D73).
 *
 * Non-Cheerful families: shows the current hero media as a preview, offers a single
 * "Replace with my own photo" upload. Uploading swaps `moment.media` to a still.
 *
 * Cheerful family: shows the three current collage shots as a mini cluster, offers
 * two upload paths — "just the featured shot" (1 file, keeps AI in slots 1 and 2)
 * or "all three" (multi-select). Two-file uploads are intentionally excluded per D73.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, fireEvent, waitFor } from '@testing-library/react';
import HeroPhotoPanel from './HeroPhotoPanel';

afterEach(cleanup);

const stillMedia = { kind: 'still' as const, url: '/hero.jpg', alt: 'a hero still' };
const videoMedia = { kind: 'video' as const, url: '/hero.mp4', alt: 'a hero clip' };
const collageShots = [
  { url: '/ai0.jpg', alt: 'ai zero' },
  { url: '/ai1.jpg', alt: 'ai one' },
  { url: '/ai2.jpg', alt: 'ai two' },
];

function baseProps() {
  return {
    onUpload: vi.fn(async (_file: File) => ({ ok: true as const, uploadId: 'up1', url: 'https://cdn.test/new.webp' })),
    onSetHeroMedia: vi.fn(async (_url: string, _alt: string) => ({ ok: true as const })),
    onReplaceCollageShots: vi.fn(async (_shots: readonly { url: string; alt: string }[]) => ({ ok: true as const })),
    onResolved: vi.fn(),
    onChanged: vi.fn(),
  };
}

describe('HeroPhotoPanel — non-Cheerful families (single hero photo)', () => {
  it('renders the current still media as a preview image', () => {
    const props = baseProps();
    const { container } = render(<HeroPhotoPanel family="cozy" media={stillMedia} shots={undefined} {...props} />);
    const img = container.querySelector('[data-hero-photo-panel-preview] img') as HTMLImageElement | null;
    expect(img).toBeTruthy();
    expect(img!.getAttribute('src')).toBe('/hero.jpg');
  });

  it('renders the current video media as a preview video (muted, loop, autoplay for a quiet reference)', () => {
    const props = baseProps();
    const { container } = render(<HeroPhotoPanel family="rustic" media={videoMedia} shots={undefined} {...props} />);
    const video = container.querySelector('[data-hero-photo-panel-preview] video') as HTMLVideoElement | null;
    expect(video).toBeTruthy();
    expect(video!.getAttribute('src')).toBe('/hero.mp4');
    expect(video!.muted).toBe(true);
    expect(video!.loop).toBe(true);
  });

  it('uploading a photo calls onUpload, then onSetHeroMedia with the resulting url, then onResolved(true) and onChanged', async () => {
    const props = baseProps();
    const { container } = render(<HeroPhotoPanel family="cozy" media={stillMedia} shots={undefined} {...props} />);
    const input = container.querySelector('input[type="file"][data-hero-photo-panel-upload="single"]') as HTMLInputElement;
    const file = new File(['x'], 'p.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => expect(props.onUpload).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(props.onSetHeroMedia).toHaveBeenCalledWith('https://cdn.test/new.webp', expect.any(String)));
    await waitFor(() => expect(props.onResolved).toHaveBeenCalledWith(true));
    expect(props.onChanged).toHaveBeenCalled();
  });

  it('surfaces the upload error (no silent failures) and does not call onSetHeroMedia when upload fails', async () => {
    const props = baseProps();
    props.onUpload.mockResolvedValueOnce({ ok: false, error: 'Could not upload that photo — try again.' } as never);
    const { container, findByText } = render(<HeroPhotoPanel family="cozy" media={stillMedia} shots={undefined} {...props} />);
    const input = container.querySelector('input[type="file"][data-hero-photo-panel-upload="single"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(['x'], 'p.png', { type: 'image/png' })] } });
    expect(await findByText(/could not upload/i)).toBeTruthy();
    expect(props.onSetHeroMedia).not.toHaveBeenCalled();
    expect(props.onResolved).not.toHaveBeenCalled();
  });

  it('does NOT render Cheerful-only controls', () => {
    const props = baseProps();
    const { container } = render(<HeroPhotoPanel family="modern" media={stillMedia} shots={undefined} {...props} />);
    expect(container.querySelector('[data-hero-photo-panel-upload="featured"]')).toBeNull();
    expect(container.querySelector('[data-hero-photo-panel-upload="triple"]')).toBeNull();
  });
});

describe('HeroPhotoPanel — Cheerful family (0/1/3 collage uploads, D73)', () => {
  it('renders the three current collage shots as previews', () => {
    const props = baseProps();
    const { container } = render(<HeroPhotoPanel family="cheerful" media={undefined} shots={collageShots} {...props} />);
    const imgs = container.querySelectorAll('[data-hero-photo-panel-preview] img');
    expect(imgs).toHaveLength(3);
    expect(imgs[0]!.getAttribute('src')).toBe('/ai0.jpg');
    expect(imgs[1]!.getAttribute('src')).toBe('/ai1.jpg');
    expect(imgs[2]!.getAttribute('src')).toBe('/ai2.jpg');
  });

  it('featured upload (1 file) calls onReplaceCollageShots with exactly one shot', async () => {
    const props = baseProps();
    const { container } = render(<HeroPhotoPanel family="cheerful" media={undefined} shots={collageShots} {...props} />);
    const input = container.querySelector('input[type="file"][data-hero-photo-panel-upload="featured"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(['x'], 'a.png', { type: 'image/png' })] } });
    await waitFor(() => expect(props.onReplaceCollageShots).toHaveBeenCalledTimes(1));
    const call = props.onReplaceCollageShots.mock.calls[0]![0] as readonly { url: string; alt: string }[];
    expect(call).toHaveLength(1);
    expect(call[0]!.url).toBe('https://cdn.test/new.webp');
    await waitFor(() => expect(props.onResolved).toHaveBeenCalledWith(true));
  });

  it('triple upload (3 files) uploads each then calls onReplaceCollageShots with three shots', async () => {
    const props = baseProps();
    props.onUpload
      .mockResolvedValueOnce({ ok: true as const, uploadId: 'u0', url: 'https://cdn.test/m0.webp' })
      .mockResolvedValueOnce({ ok: true as const, uploadId: 'u1', url: 'https://cdn.test/m1.webp' })
      .mockResolvedValueOnce({ ok: true as const, uploadId: 'u2', url: 'https://cdn.test/m2.webp' });
    const { container } = render(<HeroPhotoPanel family="cheerful" media={undefined} shots={collageShots} {...props} />);
    const input = container.querySelector('input[type="file"][data-hero-photo-panel-upload="triple"]') as HTMLInputElement;
    const files = [
      new File(['a'], 'a.png', { type: 'image/png' }),
      new File(['b'], 'b.png', { type: 'image/png' }),
      new File(['c'], 'c.png', { type: 'image/png' }),
    ];
    fireEvent.change(input, { target: { files } });
    await waitFor(() => expect(props.onUpload).toHaveBeenCalledTimes(3));
    await waitFor(() => expect(props.onReplaceCollageShots).toHaveBeenCalledTimes(1));
    const call = props.onReplaceCollageShots.mock.calls[0]![0] as readonly { url: string; alt: string }[];
    expect(call.map((s) => s.url)).toEqual(['https://cdn.test/m0.webp', 'https://cdn.test/m1.webp', 'https://cdn.test/m2.webp']);
    await waitFor(() => expect(props.onResolved).toHaveBeenCalledWith(true));
  });

  it('triple upload rejects and surfaces an error if the maker picks anything other than exactly 3 files', async () => {
    const props = baseProps();
    const { container, findByText } = render(<HeroPhotoPanel family="cheerful" media={undefined} shots={collageShots} {...props} />);
    const input = container.querySelector('input[type="file"][data-hero-photo-panel-upload="triple"]') as HTMLInputElement;
    fireEvent.change(input, {
      target: {
        files: [
          new File(['a'], 'a.png', { type: 'image/png' }),
          new File(['b'], 'b.png', { type: 'image/png' }),
        ],
      },
    });
    expect(await findByText(/pick three photos/i)).toBeTruthy();
    expect(props.onUpload).not.toHaveBeenCalled();
    expect(props.onReplaceCollageShots).not.toHaveBeenCalled();
  });

  it('triple upload surfaces the first upload error and does NOT call onReplaceCollageShots partially', async () => {
    const props = baseProps();
    props.onUpload
      .mockResolvedValueOnce({ ok: true as const, uploadId: 'u0', url: 'https://cdn.test/m0.webp' })
      .mockResolvedValueOnce({ ok: false, error: 'That image is over 30MB — pick a smaller one.' } as never);
    const { container, findByText } = render(<HeroPhotoPanel family="cheerful" media={undefined} shots={collageShots} {...props} />);
    const input = container.querySelector('input[type="file"][data-hero-photo-panel-upload="triple"]') as HTMLInputElement;
    fireEvent.change(input, {
      target: {
        files: [
          new File(['a'], 'a.png', { type: 'image/png' }),
          new File(['b'], 'b.png', { type: 'image/png' }),
          new File(['c'], 'c.png', { type: 'image/png' }),
        ],
      },
    });
    expect(await findByText(/over 30mb/i)).toBeTruthy();
    expect(props.onReplaceCollageShots).not.toHaveBeenCalled();
    expect(props.onResolved).not.toHaveBeenCalled();
  });

  it('does NOT render the non-Cheerful single-upload control', () => {
    const props = baseProps();
    const { container } = render(<HeroPhotoPanel family="cheerful" media={undefined} shots={collageShots} {...props} />);
    expect(container.querySelector('[data-hero-photo-panel-upload="single"]')).toBeNull();
  });
});
