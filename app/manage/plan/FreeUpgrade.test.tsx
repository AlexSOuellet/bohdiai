import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { SITE_PLANS, planOf } from '@/lib/backend/plan/plan';

const upgradeFromFree = vi.fn(async () => ({ ok: false as const, error: 'Your card was declined: Your card was declined. Try another card.' }));
vi.mock('next/navigation', () => ({ unstable_rethrow: () => undefined }));
vi.mock('@/lib/backend/plan/free-actions', () => ({ upgradeFromFree }));
const { FreeUpgrade } = await import('./FreeUpgrade');

Element.prototype.scrollIntoView = vi.fn(); // jsdom has no layout
const plans = SITE_PLANS.map(planOf);

describe('Your plan on Free', () => {
  it('says the maker is on Free, then every paid plan with monthly or yearly and an Upgrade', () => {
    render(<FreeUpgrade plans={plans} cardOnFile={false} note={null} />);
    expect(screen.getByRole('heading', { name: 'Free' })).toBeTruthy();
    for (const p of plans) {
      const card = screen.getByRole('region', { name: p.name });
      expect(within(card).getByRole('button', { name: `Upgrade to ${p.name}` })).toBeTruthy();
      expect(within(card).getByText(`$${p.monthly}`)).toBeTruthy();
      expect(within(card).getByText(`$${p.yearly}`)).toBeTruthy();
      expect(within(card).getByText(/on Stripe’s own page/)).toBeTruthy();
    }
  });

  it('with a card on file says what it’s charged, and follows the yearly choice', () => {
    render(<FreeUpgrade plans={plans} cardOnFile note={null} />);
    const card = screen.getByRole('region', { name: 'Maker Showcase' });
    expect(within(card).getByText(/Your card is charged \$5 today, then every month/)).toBeTruthy();
    fireEvent.click(within(card).getByRole('radio', { name: /a year/ }));
    expect(within(card).getByText(/Your card is charged \$50 today, then every year/)).toBeTruthy();
  });

  it('sends the plan and billing picked, and shows why it didn’t happen', async () => {
    render(<FreeUpgrade plans={plans} cardOnFile note={null} />);
    const card = screen.getByRole('region', { name: 'Maker Full' });
    fireEvent.click(within(card).getByRole('radio', { name: /a year/ }));
    fireEvent.click(within(card).getByRole('button', { name: 'Upgrade to Maker Full' }));
    await vi.waitFor(() => expect(upgradeFromFree).toHaveBeenCalledWith('full', 'yearly'));
    expect(await screen.findByText('Your card was declined: Your card was declined. Try another card.')).toBeTruthy();
  });

  it('says what happened coming back from Stripe', () => {
    render(<FreeUpgrade plans={plans} cardOnFile={false} note="Nothing changed. Pick a plan when you’re ready." />);
    expect(screen.getByText('Nothing changed. Pick a plan when you’re ready.')).toBeTruthy();
  });

  it('says so when the connection fails', async () => {
    upgradeFromFree.mockRejectedValueOnce(new Error('offline'));
    render(<FreeUpgrade plans={plans} cardOnFile note={null} />);
    fireEvent.click(screen.getByRole('button', { name: 'Upgrade to Maker Showcase' }));
    expect(await screen.findByText('Something went wrong. Check your connection and try again.')).toBeTruthy();
  });
});
