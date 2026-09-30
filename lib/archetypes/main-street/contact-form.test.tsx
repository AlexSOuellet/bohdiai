import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, screen, fireEvent, waitFor } from '@testing-library/react';
import { MainStreetContactForm } from './MainStreetContactForm';
import { DEFAULT_STRINGS } from './defaults';

afterEach(cleanup);

const TENANT_ID = '11111111-1111-1111-1111-111111111111';

describe('MainStreetContactForm', () => {
  it('renders name, email, and message fields and a submit', () => {
    const { getByLabelText, getByRole } = render(
      <MainStreetContactForm tenantId={TENANT_ID} />,
    );
    expect(getByLabelText(/name/i)).toBeTruthy();
    expect(getByLabelText(/email/i)).toBeTruthy();
    expect(getByLabelText(/message/i)).toBeTruthy();
    expect(getByRole('button', { name: /send/i })).toBeTruthy();
  });
});

describe('MainStreetContactForm — sending', () => {
  afterEach(() => vi.unstubAllGlobals());

  function fillAndSend(): void {
    fireEvent.change(screen.getByLabelText(DEFAULT_STRINGS.contactFormName), { target: { value: 'Sam' } });
    fireEvent.change(screen.getByLabelText(DEFAULT_STRINGS.contactFormEmail), { target: { value: 'sam@example.com' } });
    fireEvent.change(screen.getByLabelText(DEFAULT_STRINGS.contactFormMessage), { target: { value: 'Do you ship?' } });
    fireEvent.submit(screen.getByRole('button', { name: DEFAULT_STRINGS.contactFormSend }).closest('form')!);
  }

  it('posts the tenant id and the three fields as JSON, then thanks the visitor', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    render(<MainStreetContactForm tenantId={TENANT_ID} />);
    fillAndSend();
    await waitFor(() => expect(screen.getByText(DEFAULT_STRINGS.contactFormSent)).toBeTruthy());
    expect(screen.queryByRole('button')).toBeNull();
    const [url, init] = fetchMock.mock.calls[0]! as [string, RequestInit];
    expect(url).toBe('/api/contact');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({
      tenantId: TENANT_ID,
      name: 'Sam',
      email: 'sam@example.com',
      message: 'Do you ship?',
    });
  });

  it('shows a sending state with the button disabled while the request is in flight', async () => {
    let resolve: (r: Response) => void = () => {};
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>((r) => { resolve = r; })));
    render(<MainStreetContactForm tenantId={TENANT_ID} />);
    fillAndSend();
    const btn = await screen.findByRole('button', { name: DEFAULT_STRINGS.contactFormSending });
    expect((btn as HTMLButtonElement).disabled).toBe(true);
    resolve(new Response('{}', { status: 200 }));
    await waitFor(() => expect(screen.getByText(DEFAULT_STRINGS.contactFormSent)).toBeTruthy());
  });

  it('shows the error line and keeps the form when the server refuses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 400 })));
    render(<MainStreetContactForm tenantId={TENANT_ID} />);
    fillAndSend();
    await waitFor(() => expect(screen.getByText(DEFAULT_STRINGS.contactFormError)).toBeTruthy());
    const btn = screen.getByRole('button', { name: DEFAULT_STRINGS.contactFormSend }) as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
  });

  it('shows the error line when the request throws (offline)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    render(<MainStreetContactForm tenantId={TENANT_ID} />);
    fillAndSend();
    await waitFor(() => expect(screen.getByText(DEFAULT_STRINGS.contactFormError)).toBeTruthy());
  });
});
