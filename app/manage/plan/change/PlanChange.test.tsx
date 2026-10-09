import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react';
import { planOf } from '@/lib/backend/plan/plan';
import { hiddenByMove } from '@/lib/backend/plan/plan-features';
import { quoteUpgrade } from '@/lib/backend/plan/billing';

const push = vi.fn();
const upgradePlan = vi.fn();
const scheduleDowngrade = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  unstable_rethrow: () => undefined,
}));
vi.mock('@/lib/backend/plan/actions', () => ({ upgradePlan, scheduleDowngrade }));
Element.prototype.scrollIntoView = vi.fn(); // jsdom has no layout

const { PlanChange } = await import('./PlanChange');

afterEach(() => {
  cleanup();
  push.mockReset();
  upgradePlan.mockReset();
  scheduleDowngrade.mockReset();
});

const monthly = { plan: 'showcase' as const, billing: 'monthly' as const, renewsOn: '2026-10-29' };
const TODAY = '2026-10-09';
const quotes = {
  monthly: quoteUpgrade(monthly, 'lite', 'monthly', TODAY),
  yearly: quoteUpgrade(monthly, 'lite', 'yearly', TODAY),
};

function checkout() {
  return render(
    <PlanChange
      kind="up"
      from={planOf('showcase')}
      to={planOf('lite')}
      fromBilling="monthly"
      quotes={quotes}
    />,
  );
}

describe('checkout (moving up)', () => {
  it('shows the prorated working: the rest of the month, the credit, today, and the renewal', () => {
    checkout();
    const sum = screen.getByText('Today').closest('dl') as HTMLElement;
    expect(
      within(sum).getByText('Maker Lite, rest of this month').nextElementSibling?.textContent,
    ).toBe('$10');
    expect(
      within(sum).getByText('Unused Maker Showcase: 20 days left of your month').nextElementSibling
        ?.textContent,
    ).toBe('$3.33 credit');
    expect(within(sum).getByText('Credit used today').nextElementSibling?.textContent).toBe(
      '−$3.33',
    );
    expect(within(sum).getByText('Today').nextElementSibling?.textContent).toBe('$6.67');
    expect(within(sum).getByText('Then $15 a month, from').nextElementSibling?.textContent).toBe(
      'October 29, 2026',
    );
  });

  it('starts a new year on yearly, and says yearly plans aren’t refunded', () => {
    checkout();
    expect(screen.queryByText(/aren’t refunded/)).toBeNull();
    fireEvent.click(screen.getByRole('radio', { name: /a year/ }));
    expect(
      screen.getByText(
        /Yearly plans aren’t refunded\. If you downgrade later, the change starts at your next renewal\./,
      ),
    ).toBeTruthy();
    expect(screen.getByText('Today').nextElementSibling?.textContent).toBe('$146.67');
    expect(screen.getByText('Then $150 a year, from').nextElementSibling?.textContent).toBe(
      'October 9, 2027',
    );
  });

  it('lets a yearly site go monthly, showing the unused year as credit for her next bills', () => {
    const yearly = {
      plan: 'showcase' as const,
      billing: 'yearly' as const,
      renewsOn: '2027-04-09',
    };
    render(
      <PlanChange
        kind="up"
        from={planOf('showcase')}
        to={planOf('lite')}
        fromBilling="yearly"
        quotes={{
          monthly: quoteUpgrade(yearly, 'lite', 'monthly', TODAY),
          yearly: quoteUpgrade(yearly, 'lite', 'yearly', TODAY),
        }}
      />,
    );
    expect(screen.getByText(/aren’t refunded/)).toBeTruthy();
    fireEvent.click(screen.getByRole('radio', { name: /a month/ }));
    expect(screen.getByText(/Your year is turned into credit/)).toBeTruthy();
    expect(screen.getByText('Today').nextElementSibling?.textContent).toBe('$0');
    expect(
      screen.getByText('Unused Maker Showcase: about 6 months (182 days) left of your year')
        .nextElementSibling?.textContent,
    ).toBe('$24.93 credit');
    expect(screen.getByText('Credit used today').nextElementSibling?.textContent).toBe('−$15');
    expect(
      screen.getByText('Credit left, used on your next bills first').nextElementSibling
        ?.textContent,
    ).toBe('$9.93');
  });

  it('switches the plan on Confirm, on the billing she picked, and goes back to Your plan', async () => {
    upgradePlan.mockResolvedValue({ ok: true });
    checkout();
    fireEvent.click(screen.getByRole('radio', { name: /a year/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm upgrade to Maker Lite' }));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/manage/plan?changed=lite'));
    expect(upgradePlan).toHaveBeenCalledWith('lite', 'yearly');
  });

  it('shows the error and stays put when the change fails, or the call throws', async () => {
    upgradePlan.mockResolvedValueOnce({ ok: false, error: 'That isn’t a move up from your plan.' });
    checkout();
    fireEvent.click(screen.getByRole('button', { name: /Confirm upgrade/ }));
    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toBe('That isn’t a move up from your plan.'),
    );
    upgradePlan.mockRejectedValueOnce(new Error('offline'));
    fireEvent.click(screen.getByRole('button', { name: /Confirm upgrade/ }));
    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toContain('Check your connection'),
    );
    expect(push).not.toHaveBeenCalled();
  });
});

