import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor, act } from '@testing-library/react';

vi.mock('next/navigation', () => ({ usePathname: () => '/try-the-tools', useRouter: () => ({ push: vi.fn() }), unstable_rethrow: () => undefined }));
vi.mock('@/lib/tools/actions', () => ({ saveCostsToProduct: vi.fn() }));
vi.mock('@/lib/tools/print/actions', () => ({ savePiece: vi.fn(), renamePiece: vi.fn(), deletePiece: vi.fn() }));
vi.mock('@/app/manage/tools/_components/print/MatPreview', () => ({ MatPreview: () => null }));
vi.mock('@/app/manage/fonts', () => ({ backendFace: { variable: 'font-backend' } }));

import { TryTools, TRY_TOOLS } from './TryTools';
import { FeedbackForm } from './FeedbackForm';
import { IDEAS } from '@/lib/tool-feedback/feedback';
import { metadata } from './page';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('the try-the-tools page (Alex, 2026-11-15)', () => {
  it('tells search engines to skip it', () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
  it('has the six tools as tabs, and leaves out Describe it and What to bring', () => {
    render(<TryTools />);
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(TRY_TOOLS.map((t) => t.name));
    expect(TRY_TOOLS.map((t) => t.name)).toEqual(['Cost to make', 'Price it', 'Is it worth it?', 'Monthly goal', 'Shipping', 'Print it']);
  });
  it('never links into a maker’s backend or offers to save', () => {
    render(<TryTools />);
    for (const t of TRY_TOOLS) {
      fireEvent.click(screen.getByRole('tab', { name: t.name }));
      for (const a of screen.queryAllByRole('link')) expect(a.getAttribute('href') ?? '').not.toMatch(/^\/manage/);
      // Downloads stay (Print it's PNG); saving into an account doesn't.
      expect(screen.queryByRole('button', { name: /^Save (to |as a product|as an event)/ })).toBeNull();
      expect(screen.queryByRole('link', { name: /^Save (as a product|as an event)/ })).toBeNull();
      expect(screen.queryByText('My pieces')).toBeNull();
    }
  });
});

describe('the feedback form', () => {
  const send = async (): Promise<void> => {
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    });
  };
  it('lists the tool ideas to tick', () => {
    render(<FeedbackForm />);
    for (const i of IDEAS) expect(screen.getByLabelText(new RegExp(i.name))).toBeTruthy();
  });
  it('sends the ticks and words, then says thanks', async () => {
    const fetch = vi.fn(async () => Response.json({ ok: true }));
    vi.stubGlobal('fetch', fetch);
    render(<FeedbackForm />);
    fireEvent.click(screen.getByLabelText(/Batch planner/));
    fireEvent.change(screen.getByLabelText(/What worked/), { target: { value: 'Print it is great' } });
    fireEvent.change(screen.getByLabelText(/What you make/), { target: { value: 'soap' } });
    await send();
    expect(JSON.parse((fetch.mock.calls[0] as unknown as [string, { body: string }])[1].body)).toEqual({ message: 'Print it is great', wants: ['batch'], name: '', email: '', makes: 'soap', company: '' });
    await waitFor(() => expect(screen.getByText('Thank you')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Send something else' }));
    expect(screen.getByRole('button', { name: 'Send' })).toBeTruthy();
  });
  it('shows what went wrong, from the server or the connection', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ error: 'Tell us what you think, or tick a tool you’d use.' }, { status: 400 })));
    render(<FeedbackForm />);
    await send();
    expect(screen.getByRole('alert').textContent).toBe('Tell us what you think, or tick a tool you’d use.');
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new Error('offline'))));
    await send();
    expect(screen.getByRole('alert').textContent).toBe('That didn’t send. Check your connection and try again.');
  });
});
