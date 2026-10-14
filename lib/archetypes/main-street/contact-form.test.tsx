import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, screen, fireEvent, waitFor } from '@testing-library/react';
import { MainStreetContactForm } from './MainStreetContactForm';
import { keyWords } from '@/lib/site-words/words';
import { FAMILY_WORD_SPOTS, FAMILY_WORDS_PREFIX } from './words';

/** Test words: every spot says its own key. */
const W = keyWords(FAMILY_WORD_SPOTS, FAMILY_WORDS_PREFIX);

afterEach(cleanup);

const TENANT_ID = '11111111-1111-1111-1111-111111111111';

describe('MainStreetContactForm', () => {
  it('renders name, email, and message fields and a submit', () => {
    const { getByLabelText, getByRole } = render(
      <MainStreetContactForm words={W} tenantId={TENANT_ID} />,
    );
    expect(getByLabelText(W.contactFormName)).toBeTruthy();
    expect(getByLabelText(W.contactFormEmail)).toBeTruthy();
    expect(getByLabelText(W.contactFormMessage)).toBeTruthy();
    expect(getByRole('button', { name: W.contactFormSend })).toBeTruthy();
  });
});

describe('MainStreetContactForm — sending', () => {
  afterEach(() => vi.unstubAllGlobals());

  function fillAndSend(): void {
    fireEvent.change(screen.getByLabelText(W.contactFormName), { target: { value: 'Sam' } });
    fireEvent.change(screen.getByLabelText(W.contactFormEmail), { target: { value: 'sam@example.com' } });
    fireEvent.change(screen.getByLabelText(W.contactFormMessage), { target: { value: 'Do you ship?' } });
    fireEvent.submit(screen.getByRole('button', { name: W.contactFormSend }).closest('form')!);
  }

  it('posts the tenant id and the three fields as JSON, then thanks the visitor', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    render(<MainStreetContactForm words={W} tenantId={TENANT_ID} />);
    fillAndSend();
    await waitFor(() => expect(screen.getByText(W.contactFormSent)).toBeTruthy());
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
    render(<MainStreetContactForm words={W} tenantId={TENANT_ID} />);
    fillAndSend();
    const btn = await screen.findByRole('button', { name: W.contactFormSending });
    expect((btn as HTMLButtonElement).disabled).toBe(true);
    resolve(new Response('{}', { status: 200 }));
    await waitFor(() => expect(screen.getByText(W.contactFormSent)).toBeTruthy());
  });

  it('shows the error line and keeps the form when the server refuses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 400 })));
    render(<MainStreetContactForm words={W} tenantId={TENANT_ID} />);
    fillAndSend();
    await waitFor(() => expect(screen.getByText(W.contactFormError)).toBeTruthy());
    const btn = screen.getByRole('button', { name: W.contactFormSend }) as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
  });

  it('shows the error line when the request throws (offline)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    render(<MainStreetContactForm words={W} tenantId={TENANT_ID} />);
    fillAndSend();
    await waitFor(() => expect(screen.getByText(W.contactFormError)).toBeTruthy());
  });
});