const OPTIONS = Array.from({ length: 14 }, (_, i) => ({ id: `p${i}`, name: `Piece ${i}`, url: `https://cdn/${i}.jpg` }));

describe('downgrade', () => {
  function down(showcase = OPTIONS.slice(0, 2)) {
    return render(
      <PlanChange
        kind="down"
        from={planOf('full')}
        to={planOf('showcase')}
        hidden={hiddenByMove('full', 'showcase')}
        renewsOn="2027-04-09"
        fromBilling="yearly"
        daysLeft={182}
        showcase={showcase}
      />,
    );
  }

  it('says how much time is left, that it starts at renewal, and that nothing is refunded', () => {
    down();
    expect(screen.getByText('Downgrading to')).toBeTruthy();
    expect(
      screen.getByText(
        /You have about 6 months \(182 days\) left on your Maker Full year\. You keep everything in Maker Full until April 9, 2027, then Maker Showcase starts\./,
      ),
    ).toBeTruthy();
    expect(screen.getByText('Nothing already paid is refunded.')).toBeTruthy();
    const list = screen.getByText('Put away until you upgrade again')
      .nextElementSibling as HTMLElement;
    expect(within(list).getByText('The cart and online orders')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Stay on Maker Full' }).getAttribute('href')).toBe(
      '/manage/plan',
    );
  });

  it('lets her pick monthly or yearly from renewal, with the yearly terms on yearly', () => {
    down();
    expect((screen.getByRole('radio', { name: /a year/ }) as HTMLInputElement).checked).toBe(true);
    expect(screen.getByText(/Yearly plans aren’t refunded\. If you downgrade later/)).toBeTruthy();
    fireEvent.click(screen.getByRole('radio', { name: /a month/ }));
    expect(screen.queryByText(/Yearly plans aren’t refunded/)).toBeNull();
  });

  it('schedules the downgrade on the billing she picked and goes back to Your plan', async () => {
    scheduleDowngrade.mockResolvedValue({ ok: true });
    down();
    fireEvent.click(screen.getByRole('radio', { name: /a month/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Downgrade to Maker Showcase' }));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/manage/plan?scheduled=showcase'));
    expect(scheduleDowngrade).toHaveBeenCalledWith('showcase', 'monthly', ['p0', 'p1']);
  });

  it('starts with the first 12 picked and won’t let a 13th be ticked', () => {
    down(OPTIONS);
    expect(screen.getByText(/12 of 12 picked/)).toBeTruthy();
    expect((screen.getByRole('checkbox', { name: /Piece 12/ }) as HTMLInputElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('checkbox', { name: /Piece 0/ }));
    expect(screen.getByText(/11 of 12 picked/)).toBeTruthy();
    expect((screen.getByRole('checkbox', { name: /Piece 12/ }) as HTMLInputElement).disabled).toBe(false);
  });

  it('sends the pieces she picked, and can’t go ahead with none', async () => {
    scheduleDowngrade.mockResolvedValue({ ok: true });
    down();
    fireEvent.click(screen.getByRole('checkbox', { name: /Piece 0/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Downgrade to Maker Showcase' }));
    await waitFor(() => expect(scheduleDowngrade).toHaveBeenCalledWith('showcase', 'yearly', ['p1']));
    fireEvent.click(screen.getByRole('checkbox', { name: /Piece 1/ }));
    expect((screen.getByRole('button', { name: /Downgrade to Maker Showcase|Changing/ }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('shows no picker for a downgrade to Lite', () => {
    render(<PlanChange kind="down" from={planOf('full')} to={planOf('lite')} hidden={hiddenByMove('full', 'lite')} renewsOn="2027-04-09" fromBilling="yearly" daysLeft={182} showcase={[]} />);
    expect(screen.queryByText(/picked/)).toBeNull();
  });
});
