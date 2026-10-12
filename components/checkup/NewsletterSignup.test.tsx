import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NewsletterSignup } from './NewsletterSignup';

afterEach(() => vi.unstubAllGlobals());

const fill = (email: string): void => {
  fireEvent.change(screen.getByLabelText('Your email'), { target: { value: email } });
  fireEvent.click(screen.getByRole('button', { name: 'Send me the tips' }));
};

describe('NewsletterSignup', () => {
  it('asks for an email before sending anything', () => {
    const fetcher = vi.fn();
    vi.stubGlobal('fetch', fetcher);
    render(<NewsletterSignup />);
    fill('');
    expect(screen.getByRole('alert')).toHaveTextContent('Please enter your email.');
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('confirms a signup', async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({ ok: true }));
    vi.stubGlobal('fetch', fetcher);
    render(<NewsletterSignup />);
    fill('pat@example.com');
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('You’re in.'));
    expect(JSON.parse(String((fetcher.mock.calls[0] as [string, RequestInit])[1].body))).toEqual({
      email: 'pat@example.com',
      company: '',
    });
  });

  it('shows the server’s reason, or a fallback, when it fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ error: 'Signups aren’t open yet.' }, { status: 503 })));
    render(<NewsletterSignup />);
    fill('pat@example.com');
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Signups aren’t open yet.'));
  });

  it('handles an unreadable reply and a network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('oops', { status: 500 })));
    const { unmount } = render(<NewsletterSignup />);
    fill('pat@example.com');
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('didn’t go through'));
    unmount();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    render(<NewsletterSignup />);
    fill('pat@example.com');
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('didn’t go through'));
  });
});
