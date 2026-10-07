import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { emptyMarketForm, type MarketForm } from '@/lib/backend/markets/market-form';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }), unstable_rethrow: () => undefined }));
const saveMarket = vi.fn();
const removeMarket = vi.fn();
vi.mock('@/lib/backend/markets/actions', () => ({
  saveMarket: (...a: unknown[]) => saveMarket(...a),
  removeMarket: (...a: unknown[]) => removeMarket(...a),
}));

const { MarketEditor } = await import('./MarketEditor');
Element.prototype.scrollIntoView = vi.fn(); // jsdom has no layout

const existing = (over: Partial<MarketForm> = {}): MarketForm => ({
  ...emptyMarketForm(),
  id: 'm1',
  name: 'Holly Fair',
  date: '2026-11-21',
  town: 'Johnston',
  ...over,
});

afterEach(() => {
  cleanup();
  push.mockReset();
  saveMarket.mockReset();
  removeMarket.mockReset();
});

describe('MarketEditor', () => {
  it('saves a new market with its details and goes back to the list', async () => {
    saveMarket.mockResolvedValue({ ok: true, id: 'm9' });
    render(<MarketEditor initial={emptyMarketForm()} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Add a market' })).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Market name'), { target: { value: 'Holly Fair' } });
    fireEvent.change(screen.getByLabelText('Day'), { target: { value: '2026-11-21' } });
    fireEvent.change(screen.getByLabelText(/Booth or table/), { target: { value: 'Booth 4' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Save' })[0]!);
    await waitFor(() => expect(push).toHaveBeenCalledWith('/manage/markets?saved=Holly%20Fair'));
    expect(saveMarket).toHaveBeenCalledWith(expect.objectContaining({ name: 'Holly Fair', date: '2026-11-21', booth: 'Booth 4' }));
  });

  it('adds costs and shows their total', () => {
    render(<MarketEditor initial={existing()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add a cost' }));
    expect((screen.getByLabelText('What') as HTMLInputElement).value).toBe('Booth fee');
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '40' } });
    expect(screen.getByText('$40')).toBeTruthy();
  });

  it('takes a star rating and go-back answer', async () => {
    saveMarket.mockResolvedValue({ ok: true, id: 'm1' });
    render(<MarketEditor initial={existing()} />);
    fireEvent.click(screen.getByRole('button', { name: '4 stars' }));
    expect(screen.getByRole('button', { name: '4 stars' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByLabelText('Maybe'));
    fireEvent.click(screen.getAllByRole('button', { name: 'Save' })[0]!);
    await waitFor(() => expect(saveMarket).toHaveBeenCalledWith(expect.objectContaining({ rating: 4, goBack: 'maybe' })));
  });

  it('stops a market with no day before saving, and says why', async () => {
    render(<MarketEditor initial={emptyMarketForm()} />);
    fireEvent.change(screen.getByLabelText('Market name'), { target: { value: 'Holly Fair' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Save' })[0]!);
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('first day'));
    expect(saveMarket).not.toHaveBeenCalled();
  });

  it('shows a failed save and stays on the page', async () => {
    saveMarket.mockResolvedValue({ ok: false, error: 'The market couldn’t be saved. Try again in a moment.' });
    render(<MarketEditor initial={existing()} />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Save' })[0]!);
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('couldn’t be saved'));
    expect(push).not.toHaveBeenCalled();
  });

  it('removes a market after a confirm', async () => {
    removeMarket.mockResolvedValue({ ok: true });
    render(<MarketEditor initial={existing()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove this market' }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes, remove it' }));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/manage/markets?removed=Holly%20Fair'));
  });
});
