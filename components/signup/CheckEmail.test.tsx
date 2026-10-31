import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { keyWords } from '@/lib/site-words/words';
import { INTAKE_WORD_SPOTS } from '@/lib/intake/words';
import { CheckEmail } from './CheckEmail';

const words = keyWords(INTAKE_WORD_SPOTS, 'intake');
const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

const answer = (body: unknown, status = 200): Response => new Response(JSON.stringify(body), { status });

function setup() {
  const u = userEvent.setup({ delay: null });
  render(<CheckEmail words={words} session="cs_1" email="lena@example.com" contactEmail="alex@example.com" />);
  return u;
}

describe('CheckEmail', () => {
  it('says where the link went and to check spam', () => {
    setup();
    expect(screen.getByText('intake.paid.body')).toBeInTheDocument();
    expect(screen.getByText('intake.paid.spam')).toBeInTheDocument();
  });

  it('sends it again', async () => {
    fetchMock.mockResolvedValue(answer({ email: 'lena@example.com' }));
    const u = setup();
    await u.click(screen.getByRole('button', { name: 'intake.paid.again' }));
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/signup/again');
    expect(JSON.parse(String(init.body))).toEqual({ session: 'cs_1' });
    expect(await screen.findByRole('status')).toHaveTextContent('intake.paid.sent');
  });

  it('fixes a mistyped email and sends it there', async () => {
    fetchMock.mockResolvedValue(answer({ email: 'lena.m@example.com' }));
    const u = setup();
    await u.click(screen.getByRole('button', { name: 'intake.paid.wrong' }));
    await u.type(screen.getByLabelText('intake.paid.fixLabel'), 'lena.m@example.com');
    await u.click(screen.getByRole('button', { name: 'intake.paid.fixButton' }));
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({ session: 'cs_1', email: 'lena.m@example.com' });
    expect(await screen.findByRole('status')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'intake.paid.again' })).toBeInTheDocument();
  });

  it('shows the problem in the form’s own words', async () => {
    fetchMock.mockResolvedValue(answer({ problem: { spot: 'accountExists', values: {} } }, 400));
    const u = setup();
    await u.click(screen.getByRole('button', { name: 'intake.paid.wrong' }));
    await u.type(screen.getByLabelText('intake.paid.fixLabel'), 'taken@example.com');
    await u.click(screen.getByRole('button', { name: 'intake.paid.fixButton' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('intake.errors.accountExists');
  });

  it('says it didn’t send when the network fails', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));
    const u = setup();
    await u.click(screen.getByRole('button', { name: 'intake.paid.again' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('intake.errors.failed');
  });
});
