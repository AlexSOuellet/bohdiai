import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const refresh = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));

import { OfflinePanel } from './OfflinePanel';

beforeEach(() => refresh.mockReset());

describe('OfflinePanel', () => {
  it('a live site can be taken offline, after asking once more', async () => {
    const takeOffline = vi.fn(async () => ({ ok: true as const }));
    const u = userEvent.setup();
    render(<OfflinePanel offline={false} takeOffline={takeOffline} />);
    await u.click(screen.getByRole('button', { name: 'Take my site offline' }));
    expect(takeOffline).not.toHaveBeenCalled();
    await u.click(screen.getByRole('button', { name: 'Yes, take it offline' }));
    expect(takeOffline).toHaveBeenCalledTimes(1);
    expect(refresh).toHaveBeenCalled();
  });

  it('an offline site says so, opens through its private link, and can be put back', async () => {
    const putOnline = vi.fn(async () => ({ ok: true as const }));
    const u = userEvent.setup();
    render(<OfflinePanel offline previewUrl="https://tide.bohdiai.com/?preview=abc" putOnline={putOnline} />);
    expect(screen.getByRole('heading', { name: 'Your site is offline' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View my site' })).toHaveAttribute('href', 'https://tide.bohdiai.com/?preview=abc');
    await u.click(screen.getByRole('button', { name: 'Put it back online' }));
    await u.click(screen.getByRole('button', { name: 'Yes, put it back' }));
    expect(putOnline).toHaveBeenCalledTimes(1);
  });

  it('shows why when it doesn’t work', async () => {
    const takeOffline = vi.fn(async () => ({ ok: false as const, error: 'Your site couldn’t be taken offline. Try again in a moment.' }));
    const u = userEvent.setup();
    render(<OfflinePanel offline={false} takeOffline={takeOffline} />);
    await u.click(screen.getByRole('button', { name: 'Take my site offline' }));
    await u.click(screen.getByRole('button', { name: 'Yes, take it offline' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('couldn’t be taken offline');
    expect(refresh).not.toHaveBeenCalled();
  });
});
