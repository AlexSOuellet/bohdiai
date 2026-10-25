import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';

const refresh = vi.fn();
const a = vi.hoisted(() => ({ setOwnBackground: vi.fn(), removeOwnBackground: vi.fn(), chooseScene: vi.fn(), setOwnScene: vi.fn(), findScenes: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }), unstable_rethrow: () => undefined }));
vi.mock('@/lib/backend/scene/background-actions', () => a);
Element.prototype.scrollIntoView = vi.fn(); // jsdom has no layout

const { BackgroundEditor } = await import('./BackgroundEditor');

const view = {
  own: 'https://cdn/wood.jpg',
  scenic: { key: 'rustic-charm-1', url: 'https://cdn/s1.webp' },
  scenes: [
    { key: 'rustic-charm-1', url: 'https://cdn/s1.webp', description: 'Barn interior', mine: true },
    { key: 'rustic-charm-2', url: 'https://cdn/s2.webp', description: 'Autumn field', mine: true },
    { key: 'marsh', url: 'https://cdn/m.webp', description: 'Salt marsh', mine: false },
  ],
};
const file = (): File => new File(['x'], 'p.jpg', { type: 'image/jpeg' });

afterEach(() => {
  cleanup();
  refresh.mockReset();
  Object.values(a).forEach((f) => f.mockReset());
});

describe('BackgroundEditor', () => {
  it('shows her background and her scenes, marking the one Scenic shows', () => {
    render(<BackgroundEditor initial={view} siteUrl="https://x.bohdiai.com" />);
    expect(screen.getByAltText('Your background')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Barn interior/ }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText(/Showing now/)).toBeTruthy();
  });

  it('picks another scene', async () => {
    a.chooseScene.mockResolvedValue({ ok: true });
    render(<BackgroundEditor initial={view} siteUrl="https://x.bohdiai.com" />);
    fireEvent.click(screen.getByRole('button', { name: /Autumn field/ }));
    await waitFor(() => expect(a.chooseScene).toHaveBeenCalledWith('rustic-charm-2'));
    expect(await screen.findByText('Saved. Scenic shows that scene now.')).toBeTruthy();
    expect(refresh).toHaveBeenCalled();
  });

  it('replaces and removes her background', async () => {
    a.setOwnBackground.mockResolvedValue({ ok: true, url: 'u' });
    a.removeOwnBackground.mockResolvedValue({ ok: true });
    render(<BackgroundEditor initial={view} siteUrl="https://x.bohdiai.com" />);
    fireEvent.change(screen.getByLabelText('Replace your background'), { target: { files: [file()] } });
    await waitFor(() => expect(a.setOwnBackground).toHaveBeenCalled());
    expect(await screen.findByText(/Your background is saved/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes, remove it' }));
    await waitFor(() => expect(a.removeOwnBackground).toHaveBeenCalled());
  });

  it('uploads her own Scenic photo with how light it is', async () => {
    a.setOwnScene.mockResolvedValue({ ok: true, url: 'u' });
    render(<BackgroundEditor initial={{ own: null, scenic: null, scenes: [] }} siteUrl="https://x.bohdiai.com" />);
    expect(screen.getByText('No background of your own yet.')).toBeTruthy();
    expect(screen.getByText('The scene library is empty.')).toBeTruthy();
    fireEvent.click(screen.getByLabelText(/A dark photo/));
    fireEvent.change(screen.getByLabelText('Upload your own Scenic photo'), { target: { files: [file()] } });
    await waitFor(() => expect(a.setOwnScene).toHaveBeenCalled());
    expect((a.setOwnScene.mock.calls[0]?.[0] as FormData).get('tone')).toBe('dark');
  });

  it('shows her own Scenic photo when that’s what Scenic shows', () => {
    render(<BackgroundEditor initial={{ ...view, scenic: { key: null, url: 'https://cdn/mine.webp' } }} siteUrl="https://x.bohdiai.com" />);
    expect(screen.getByAltText('Your own Scenic photo, showing now')).toBeTruthy();
  });

  it('says why something failed, or that the server can’t be reached', async () => {
    a.chooseScene.mockResolvedValueOnce({ ok: false, error: 'That scene isn’t one made for your site.' }).mockRejectedValueOnce(new Error('offline'));
    render(<BackgroundEditor initial={view} siteUrl="https://x.bohdiai.com" />);
    fireEvent.click(screen.getByRole('button', { name: /Autumn field/ }));
    expect(await screen.findByText('That scene isn’t one made for your site.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Autumn field/ }));
    expect(await screen.findByText(/Check your connection/)).toBeTruthy();
  });

  it('searches the library, says when nothing matches, and shows everything again', async () => {
    a.findScenes
      .mockResolvedValueOnce({ ok: true, scenes: [] })
      .mockResolvedValueOnce({ ok: false, error: 'The scenes couldn’t be searched.' })
      .mockRejectedValueOnce(new Error('offline'));
    render(<BackgroundEditor initial={view} siteUrl="https://x.bohdiai.com" />);
    expect(screen.getAllByText(/Made for your site/)).toHaveLength(2);
    fireEvent.change(screen.getByLabelText('Search the scenes'), { target: { value: 'volcano' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    expect(await screen.findByText('No scenes match those words.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    expect(await screen.findByText('The scenes couldn’t be searched.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    expect(await screen.findByText(/Check your connection/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Show all' }));
    expect(screen.getByRole('button', { name: /Salt marsh/ })).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Search the scenes'), { target: { value: ' ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    expect(a.findScenes).toHaveBeenCalledTimes(3);
  });

  it('ignores an empty file pick', () => {
    render(<BackgroundEditor initial={{ own: null, scenic: null, scenes: [] }} siteUrl="https://x.bohdiai.com" />);
    fireEvent.change(screen.getByLabelText('Add a background'), { target: { files: [] } });
    expect(a.setOwnBackground).not.toHaveBeenCalled();
  });
});
