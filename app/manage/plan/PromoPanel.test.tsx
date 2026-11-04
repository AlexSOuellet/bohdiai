// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const m = vi.hoisted(() => ({ redeemPromo: vi.fn(), refresh: vi.fn() }));
vi.mock('@/lib/backend/plan/promo-actions', () => ({ redeemPromo: m.redeemPromo }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: m.refresh }), unstable_rethrow: () => undefined }));

import { PromoPanel } from './PromoPanel';

function enter(code: string): void {
  fireEvent.change(screen.getByLabelText('Enter your code'), { target: { value: code } });
  fireEvent.click(screen.getByRole('button', { name: 'Use code' }));
}

beforeEach(() => vi.clearAllMocks());

describe('PromoPanel', () => {
  it('shows a discount already running', () => {
    render(<PromoPanel discount="3 months free" />);
    expect(screen.getByText('Your discount: 3 months free')).toBeInTheDocument();
  });
  it('says when a code worked and refreshes the plan', async () => {
    m.redeemPromo.mockResolvedValue({ ok: true, message: 'Done: 10% off.' });
    render(<PromoPanel discount={null} />);
    enter('SPRING10');
    expect(await screen.findByRole('status')).toHaveTextContent('Done: 10% off.');
    expect(m.redeemPromo).toHaveBeenCalledWith('SPRING10');
    expect(m.refresh).toHaveBeenCalled();
    expect(screen.getByLabelText('Enter your code')).toHaveValue('');
  });
  it('says why a code was turned away', async () => {
    m.redeemPromo.mockResolvedValue({ ok: false, error: 'You’ve already used that code.' });
    render(<PromoPanel discount={null} />);
    enter('SPRING10');
    expect(await screen.findByRole('alert')).toHaveTextContent('You’ve already used that code.');
    expect(m.refresh).not.toHaveBeenCalled();
  });
  it('says so when the request itself fails', async () => {
    m.redeemPromo.mockRejectedValue(new Error('offline'));
    render(<PromoPanel discount={null} />);
    enter('SPRING10');
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Check your connection'));
  });
});
