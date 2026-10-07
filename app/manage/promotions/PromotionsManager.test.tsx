import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import type { Promotion } from '@/lib/storefront/promotions';

const actions = { addPromotion: vi.fn(), updatePromotion: vi.fn(), setPromotionActive: vi.fn(), removePromotion: vi.fn() };
vi.mock('@/lib/backend/promotions/actions', () => ({
  addPromotion: (...a: unknown[]) => actions.addPromotion(...a),
  updatePromotion: (...a: unknown[]) => actions.updatePromotion(...a),
  setPromotionActive: (...a: unknown[]) => actions.setPromotionActive(...a),
  removePromotion: (...a: unknown[]) => actions.removePromotion(...a),
}));

const { PromotionsManager } = await import('./PromotionsManager');
Element.prototype.scrollIntoView = vi.fn(); // jsdom has no layout

const code = (over: Partial<Promotion> = {}): Promotion => ({
  id: 'c1',
  kind: 'code',
  name: 'MARKET10',
  code: 'MARKET10',
  percentOff: 10,
  amountOffCents: null,
  startsOn: null,
  endsOn: '2026-10-31',
  maxUses: 25,
  uses: 3,
  active: true,
  ...over,
});

afterEach(() => {
  cleanup();
  Object.values(actions).forEach((f) => f.mockReset());
});

describe('PromotionsManager', () => {
  it('lists a code with what it takes off, its days and its uses', () => {
    render(<PromotionsManager initial={[code()]} today="2026-10-07" />);
    expect(screen.getByText('Code MARKET10')).toBeTruthy();
    expect(screen.getByText('Running')).toBeTruthy();
    expect(screen.getByText(/10% off the order · Until Oct 31, 2026 · used 3 of 25 times/)).toBeTruthy();
  });

  it('adds a code', async () => {
    actions.addPromotion.mockResolvedValue({
      ok: true,
      item: code({ id: 'c2', code: 'FAIR5', name: 'FAIR5', percentOff: null, amountOffCents: 500, uses: 0, maxUses: null, endsOn: null }),
    });
    render(<PromotionsManager initial={[]} today="2026-10-07" />);
    fireEvent.change(screen.getByLabelText('Code'), { target: { value: 'fair5' } });
    fireEvent.change(screen.getByLabelText('Takes off'), { target: { value: 'dollars' } });
    fireEvent.change(screen.getByLabelText('Dollars off'), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add code' }));
    await waitFor(() => expect(screen.getByText('Code FAIR5')).toBeTruthy());
    expect(actions.addPromotion).toHaveBeenCalledWith(expect.objectContaining({ kind: 'code', code: 'FAIR5', amountType: 'dollars', amount: '5' }));
  });

  it('adds a sale, which only takes a percent', async () => {
    actions.addPromotion.mockResolvedValue({
      ok: true,
      item: code({ id: 's1', kind: 'sale', name: 'Fall Sale', code: null, percentOff: 20, maxUses: null, uses: 0 }),
    });
    render(<PromotionsManager initial={[]} today="2026-10-07" />);
    fireEvent.click(screen.getByLabelText(/Sale: a percent off everything/));
    expect(screen.queryByLabelText('Takes off')).toBeNull();
    fireEvent.change(screen.getByLabelText(/Sale name/), { target: { value: 'Fall Sale' } });
    fireEvent.change(screen.getByLabelText('Percent off'), { target: { value: '20' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add sale' }));
    await waitFor(() => expect(screen.getByText('Sale: Fall Sale')).toBeTruthy());
  });

  it('stops a bad code before saving, and says why', async () => {
    render(<PromotionsManager initial={[]} today="2026-10-07" />);
    fireEvent.change(screen.getByLabelText('Code'), { target: { value: 'x' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add code' }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('3 to 20 letters'));
    expect(actions.addPromotion).not.toHaveBeenCalled();
  });

  it('pauses a code', async () => {
    actions.setPromotionActive.mockResolvedValue({ ok: true });
    render(<PromotionsManager initial={[code()]} today="2026-10-07" />);
    fireEvent.click(screen.getByRole('button', { name: 'Pause MARKET10' }));
    await waitFor(() => expect(screen.getByText('Paused')).toBeTruthy());
    expect(actions.setPromotionActive).toHaveBeenCalledWith('c1', false);
  });

  it('changes a code', async () => {
    actions.updatePromotion.mockResolvedValue({ ok: true, item: code({ percentOff: 15 }) });
    render(<PromotionsManager initial={[code()]} today="2026-10-07" />);
    fireEvent.click(screen.getByRole('button', { name: 'Change MARKET10' }));
    fireEvent.change(screen.getAllByLabelText('Percent off')[1]!, { target: { value: '15' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(screen.getByText(/15% off the order/)).toBeTruthy());
  });
});
