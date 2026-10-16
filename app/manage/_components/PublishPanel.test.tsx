import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PublishPanel } from './PublishPanel';

describe('PublishPanel', () => {
  it('says the site is private, opens it, and publishes after a second yes', async () => {
    const publish = vi.fn(() => Promise.resolve({ ok: true as const }));
    render(<PublishPanel siteUrl="https://tide.bohdiai.com" previewUrl="https://tide.bohdiai.com/?preview=abc" publish={publish} />);
    expect(screen.getByText('Your site is private')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View my site' })).toHaveAttribute('href', 'https://tide.bohdiai.com/?preview=abc');
    const u = userEvent.setup();
    await u.click(screen.getByRole('button', { name: 'Publish' }));
    expect(publish).not.toHaveBeenCalled();
    await u.click(screen.getByRole('button', { name: 'Yes, put it live' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Your site is live');
    expect(screen.getByRole('link', { name: 'tide.bohdiai.com' })).toHaveAttribute('href', 'https://tide.bohdiai.com');
  });

  it('"Not yet" keeps it private', async () => {
    const publish = vi.fn();
    render(<PublishPanel siteUrl="https://tide.bohdiai.com" previewUrl="https://x" publish={publish} />);
    const u = userEvent.setup();
    await u.click(screen.getByRole('button', { name: 'Publish' }));
    await u.click(screen.getByRole('button', { name: 'Not yet' }));
    expect(publish).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Publish' })).toBeInTheDocument();
  });

  it('shows why when it can’t publish, or when the site can’t be opened first', async () => {
    const publish = vi.fn().mockResolvedValueOnce({ ok: false, error: 'No access.' }).mockRejectedValueOnce(new Error('offline'));
    render(<PublishPanel siteUrl="https://tide.bohdiai.com" previewUrl={null} publish={publish} />);
    expect(screen.getByText(/can’t be opened before it’s published/)).toBeInTheDocument();
    const u = userEvent.setup();
    await u.click(screen.getByRole('button', { name: 'Publish' }));
    await u.click(screen.getByRole('button', { name: 'Yes, put it live' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No access.');
    await u.click(screen.getByRole('button', { name: 'Publish' }));
    await u.click(screen.getByRole('button', { name: 'Yes, put it live' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Try again in a moment.');
  });
});
