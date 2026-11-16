import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { keyWords } from '@/lib/site-words/words';
import { INTAKE_WORD_SPOTS } from '@/lib/intake/words';
import { ReportForm } from './ReportForm';

const words = keyWords(INTAKE_WORD_SPOTS, 'intake').report;
const fetchMock = vi.fn();
beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

const SITE = { subdomain: 'rustic-charm', name: 'Rustic Charm' };

describe('ReportForm (go-live step 3, Alex 2026-11-16)', () => {
  it('sends the site from the link, why, and what happened, then says thanks', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    const u = userEvent.setup({ delay: null });
    render(<ReportForm words={words} site={SITE} />);
    expect(screen.queryByLabelText('intake.report.site')).toBeNull();
    await u.click(screen.getByRole('radio', { name: 'intake.report.reasons.scam' }));
    await u.type(screen.getByLabelText('intake.report.details'), 'Never shipped.');
    await u.click(screen.getByRole('button', { name: 'intake.report.send' }));
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/report-site');
    expect(JSON.parse(String(init.body))).toMatchObject({
      site: 'rustic-charm',
      reason: 'scam',
      details: 'Never shipped.',
    });
    expect(await screen.findByText('intake.report.sentTitle')).toBeTruthy();
  });

  it('asks for the address when the link didn’t say which site', async () => {
    const u = userEvent.setup({ delay: null });
    render(<ReportForm words={words} site={null} />);
    await u.click(screen.getByRole('button', { name: 'intake.report.send' }));
    expect(screen.getByRole('alert').textContent).toBe('intake.report.errors.site');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('names what’s missing before sending, and shows the route’s answer in the page’s words', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ problem: 'notFound' }), { status: 400 }),
    );
    const u = userEvent.setup({ delay: null });
    render(<ReportForm words={words} site={SITE} />);
    await u.click(screen.getByRole('button', { name: 'intake.report.send' }));
    expect(screen.getByRole('alert').textContent).toBe('intake.report.errors.reason');
    await u.click(screen.getByRole('radio', { name: 'intake.report.reasons.other' }));
    await u.type(screen.getByLabelText('intake.report.details'), 'x');
    await u.click(screen.getByRole('button', { name: 'intake.report.send' }));
    expect((await screen.findByRole('alert')).textContent).toBe('intake.report.errors.notFound');
  });

  it('says it didn’t send when the connection fails', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));
    const u = userEvent.setup({ delay: null });
    render(<ReportForm words={words} site={SITE} />);
    await u.click(screen.getByRole('radio', { name: 'intake.report.reasons.other' }));
    await u.type(screen.getByLabelText('intake.report.details'), 'x');
    await u.click(screen.getByRole('button', { name: 'intake.report.send' }));
    expect((await screen.findByRole('alert')).textContent).toBe('intake.report.errors.failed');
  });
});
