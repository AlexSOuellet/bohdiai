import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { keyWords } from '@/lib/site-words/words';
import { SHOP_WORD_SPOTS, SHOP_WORDS_PREFIX } from '@/lib/storefront/words';
import NotifyForm from './NotifyForm';

const W = keyWords(SHOP_WORD_SPOTS, SHOP_WORDS_PREFIX).notify;

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function submit(): void {
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'a@b.co' } });
  fireEvent.click(screen.getByRole('button'));
}

describe('NotifyForm', () => {
  it('labels the form in the site’s words', () => {
    render(<NotifyForm tenantId="t1" listingId="l1" words={W} />);
    const input = screen.getByRole('textbox');
    expect(input.getAttribute('placeholder')).toBe(W.placeholder);
    expect(input.getAttribute('aria-label')).toBe(W.emailLabel);
    expect(screen.getByRole('button').textContent).toBe(W.send);
  });

  it('thanks the shopper once signed up', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })));
    render(<NotifyForm tenantId="t1" listingId="l1" words={W} />);
    submit();
    await waitFor(() => expect(screen.getByText(W.thanks)).toBeTruthy());
  });

  it('shows the server’s error, or the site’s word when the server gives none', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"error":"server says no"}', { status: 400 })));
    render(<NotifyForm tenantId="t1" listingId="l1" words={W} />);
    submit();
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('server says no'));
    cleanup();
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 500 })));
    render(<NotifyForm tenantId="t1" listingId="l1" words={W} />);
    submit();
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe(W.failed));
  });

  it('says so in the site’s words when the network fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }));
    render(<NotifyForm tenantId="t1" listingId="l1" words={W} />);
    submit();
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe(W.network));
  });
});
