import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InquiryForm } from './InquiryForm';

const fetchMock = vi.fn();
beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

async function fill(): Promise<void> {
  const u = userEvent.setup();
  await u.type(screen.getByLabelText(/your name/i), 'Pat');
  await u.type(screen.getByRole('textbox', { name: /^email$/i }), 'pat@example.com');
  await u.click(screen.getByLabelText(/charity/i));
  await u.type(screen.getByLabelText(/what do you need/i), 'A donate page');
  await u.click(screen.getByRole('button', { name: /send/i }));
}

describe('InquiryForm', () => {
  it('posts JSON and shows the thank-you', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    render(<InquiryForm />);
    await fill();
    expect(await screen.findByRole('status')).toHaveTextContent(/thanks/i);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/inquiry');
    expect(JSON.parse(String(init.body))).toMatchObject({
      name: 'Pat',
      email: 'pat@example.com',
      kind: 'charity',
      message: 'A donate page',
      link: '',
      company: '',
      phone: '',
      contactBy: 'email',
    });
  });

  it('shows a missing-field problem without sending', async () => {
    render(<InquiryForm />);
    await userEvent.setup().click(screen.getByRole('button', { name: /send/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/name/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('asks for the kind of business before sending', async () => {
    render(<InquiryForm />);
    const u = userEvent.setup();
    await u.type(screen.getByLabelText(/your name/i), 'Pat');
    await u.type(screen.getByRole('textbox', { name: /^email$/i }), 'pat@example.com');
    await u.type(screen.getByLabelText(/what do you need/i), 'A site');
    await u.click(screen.getByRole('button', { name: /send/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/kind of business/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('needs a phone number before it will send a text or call request', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    render(<InquiryForm />);
    const u = userEvent.setup();
    await u.click(screen.getByRole('radio', { name: /^text$/i }));
    expect(screen.getByRole('textbox', { name: /needed to call or text/i })).toBeInTheDocument();
    await fill();
    expect(await screen.findByRole('alert')).toHaveTextContent(/phone number/i);
    expect(fetchMock).not.toHaveBeenCalled();
    await u.type(screen.getByRole('textbox', { name: /^phone/i }), '401 555 0100');
    await u.click(screen.getByRole('button', { name: /send/i }));
    await screen.findByRole('status');
    expect(JSON.parse(String((fetchMock.mock.calls[0] as [string, RequestInit])[1].body))).toMatchObject({
      phone: '401 555 0100',
      contactBy: 'text',
    });
  });

  it('shows the server’s message when it refuses', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: 'Please wait a minute and try again.' }), { status: 429 }),
    );
    render(<InquiryForm />);
    await fill();
    expect(await screen.findByRole('alert')).toHaveTextContent('Please wait a minute and try again.');
  });

  it('shows the email fallback when the server answer is unreadable', async () => {
    fetchMock.mockResolvedValue(new Response('<html>oops</html>', { status: 500 }));
    render(<InquiryForm />);
    await fill();
    expect(await screen.findByRole('alert')).toHaveTextContent('alex@bohdiai.com');
  });

  it('shows the email fallback when the network fails', async () => {
    fetchMock.mockRejectedValue(new TypeError('offline'));
    render(<InquiryForm />);
    await fill();
    expect(await screen.findByRole('alert')).toHaveTextContent('alex@bohdiai.com');
  });

  it('lets you send another after a thank-you', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    render(<InquiryForm />);
    await fill();
    await userEvent.setup().click(await screen.findByRole('button', { name: /send another/i }));
    expect(screen.getByLabelText(/your name/i)).toHaveValue('');
  });
});

describe('InquiryForm — on a pricing page', () => {
  it('offers the audience’s plans and sends the one picked', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    render(<InquiryForm audience="maker" initialKind="maker" />);
    const plans = screen.getByRole('group', { name: /which plan/i });
    expect(plans).toHaveTextContent('Maker Lite');
    expect(plans).toHaveTextContent('Maker Full');
    expect(plans).toHaveTextContent('Not sure yet');
    expect(plans).not.toHaveTextContent('Contractor');
    const u = userEvent.setup();
    await u.click(screen.getByLabelText('Maker Full'));
    await u.type(screen.getByLabelText(/your name/i), 'Pat');
    await u.type(screen.getByRole('textbox', { name: /^email$/i }), 'pat@example.com');
    await u.type(screen.getByLabelText(/what do you need/i), 'Candles');
    await u.click(screen.getByRole('button', { name: /send/i }));
    await screen.findByRole('status');
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toMatchObject({ kind: 'maker', plan: 'maker-full' });
  });

  it('starts on the plan they clicked and keeps it for the next message', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    render(<InquiryForm audience="contractor" initialKind="service" initialPlan="contractor-full" />);
    expect(screen.getByLabelText('Contractor Full')).toBeChecked();
    expect(screen.getByLabelText(/service business/i)).toBeChecked();
    const u = userEvent.setup();
    await u.type(screen.getByLabelText(/your name/i), 'Chris');
    await u.type(screen.getByRole('textbox', { name: /^email$/i }), 'chris@example.com');
    await u.type(screen.getByLabelText(/what do you need/i), 'Sod jobs');
    await u.click(screen.getByRole('button', { name: /send/i }));
    await u.click(await screen.findByRole('button', { name: /send another/i }));
    expect(screen.getByLabelText('Contractor Full')).toBeChecked();
  });

  it('sends no plan when they are not sure', async () => {
    render(<InquiryForm audience="maker" initialPlan="maker-lite" />);
    await userEvent.setup().click(screen.getByLabelText('Not sure yet'));
    expect(screen.getByLabelText('Not sure yet')).toBeChecked();
  });

  it('shows no plan question on the home page', () => {
    render(<InquiryForm />);
    expect(screen.queryByRole('group', { name: /which plan/i })).toBeNull();
  });
});
