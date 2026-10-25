import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { LOOKS } from '@/lib/site/looks';

const refresh = vi.fn();
const keepThisLook = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }), unstable_rethrow: () => undefined }));
vi.mock('@/lib/backend/looks/actions', () => ({ keepThisLook }));
Element.prototype.scrollIntoView = vi.fn(); // jsdom has no layout

const { LookTryOn } = await import('./LookTryOn');
const frame = (): string => screen.getByTitle(/Your site in the/).getAttribute('src') ?? '';

afterEach(() => {
  cleanup();
  refresh.mockReset();
  keepThisLook.mockReset();
});

describe('LookTryOn', () => {
  it('opens on the look her site wears now, in her own site', () => {
    render(<LookTryOn looks={LOOKS} current="rustic" siteUrl="https://rustic-charm.bohdiai.com" noScene={false} />);
    expect(frame()).toBe('https://rustic-charm.bohdiai.com/?previewMood=rustic&previewLook=main-street-tannery');
    expect(screen.getByText('This is the look your site wears now.')).toBeTruthy();
    expect(screen.getByText('Yours now')).toBeTruthy();
  });

  it('shows her site in another mood, then keeps it', async () => {
    keepThisLook.mockResolvedValue({ ok: true });
    render(<LookTryOn looks={LOOKS} current="rustic" siteUrl="https://rustic-charm.bohdiai.com" noScene={false} />);
    fireEvent.click(screen.getByRole('button', { name: /Cozy/ }));
    expect(frame()).toContain('previewMood=cozy');
    fireEvent.click(screen.getByRole('button', { name: 'Keep the Cozy look' }));
    await waitFor(() => expect(keepThisLook).toHaveBeenCalledWith('cozy'));
    expect(await screen.findByText('Your site wears the Cozy look now.')).toBeTruthy();
    expect(refresh).toHaveBeenCalled();
  });

  it('switches the window to a phone', () => {
    const { container } = render(<LookTryOn looks={LOOKS} current={null} siteUrl="http://x.localhost:3000" noScene={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Phone' }));
    expect(container.querySelector('.bk-looks-window')?.getAttribute('data-phone')).toBe('true');
    expect(frame()).toContain(`previewMood=${LOOKS[0]?.mood}`);
  });

  it('lets her see Scenic but not keep it without her own photo', () => {
    render(<LookTryOn looks={LOOKS} current="rustic" siteUrl="https://x.bohdiai.com" noScene />);
    fireEvent.click(screen.getByRole('button', { name: /Scenic/ }));
    expect(screen.queryByRole('button', { name: /Keep the/ })).toBeNull();
    expect(screen.getByText(/doesn’t have one yet/)).toBeTruthy();
  });

  it('says why a look couldn’t be kept, or that the server can’t be reached', async () => {
    keepThisLook.mockResolvedValueOnce({ ok: false, error: 'The look couldn’t be kept.' });
    render(<LookTryOn looks={LOOKS} current="rustic" siteUrl="https://x.bohdiai.com" noScene={false} />);
    fireEvent.click(screen.getByRole('button', { name: /Dark/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Keep the Dark look' }));
    expect(await screen.findByText('The look couldn’t be kept.')).toBeTruthy();
    keepThisLook.mockRejectedValueOnce(new Error('offline'));
    fireEvent.click(screen.getByRole('button', { name: 'Keep the Dark look' }));
    expect(await screen.findByText(/Check your connection/)).toBeTruthy();
  });
});
