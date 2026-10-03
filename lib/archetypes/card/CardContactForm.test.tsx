import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { CardContactForm } from './CardContactForm';
import { CARD_STRINGS } from './strings';

const S = CARD_STRINGS.form;
const TENANT = '4b8f0f5e-8f3a-4a57-9a8e-1f2d3c4b5a69';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function fill(): void {
  render(<CardContactForm tenantId={TENANT} />);
  fireEvent.change(screen.getByLabelText(S.name), { target: { value: 'Pat' } });
  fireEvent.change(screen.getByLabelText(S.email), { target: { value: 'pat@example.com' } });
  fireEvent.change(screen.getByLabelText(S.message), { target: { value: 'A Navy flag please' } });
  fireEvent.submit(screen.getByRole('button', { name: S.send }).closest('form') as HTMLFormElement);
}

describe('CardContactForm', () => {
  it('posts the message with the tenant id and thanks the visitor', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    fill();
    await waitFor(() => expect(screen.getByText(S.sent)).toBeTruthy());
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/contact');
    expect(JSON.parse(String(init.body))).toEqual({ tenantId: TENANT, name: 'Pat', email: 'pat@example.com', message: 'A Navy flag please' });
    fireEvent.click(screen.getByRole('button', { name: S.sendAnother }));
    expect(screen.getByRole('button', { name: S.send })).toBeTruthy();
  });

  it('shows the server’s own words when it refuses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "This shop hasn't set up a contact email yet." }), { status: 503 })));
    fill();
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe("This shop hasn't set up a contact email yet."));
  });

  it('falls back to a plain message when the refusal has no words', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('oops', { status: 500 })));
    fill();
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe(S.error));
  });

  it('says so when the network fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
    fill();
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe(S.errorNetwork));
  });

  it('quietly drops a bot that fills the hidden field', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    render(<CardContactForm tenantId={TENANT} />);
    fireEvent.change(screen.getByLabelText(S.honeypot), { target: { value: 'Acme' } });
    fireEvent.submit(screen.getByRole('button', { name: S.send }).closest('form') as HTMLFormElement);
    await waitFor(() => expect(screen.getByText(S.sent)).toBeTruthy());
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
